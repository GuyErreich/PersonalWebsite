/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { GameDevItem } from "./types";

export const fallbackGameDevItems: GameDevItem[] = [
  {
    id: "1",
    title: "Procedural Dungeon Generator",
    description:
      "A runtime dungeon generator using BSP trees and cellular automata, producing unique layouts with guaranteed connectivity.",
    media_url: "",
    icon_name: "cpu",
    github_url: "https://github.com",
    tags: ["C#", "Unity", "Procedural Gen", "Algorithms"],
  },
  {
    id: "2",
    title: "Multiplayer FPS Prototype",
    description:
      "A networked first-person shooter prototype built with authoritative server rollback and client-side prediction for smooth gameplay.",
    media_url: "",
    icon_name: "gamepad",
    github_url: "https://github.com",
    tags: ["Unity", "Netcode", "C#", "FPS"],
  },
  {
    id: "3",
    title: "Custom Physics Engine",
    description:
      "A 2D rigid-body physics engine from scratch featuring AABB collision detection, impulse resolution, and friction simulation.",
    media_url: "",
    icon_name: "rocket",
    github_url: "https://github.com",
    tags: ["C++", "Physics", "Math", "2D"],
  },
  {
    id: "4",
    title: "Shader Graph VFX Pack",
    description:
      "A library of HLSL shaders and Unity Shader Graph assets — dissolve, hologram, water ripple, and stylised post-processing effects.",
    media_url: "",
    icon_name: "monitor",
    github_url: "https://github.com",
    tags: ["HLSL", "Unity", "Shader Graph", "VFX"],
  },
  {
    id: "5",
    title: "AI Behaviour Tree System",
    description:
      "A composable behaviour tree framework for NPC AI with support for parallel nodes, decorators, and runtime debugging visualisation.",
    media_url: "",
    icon_name: "cpu",
    github_url: "https://github.com",
    tags: ["C#", "Unity", "AI", "Behaviour Trees"],
  },
  {
    id: "6",
    title: "Inventory & Crafting System",
    description:
      "A data-driven inventory and crafting system with drag-and-drop UI, stackable items, and recipe resolution via scriptable objects.",
    media_url: "",
    icon_name: "wrench",
    github_url: "https://github.com",
    tags: ["C#", "Unity", "UI", "Data-Driven"],
  },
  {
    id: "7",
    title: "Top-Down RPG Demo",
    description:
      "A top-down RPG demo featuring dialogue trees, quests, turn-based combat, and a tiled world built with Tiled and Godot.",
    media_url: "",
    icon_name: "globe",
    github_url: "https://github.com",
    tags: ["Godot", "GDScript", "RPG", "Tiled"],
  },
  {
    id: "8",
    title: "Mobile Endless Runner",
    description:
      "A mobile endless runner with procedurally spawned obstacles, swipe controls, leaderboard integration, and adaptive difficulty.",
    media_url: "",
    icon_name: "smartphone",
    github_url: "https://github.com",
    tags: ["Unity", "C#", "Mobile", "Procedural Gen"],
  },
];
