/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import {
  Code2,
  Cpu,
  Database,
  Gamepad2,
  Globe,
  Monitor,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Terminal,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useDevOpsTechStacks } from "../../hooks/devops/useDevOpsTechStacks";
import {
  buildGameDevStoredContent,
  dedupeGameDevVfxByMediaUrl,
  GAMEDEV_COMING_SOON_DEFAULT_SUMMARY,
  isImageUrl,
  parseGameDevStoredContent,
} from "../../lib/gamedev";
import {
  ensureVfxFromMediaLibraryItem,
  markVfxShownInLibrary,
  normalizeLinkedVfxIds,
} from "../../lib/gamedev/vfxLibrary";
import { fetchGitHubProjectSeed } from "../../lib/github/fetchRepoSeed";
import {
  playClickSound,
  playHoverSound,
  playMenuCloseSound,
} from "../../lib/sound/interactionSounds";
import {
  type MediaLibraryItem,
  stripFileExtension,
  uploadOrReuseMediaLibraryItem,
} from "../../lib/storage/mediaLibrary";
import {
  getMimeTypesForFolder,
  R2_UPLOAD_FOLDERS,
  R2_UPLOAD_POLICIES,
} from "../../lib/storage/r2UploadPolicies";
import { supabase } from "../../lib/supabase";
import {
  GAMEDEV_FORM_SECTIONS,
  type GameDevFormSectionId,
  type MediaLibraryRoleFilter,
  sectionIdFromWizardStep,
} from "./gamedev/formSections";
import { GameDevProjectFormShell } from "./gamedev/GameDevProjectFormShell";
import { GameDevBasicsSection } from "./gamedev/sections/GameDevBasicsSection";
import { GameDevContentSection } from "./gamedev/sections/GameDevContentSection";
import { GameDevDiscoverySection } from "./gamedev/sections/GameDevDiscoverySection";
import { GameDevLinksSection } from "./gamedev/sections/GameDevLinksSection";
import { GameDevMediaSection } from "./gamedev/sections/GameDevMediaSection";
import type { MediaLibraryPickerAction } from "./mediaLibrary/MediaLibraryPickerExplorer";
import { MediaLibraryPickerModal } from "./mediaLibrary/MediaLibraryPickerModal";
import type { AdminDevOpsProject, AdminGameDevProject, AdminGameDevVfx } from "./types";

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "gamedev" | "devops";
  onSuccess: () => void;
  editingItem?: AdminGameDevProject | AdminDevOpsProject | null;
  gameDevCreatePreset?: "full" | "coming_soon";
}

const AVAILABLE_ICONS = [
  { id: "gamepad", icon: Gamepad2, label: "Game" },
  { id: "code", icon: Code2, label: "Code" },
  { id: "server", icon: Server, label: "Server" },
  { id: "globe", icon: Globe, label: "Web" },
  { id: "cpu", icon: Cpu, label: "Hardware" },
  { id: "database", icon: Database, label: "Database" },
  { id: "rocket", icon: Rocket, label: "Rocket" },
  { id: "shield", icon: Shield, label: "Security" },
  { id: "terminal", icon: Terminal, label: "Terminal" },
  { id: "wrench", icon: Wrench, label: "Tool" },
  { id: "smartphone", icon: Smartphone, label: "Mobile" },
  { id: "monitor", icon: Monitor, label: "Desktop" },
];

const ALLOWED_MEDIA_MIME_TYPES = new Set(getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevAssets));

const MEDIA_ACCEPT = getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevAssets).join(",");

const MAX_MEDIA_SIZE_BYTES = R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.gameDevAssets].maxBytes;
const MAX_MEDIA_SIZE_MB = Math.round(MAX_MEDIA_SIZE_BYTES / (1024 * 1024));
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 50000;
const MAX_STACK_LENGTH = 40;

/**
 * Merge a server fetch into the in-modal catalog without dropping rows added
 * via in-modal VFX create while the fetch was in flight.
 */
const mergeFetchedAvailableVfx = (
  prev: AdminGameDevVfx[],
  fetched: AdminGameDevVfx[],
): AdminGameDevVfx[] => {
  const fetchedIds = new Set(fetched.map((item) => item.id));
  const localOnly = prev.filter((item) => !fetchedIds.has(item.id));
  return dedupeGameDevVfxByMediaUrl([...fetched, ...localOnly]);
};

type BodyEditorTab = "write" | "preview";

const escapeMarkdownImageLabel = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const normalizeOptionalHttpsUrl = (value: string, fieldName: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${fieldName} must use HTTPS.`);
  }

  return parsed.href;
};

export const ItemFormModal = ({
  isOpen,
  onClose,
  type,
  onSuccess,
  editingItem = null,
  gameDevCreatePreset = "full",
}: ItemFormModalProps) => {
  const formIdBase = useId();
  const modalTitleId = `${formIdBase}-modal-title`;
  const gameDevSectionTitleId = `${formIdBase}-gamedev-section-title`;
  const itemTitleId = `${formIdBase}-item-title`;
  const itemDescriptionId = `${formIdBase}-item-description`;
  const itemBodyId = `${formIdBase}-item-body`;
  const itemBodyAssetUploadId = `${formIdBase}-item-body-asset-upload`;
  const itemMediaId = `${formIdBase}-item-media`;
  const itemGithubUrlId = `${formIdBase}-item-github-url`;
  const itemLiveUrlId = `${formIdBase}-item-live-url`;
  const itemRepoUrlId = `${formIdBase}-item-repo-url`;
  const customGameTagInputId = `${formIdBase}-custom-game-tag-input`;
  const customStackInputId = `${formIdBase}-custom-stack-input`;
  const bodyAssetInputRef = useRef<HTMLInputElement>(null);
  const headerMediaLibraryReloadRef = useRef<(() => Promise<void>) | null>(null);
  const vfxMediaLibraryReloadRef = useRef<(() => Promise<void>) | null>(null);
  const formGenerationRef = useRef(0);
  const linkedVfxIdsEditedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { stacks: availableTechStacks } = useDevOpsTechStacks(isOpen && type === "devops");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("gamepad");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [selectedHeaderMediaUrl, setSelectedHeaderMediaUrl] = useState<string | null>(null);
  const [selectedHeaderThumbnailUrl, setSelectedHeaderThumbnailUrl] = useState<string | null>(null);
  const [selectedCardThumbnailUrl, setSelectedCardThumbnailUrl] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredSort, setFeaturedSort] = useState("");
  const [showVfxSection, setShowVfxSection] = useState(true);
  const [linkedVfxIds, setLinkedVfxIds] = useState<string[]>([]);
  const [linkedVfxDetails, setLinkedVfxDetails] = useState<AdminGameDevVfx[]>([]);
  const [availableVfx, setAvailableVfx] = useState<AdminGameDevVfx[]>([]);
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [customStackInput, setCustomStackInput] = useState("");
  const [selectedGameTags, setSelectedGameTags] = useState<string[]>([]);
  const [customGameTagInput, setCustomGameTagInput] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isImportingRepo, setIsImportingRepo] = useState(false);
  const [isUploadingBodyAsset, setIsUploadingBodyAsset] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isVfxMediaLibraryOpen, setIsVfxMediaLibraryOpen] = useState(false);
  const [mediaLibraryRoleFilter, setMediaLibraryRoleFilter] =
    useState<MediaLibraryRoleFilter>("all");
  const [wizardStep, setWizardStep] = useState(0);
  const [activeSection, setActiveSection] = useState<GameDevFormSectionId>("basics");
  const [activeBodyTab, setActiveBodyTab] = useState<BodyEditorTab>("write");
  const [uploadedBodyMedia, setUploadedBodyMedia] = useState<Array<{ url: string; alt: string }>>(
    [],
  );
  const [isComingSoon, setIsComingSoon] = useState(false);
  // Settled after a hydrate attempt finishes (success or failure) — unblocks Cancel.
  const [isVfxLinksHydrated, setIsVfxLinksHydrated] = useState(true);
  // True only when the last hydrate attempt failed — keeps Discovery edits gated.
  const [vfxLinksHydrateFailed, setVfxLinksHydrateFailed] = useState(false);
  const [vfxLinksHydrateRetryNonce, setVfxLinksHydrateRetryNonce] = useState(0);

  const [pendingMediaPreviewUrl, setPendingMediaPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaFile) {
      setPendingMediaPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(mediaFile);
    setPendingMediaPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [mediaFile]);

  const isEditing = Boolean(editingItem);
  const isEditingGameDev = Boolean(isEditing && type === "gamedev");

  const modalTitle = useMemo(() => {
    if (isEditing) {
      if (type === "gamedev" && isComingSoon) {
        return "Edit Coming Soon Project";
      }

      return `Edit ${type === "gamedev" ? "Game Dev Project" : "DevOps Project"}`;
    }

    if (type === "gamedev" && isComingSoon) {
      return "Add Coming Soon Project";
    }

    return `Add New ${type === "gamedev" ? "Game Dev Project" : "DevOps Project"}`;
  }, [isComingSoon, isEditing, type]);

  const markLinkedVfxIdsEdited = useCallback(() => {
    linkedVfxIdsEditedRef.current = true;
  }, []);

  const canEditLinkedVfxIds = !isEditingGameDev || (isVfxLinksHydrated && !vfxLinksHydrateFailed);
  const isVfxLinksLoading = isEditingGameDev && !isVfxLinksHydrated;

  const handleLinkedVfxIdsChange = useCallback(
    (updater: (prev: string[]) => string[]) => {
      // Ignore pre-hydrate edits so linkedVfxIdsEditedRef cannot block server IDs.
      if (!canEditLinkedVfxIds) {
        return;
      }
      markLinkedVfxIdsEdited();
      setLinkedVfxIds(updater);
    },
    [canEditLinkedVfxIds, markLinkedVfxIdsEdited],
  );

  const clearHeaderMediaSelection = useCallback(() => {
    setSelectedHeaderMediaUrl(null);
    setSelectedHeaderThumbnailUrl(null);
  }, []);

  const handleHeaderMediaUrlChange = useCallback((url: string | null) => {
    setSelectedHeaderMediaUrl(url);
    if (url === null) {
      setSelectedHeaderThumbnailUrl(null);
    }
  }, []);

  const handleHeaderMediaLibrarySelect = useCallback((item: MediaLibraryItem) => {
    setSelectedHeaderMediaUrl(item.media_url);
    setMediaFile(null);
    setSelectedHeaderThumbnailUrl(null);
  }, []);

  const handleMediaFileChange = useCallback((file: File | null) => {
    setMediaFile(file);
    if (file) {
      // Replacing header via upload invalidates any poster tied to prior header media.
      setSelectedHeaderMediaUrl(null);
      setSelectedHeaderThumbnailUrl(null);
    }
  }, []);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setBody("");
    setSelectedIcon("gamepad");
    setMediaFile(null);
    setSelectedHeaderMediaUrl(null);
    setSelectedHeaderThumbnailUrl(null);
    setSelectedCardThumbnailUrl(null);
    setIsFeatured(false);
    setFeaturedSort("");
    setShowVfxSection(true);
    linkedVfxIdsEditedRef.current = false;
    setLinkedVfxIds([]);
    setLinkedVfxDetails([]);
    // Drop catalog across close/reopen so deleted VFX cannot resurface as
    // localOnly via mergeFetchedAvailableVfx; in-session create races still merge.
    setAvailableVfx([]);
    setSelectedStacks([]);
    setCustomStackInput("");
    setSelectedGameTags([]);
    setCustomGameTagInput("");
    setGithubUrl("");
    setLiveUrl("");
    setRepoUrl("");
    setActiveBodyTab("write");
    setUploadedBodyMedia([]);
    setIsMediaLibraryOpen(false);
    setIsVfxMediaLibraryOpen(false);
    headerMediaLibraryReloadRef.current = null;
    vfxMediaLibraryReloadRef.current = null;
    setMediaLibraryRoleFilter("all");
    setWizardStep(0);
    setActiveSection("basics");
    setIsComingSoon(false);
    setIsVfxLinksHydrated(true);
    setVfxLinksHydrateFailed(false);
    setError(null);
  }, []);

  useEffect(() => {
    formGenerationRef.current += 1;
    // Drop in-flight import/upload UI so a switched or closed form cannot stay locked.
    setIsImportingRepo(false);
    setIsUploadingBodyAsset(false);
  }, [editingItem?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (!editingItem) {
      resetForm();

      if (type === "gamedev" && gameDevCreatePreset === "coming_soon") {
        setIsComingSoon(true);
        setDescription(GAMEDEV_COMING_SOON_DEFAULT_SUMMARY);
      }

      setIsVfxLinksHydrated(true);
      return;
    }

    setError(null);
    setTitle(editingItem.title);
    setSelectedIcon(editingItem.icon_name ?? "gamepad");
    setGithubUrl(editingItem.github_url ?? "");
    setLiveUrl(editingItem.live_url ?? "");

    if (type === "gamedev") {
      const gameDevItem = editingItem as AdminGameDevProject;
      const parsed = parseGameDevStoredContent(gameDevItem.description);

      setDescription(parsed.summary);
      setBody(parsed.body);
      setSelectedHeaderMediaUrl(gameDevItem.header_media_url ?? gameDevItem.media_url ?? null);
      setSelectedHeaderThumbnailUrl(gameDevItem.header_thumbnail_url ?? null);
      setSelectedCardThumbnailUrl(gameDevItem.thumbnail_url ?? null);
      setIsFeatured(gameDevItem.is_featured ?? false);
      setFeaturedSort(gameDevItem.featured_sort != null ? String(gameDevItem.featured_sort) : "");
      setShowVfxSection(gameDevItem.show_vfx_section ?? true);
      setIsComingSoon(gameDevItem.is_coming_soon ?? false);
      setSelectedGameTags(gameDevItem.tags ?? []);
      setSelectedStacks([]);
      linkedVfxIdsEditedRef.current = false;
      setLinkedVfxIds([]);
      setLinkedVfxDetails([]);
      setIsVfxLinksHydrated(false);
      setVfxLinksHydrateFailed(false);
    } else {
      const devOpsItem = editingItem as AdminDevOpsProject;
      setDescription(devOpsItem.description);
      setBody("");
      setSelectedHeaderMediaUrl(null);
      setSelectedStacks(devOpsItem.tech_stack ?? []);
      setSelectedGameTags([]);
      setIsVfxLinksHydrated(true);
      setVfxLinksHydrateFailed(false);
    }
  }, [editingItem, gameDevCreatePreset, isOpen, resetForm, type]);

  // Separate from form population so Retry does not wipe unrelated field edits.
  useEffect(() => {
    if (!isOpen || type !== "gamedev" || !editingItem) {
      return;
    }

    const projectId = editingItem.id;
    setIsVfxLinksHydrated(false);
    setVfxLinksHydrateFailed(false);

    let isCurrent = true;

    void (async () => {
      let hydrateSucceeded = false;

      try {
        const [vfxResult, linkResult] = await Promise.all([
          supabase
            .from("gamedev_vfx")
            .select("*")
            .order("sort_order", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("gamedev_project_vfx")
            .select("gamedev_vfx_id, sort_order")
            .eq("gamedev_item_id", projectId)
            .order("sort_order", { ascending: true, nullsFirst: false }),
        ]);

        if (vfxResult.error) {
          throw new Error(vfxResult.error.message);
        }

        if (linkResult.error) {
          throw new Error(linkResult.error.message);
        }

        if (!isCurrent) {
          return;
        }

        const vfxData = vfxResult.data;
        const linkData = linkResult.data;

        const rawVfx = ((vfxData ?? []) as AdminGameDevVfx[]).map((item) => ({
          ...item,
          tags: item.tags ?? [],
        }));
        const dedupedVfx = dedupeGameDevVfxByMediaUrl(rawVfx);

        setAvailableVfx((prev) => mergeFetchedAvailableVfx(prev, dedupedVfx));

        const orderedLinks = [...(linkData ?? [])].sort((left, right) => {
          const leftOrder = left.sort_order ?? Number.MAX_SAFE_INTEGER;
          const rightOrder = right.sort_order ?? Number.MAX_SAFE_INTEGER;
          return leftOrder - rightOrder;
        });

        const orderedLinkedIds = orderedLinks.map((link) => link.gamedev_vfx_id);
        const missingLinkedIds = orderedLinkedIds.filter(
          (vfxId) => !rawVfx.some((item) => item.id === vfxId),
        );

        let linkedDetails: AdminGameDevVfx[] = [];

        if (missingLinkedIds.length > 0) {
          const { data: missingVfxData, error: missingVfxError } = await supabase
            .from("gamedev_vfx")
            .select("*")
            .in("id", missingLinkedIds);

          if (missingVfxError) {
            throw new Error(missingVfxError.message);
          }

          if (!isCurrent) {
            return;
          }

          linkedDetails = ((missingVfxData ?? []) as AdminGameDevVfx[]).map((item) => ({
            ...item,
            tags: item.tags ?? [],
          }));
        }

        const normalizedLinkedIds = await normalizeLinkedVfxIds(orderedLinkedIds, rawVfx);
        if (!isCurrent) {
          return;
        }

        setLinkedVfxDetails(linkedDetails);
        if (!linkedVfxIdsEditedRef.current) {
          setLinkedVfxIds(normalizedLinkedIds);
        }
        hydrateSucceeded = true;
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load VFX links.");
        }
      } finally {
        if (isCurrent) {
          // Always settle so Cancel/Save are not stuck on "still loading".
          // Discovery edits stay gated via vfxLinksHydrateFailed until success.
          setIsVfxLinksHydrated(true);
          setVfxLinksHydrateFailed(!hydrateSucceeded);
        }
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [editingItem?.id, isOpen, type, vfxLinksHydrateRetryNonce]);

  useEffect(() => {
    if (!isOpen || type !== "gamedev") {
      return;
    }

    let isMounted = true;

    void (async () => {
      const { data, error: vfxListError } = await supabase
        .from("gamedev_vfx")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (vfxListError) {
        setError(vfxListError.message);
        return;
      }

      const fetched = dedupeGameDevVfxByMediaUrl(
        ((data ?? []) as AdminGameDevVfx[]).map((item) => ({
          ...item,
          tags: item.tags ?? [],
        })),
      );
      setAvailableVfx((prev) => mergeFetchedAvailableVfx(prev, fetched));
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, type]);

  const closeModal = useCallback(() => {
    playMenuCloseSound();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || loading || isImportingRepo || isUploadingBodyAsset) return;
      // Nested media pickers own Escape first.
      if (isMediaLibraryOpen || isVfxMediaLibraryOpen) return;
      closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    closeModal,
    isImportingRepo,
    isMediaLibraryOpen,
    isOpen,
    isUploadingBodyAsset,
    isVfxMediaLibraryOpen,
    loading,
  ]);

  const handleImportFromRepo = async () => {
    const normalizedRepoUrl = repoUrl.trim();
    if (!normalizedRepoUrl) {
      setError("Enter a GitHub repository URL to import.");
      return;
    }

    const generation = formGenerationRef.current;
    setError(null);
    setIsImportingRepo(true);

    try {
      const seed = await fetchGitHubProjectSeed(normalizedRepoUrl);

      if (generation !== formGenerationRef.current) {
        return;
      }

      setTitle(seed.title);
      setDescription(seed.description);
      if (type === "gamedev") {
        setBody(seed.readme || "");
        setSelectedGameTags(seed.tags);
      }

      setGithubUrl(seed.githubUrl);
      setLiveUrl(seed.liveUrl ?? "");
    } catch (err) {
      if (generation !== formGenerationRef.current) {
        return;
      }

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to import repository data.");
      }
    } finally {
      if (generation === formGenerationRef.current) {
        setIsImportingRepo(false);
      }
    }
  };

  const appendToBody = (snippet: string) => {
    setBody((current) => {
      const trimmed = current.trimEnd();
      if (!trimmed) return snippet;
      return `${trimmed}\n\n${snippet}`;
    });
  };

  const handleBodyAssetUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const generation = formGenerationRef.current;
    setError(null);
    setIsUploadingBodyAsset(true);

    try {
      const selectedFiles = Array.from(files);

      for (const file of selectedFiles) {
        if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type.toLowerCase())) {
          throw new Error("One or more body media files have unsupported types.");
        }

        if (file.size <= 0 || file.size > MAX_MEDIA_SIZE_BYTES) {
          throw new Error(`One or more body media files exceed ${MAX_MEDIA_SIZE_MB}MB.`);
        }
      }

      const newMedia: Array<{ url: string; alt: string }> = [];

      for (const file of selectedFiles) {
        const { item } = await uploadOrReuseMediaLibraryItem({
          file,
          uploadFolder: R2_UPLOAD_FOLDERS.gameDevAssets,
          folderOrigin: "gamedev",
          preferredName: stripFileExtension(file.name),
        });

        if (generation !== formGenerationRef.current) {
          return;
        }

        const alt =
          file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]+/g, " ")
            .trim() || "Project media";

        newMedia.push({ url: item.media_url, alt });
      }

      setUploadedBodyMedia((prev) => [...prev, ...newMedia]);

      // Separate refs so header/VFX pickers do not overwrite each other;
      // cleared on close so reload never targets an unmounted explorer.
      if (isMediaLibraryOpen && headerMediaLibraryReloadRef.current) {
        await headerMediaLibraryReloadRef.current();
      }
      if (isVfxMediaLibraryOpen && vfxMediaLibraryReloadRef.current) {
        await vfxMediaLibraryReloadRef.current();
      }
    } catch (err) {
      if (generation !== formGenerationRef.current) {
        return;
      }

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to upload body media.");
      }
    } finally {
      if (generation === formGenerationRef.current) {
        setIsUploadingBodyAsset(false);
      }
    }
  };

  const insertUploadedMedia = (mediaUrl: string, mediaAlt: string) => {
    appendToBody(`![${escapeMarkdownImageLabel(mediaAlt)}](${mediaUrl})`);
  };

  const insertLibraryMedia = useCallback((item: MediaLibraryItem) => {
    appendToBody(`![${escapeMarkdownImageLabel(item.name)}](${item.media_url})`);
  }, []);

  const addGameTag = useCallback(() => {
    const trimmed = customGameTagInput.trim();
    if (trimmed && !selectedGameTags.includes(trimmed)) {
      setSelectedGameTags((prev) => [...prev, trimmed]);
    }
    setCustomGameTagInput("");
  }, [customGameTagInput, selectedGameTags]);

  const openMediaLibrary = useCallback((role: MediaLibraryRoleFilter) => {
    setMediaLibraryRoleFilter(role);
    setIsMediaLibraryOpen(true);
  }, []);

  const openVfxMediaLibrary = useCallback(() => {
    if (!canEditLinkedVfxIds) {
      return;
    }
    setIsVfxMediaLibraryOpen(true);
  }, [canEditLinkedVfxIds]);

  const handleVfxMediaLibrarySelect = useCallback(
    async (item: MediaLibraryItem) => {
      if (!canEditLinkedVfxIds) {
        return;
      }

      const generation = formGenerationRef.current;
      setError(null);

      try {
        const vfx = await ensureVfxFromMediaLibraryItem(item);

        if (generation !== formGenerationRef.current) {
          return;
        }

        // Re-check after await: hydrate may still be in flight for edit forms.
        if (!canEditLinkedVfxIds) {
          return;
        }

        setAvailableVfx((prev) =>
          dedupeGameDevVfxByMediaUrl([
            ...prev.filter((entry) => entry.id !== vfx.id),
            {
              ...vfx,
              tags: vfx.tags ?? [],
            },
          ]),
        );

        markLinkedVfxIdsEdited();
        setLinkedVfxIds((prev) => (prev.includes(vfx.id) ? prev : [...prev, vfx.id]));
      } catch (err) {
        if (generation !== formGenerationRef.current) {
          return;
        }

        setError(err instanceof Error ? err.message : "Unable to add VFX media.");
      }
    },
    [canEditLinkedVfxIds, markLinkedVfxIdsEdited],
  );

  const gameDevFormMode = isEditing ? "sidebar" : "wizard";
  const visibleGameDevSection =
    gameDevFormMode === "wizard" ? sectionIdFromWizardStep(wizardStep) : activeSection;

  const sectionCompletion = useMemo(
    (): Record<GameDevFormSectionId, boolean> => ({
      basics: Boolean(title.trim() && description.trim()),
      content: isComingSoon ? true : Boolean(body.trim()),
      media: isComingSoon
        ? true
        : Boolean(
            selectedHeaderMediaUrl ||
              mediaFile ||
              selectedCardThumbnailUrl ||
              selectedHeaderThumbnailUrl,
          ),
      discovery: isComingSoon || !showVfxSection || linkedVfxIds.length > 0,
      links: Boolean(githubUrl.trim() || liveUrl.trim() || repoUrl.trim()),
    }),
    [
      title,
      description,
      body,
      isComingSoon,
      selectedHeaderMediaUrl,
      mediaFile,
      selectedCardThumbnailUrl,
      selectedHeaderThumbnailUrl,
      linkedVfxIds,
      showVfxSection,
      githubUrl,
      liveUrl,
      repoUrl,
    ],
  );

  const mediaLibraryActions = useMemo((): MediaLibraryPickerAction[] => {
    const actions: MediaLibraryPickerAction[] = [
      {
        id: "header",
        label: "Use as Header",
        badgeLabel: "Header",
        selectedUrl: selectedHeaderMediaUrl,
        onClear: clearHeaderMediaSelection,
        onSelect: handleHeaderMediaLibrarySelect,
      },
      {
        id: "thumbnail",
        label: "Card Thumbnail",
        badgeLabel: "Card",
        selectedUrl: selectedCardThumbnailUrl,
        onClear: () => setSelectedCardThumbnailUrl(null),
        isAvailable: (item) => item.media_type === "image",
        onSelect: (item) => {
          setSelectedCardThumbnailUrl(item.media_url);
        },
      },
      {
        id: "poster",
        label: "Header Poster",
        badgeLabel: "Poster",
        selectedUrl: selectedHeaderThumbnailUrl,
        onClear: () => setSelectedHeaderThumbnailUrl(null),
        isAvailable: (item) => item.media_type === "image",
        onSelect: (item) => {
          setSelectedHeaderThumbnailUrl(item.media_url);
        },
      },
      {
        id: "body",
        label: "Insert in Body",
        onSelect: insertLibraryMedia,
      },
    ];

    return actions;
  }, [
    selectedHeaderMediaUrl,
    selectedCardThumbnailUrl,
    selectedHeaderThumbnailUrl,
    clearHeaderMediaSelection,
    handleHeaderMediaLibrarySelect,
    insertLibraryMedia,
  ]);

  const vfxMediaLibraryActions = useMemo((): MediaLibraryPickerAction[] => {
    const linkedUrls = new Set(
      linkedVfxIds
        .map((id) => availableVfx.find((item) => item.id === id)?.media_url)
        .filter((url): url is string => Boolean(url)),
    );

    return [
      {
        id: "vfx",
        label: "Add to Project VFX",
        badgeLabel: "VFX",
        selectedUrl: null,
        onSelect: (item) => {
          void handleVfxMediaLibrarySelect(item);
        },
        isAvailable: (item) => !linkedUrls.has(item.media_url),
      },
    ];
  }, [availableVfx, handleVfxMediaLibrarySelect, linkedVfxIds]);

  const filteredMediaLibraryActions = useMemo(() => {
    if (mediaLibraryRoleFilter === "all") {
      return mediaLibraryActions;
    }

    return mediaLibraryActions.filter((action) => action.id === mediaLibraryRoleFilter);
  }, [mediaLibraryActions, mediaLibraryRoleFilter]);

  const handleWizardNext = () => {
    if (wizardStep === 0) {
      if (!title.trim()) {
        setError("Title is required.");
        return;
      }

      if (!description.trim()) {
        setError("Description is required for Game Dev projects.");
        return;
      }

      setError(null);
    }

    if (
      sectionIdFromWizardStep(wizardStep) === "discovery" &&
      !isComingSoon &&
      showVfxSection &&
      linkedVfxIds.length === 0
    ) {
      setError("Add at least one VFX image or video for this project.");
      return;
    }

    setError(null);
    setWizardStep((current) => Math.min(current + 1, GAMEDEV_FORM_SECTIONS.length - 1));
  };

  const handleWizardBack = () => {
    setWizardStep((current) => Math.max(current - 1, 0));
  };

  const renderGameDevSection = () => {
    switch (visibleGameDevSection) {
      case "basics":
        return (
          <GameDevBasicsSection
            itemTitleId={itemTitleId}
            itemDescriptionId={itemDescriptionId}
            customGameTagInputId={customGameTagInputId}
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            selectedIcon={selectedIcon}
            onIconChange={setSelectedIcon}
            selectedGameTags={selectedGameTags}
            customGameTagInput={customGameTagInput}
            onCustomGameTagInputChange={setCustomGameTagInput}
            onAddGameTag={addGameTag}
            isComingSoon={isComingSoon}
            onComingSoonChange={(value) => {
              setIsComingSoon(value);
              if (value && description.trim().length === 0) {
                setDescription(GAMEDEV_COMING_SOON_DEFAULT_SUMMARY);
              }
            }}
          />
        );
      case "content":
        return (
          <GameDevContentSection
            itemBodyId={itemBodyId}
            itemBodyAssetUploadId={itemBodyAssetUploadId}
            body={body}
            onBodyChange={setBody}
            activeBodyTab={activeBodyTab}
            onActiveBodyTabChange={setActiveBodyTab}
            isComingSoon={isComingSoon}
            isUploadingBodyAsset={isUploadingBodyAsset}
            bodyAssetInputRef={bodyAssetInputRef}
            mediaAccept={MEDIA_ACCEPT}
            onBodyAssetUpload={handleBodyAssetUpload}
            uploadedBodyMedia={uploadedBodyMedia}
            onInsertUploadedMedia={insertUploadedMedia}
          />
        );
      case "media":
        return (
          <GameDevMediaSection
            itemMediaId={itemMediaId}
            mediaAccept={MEDIA_ACCEPT}
            maxMediaSizeMb={MAX_MEDIA_SIZE_MB}
            selectedHeaderMediaUrl={selectedHeaderMediaUrl}
            pendingHeaderPreviewUrl={pendingMediaPreviewUrl}
            mediaFile={mediaFile}
            onHeaderMediaUrlChange={handleHeaderMediaUrlChange}
            onMediaFileChange={handleMediaFileChange}
            onMediaValidationError={setError}
            selectedCardThumbnailUrl={selectedCardThumbnailUrl}
            onCardThumbnailUrlChange={setSelectedCardThumbnailUrl}
            selectedHeaderThumbnailUrl={selectedHeaderThumbnailUrl}
            onHeaderThumbnailUrlChange={setSelectedHeaderThumbnailUrl}
            onOpenMediaLibrary={openMediaLibrary}
            allowedMediaMimeTypes={ALLOWED_MEDIA_MIME_TYPES}
            maxMediaSizeBytes={MAX_MEDIA_SIZE_BYTES}
          />
        );
      case "discovery":
        return (
          <GameDevDiscoverySection
            isFeatured={isFeatured}
            onIsFeaturedChange={setIsFeatured}
            featuredSort={featuredSort}
            onFeaturedSortChange={setFeaturedSort}
            showVfxSection={showVfxSection}
            onShowVfxSectionChange={setShowVfxSection}
            availableVfx={availableVfx}
            linkedVfxDetails={linkedVfxDetails}
            linkedVfxIds={linkedVfxIds}
            onLinkedVfxIdsChange={handleLinkedVfxIdsChange}
            onOpenVfxMediaLibrary={openVfxMediaLibrary}
            isComingSoon={isComingSoon}
            vfxLinksDisabled={!canEditLinkedVfxIds}
            vfxLinksLoadFailed={vfxLinksHydrateFailed}
            onRetryVfxLinksLoad={
              vfxLinksHydrateFailed
                ? () => {
                    setError(null);
                    setVfxLinksHydrateRetryNonce((prev) => prev + 1);
                  }
                : undefined
            }
          />
        );
      case "links":
        return (
          <GameDevLinksSection
            itemGithubUrlId={itemGithubUrlId}
            itemLiveUrlId={itemLiveUrlId}
            itemRepoUrlId={itemRepoUrlId}
            githubUrl={githubUrl}
            onGithubUrlChange={setGithubUrl}
            liveUrl={liveUrl}
            onLiveUrlChange={setLiveUrl}
            repoUrl={repoUrl}
            onRepoUrlChange={setRepoUrl}
            isImportingRepo={isImportingRepo}
            onImportFromRepo={() => {
              void handleImportFromRepo();
            }}
          />
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError("Title is required.");
      return;
    }

    if (normalizedTitle.length > MAX_TITLE_LENGTH) {
      setError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
      return;
    }

    const normalizedStacks = Array.from(
      new Set(selectedStacks.map((stack) => stack.trim()).filter((stack) => stack.length > 0)),
    );

    const normalizedGameTags = Array.from(
      new Set(selectedGameTags.map((stack) => stack.trim()).filter((stack) => stack.length > 0)),
    );

    if (
      [...normalizedStacks, ...normalizedGameTags].some((stack) => stack.length > MAX_STACK_LENGTH)
    ) {
      setError(`Each stack/tag item must be ${MAX_STACK_LENGTH} characters or fewer.`);
      return;
    }

    if (type === "devops" && normalizedStacks.length === 0) {
      setError("Select at least one tech stack.");
      return;
    }

    let normalizedGithubUrl: string | null;
    let normalizedLiveUrl: string | null;
    try {
      normalizedGithubUrl = normalizeOptionalHttpsUrl(githubUrl, "GitHub URL");
      normalizedLiveUrl = normalizeOptionalHttpsUrl(liveUrl, "Live URL");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid URL value.");
      return;
    }

    if (type === "gamedev" && isEditingGameDev && isVfxLinksLoading) {
      setError("Project VFX links are still loading. Please wait and try again.");
      return;
    }

    if (type === "gamedev" && isEditingGameDev && vfxLinksHydrateFailed) {
      setError("Project VFX links failed to load. Retry loading or cancel without saving.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (type === "gamedev") {
        const normalizedSummary = description.trim();
        const normalizedBody = body.trim();

        if (!normalizedSummary) {
          setError(
            isComingSoon
              ? "Teaser description is required for coming soon projects."
              : "Description is required for Game Dev projects.",
          );
          return;
        }

        if (!isComingSoon && !normalizedBody) {
          setError("Body markdown is required for Game Dev projects.");
          return;
        }

        const normalizedLinkedVfxIds = await normalizeLinkedVfxIds(linkedVfxIds, availableVfx);

        if (!isComingSoon && showVfxSection && normalizedLinkedVfxIds.length === 0) {
          setError("Add at least one VFX image or video for this project.");
          return;
        }

        // Coming soon is a display flag — keep structured body when present so
        // converting published → teaser does not wipe markdown permanently.
        // Always persist the BODY marker (even with empty body) so fail-closed
        // public SELECT does not null teaser-only descriptions.
        const storedDescription = buildGameDevStoredContent(normalizedSummary, normalizedBody);
        if (storedDescription.length > MAX_DESCRIPTION_LENGTH) {
          setError(`Body content must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
          return;
        }

        const sourceGameDev = isEditingGameDev ? (editingItem as AdminGameDevProject) : null;

        // selected* is hydrated from the project on edit open and updated by Clear/pickers —
        // treat null as intentional clear; do not fall back to sourceGameDev URLs.
        let finalHeaderMediaUrl = selectedHeaderMediaUrl;

        if (mediaFile) {
          const { item } = await uploadOrReuseMediaLibraryItem({
            file: mediaFile,
            uploadFolder: R2_UPLOAD_FOLDERS.gameDevAssets,
            folderOrigin: "gamedev",
            preferredName: stripFileExtension(mediaFile.name),
          });
          finalHeaderMediaUrl = item.media_url;
        }

        const parsedFeaturedSort = featuredSort.trim() ? Number(featuredSort) : null;
        const normalizedFeaturedSort =
          parsedFeaturedSort != null && Number.isFinite(parsedFeaturedSort)
            ? parsedFeaturedSort
            : null;

        const teaserMediaUrl = finalHeaderMediaUrl?.trim() ? finalHeaderMediaUrl.trim() : null;
        const imageOnlyUrl = (url: string | null | undefined): string | null =>
          url && isImageUrl(url) ? url : null;
        // New projects: derive card thumb from header when unset. Edit: persist Clear as null.
        const teaserThumbnailUrl = isEditingGameDev
          ? isComingSoon
            ? imageOnlyUrl(selectedCardThumbnailUrl)
            : selectedCardThumbnailUrl
          : isComingSoon
            ? (imageOnlyUrl(selectedCardThumbnailUrl) ?? imageOnlyUrl(teaserMediaUrl) ?? null)
            : (selectedCardThumbnailUrl ?? imageOnlyUrl(teaserMediaUrl) ?? null);

        const projectPayload = {
          title: normalizedTitle,
          description: storedDescription,
          // Keep card/legacy media_url aligned with header so new projects are not blank in gallery.
          media_url: teaserMediaUrl,
          thumbnail_url: teaserThumbnailUrl,
          header_media_url: teaserMediaUrl,
          header_thumbnail_url: selectedHeaderThumbnailUrl,
          icon_name: selectedIcon,
          github_url: normalizedGithubUrl,
          live_url: normalizedLiveUrl,
          tags: normalizedGameTags,
          is_featured: isFeatured,
          featured_sort: isFeatured ? normalizedFeaturedSort : null,
          show_vfx_section: showVfxSection,
          is_coming_soon: isComingSoon,
        };

        const syncProjectVfxLinks = async (projectId: string) => {
          // Library visibility is owned by VfxManager / markVfxShownInLibrary — unlinking
          // a project must not force show_in_library=false on curated entries.
          // Coming soon still syncs Discovery links, but must not publish those effects
          // into the public VFX gallery while the project page keeps VFX hidden.
          const { data: existingLinks, error: fetchLinksError } = await supabase
            .from("gamedev_project_vfx")
            .select("gamedev_vfx_id, sort_order")
            .eq("gamedev_item_id", projectId);

          if (fetchLinksError) {
            throw new Error(fetchLinksError.message);
          }

          const existingIds = (existingLinks ?? []).map((link) => link.gamedev_vfx_id);
          const desiredIdSet = new Set(normalizedLinkedVfxIds);

          if (normalizedLinkedVfxIds.length === 0) {
            if (existingIds.length === 0) {
              return;
            }

            const { error: clearLinksError } = await supabase
              .from("gamedev_project_vfx")
              .delete()
              .eq("gamedev_item_id", projectId);

            if (clearLinksError) {
              throw new Error(clearLinksError.message);
            }

            return;
          }

          const idsToRemove = existingIds.filter((id) => !desiredIdSet.has(id));
          // Capture rows before delete so upsert/mark failures can restore associations.
          const removedLinksToRestore = (existingLinks ?? [])
            .filter((link) => !desiredIdSet.has(link.gamedev_vfx_id))
            .map((link) => ({
              gamedev_item_id: projectId,
              gamedev_vfx_id: link.gamedev_vfx_id,
              sort_order: link.sort_order,
            }));
          // Kept associations may have new sort_order after upsert; restore pre-save order on mark failure.
          const keptLinksToRestore = (existingLinks ?? [])
            .filter((link) => desiredIdSet.has(link.gamedev_vfx_id))
            .map((link) => ({
              gamedev_item_id: projectId,
              gamedev_vfx_id: link.gamedev_vfx_id,
              sort_order: link.sort_order,
            }));

          if (idsToRemove.length > 0) {
            const { error: removeLinksError } = await supabase
              .from("gamedev_project_vfx")
              .delete()
              .eq("gamedev_item_id", projectId)
              .in("gamedev_vfx_id", idsToRemove);

            if (removeLinksError) {
              throw new Error(removeLinksError.message);
            }
          }

          const { error: upsertLinksError } = await supabase.from("gamedev_project_vfx").upsert(
            normalizedLinkedVfxIds.map((vfxId, index) => ({
              gamedev_item_id: projectId,
              gamedev_vfx_id: vfxId,
              sort_order: index,
            })),
            { onConflict: "gamedev_item_id,gamedev_vfx_id" },
          );

          if (upsertLinksError) {
            if (removedLinksToRestore.length > 0) {
              const { error: restoreRemovedError } = await supabase
                .from("gamedev_project_vfx")
                .upsert(removedLinksToRestore, {
                  onConflict: "gamedev_item_id,gamedev_vfx_id",
                });

              if (restoreRemovedError) {
                throw new Error(
                  `${upsertLinksError.message} (also failed to restore removed VFX links: ${restoreRemovedError.message})`,
                );
              }
            }

            throw new Error(upsertLinksError.message);
          }

          // Newly linked VFX get show_in_library=true; VfxManager owns ongoing visibility.
          // First eligibility (ineligible → eligible) marks all linked VFX once.
          const existingIdSet = new Set(existingIds);
          const newlyLinkedVfxIds = normalizedLinkedVfxIds.filter((id) => !existingIdSet.has(id));
          const wasComingSoon = Boolean(sourceGameDev?.is_coming_soon);
          const wasShowVfxSection = Boolean(sourceGameDev?.show_vfx_section);
          const becomingEligible =
            !isComingSoon &&
            showVfxSection &&
            ((wasComingSoon && !isComingSoon) || (!wasShowVfxSection && showVfxSection));
          const vfxIdsToMarkInLibrary =
            !isComingSoon && showVfxSection
              ? becomingEligible
                ? normalizedLinkedVfxIds
                : newlyLinkedVfxIds
              : [];
          if (vfxIdsToMarkInLibrary.length > 0) {
            try {
              await markVfxShownInLibrary(vfxIdsToMarkInLibrary);
            } catch (markError) {
              const markMessage =
                markError instanceof Error ? markError.message : String(markError);
              const secondaryFailures: string[] = [];

              // Restore associations deleted before upsert so a failed mark does not
              // permanently drop prior project↔VFX links.
              if (removedLinksToRestore.length > 0) {
                const { error: restoreRemovedError } = await supabase
                  .from("gamedev_project_vfx")
                  .upsert(removedLinksToRestore, {
                    onConflict: "gamedev_item_id,gamedev_vfx_id",
                  });

                if (restoreRemovedError) {
                  secondaryFailures.push(
                    `failed to restore removed VFX links: ${restoreRemovedError.message}`,
                  );
                }
              }

              // Restore pre-save sort_order for kept (existing ∩ desired) links so a failed
              // mark does not permanently reorder remaining project VFX.
              if (keptLinksToRestore.length > 0) {
                const { error: restoreKeptError } = await supabase
                  .from("gamedev_project_vfx")
                  .upsert(keptLinksToRestore, {
                    onConflict: "gamedev_item_id,gamedev_vfx_id",
                  });

                if (restoreKeptError) {
                  secondaryFailures.push(
                    `failed to restore kept VFX link sort order: ${restoreKeptError.message}`,
                  );
                }
              }

              // Roll back only links added this save; keep pre-existing associations.
              if (newlyLinkedVfxIds.length > 0) {
                const { error: compensateError } = await supabase
                  .from("gamedev_project_vfx")
                  .delete()
                  .eq("gamedev_item_id", projectId)
                  .in("gamedev_vfx_id", newlyLinkedVfxIds);

                if (compensateError) {
                  secondaryFailures.push(
                    `failed to roll back VFX links: ${compensateError.message}`,
                  );
                }
              }

              // Always restore pre-save eligibility so a retry still detects becomingEligible,
              // even when newlyLinked link compensate failed.
              if (becomingEligible && sourceGameDev) {
                const { error: eligibilityRollbackError } = await supabase
                  .from("gamedev_items")
                  .update({
                    is_coming_soon: sourceGameDev.is_coming_soon ?? false,
                    show_vfx_section: sourceGameDev.show_vfx_section ?? false,
                  })
                  .eq("id", projectId);

                if (eligibilityRollbackError) {
                  secondaryFailures.push(
                    `failed to roll back project eligibility: ${eligibilityRollbackError.message}`,
                  );
                }
              } else if (!sourceGameDev) {
                // Create path: remove the orphan project so a retry does not insert a duplicate.
                // gamedev_project_vfx rows cascade on gamedev_items delete.
                const { error: createRollbackError } = await supabase
                  .from("gamedev_items")
                  .delete()
                  .eq("id", projectId);

                if (createRollbackError) {
                  secondaryFailures.push(
                    `failed to roll back created project: ${createRollbackError.message}`,
                  );
                }
              }

              if (secondaryFailures.length > 0) {
                throw new Error(`${markMessage} (also ${secondaryFailures.join("; ")})`);
              }

              throw markError instanceof Error ? markError : new Error(markMessage);
            }
          }
        };

        if (isEditingGameDev && sourceGameDev) {
          const { error: updateError } = await supabase
            .from("gamedev_items")
            .update(projectPayload)
            .eq("id", sourceGameDev.id);

          if (updateError) {
            throw new Error(updateError.message);
          }

          // Only roll back eligibility when this save was an ineligible→eligible
          // transition. Restricting saves (live→coming-soon / hide VFX section) must
          // keep the committed restricted flags if sync fails mid-way.
          const wasComingSoon = Boolean(sourceGameDev.is_coming_soon);
          const wasShowVfxSection = Boolean(sourceGameDev.show_vfx_section);
          const becomingEligible =
            !isComingSoon &&
            showVfxSection &&
            ((wasComingSoon && !isComingSoon) || (!wasShowVfxSection && showVfxSection));

          try {
            await syncProjectVfxLinks(sourceGameDev.id);
          } catch (syncError) {
            if (becomingEligible) {
              // Restore pre-save eligibility so a retry still detects becomingEligible
              // after fetch/remove/upsert failures (mark-path already compensates).
              const { error: eligibilityRollbackError } = await supabase
                .from("gamedev_items")
                .update({
                  is_coming_soon: sourceGameDev.is_coming_soon ?? false,
                  show_vfx_section: sourceGameDev.show_vfx_section ?? false,
                })
                .eq("id", sourceGameDev.id);

              if (eligibilityRollbackError) {
                const syncMessage =
                  syncError instanceof Error ? syncError.message : String(syncError);
                throw new Error(
                  `${syncMessage} (also failed to roll back project eligibility: ${eligibilityRollbackError.message})`,
                );
              }
            }

            throw syncError instanceof Error ? syncError : new Error(String(syncError));
          }
        } else {
          const { data: insertedItem, error: insertError } = await supabase
            .from("gamedev_items")
            .insert([projectPayload])
            .select("id")
            .single();

          if (insertError || !insertedItem) {
            throw new Error(insertError?.message ?? "Failed to create game dev project.");
          }

          try {
            await syncProjectVfxLinks(insertedItem.id);
          } catch (syncError) {
            // Roll back the inserted project on any sync failure (fetch/upsert/remove/mark)
            // so a retry does not create a duplicate. Links cascade on gamedev_items delete.
            const { error: orphanDeleteError } = await supabase
              .from("gamedev_items")
              .delete()
              .eq("id", insertedItem.id);

            if (orphanDeleteError) {
              const syncMessage =
                syncError instanceof Error ? syncError.message : String(syncError);
              throw new Error(
                `${syncMessage} (also failed to roll back created project: ${orphanDeleteError.message})`,
              );
            }

            throw syncError instanceof Error ? syncError : new Error(String(syncError));
          }
        }
      } else {
        const normalizedDescription = description.trim();
        if (!normalizedDescription) {
          setError("Description is required.");
          return;
        }

        if (normalizedDescription.length > MAX_DESCRIPTION_LENGTH) {
          setError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
          return;
        }

        if (isEditing && editingItem) {
          const target = editingItem as AdminDevOpsProject;
          const { error: updateError } = await supabase
            .from("devops_projects")
            .update({
              title: normalizedTitle,
              description: normalizedDescription,
              tech_stack: normalizedStacks,
              icon_name: selectedIcon,
              github_url: normalizedGithubUrl,
              live_url: normalizedLiveUrl,
            })
            .eq("id", target.id);

          if (updateError) {
            throw new Error(updateError.message);
          }
        } else {
          const { error: insertError } = await supabase.from("devops_projects").insert([
            {
              title: normalizedTitle,
              description: normalizedDescription,
              tech_stack: normalizedStacks,
              icon_name: selectedIcon,
              github_url: normalizedGithubUrl,
              live_url: normalizedLiveUrl,
            },
          ]);

          if (insertError) {
            throw new Error(insertError.message);
          }
        }
      }

      onSuccess();
      closeModal();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while saving.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={modalTitleId}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <button
          type="button"
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          aria-label="Close dialog"
          onMouseEnter={playHoverSound}
          onClick={() => {
            if (loading || isImportingRepo || isUploadingBodyAsset) {
              return;
            }

            playClickSound();
            closeModal();
          }}
        ></button>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`relative inline-block w-full transform overflow-hidden rounded-lg border border-gray-700 bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle ${
            type === "gamedev" ? "max-w-5xl" : "max-w-2xl"
          }`}
        >
          <form onSubmit={handleSubmit}>
            <div className="bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <h3 className="mb-4 text-lg font-medium leading-6 text-white" id={modalTitleId}>
                {modalTitle}
              </h3>

              {error && (
                <div className="mb-4 rounded border border-red-500 bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {type === "gamedev" ? (
                  <>
                    <GameDevProjectFormShell
                      mode={gameDevFormMode}
                      wizardStep={wizardStep}
                      activeSection={activeSection}
                      sectionCompletion={sectionCompletion}
                      sectionTitleId={gameDevSectionTitleId}
                      loading={loading}
                      saveDisabled={isVfxLinksLoading}
                      onWizardStepChange={setWizardStep}
                      onSectionChange={setActiveSection}
                      onBack={handleWizardBack}
                      onNext={handleWizardNext}
                      onCancel={closeModal}
                    >
                      {renderGameDevSection()}
                    </GameDevProjectFormShell>

                    <MediaLibraryPickerModal
                      isOpen={isMediaLibraryOpen}
                      onClose={() => {
                        setIsMediaLibraryOpen(false);
                        setMediaLibraryRoleFilter("all");
                        headerMediaLibraryReloadRef.current = null;
                      }}
                      onReady={({ reload }) => {
                        headerMediaLibraryReloadRef.current = reload;
                      }}
                      actions={filteredMediaLibraryActions}
                    />

                    <MediaLibraryPickerModal
                      isOpen={isVfxMediaLibraryOpen}
                      onClose={() => {
                        setIsVfxMediaLibraryOpen(false);
                        vfxMediaLibraryReloadRef.current = null;
                      }}
                      title="Add Project VFX"
                      description="Pick images or videos from the media library to show in this project's VFX section."
                      onReady={({ reload }) => {
                        vfxMediaLibraryReloadRef.current = reload;
                      }}
                      actions={vfxMediaLibraryActions}
                    />
                  </>
                ) : (
                  <>
                    <div>
                      <p className="mb-1 block text-sm font-medium text-gray-300">Project Icon</p>
                      <div className="grid grid-cols-6 gap-2">
                        {AVAILABLE_ICONS.map((iconOpt) => (
                          <motion.button
                            key={iconOpt.id}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={playHoverSound}
                            onClick={() => {
                              playClickSound();
                              setSelectedIcon(iconOpt.id);
                            }}
                            className={`flex flex-col items-center justify-center rounded-lg p-2 transition-colors ${
                              selectedIcon === iconOpt.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
                            }`}
                            title={iconOpt.label}
                          >
                            <iconOpt.icon className="mb-1 h-5 w-5" />
                            <span className="flex w-full justify-center truncate text-[10px]">
                              {iconOpt.label}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={itemTitleId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Title
                      </label>
                      <input
                        id={itemTitleId}
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={itemDescriptionId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Description
                      </label>
                      <textarea
                        id={itemDescriptionId}
                        required
                        rows={5}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="block text-sm font-medium text-gray-300">Tech Stack</p>

                      {availableTechStacks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {availableTechStacks.map((stack) => (
                            <motion.button
                              key={stack}
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onMouseEnter={playHoverSound}
                              onClick={() => {
                                playClickSound();
                                setSelectedStacks((prev) =>
                                  prev.includes(stack)
                                    ? prev.filter((s) => s !== stack)
                                    : [...prev, stack],
                                );
                              }}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                selectedStacks.includes(stack)
                                  ? "border-blue-500/60 bg-blue-600/40 text-blue-200"
                                  : "border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                              }`}
                            >
                              {stack}
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No tech stacks defined yet.</p>
                      )}

                      <div className="flex gap-2">
                        <input
                          id={customStackInputId}
                          type="text"
                          aria-label="Tech stack entry"
                          placeholder="Custom tag (one-off)…"
                          value={customStackInput}
                          onChange={(e) => setCustomStackInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = customStackInput.trim();
                              if (trimmed && !selectedStacks.includes(trimmed)) {
                                setSelectedStacks((prev) => [...prev, trimmed]);
                              }
                              setCustomStackInput("");
                            }
                          }}
                          className="flex-1 rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onMouseEnter={playHoverSound}
                          onClick={() => {
                            playClickSound();
                            const trimmed = customStackInput.trim();
                            if (trimmed && !selectedStacks.includes(trimmed)) {
                              setSelectedStacks((prev) => [...prev, trimmed]);
                            }
                            setCustomStackInput("");
                          }}
                          disabled={!customStackInput.trim()}
                          className="rounded-md bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-500 disabled:opacity-40"
                        >
                          Add
                        </motion.button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <label
                        htmlFor={itemRepoUrlId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Import from GitHub Repository
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        Prefills title, short description, and repo URL.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <input
                          id={itemRepoUrlId}
                          type="url"
                          placeholder="https://github.com/owner/repo"
                          className="flex-1 rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onMouseEnter={playHoverSound}
                          onClick={() => {
                            playClickSound();
                            void handleImportFromRepo();
                          }}
                          disabled={isImportingRepo || !repoUrl.trim()}
                          className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
                        >
                          {isImportingRepo ? "Importing..." : "Import"}
                        </motion.button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={itemGithubUrlId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        GitHub URL (Optional)
                      </label>
                      <input
                        id={itemGithubUrlId}
                        type="url"
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={itemLiveUrlId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Live URL (Optional)
                      </label>
                      <input
                        id={itemLiveUrlId}
                        type="url"
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {type !== "gamedev" ? (
              <div className="border-t border-gray-600 bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={playHoverSound}
                  onClick={playClickSound}
                  disabled={loading}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {loading ? "Saving..." : isEditing ? "Update Item" : "Save Item"}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    closeModal();
                  }}
                  disabled={loading}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-500 bg-transparent px-4 py-2 text-base font-medium text-gray-300 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </motion.button>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
};
