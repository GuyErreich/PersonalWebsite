/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from "react";
import { hasAdminRoleFromMetadata } from "../../lib/auth/roles";
import { supabase } from "../../lib/supabase";

const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 30_000;

/**
 * Per-tab admin idle-logout hook.
 * Mount once at app root. Signs out the admin session after 15 minutes of
 * inactivity in the current tab. Each tab tracks its own deadline independently;
 * activity in another tab does not reset this tab's timer.
 *
 * Strategies used:
 *  1. Activity events reset an absolute deadline timestamp.
 *  2. setTimeout fires at the exact deadline.
 *  3. visibilitychange + focus check the deadline when the tab regains focus.
 *  4. A 30-second interval catches any browser-throttled timers.
 *  5. Supabase auth state changes update the hasAdminSession flag.
 */
export const useAdminIdleLogout = () => {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleDeadlineRef = useRef<number | null>(null);

  useEffect(() => {
    let hasAdminSession = false;
    let idleCheckIntervalId: ReturnType<typeof setInterval> | null = null;

    const clearIdleTimer = () => {
      if (!idleTimerRef.current) return;
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    };

    const clearIdleTracking = () => {
      clearIdleTimer();
      idleDeadlineRef.current = null;
    };

    const activityEvents = ["mousemove", "keydown", "pointerdown", "scroll"] as const;

    const startActivityTracking = () => {
      if (idleCheckIntervalId) return;

      for (const eventName of activityEvents) {
        window.addEventListener(eventName, markActivity, { passive: true });
      }

      document.addEventListener("visibilitychange", checkIdleExpiry);
      window.addEventListener("focus", checkIdleExpiry);

      idleCheckIntervalId = setInterval(checkIdleExpiry, IDLE_CHECK_INTERVAL_MS);
    };

    const stopActivityTracking = () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markActivity);
      }

      document.removeEventListener("visibilitychange", checkIdleExpiry);
      window.removeEventListener("focus", checkIdleExpiry);

      if (!idleCheckIntervalId) return;

      clearInterval(idleCheckIntervalId);
      idleCheckIntervalId = null;
    };

    const performIdleLogout = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) return;

      if (!hasAdminRoleFromMetadata(user.app_metadata)) return;

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error(signOutError.message);
        idleDeadlineRef.current = Date.now() + ADMIN_IDLE_TIMEOUT_MS;
        scheduleIdleLogout();
      }
    };

    const checkIdleExpiry = () => {
      if (!hasAdminSession || !idleDeadlineRef.current) return;

      if (Date.now() >= idleDeadlineRef.current) {
        clearIdleTracking();
        void performIdleLogout();
      }
    };

    const scheduleIdleLogout = () => {
      clearIdleTimer();
      if (!idleDeadlineRef.current) return;

      const remainingMs = idleDeadlineRef.current - Date.now();
      if (remainingMs <= 0) {
        checkIdleExpiry();
        return;
      }

      idleTimerRef.current = setTimeout(checkIdleExpiry, remainingMs);
    };

    const markActivity = () => {
      if (!hasAdminSession) return;
      idleDeadlineRef.current = Date.now() + ADMIN_IDLE_TIMEOUT_MS;
      scheduleIdleLogout();
    };

    const refreshAdminSessionState = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        hasAdminSession = false;
        clearIdleTracking();
        stopActivityTracking();
        return;
      }

      hasAdminSession = hasAdminRoleFromMetadata(user.app_metadata);

      if (!hasAdminSession) {
        clearIdleTracking();
        stopActivityTracking();
        return;
      }

      startActivityTracking();
      markActivity();
    };

    void refreshAdminSessionState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      hasAdminSession = !!session?.user && hasAdminRoleFromMetadata(session.user.app_metadata);

      if (!hasAdminSession) {
        clearIdleTracking();
        stopActivityTracking();
        return;
      }

      startActivityTracking();
      markActivity();
    });

    return () => {
      clearIdleTracking();
      stopActivityTracking();

      subscription.unsubscribe();
    };
  }, []);
};
