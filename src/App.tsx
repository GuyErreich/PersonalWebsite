/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { lazy, Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from "./pages/Home";

const Login = lazy(async () =>
  import("./pages/Login").then((module) => ({ default: module.Login })),
);
const Admin = lazy(async () =>
  import("./pages/Admin").then((module) => ({ default: module.Admin })),
);

function App() {
  const routeFallback = <div className="min-h-screen bg-gray-900" />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <Suspense fallback={routeFallback}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/management"
          element={
            <Suspense fallback={routeFallback}>
              <Admin />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
