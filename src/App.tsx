/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { lazy, Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { useAdminIdleLogout } from "./hooks/auth/useAdminIdleLogout";
import { Home } from "./pages/Home";

const Login = lazy(async () => {
  const module = await import("./pages/Login");

  return { default: module.Login };
});
const Admin = lazy(async () => {
  const module = await import("./pages/Admin");

  return { default: module.Admin };
});
const GameDevProject = lazy(async () => {
  const module = await import("./pages/GameDevProject");

  return { default: module.GameDevProject };
});

function App() {
  useAdminIdleLogout();

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
        <Route
          path="/gamedev/projects/:id"
          element={
            <Suspense fallback={routeFallback}>
              <GameDevProject />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
