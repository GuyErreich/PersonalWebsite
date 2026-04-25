/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import {
  FolderOpen,
  Gamepad2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  RefreshCw,
  Server,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DevOpsTechStackManager } from "../components/admin/DevOpsTechStackManager";
import { ItemFormModal } from "../components/admin/ItemFormModal";
import { ManagedProjectsList } from "../components/admin/ManagedProjectsList";
import { MediaLibraryManager } from "../components/admin/MediaLibraryManager";
import { ShowreelManager } from "../components/admin/ShowreelManager";
import type {
  AdminDevOpsProject,
  AdminGameDevProject,
  AdminProjectListItem,
} from "../components/admin/types";
import { useAdminAuth } from "../hooks/auth/useAdminAuth";
import { parseGameDevStoredContent } from "../lib/gamedev";
import { playClickSound, playHoverSound } from "../lib/sound/interactionSounds";
import { supabase } from "../lib/supabase";

const FALLBACK_EMPTY_ERROR = "Unable to load project list.";

type AdminSection = "showreel" | "gamedev" | "devops" | "gallery";
type ProjectSection = "gamedev" | "devops";

export const Admin = () => {
  const { loading, handleLogout } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>("showreel");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ProjectSection>("gamedev");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [gameDevProjects, setGameDevProjects] = useState<AdminGameDevProject[]>([]);
  const [devOpsProjects, setDevOpsProjects] = useState<AdminDevOpsProject[]>([]);
  const [editingItem, setEditingItem] = useState<AdminGameDevProject | AdminDevOpsProject | null>(
    null,
  );

  const loadProjects = async () => {
    setIsFetching(true);
    setFetchError(null);

    try {
      const [gameDevResponse, devOpsResponse] = await Promise.all([
        supabase.from("gamedev_items").select("*").order("created_at", { ascending: false }),
        supabase.from("devops_projects").select("*").order("created_at", { ascending: false }),
      ]);

      if (gameDevResponse.error) {
        setFetchError(gameDevResponse.error.message);
      } else {
        setGameDevProjects(
          ((gameDevResponse.data ?? []) as AdminGameDevProject[]).map((item) => ({
            ...item,
            tags: item.tags ?? [],
          })),
        );
      }

      if (devOpsResponse.error) {
        setFetchError(devOpsResponse.error.message);
      } else {
        setDevOpsProjects((devOpsResponse.data ?? []) as AdminDevOpsProject[]);
      }
    } catch {
      setFetchError(FALLBACK_EMPTY_ERROR);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const gameDevListItems = useMemo<AdminProjectListItem[]>(
    () =>
      gameDevProjects.map((item) => {
        const parsed = parseGameDevStoredContent(item.description);

        return {
          id: item.id,
          title: item.title,
          description: parsed.summary,
          tags: item.tags ?? [],
          created_at: item.created_at,
        };
      }),
    [gameDevProjects],
  );

  const devOpsListItems = useMemo<AdminProjectListItem[]>(
    () =>
      devOpsProjects.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        tags: item.tech_stack,
        created_at: item.created_at,
      })),
    [devOpsProjects],
  );

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleEdit = (id: string, section: ProjectSection) => {
    if (section === "gamedev") {
      const target = gameDevProjects.find((item) => item.id === id) ?? null;
      setEditingItem(target);
      setModalType("gamedev");
      setIsModalOpen(Boolean(target));
      return;
    }

    const target = devOpsProjects.find((item) => item.id === id) ?? null;
    setEditingItem(target);
    setModalType("devops");
    setIsModalOpen(Boolean(target));
  };

  const handleCreate = (section: ProjectSection) => {
    setEditingItem(null);
    setModalType(section);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    void loadProjects();
    setIsModalOpen(false);
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  const isProjectSection = activeSection === "gamedev" || activeSection === "devops";

  const projectSection: ProjectSection = activeSection === "devops" ? "devops" : "gamedev";

  const navItems: Array<{ id: AdminSection; label: string; icon: typeof Play }> = [
    { id: "showreel", label: "Showreel", icon: Play },
    { id: "gamedev", label: "GameDev", icon: Gamepad2 },
    { id: "devops", label: "DevOps", icon: Server },
    { id: "gallery", label: "Gallery", icon: FolderOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="border-b border-gray-700 bg-gray-800 px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold">Portfolio Management</h1>
          <div className="flex items-center space-x-4">
            <a href="/" className="text-sm text-gray-400 hover:text-white">
              View Site
            </a>
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={playHoverSound}
              onClick={() => {
                playClickSound();
                handleLogout();
              }}
              className="flex items-center space-x-2 text-red-400 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex max-w-7xl gap-4 px-4 py-8">
        <aside
          className={`sticky top-6 h-fit rounded-xl border border-gray-700 bg-gray-800 p-3 transition-all ${
            isSidebarCollapsed ? "w-[72px]" : "w-[220px]"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <p className="text-xs uppercase tracking-wide text-gray-400">Sections</p>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={playHoverSound}
              onClick={() => {
                playClickSound();
                setIsSidebarCollapsed((prev) => !prev);
              }}
              className="rounded-md border border-gray-600 p-1.5 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-200"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </motion.button>
          </div>

          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    setActiveSection(item.id);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "border border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                      : "border border-transparent bg-gray-900/40 text-gray-300 hover:border-gray-600"
                  } ${isSidebarCollapsed ? "justify-center px-1" : "justify-start"}`}
                >
                  <Icon className="h-4 w-4" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </motion.button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {activeSection === "showreel" && <ShowreelManager />}

          {activeSection === "gallery" && <MediaLibraryManager />}

          {isProjectSection && (
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-2xl font-bold">
                  {projectSection === "gamedev" ? "Game Dev Projects" : "DevOps Projects"}
                </h2>

                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      playClickSound();
                      void loadProjects();
                    }}
                    className="flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:border-gray-500"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      playClickSound();
                      handleCreate(projectSection);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add New
                  </motion.button>
                </div>
              </div>

              {fetchError && (
                <div className="mb-4 rounded border border-red-500 bg-red-500/10 p-3 text-sm text-red-300">
                  {fetchError}
                </div>
              )}

              {isFetching ? (
                <p className="py-10 text-center text-gray-400">Loading projects...</p>
              ) : projectSection === "gamedev" ? (
                <ManagedProjectsList
                  title="Existing GameDev Projects"
                  emptyText="No GameDev projects yet. Click Add New to create one."
                  items={gameDevListItems}
                  onEdit={(id) => handleEdit(id, "gamedev")}
                />
              ) : (
                <ManagedProjectsList
                  title="Existing DevOps Projects"
                  emptyText="No DevOps projects yet. Click Add New to create one."
                  items={devOpsListItems}
                  onEdit={(id) => handleEdit(id, "devops")}
                />
              )}

              {projectSection === "devops" && <DevOpsTechStackManager />}
            </div>
          )}
        </section>

        <ItemFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          type={modalType}
          onSuccess={handleSaveSuccess}
          editingItem={editingItem}
        />
      </main>
    </div>
  );
};
