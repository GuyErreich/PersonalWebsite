/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu = ({ x, y, items, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handlePointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose]);

  useEffect(() => {
    firstItemRef.current?.focus();
  }, []);

  useEffect(() => {
    const menuNode = ref.current;
    if (!menuNode) {
      setPosition({ left: x, top: y });
      return;
    }

    const viewportPadding = 8;
    const menuRect = menuNode.getBoundingClientRect();
    const maxLeft = Math.max(viewportPadding, window.innerWidth - menuRect.width - viewportPadding);
    const maxTop = Math.max(
      viewportPadding,
      window.innerHeight - menuRect.height - viewportPadding,
    );

    setPosition({
      left: Math.min(Math.max(viewportPadding, x), maxLeft),
      top: Math.min(Math.max(viewportPadding, y), maxTop),
    });
  }, [x, y, items.length]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      style={{ top: position.top, left: position.left }}
      role="menu"
      aria-label="Context menu"
      className="fixed z-50 min-w-[168px] overflow-hidden rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-2xl"
    >
      {items.map((item, index) => (
        <motion.button
          key={item.label}
          ref={index === 0 ? firstItemRef : undefined}
          type="button"
          role="menuitem"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            item.onClick();
            onClose();
          }}
          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
            item.danger
              ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
              : "text-gray-200 hover:bg-gray-800 hover:text-white"
          }`}
        >
          {item.icon}
          {item.label}
        </motion.button>
      ))}
    </motion.div>
  );
};
