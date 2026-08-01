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
  const mediaLibraryReloadRef = useRef<(() => Promise<void>) | null>(null);

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
  const [showVfxSection, setShowVfxSection] = useState(false);
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
  const [isVfxLinksHydrated, setIsVfxLinksHydrated] = useState(true);

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
    setShowVfxSection(false);
    setLinkedVfxIds([]);
    setLinkedVfxDetails([]);
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
    setMediaLibraryRoleFilter("all");
    setWizardStep(0);
    setActiveSection("basics");
    setIsComingSoon(false);
    setIsVfxLinksHydrated(true);
    setError(null);
  }, []);

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
      setShowVfxSection(
        gameDevItem.is_coming_soon ? false : (gameDevItem.show_vfx_section ?? true),
      );
      setIsComingSoon(gameDevItem.is_coming_soon ?? false);
      setSelectedGameTags(gameDevItem.tags ?? []);
      setSelectedStacks([]);
      setIsVfxLinksHydrated(false);

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
              .eq("gamedev_item_id", gameDevItem.id)
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

          setAvailableVfx(dedupedVfx);

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

          setLinkedVfxDetails(linkedDetails);
          setLinkedVfxIds(await normalizeLinkedVfxIds(orderedLinkedIds, rawVfx));
          hydrateSucceeded = true;
        } catch (loadError) {
          if (isCurrent) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load VFX links.");
          }
        } finally {
          if (isCurrent) {
            setIsVfxLinksHydrated(hydrateSucceeded);
          }
        }
      })();

      return () => {
        isCurrent = false;
      };
    } else {
      const devOpsItem = editingItem as AdminDevOpsProject;
      setDescription(devOpsItem.description);
      setBody("");
      setSelectedHeaderMediaUrl(null);
      setSelectedStacks(devOpsItem.tech_stack ?? []);
      setSelectedGameTags([]);
      setIsVfxLinksHydrated(true);
    }
  }, [editingItem, gameDevCreatePreset, isOpen, resetForm, type]);

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

      setAvailableVfx(
        dedupeGameDevVfxByMediaUrl(
          ((data ?? []) as AdminGameDevVfx[]).map((item) => ({
            ...item,
            tags: item.tags ?? [],
          })),
        ),
      );
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
      if (event.key !== "Escape" || loading) return;
      // Nested media pickers own Escape first.
      if (isMediaLibraryOpen || isVfxMediaLibraryOpen) return;
      closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeModal, isMediaLibraryOpen, isOpen, isVfxMediaLibraryOpen, loading]);

  const handleImportFromRepo = async () => {
    const normalizedRepoUrl = repoUrl.trim();
    if (!normalizedRepoUrl) {
      setError("Enter a GitHub repository URL to import.");
      return;
    }

    setError(null);
    setIsImportingRepo(true);

    try {
      const seed = await fetchGitHubProjectSeed(normalizedRepoUrl);

      setTitle(seed.title);
      setDescription(seed.description);
      if (type === "gamedev") {
        setBody(seed.readme || "");
        setSelectedGameTags(seed.tags);
      }

      setGithubUrl(seed.githubUrl);
      setLiveUrl(seed.liveUrl ?? "");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to import repository data.");
      }
    } finally {
      setIsImportingRepo(false);
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
        const alt =
          file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]+/g, " ")
            .trim() || "Project media";

        newMedia.push({ url: item.media_url, alt });
      }

      setUploadedBodyMedia((prev) => [...prev, ...newMedia]);

      if (mediaLibraryReloadRef.current) {
        await mediaLibraryReloadRef.current();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to upload body media.");
      }
    } finally {
      setIsUploadingBodyAsset(false);
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
    setIsVfxMediaLibraryOpen(true);
  }, []);

  const handleVfxMediaLibrarySelect = useCallback(async (item: MediaLibraryItem) => {
    setError(null);

    try {
      const vfx = await ensureVfxFromMediaLibraryItem(item);

      setAvailableVfx((prev) =>
        dedupeGameDevVfxByMediaUrl([
          ...prev.filter((entry) => entry.id !== vfx.id),
          {
            ...vfx,
            tags: vfx.tags ?? [],
          },
        ]),
      );

      setLinkedVfxIds((prev) => (prev.includes(vfx.id) ? prev : [...prev, vfx.id]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add VFX media.");
    }
  }, []);

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
      discovery: isComingSoon || isFeatured || !showVfxSection || linkedVfxIds.length > 0,
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
      isFeatured,
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
        onClear: () => setSelectedHeaderMediaUrl(null),
        onSelect: (item) => {
          setSelectedHeaderMediaUrl(item.media_url);
          setMediaFile(null);
        },
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
              if (value) {
                setShowVfxSection(false);
                if (description.trim().length === 0) {
                  setDescription(GAMEDEV_COMING_SOON_DEFAULT_SUMMARY);
                }
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
            onHeaderMediaUrlChange={setSelectedHeaderMediaUrl}
            onMediaFileChange={setMediaFile}
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
            onLinkedVfxIdsChange={setLinkedVfxIds}
            onOpenVfxMediaLibrary={openVfxMediaLibrary}
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

    if (type === "gamedev" && isEditingGameDev && !isVfxLinksHydrated) {
      setError("Project VFX links are still loading. Please wait and try again.");
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
        const storedDescription = normalizedBody
          ? buildGameDevStoredContent(normalizedSummary, normalizedBody)
          : normalizedSummary;
        if (storedDescription.length > MAX_DESCRIPTION_LENGTH) {
          setError(`Body content must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
          return;
        }

        const sourceGameDev = isEditingGameDev ? (editingItem as AdminGameDevProject) : null;

        let finalHeaderMediaUrl =
          selectedHeaderMediaUrl ??
          sourceGameDev?.header_media_url ??
          sourceGameDev?.media_url ??
          null;

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
        const teaserThumbnailUrl = isComingSoon
          ? (imageOnlyUrl(selectedCardThumbnailUrl) ??
            imageOnlyUrl(teaserMediaUrl) ??
            imageOnlyUrl(sourceGameDev?.thumbnail_url) ??
            null)
          : (selectedCardThumbnailUrl ??
            sourceGameDev?.thumbnail_url ??
            imageOnlyUrl(teaserMediaUrl) ??
            null);

        const projectPayload = {
          title: normalizedTitle,
          description: storedDescription,
          // Keep card/legacy media_url aligned with header so new projects are not blank in gallery.
          media_url: teaserMediaUrl ?? sourceGameDev?.media_url ?? null,
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
          if (isComingSoon) {
            const { error: clearLinksError } = await supabase
              .from("gamedev_project_vfx")
              .delete()
              .eq("gamedev_item_id", projectId);

            if (clearLinksError) {
              throw new Error(clearLinksError.message);
            }

            return;
          }

          const { data: existingLinks, error: fetchLinksError } = await supabase
            .from("gamedev_project_vfx")
            .select("gamedev_vfx_id")
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
            throw new Error(upsertLinksError.message);
          }

          if (showVfxSection && normalizedLinkedVfxIds.length > 0) {
            await markVfxShownInLibrary(normalizedLinkedVfxIds);
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

          await syncProjectVfxLinks(sourceGameDev.id);
        } else {
          const { data: insertedItem, error: insertError } = await supabase
            .from("gamedev_items")
            .insert([projectPayload])
            .select("id")
            .single();

          if (insertError || !insertedItem) {
            throw new Error(insertError?.message ?? "Failed to create game dev project.");
          }

          await syncProjectVfxLinks(insertedItem.id);
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
            if (loading) {
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
                      saveDisabled={isEditingGameDev && !isVfxLinksHydrated}
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
                      }}
                      onReady={({ reload }) => {
                        mediaLibraryReloadRef.current = reload;
                      }}
                      actions={filteredMediaLibraryActions}
                    />

                    <MediaLibraryPickerModal
                      isOpen={isVfxMediaLibraryOpen}
                      onClose={() => setIsVfxMediaLibraryOpen(false)}
                      title="Add Project VFX"
                      description="Pick images or videos from the media library to show in this project's VFX section."
                      onReady={({ reload }) => {
                        mediaLibraryReloadRef.current = reload;
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
