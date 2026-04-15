/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollContainer } from "../../../../../lib/ScrollContainerContext";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevIconMap, GameDevItem } from "../../common/data/types";

interface GameDevHiveGalleryProps {
  items: GameDevItem[];
  iconMap: GameDevIconMap;
  isLoading?: boolean;
  emptyMessage?: string;
}

const LONG_PRESS_MS = 220;
const LONG_PRESS_MOVE_TOLERANCE = 10;
const SPREAD_DISMISS_THRESHOLD = 48;
const clampIndex = (value: number, size: number) => {
  if (size <= 0) return 0;

  return Math.max(0, Math.min(size - 1, value));
};

/**
 * Returns every (row, col) position in a (2*halfGrid+1)² grid sorted by:
 * 1. Chebyshev ring distance (0 = center)
 * 2. Clockwise angle starting from the right (atan2 in screen-space coords)
 * This produces a spiral order: center → right → down-right → down → …
 */
const getSpiralPositions = (halfGrid: number): Array<{ row: number; col: number }> => {
  const positions: Array<{ row: number; col: number }> = [];

  for (let row = -halfGrid; row <= halfGrid; row += 1) {
    for (let col = -halfGrid; col <= halfGrid; col += 1) {
      positions.push({ row, col });
    }
  }

  const norm = (angle: number) => ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  positions.sort((a, b) => {
    const ringA = Math.max(Math.abs(a.row), Math.abs(a.col));
    const ringB = Math.max(Math.abs(b.row), Math.abs(b.col));

    if (ringA !== ringB) return ringA - ringB;

    return norm(Math.atan2(a.row, a.col)) - norm(Math.atan2(b.row, b.col));
  });

  return positions;
};

const GRID_CONFIG = {
  3: {
    cellWidth: 108,
    cellHeight: 112,
    cardWidth: 86,
    cardHeight: 98,
    centerScale: 1.22,
    ringOneScale: 0.94,
    ringTwoScale: 0.66,
    edgeScale: 0.5,
    ringOneOpacity: 0.94,
    ringTwoOpacity: 0.72,
    edgeOpacity: 0.46,
    labelThreshold: 1.25,
    spreadSpacingMultiplier: 1.54,
    spreadCenterBoost: 0.12,
    spreadRingOneBoost: 0.05,
    spreadLabelBoost: 1.15,
    snapThresholdRatio: 0.28,
  },
  5: {
    cellWidth: 70,
    cellHeight: 76,
    cardWidth: 58,
    cardHeight: 68,
    centerScale: 1.14,
    ringOneScale: 0.9,
    ringTwoScale: 0.72,
    edgeScale: 0.54,
    ringOneOpacity: 0.9,
    ringTwoOpacity: 0.7,
    edgeOpacity: 0.5,
    labelThreshold: 0.95,
    spreadSpacingMultiplier: 1.26,
    spreadCenterBoost: 0.06,
    spreadRingOneBoost: 0.03,
    spreadLabelBoost: 0.6,
    snapThresholdRatio: 0.2,
  },
} as const;

export const GameDevHiveGallery = ({
  items,
  iconMap,
  isLoading = false,
  emptyMessage = "No projects added yet.",
}: GameDevHiveGalleryProps) => {
  const scrollContainer = useScrollContainer();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isSpreadMode, setIsSpreadMode] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [stageBounds, setStageBounds] = useState<DOMRect | null>(null);
  const [centerNodeBounds, setCenterNodeBounds] = useState<DOMRect | null>(null);
  const clusterX = useMotionValue(0);
  const clusterY = useMotionValue(0);
  const [visualOffset, setVisualOffset] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null);
  const spreadPointerOriginRef = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const centerNodeRef = useRef<HTMLButtonElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (items.length === 0) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      const gridDim = items.length > 9 ? 5 : 3;
      const half = Math.floor(gridDim / 2);
      setFocusedIndex(clampIndex(half * gridDim + half, items.length));
      return;
    }

    setFocusedIndex((current) => clampIndex(current, items.length));
  }, [items.length]);

  const focusIndex = clampIndex(focusedIndex, items.length);
  const gridDimension = items.length > 9 ? 5 : 3;
  const gridConfig = GRID_CONFIG[gridDimension];
  const halfGrid = Math.floor(gridDimension / 2);
  const { cellWidth, cellHeight } = gridConfig;
  const spacingMultiplier = isSpreadMode ? gridConfig.spreadSpacingMultiplier : 1;

  const virtualCells = useMemo(() => {
    if (items.length === 0) return [];

    const cells: Array<{
      key: string;
      row: number;
      col: number;
      item: GameDevItem;
      itemIndex: number;
    }> = [];

    if (isSpreadMode) {
      // Spiral ordering from focusIndex outward.
      const spiralPositions = getSpiralPositions(halfGrid);

      spiralPositions.forEach(({ row, col }, spiralIndex) => {
        const itemIndex = focusIndex + spiralIndex;
        const item = items[itemIndex];

        if (!item) return;

        cells.push({
          key: `spread:${item.id}`,
          row,
          col,
          item,
          itemIndex,
        });
      });

      return cells;
    }

    // Normal drag mode: render ALL items at their fixed grid positions.
    // The cluster translates so the focused item is always at center.
    // Items near the edge are scaled/faded by ringDistance, but never unloaded.
    const focusedCol = focusIndex % gridDimension;
    const focusedRow = Math.floor(focusIndex / gridDimension);

    items.forEach((item, i) => {
      const colAbs = i % gridDimension;
      const rowAbs = Math.floor(i / gridDimension);
      cells.push({
        key: `grid:${item.id}`,
        row: rowAbs - focusedRow,
        col: colAbs - focusedCol,
        item,
        itemIndex: i,
      });
    });

    return cells;
  }, [focusIndex, gridDimension, halfGrid, isSpreadMode, items]);

  const previewColShift = Math.round(visualOffset.x / cellWidth);
  const previewRowShift = Math.round(visualOffset.y / cellHeight);
  const previewIndex = useMemo(() => {
    if (items.length === 0) return 0;

    return clampIndex(focusIndex - previewColShift - previewRowShift * gridDimension, items.length);
  }, [focusIndex, gridDimension, items.length, previewColShift, previewRowShift]);

  const clearLongPressTimer = useCallback(() => {
    if (!longPressTimerRef.current) return;

    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  const releaseSpreadMode = useCallback(() => {
    clearLongPressTimer();
    pointerOriginRef.current = null;
    spreadPointerOriginRef.current = null;
    setIsSpreadMode(false);
    setCenterNodeBounds(null);
    setStageBounds(null);
  }, [clearLongPressTimer]);

  const armLongPress = useCallback(
    (clientX: number, clientY: number) => {
      clearLongPressTimer();
      pointerOriginRef.current = { x: clientX, y: clientY };
      longPressTimerRef.current = setTimeout(() => {
        setStageBounds(stageRef.current?.getBoundingClientRect() ?? null);
        spreadPointerOriginRef.current = pointerOriginRef.current;
        setIsSpreadMode(true);
        playHoverSound();
        longPressTimerRef.current = null;
      }, LONG_PRESS_MS);
    },
    [clearLongPressTimer],
  );

  const getSnapStateFromCurrentOffset = useCallback(() => {
    if (items.length === 0) {
      return { index: 0, colShift: 0, rowShift: 0 };
    }

    const colShift = Math.round(clusterX.get() / cellWidth);
    const rowShift = Math.round(clusterY.get() / cellHeight);
    const index = clampIndex(focusIndex - colShift - rowShift * gridDimension, items.length);

    return { index, colShift, rowShift };
  }, [cellHeight, cellWidth, clusterX, clusterY, focusIndex, gridDimension, items.length]);

  useMotionValueEvent(clusterX, "change", (latest) => {
    setVisualOffset((current) => ({ ...current, x: latest }));
  });

  useMotionValueEvent(clusterY, "change", (latest) => {
    setVisualOffset((current) => ({ ...current, y: latest }));
  });

  const springClusterToCenter = useCallback(() => {
    const stopX = animate(clusterX, 0, {
      type: "spring",
      stiffness: 180,
      damping: 26,
      mass: 0.9,
    });
    const stopY = animate(clusterY, 0, {
      type: "spring",
      stiffness: 180,
      damping: 26,
      mass: 0.9,
    });

    return () => {
      stopX.stop();
      stopY.stop();
    };
  }, [clusterX, clusterY]);

  const activeItem = items[previewIndex];
  const ActiveProjectIcon = (
    activeItem?.icon_name ? (iconMap[activeItem.icon_name] ?? Gamepad2) : Gamepad2
  ) as React.ComponentType<{ className?: string }>;

  const snapToProject = useCallback(
    (index: number, withSound = false) => {
      const nextItem = items[index];

      if (!nextItem) return;

      if (withSound) {
        playClickSound();
      }

      setFocusedIndex(index);
      springClusterToCenter();
    },
    [items, springClusterToCenter],
  );

  const commitSnappedPreview = useCallback(() => {
    const dragDistance = Math.max(Math.abs(clusterX.get()), Math.abs(clusterY.get()));
    const snapThreshold = Math.min(cellWidth, cellHeight) * gridConfig.snapThresholdRatio;
    const { index, colShift, rowShift } = getSnapStateFromCurrentOffset();
    const nextItem = items[index];

    if (dragDistance < snapThreshold || index === focusIndex) {
      springClusterToCenter();
      return;
    }

    if (!nextItem) {
      springClusterToCenter();
      return;
    }

    const targetX = colShift * cellWidth;
    const targetY = rowShift * cellHeight;
    let settledAnimations = 0;

    const finalizeSnap = () => {
      settledAnimations += 1;

      if (settledAnimations < 2) return;

      clusterX.set(0);
      clusterY.set(0);
      setVisualOffset({ x: 0, y: 0 });
      setFocusedIndex(index);
    };

    const animateAxis = (motionValue: typeof clusterX, target: number, current: number) => {
      if (Math.abs(current - target) < 0.5) {
        finalizeSnap();
        return;
      }

      animate(motionValue, target, {
        type: "spring",
        stiffness: 260,
        damping: 28,
        mass: 0.82,
        onComplete: finalizeSnap,
      });
    };

    animateAxis(clusterX, targetX, clusterX.get());
    animateAxis(clusterY, targetY, clusterY.get());
  }, [
    cellHeight,
    cellWidth,
    clusterX,
    clusterY,
    focusIndex,
    getSnapStateFromCurrentOffset,
    gridConfig.snapThresholdRatio,
    items,
    springClusterToCenter,
  ]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  useEffect(() => {
    const element = scrollContainer?.current as HTMLElement | null;

    if (!element || !isInteracting) return;

    element.style.overflow = "hidden";

    return () => {
      element.style.overflow = "";
    };
  }, [isInteracting, scrollContainer]);

  useEffect(() => {
    if (!isSpreadMode) {
      setCenterNodeBounds(null);
      return;
    }

    let frameId = 0;

    const updateBounds = () => {
      setCenterNodeBounds(centerNodeRef.current?.getBoundingClientRect() ?? null);
      frameId = requestAnimationFrame(updateBounds);
    };

    frameId = requestAnimationFrame(updateBounds);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isSpreadMode, previewIndex, visualOffset.x, visualOffset.y]);

  if (isLoading) {
    return (
      <div className="gamedev-hive-shell" data-no-swipe-page>
        <div className="gamedev-hive-stage gamedev-hive-stage--loading">
          <div className="gamedev-hive-active-skeleton" />
          <div className="gamedev-hive-node-skeleton gamedev-hive-node-skeleton--a" />
          <div className="gamedev-hive-node-skeleton gamedev-hive-node-skeleton--b" />
          <div className="gamedev-hive-node-skeleton gamedev-hive-node-skeleton--c" />
          <div className="gamedev-hive-node-skeleton gamedev-hive-node-skeleton--d" />
        </div>
      </div>
    );
  }

  if (!activeItem) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="gamedev-hive-shell" data-no-swipe-page>
      <div
        ref={stageRef}
        className={`gamedev-hive-stage${isSpreadMode ? " gamedev-hive-stage--spread" : ""}`}
        onPointerDown={(event) => {
          setIsInteracting(true);
          armLongPress(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (isSpreadMode) {
            const origin = spreadPointerOriginRef.current;

            if (origin) {
              const dx = event.clientX - origin.x;
              const dy = event.clientY - origin.y;

              if (Math.hypot(dx, dy) > SPREAD_DISMISS_THRESHOLD) {
                releaseSpreadMode();
              }
            }

            return;
          }

          const origin = pointerOriginRef.current;

          if (!origin) return;

          const deltaX = event.clientX - origin.x;
          const deltaY = event.clientY - origin.y;

          if (Math.hypot(deltaX, deltaY) > LONG_PRESS_MOVE_TOLERANCE) {
            clearLongPressTimer();
            pointerOriginRef.current = null;
          }
        }}
        onPointerUp={() => {
          releaseSpreadMode();
          setIsInteracting(false);
        }}
        onPointerCancel={() => {
          releaseSpreadMode();
          setIsInteracting(false);
        }}
        onPointerLeave={() => {
          releaseSpreadMode();
          setIsInteracting(false);
        }}
      >
        <div className="gamedev-hive-backdrop" />
        <div className="absolute inset-0">
          <div
            className={`gamedev-hive-center-target${isSpreadMode ? " gamedev-hive-center-target--spread" : ""}`}
          />

          <motion.div
            className="gamedev-hive-cluster"
            drag={items.length > 1}
            dragMomentum={false}
            dragElastic={0.08}
            dragConstraints={false}
            style={{ x: clusterX, y: clusterY }}
            onDragStart={() => {
              if (!isSpreadMode) setIsInteracting(true);
            }}
            onDragEnd={() => {
              releaseSpreadMode();
              commitSnappedPreview();
              setIsInteracting(false);
            }}
          >
            {virtualCells.map(({ key, row, col, item, itemIndex }) => {
              const projectedCol = col * spacingMultiplier + visualOffset.x / cellWidth;
              const projectedRow = row * spacingMultiplier + visualOffset.y / cellHeight;
              const ringDistance = Math.max(Math.abs(projectedCol), Math.abs(projectedRow));
              const nodeScale =
                ringDistance < 0.5
                  ? gridConfig.centerScale + (isSpreadMode ? gridConfig.spreadCenterBoost : 0)
                  : ringDistance < 1.5
                    ? gridConfig.ringOneScale + (isSpreadMode ? gridConfig.spreadRingOneBoost : 0)
                    : ringDistance < 2.5
                      ? gridConfig.ringTwoScale
                      : gridConfig.edgeScale;
              const nodeOpacity =
                ringDistance < 0.5
                  ? 1
                  : ringDistance < 1.5
                    ? gridConfig.ringOneOpacity
                    : ringDistance < 2.5
                      ? gridConfig.ringTwoOpacity
                      : gridConfig.edgeOpacity;
              const showLabel =
                ringDistance <
                gridConfig.labelThreshold + (isSpreadMode ? gridConfig.spreadLabelBoost : 0);
              const showThumbnail = !!item.thumbnail_url;
              const ProjectIcon = (
                item.icon_name ? (iconMap[item.icon_name] ?? Gamepad2) : Gamepad2
              ) as React.ComponentType<{ className?: string }>;
              const isPreviewCenter = itemIndex === previewIndex && row === 0 && col === 0;

              return (
                <motion.button
                  key={key}
                  ref={isPreviewCenter ? centerNodeRef : null}
                  type="button"
                  aria-label={`Focus ${item.title}`}
                  className={`gamedev-hive-node${isPreviewCenter ? " gamedev-hive-node--center" : ""}`}
                  style={{
                    left: `calc(50% + ${col * cellWidth * spacingMultiplier}px)`,
                    top: `calc(50% + ${row * cellHeight * spacingMultiplier}px)`,
                    opacity: nodeOpacity,
                    zIndex: Math.max(1, 40 - Math.round(ringDistance * 10)),
                    width: `${gridConfig.cardWidth}px`,
                    height: `${gridConfig.cardHeight}px`,
                  }}
                  animate={{ scale: nodeScale }}
                  whileHover={{ scale: nodeScale + 0.04 }}
                  whileTap={{ scale: Math.max(0.5, nodeScale - 0.06) }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    snapToProject(itemIndex, true);
                  }}
                >
                  {showThumbnail ? (
                    <div
                      className="gamedev-hive-node-thumb"
                      style={{ backgroundImage: `url(${item.thumbnail_url})` }}
                    />
                  ) : (
                    <div className="gamedev-hive-node-icon">
                      <ProjectIcon className="h-4 w-4" />
                    </div>
                  )}
                  {showLabel ? <span className="gamedev-hive-node-label">{item.title}</span> : null}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Spread bubble is portaled to body so no stacking context can clip it */}
      </div>

      {isSpreadMode && stageBounds
        ? createPortal(
            <AnimatePresence mode="wait">
              <div
                key={activeItem.id}
                className="gamedev-hive-active-card gamedev-hive-active-card--spread"
                style={{
                  position: "fixed",
                  left: centerNodeBounds
                    ? centerNodeBounds.left + centerNodeBounds.width / 2
                    : stageBounds.left + stageBounds.width / 2,
                  top: centerNodeBounds ? centerNodeBounds.top - 10 : stageBounds.top,
                  transform: "translate(-50%, -100%)",
                  zIndex: 9999,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1.03, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -12 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="gamedev-hive-focus-core">
                    <div className="gamedev-hive-focus-orb">
                      <ActiveProjectIcon className="h-5 w-5 text-purple-300 drop-shadow-[0_0_4px_currentColor]" />
                    </div>

                    <div className="gamedev-hive-focus-copy">
                      <p className="gamedev-hive-focus-index">
                        {focusIndex + 1} / {items.length}
                      </p>
                      <h4 className="gamedev-hive-focus-title">{activeItem.title}</h4>

                      <p className="gamedev-hive-focus-description">{activeItem.description}</p>

                      {activeItem.tags?.length ? (
                        <div className="gamedev-hive-focus-tags">
                          {activeItem.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="gamedev-hive-focus-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              </div>
            </AnimatePresence>,
            document.body,
          )
        : null}

      <div className="gamedev-hive-meta">
        <p className="gamedev-hive-caption">
          {isSpreadMode
            ? "Release to collapse the spread view."
            : "Swipe to spin the hive, tap any node to focus it, or hold to spread it."}
        </p>
        <p className="gamedev-hive-count">{items.length} visible</p>
      </div>
    </div>
  );
};
