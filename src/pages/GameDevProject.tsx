/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Github, Layers3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { fallbackGameDevItems } from "../components/ui/gamedev/common/data/items";
import type {
  GameDevItem,
  GameDevMediaItem,
  GameDevVfxItem,
} from "../components/ui/gamedev/common/data/types";
import { GameDevProjectHeaderMedia } from "../components/ui/gamedev/common/media/GameDevProjectHeaderMedia";
import { GameDevProjectMediaGallery } from "../components/ui/gamedev/common/media/GameDevProjectMediaGallery";
import { GameDevProjectVfxSection } from "../components/ui/gamedev/common/media/GameDevProjectVfxSection";
import {
  buildGameDevSummary,
  dedupeGameDevVfxByMediaUrl,
  inferMediaTypeFromUrl,
  isGameDevComingSoon,
  parseGameDevStoredContent,
} from "../lib/gamedev";
import { playClickSound, playHoverSound } from "../lib/sound/interactionSounds";
import { supabase } from "../lib/supabase";

interface ProjectState {
  project: GameDevItem | null;
  mediaItems: GameDevMediaItem[];
  linkedVfx: GameDevVfxItem[];
  isLoading: boolean;
  error: string | null;
}

const MotionLink = motion(Link);

export const GameDevProject = () => {
  const { id } = useParams();
  const [state, setState] = useState<ProjectState>({
    project: null,
    mediaItems: [],
    linkedVfx: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCurrent = true;

    const safeSetState = (nextState: ProjectState) => {
      if (!isCurrent) {
        return;
      }

      setState(nextState);
    };

    if (!id) {
      safeSetState({
        project: null,
        mediaItems: [],
        linkedVfx: [],
        isLoading: false,
        error: "Missing project id.",
      });
      return () => {
        isCurrent = false;
      };
    }

    void (async () => {
      safeSetState({
        project: null,
        mediaItems: [],
        linkedVfx: [],
        isLoading: true,
        error: null,
      });

      try {
        const { data: projectData, error: projectError } = await supabase
          .from("gamedev_items")
          .select("*")
          .eq("id", id)
          .single();

        if (projectError || !projectData) {
          const fallback = fallbackGameDevItems.find((item) => item.id === id) ?? null;
          if (!fallback) {
            safeSetState({
              project: null,
              mediaItems: [],
              linkedVfx: [],
              isLoading: false,
              error: "Project not found.",
            });
            return;
          }

          safeSetState({
            project: fallback,
            mediaItems: [],
            linkedVfx: [],
            isLoading: false,
            error: null,
          });
          return;
        }

        const typedProject = projectData as GameDevItem;

        const [{ data: mediaData, error: mediaError }, { data: linkData }] = await Promise.all([
          supabase
            .from("gamedev_item_media")
            .select("*")
            .eq("gamedev_item_id", id)
            .order("sort_order", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: true }),
          supabase
            .from("gamedev_project_vfx")
            .select("gamedev_vfx_id, sort_order")
            .eq("gamedev_item_id", id)
            .order("sort_order", { ascending: true, nullsFirst: false }),
        ]);

        const normalizedMedia = mediaError
          ? []
          : (mediaData ?? []).map((item) => {
              const typedItem = item as GameDevMediaItem;
              return {
                ...typedItem,
                media_type: typedItem.media_type ?? inferMediaTypeFromUrl(typedItem.media_url),
              };
            });

        let linkedVfx: GameDevVfxItem[] = [];

        if (linkData && linkData.length > 0) {
          const vfxIds = linkData.map((link) => link.gamedev_vfx_id);
          const { data: vfxData } = await supabase.from("gamedev_vfx").select("*").in("id", vfxIds);

          const vfxById = new Map(
            ((vfxData ?? []) as GameDevVfxItem[]).map((item) => [item.id, item]),
          );

          linkedVfx = dedupeGameDevVfxByMediaUrl(
            linkData
              .map((link) => vfxById.get(link.gamedev_vfx_id) ?? null)
              .filter((item): item is GameDevVfxItem => item != null),
          );
        }

        safeSetState({
          project: typedProject,
          mediaItems: normalizedMedia,
          linkedVfx,
          isLoading: false,
          error: null,
        });
      } catch {
        const fallback = fallbackGameDevItems.find((item) => item.id === id) ?? null;

        if (fallback) {
          safeSetState({
            project: fallback,
            mediaItems: [],
            linkedVfx: [],
            isLoading: false,
            error: null,
          });
          return;
        }

        safeSetState({
          project: null,
          mediaItems: [],
          linkedVfx: [],
          isLoading: false,
          error: "Project not found.",
        });
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  const content = useMemo(() => {
    if (!state.project) return "";

    const parsed = parseGameDevStoredContent(state.project.description);
    return parsed.body || "No project documentation has been added yet.";
  }, [state.project]);

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-800" />
          <div className="mt-6 h-10 w-2/3 animate-pulse rounded-lg bg-slate-800" />
          <div className="mt-8 aspect-video animate-pulse rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  if (state.error || !state.project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-semibold">Project unavailable</h1>
          <p className="mt-3 text-slate-300">
            {state.error ?? "This project could not be loaded."}
          </p>
          <MotionLink
            to="/#gamedev"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={playHoverSound}
            onClick={playClickSound}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:border-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </MotionLink>
        </div>
      </div>
    );
  }

  const project = state.project;
  const comingSoon = isGameDevComingSoon(project);
  const summary = project.summary ?? buildGameDevSummary(project.description, 240);
  const headerMediaUrl =
    project.header_media_url?.trim() || project.media_url?.trim() || null;
  const showVfxSection = project.show_vfx_section !== false && state.linkedVfx.length > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_42%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.14),transparent_42%),linear-gradient(to_bottom,#030712,#0f172a)] text-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <MotionLink
            to="/#gamedev"
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={playHoverSound}
            onClick={playClickSound}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:border-cyan-300/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to GameDev
          </MotionLink>

          <div className="flex items-center gap-2">
            {project.github_url ? (
              <motion.a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-cyan-300/45"
              >
                <Github className="h-4 w-4" />
                GitHub
              </motion.a>
            ) : null}

            {project.live_url ? (
              <motion.a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-cyan-300/45"
              >
                <ExternalLink className="h-4 w-4" />
                Live
              </motion.a>
            ) : null}
          </div>
        </div>

        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
            {comingSoon ? "Coming Soon" : "GameDev Project"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {project.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            {summary}
          </p>
        </header>

        {comingSoon ? (
          <section className="mb-10 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/90">
              In development
            </p>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-amber-50/90">
              This project is still in progress. Check back later for screenshots, breakdowns, and
              playable builds.
            </p>
            {headerMediaUrl ? (
              <div className="mt-8">
                <GameDevProjectHeaderMedia
                  mediaUrl={headerMediaUrl}
                  thumbnailUrl={project.header_thumbnail_url}
                  title={project.title}
                />
              </div>
            ) : null}
            {state.mediaItems.length > 0 ? (
              <div className="mt-8">
                <GameDevProjectMediaGallery
                  mediaItems={state.mediaItems}
                  projectTitle={project.title}
                />
              </div>
            ) : null}
            {project.tags && project.tags.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <>
            {headerMediaUrl ? (
              <section className="mb-10">
                <GameDevProjectHeaderMedia
                  mediaUrl={headerMediaUrl}
                  thumbnailUrl={project.header_thumbnail_url}
                  title={project.title}
                />
              </section>
            ) : null}

            {state.mediaItems.length > 0 ? (
              <section className="mb-10">
                <GameDevProjectMediaGallery
                  mediaItems={state.mediaItems}
                  projectTitle={project.title}
                />
              </section>
            ) : null}

            {showVfxSection ? <GameDevProjectVfxSection vfxItems={state.linkedVfx} /> : null}

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <article className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,1)] md:p-7">
                <MarkdownRenderer content={content} />
              </article>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300/80">
                    <Layers3 className="h-3.5 w-3.5" />
                    Tech Stack
                  </div>

                  {project.tags && project.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300">
                      Tags will appear here once added in management.
                    </p>
                  )}
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
