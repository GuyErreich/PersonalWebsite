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
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevIconMap, GameDevItem } from "../../common/data/types";

interface GameDevHiveGalleryProps {
  items: GameDevItem[];
  iconMap: GameDevIconMap;
  isLoading?: boolean;
  emptyMessage?: string;
}

const modulo = (value: number, size: number) => ((value % size) + size) % size;
const LONG_PRESS_MS = 280;
const LONG_PRESS_MOVE_TOLERANCE = 14;
const SPREAD_SPACING_MULTIPLIER = 1.28;

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
  },
} as const;

export const GameDevHiveGallery = ({
  items,
  iconMap,
  isLoading = false,
  emptyMessage = "No projects added yet.",
}: GameDevHiveGalleryProps) => {
  const [focusedId, setFocusedId] = useState<string | null>(items[0]?.id ?? null);
  const [isSpreadMode, setIsSpreadMode] = useState(false);
  const clusterX = useMotionValue(0);
  const clusterY = useMotionValue(0);
  const [visualOffset, setVisualOffset] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setFocusedId(null);
      return;
    }

    if (!focusedId || !items.some((item) => item.id === focusedId)) {
      setFocusedId(items[0].id);
    }
  }, [focusedId, items]);

  const focusIndex = useMemo(() => {
    const index = items.findIndex((item) => item.id === focusedId);

    return index >= 0 ? index : 0;
  }, [focusedId, items]);
  const gridDimension = items.length > 9 ? 5 : 3;
  const gridConfig = GRID_CONFIG[gridDimension];
  const halfGrid = Math.floor(gridDimension / 2);
  const renderPadding = 1;
  const { cellWidth, cellHeight } = gridConfig;
  const spacingMultiplier = isSpreadMode ? SPREAD_SPACING_MULTIPLIER : 1;

  const virtualCells = useMemo(() => {
    const cells: Array<{
      key: string;
      row: number;
      col: number;
      item: GameDevItem;
      itemIndex: number;
    }> = [];

    if (items.length === 0) {
      return cells;
    }

    for (let row = -halfGrid - renderPadding; row <= halfGrid + renderPadding; row += 1) {
      for (let col = -halfGrid - renderPadding; col <= halfGrid + renderPadding; col += 1) {
        const linearOffset = row * gridDimension + col;
        const itemIndex = modulo(focusIndex + linearOffset, items.length);

        cells.push({
          key: `${row}:${col}:${items[itemIndex]?.id ?? itemIndex}`,
          row,
          col,
          item: items[itemIndex],
          itemIndex,
        });
      }
    }

    return cells;
  }, [focusIndex, gridDimension, halfGrid, items]);

  const previewColShift = Math.round(visualOffset.x / cellWidth);
  const previewRowShift = Math.round(visualOffset.y / cellHeight);
  const previewIndex = useMemo(() => {
    if (items.length === 0) return 0;

    return modulo(focusIndex - previewColShift - previewRowShift * gridDimension, items.length);
  }, [focusIndex, gridDimension, items.length, previewColShift, previewRowShift]);

  const clearLongPressTimer = useCallback(() => {
    if (!longPressTimerRef.current) return;

    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  const releaseSpreadMode = useCallback(() => {
    clearLongPressTimer();
    pointerOriginRef.current = null;
    setIsSpreadMode(false);
  }, [clearLongPressTimer]);

  const armLongPress = useCallback(
    (clientX: number, clientY: number) => {
      clearLongPressTimer();
      pointerOriginRef.current = { x: clientX, y: clientY };
      longPressTimerRef.current = setTimeout(() => {
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
    const index = modulo(focusIndex - colShift - rowShift * gridDimension, items.length);

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
      setFocusedId(nextItem.id);
      springClusterToCenter();
    },
    [items, springClusterToCenter],
  );

  const commitSnappedPreview = useCallback(() => {
    const { index, colShift, rowShift } = getSnapStateFromCurrentOffset();
    const nextItem = items[index];

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
      setFocusedId(nextItem.id);
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
    getSnapStateFromCurrentOffset,
    items,
    springClusterToCenter,
  ]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  if (isLoading) {
    return (
      <div className="gamedev-hive-shell">
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
    <div className="gamedev-hive-shell">
      <div
        className={`gamedev-hive-stage${isSpreadMode ? " gamedev-hive-stage--spread" : ""}`}
        onPointerDown={(event) => {
          armLongPress(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          const origin = pointerOriginRef.current;

          if (!origin || isSpreadMode) return;

          const deltaX = event.clientX - origin.x;
          const deltaY = event.clientY - origin.y;

          if (Math.hypot(deltaX, deltaY) > LONG_PRESS_MOVE_TOLERANCE) {
            clearLongPressTimer();
            pointerOriginRef.current = null;
          }
        }}
        onPointerUp={releaseSpreadMode}
        onPointerCancel={releaseSpreadMode}
        onPointerLeave={releaseSpreadMode}
      >
        <div className="gamedev-hive-backdrop" />
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
            releaseSpreadMode();
          }}
          onDragEnd={() => {
            releaseSpreadMode();
            commitSnappedPreview();
          }}
        >
          {virtualCells.map(({ key, row, col, item, itemIndex }) => {
            const projectedCol = col * spacingMultiplier + visualOffset.x / cellWidth;
            const projectedRow = row * spacingMultiplier + visualOffset.y / cellHeight;
            const ringDistance = Math.max(Math.abs(projectedCol), Math.abs(projectedRow));
            const nodeScale =
              ringDistance < 0.5
                ? gridConfig.centerScale + (isSpreadMode ? 0.08 : 0)
                : ringDistance < 1.5
                  ? gridConfig.ringOneScale + (isSpreadMode ? 0.03 : 0)
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
            const showLabel = ringDistance < gridConfig.labelThreshold + (isSpreadMode ? 0.95 : 0);
            const showThumbnail = !!item.thumbnail_url;
            const ProjectIcon = (
              item.icon_name ? (iconMap[item.icon_name] ?? Gamepad2) : Gamepad2
            ) as React.ComponentType<{ className?: string }>;
            const isPreviewCenter = itemIndex === previewIndex && row === 0 && col === 0;

            return (
              <motion.button
                key={key}
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

        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: isSpreadMode ? 1.03 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`gamedev-hive-active-card${isSpreadMode ? " gamedev-hive-active-card--spread" : ""}`}
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

                {isSpreadMode ? (
                  <>
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
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

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
