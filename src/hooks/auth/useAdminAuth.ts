/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasAdminRoleFromMetadata } from "../../lib/auth/roles";
import { supabase } from "../../lib/supabase";

interface UseAdminAuthResult {
  loading: boolean;
  handleLogout: () => Promise<void>;
}

/**
 * Validates the current session as admin on mount and redirects away if not.
 * Also listens for auth state changes so an externally triggered sign-out
 * (e.g. idle logout) immediately redirects to /login.
 */
export const useAdminAuth = (): UseAdminAuthResult => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          navigate("/login");
          return;
        }

        if (!hasAdminRoleFromMetadata(user.app_metadata)) {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) {
            console.error(signOutError.message);
          }
          navigate("/");
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        navigate("/login");
      }
    };

    void checkUser();
  }, [navigate]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/login");
        return;
      }

      if (!hasAdminRoleFromMetadata(session.user.app_metadata)) {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return;
    }
    navigate("/");
  }, [navigate]);

  return { loading, handleLogout };
};
