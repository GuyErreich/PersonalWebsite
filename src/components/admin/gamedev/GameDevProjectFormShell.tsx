/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { useMediaQuery } from "../../../hooks/responsive/useMediaQuery";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import {
  GAMEDEV_FORM_SECTIONS,
  type GameDevFormSectionId,
} from "./formSections";

interface GameDevProjectFormShellProps {
  mode: "wizard" | "sidebar";
  wizardStep: number;
  activeSection: GameDevFormSectionId;
  sectionCompletion: Record<GameDevFormSectionId, boolean>;
  sectionTitleId: string;
  loading: boolean;
  onWizardStepChange: (step: number) => void;
  onSectionChange: (section: GameDevFormSectionId) => void;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  children: ReactNode;
}

export const GameDevProjectFormShell = ({
  mode,
  wizardStep,
  activeSection,
  sectionCompletion,
  sectionTitleId,
  loading,
  onWizardStepChange,
  onSectionChange,
  onBack,
  onNext,
  onCancel,
  children,
}: GameDevProjectFormShellProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const sectionHeadingRef = useRef<HTMLHeadingElement>(null);
  const isWizard = mode === "wizard";
  const isLastWizardStep = wizardStep >= GAMEDEV_FORM_SECTIONS.length - 1;
  const activeConfig =
    GAMEDEV_FORM_SECTIONS.find((section) => section.id === activeSection) ??
    GAMEDEV_FORM_SECTIONS[0];

  useEffect(() => {
    sectionHeadingRef.current?.focus();
  }, [activeSection, wizardStep, mode]);

  const renderNavButton = (
    section: (typeof GAMEDEV_FORM_SECTIONS)[number],
    index: number,
    variant: "wizard" | "sidebar" | "mobile-tab",
  ) => {
    const isActive = isWizard ? wizardStep === index : activeSection === section.id;
    const isComplete = sectionCompletion[section.id];

    const baseClass =
      variant === "sidebar"
        ? "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"
        : variant === "mobile-tab"
          ? "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          : "flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium transition-colors";

    const activeClass =
      variant === "sidebar"
        ? "bg-cyan-500/20 text-cyan-100"
        : "bg-cyan-500/20 text-cyan-200";

    const inactiveClass =
      variant === "sidebar"
        ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
        : "bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200";

    return (
      <motion.button
        key={section.id}
        type="button"
        role={variant === "mobile-tab" ? "tab" : undefined}
        aria-current={variant === "sidebar" && isActive ? "page" : undefined}
        aria-selected={variant === "mobile-tab" ? isActive : undefined}
        whileHover={{ scale: variant === "wizard" ? 1.02 : 1.01 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={playHoverSound}
        onClick={() => {
          playClickSound();
          if (isWizard) {
            onWizardStepChange(index);
            return;
          }
          onSectionChange(section.id);
        }}
        className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
      >
        <span className="flex items-center gap-1.5">
          {variant === "wizard" ? (
            <span className="font-semibold text-cyan-300/80">{index + 1}</span>
          ) : null}
          {section.shortLabel}
        </span>
        {isComplete ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-green-400" aria-hidden="true" />
        ) : null}
      </motion.button>
    );
  };

  const sectionPanel = (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <h4
        ref={sectionHeadingRef}
        id={sectionTitleId}
        tabIndex={-1}
        className="mb-3 text-sm font-medium text-white outline-none"
      >
        {activeConfig.label}
      </h4>
      {children}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex min-h-0 max-h-[min(80vh,760px)] flex-1 flex-col overflow-hidden">
        {isWizard ? (
          <>
            <div
              className="mb-3 flex flex-wrap gap-1 border-b border-gray-700 pb-3"
              aria-label="Project creation steps"
            >
              {GAMEDEV_FORM_SECTIONS.map((section, index) =>
                renderNavButton(section, index, "wizard"),
              )}
            </div>
            {sectionPanel}
          </>
        ) : isMobile ? (
          <>
            <div
              className="mb-3 flex gap-2 overflow-x-auto border-b border-gray-700 pb-2"
              role="tablist"
              aria-label="Project editor sections"
            >
              {GAMEDEV_FORM_SECTIONS.map((section, index) =>
                renderNavButton(section, index, "mobile-tab"),
              )}
            </div>
            {sectionPanel}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 gap-4">
            <nav
              className="flex w-44 shrink-0 flex-col gap-1 border-r border-gray-700 pr-3"
              aria-label="Project editor sections"
            >
              {GAMEDEV_FORM_SECTIONS.map((section, index) =>
                renderNavButton(section, index, "sidebar"),
              )}
            </nav>
            {sectionPanel}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-gray-600 pt-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onCancel();
          }}
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-gray-500 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 disabled:opacity-50"
        >
          Cancel
        </motion.button>

        {isWizard && wizardStep > 0 ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              onBack();
            }}
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-gray-500 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 disabled:opacity-50"
          >
            Back
          </motion.button>
        ) : null}

        {isWizard && !isLastWizardStep ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              onNext();
            }}
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-cyan-500/40 bg-cyan-600/20 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-600/30 disabled:opacity-50"
          >
            Next
          </motion.button>
        ) : null}

        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onMouseEnter={playHoverSound}
          onClick={playClickSound}
          disabled={loading}
          className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50 ${
            isWizard && !isLastWizardStep
              ? "bg-gray-600 hover:bg-gray-500"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Save"}
        </motion.button>
      </div>
    </div>
  );
};
