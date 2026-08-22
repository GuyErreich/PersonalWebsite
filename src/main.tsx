/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const rootEl = document.getElementById("root");
// #region agent log
fetch("http://127.0.0.1:7602/ingest/fe3726c4-9ddf-48a8-8526-d45977fb3425", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1d80fb" },
  body: JSON.stringify({
    sessionId: "1d80fb",
    runId: "post-fix",
    hypothesisId: "C",
    location: "main.tsx:bootstrap",
    message: "React bootstrap starting",
    data: { hasRoot: Boolean(rootEl) },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

createRoot(rootEl!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
