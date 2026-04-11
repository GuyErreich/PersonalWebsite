/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";

type GameDevPanelButtonVariant = "primary" | "secondary";

type GameDevPanelButtonIconPosition = "start" | "end";

interface GameDevPanelButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant: GameDevPanelButtonVariant;
  hoverX?: number;
  icon?: ReactNode;
  iconPosition?: GameDevPanelButtonIconPosition;
  ariaLabel?: string;
}

const BUTTON_CLASS_MAP: Record<GameDevPanelButtonVariant, string> = {
  primary: "gamedev-panel-primary-button",
  secondary: "gamedev-panel-action-button",
};

export const GameDevPanelButton = ({
  children,
  onClick,
  variant,
  hoverX = 0,
  icon,
  iconPosition = "end",
  ariaLabel,
}: GameDevPanelButtonProps) => {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      whileHover={{ scale: 1.02, x: hoverX }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={playHoverSound}
      onClick={() => {
        playClickSound();
        onClick();
      }}
      className={BUTTON_CLASS_MAP[variant]}
    >
      {iconPosition === "start" ? icon : null}
      {children}
      {iconPosition === "end" ? icon : null}
    </motion.button>
  );
};
