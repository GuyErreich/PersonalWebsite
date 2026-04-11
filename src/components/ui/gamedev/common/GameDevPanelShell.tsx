/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ReactNode } from "react";

interface GameDevPanelShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export const GameDevPanelShell = ({
  eyebrow,
  title,
  description,
  rightAction,
  children,
  footer,
}: GameDevPanelShellProps) => {
  return (
    <div className="gamedev-panel-card">
      <div className="gamedev-panel-header">
        <div>
          <p className="gamedev-panel-eyebrow">{eyebrow}</p>
          <h3 className="gamedev-panel-title">{title}</h3>
        </div>
        {rightAction}
      </div>
      {description ? <p className="gamedev-panel-description">{description}</p> : null}
      <div className="gamedev-panel-scroll">{children}</div>
      {footer}
    </div>
  );
};
