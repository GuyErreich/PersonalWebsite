/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { DevOpsProject } from "./types";

export const devOpsProjects: DevOpsProject[] = [
  {
    id: "1",
    title: "Automated CI/CD Pipeline",
    description:
      "A robust GitHub Actions pipeline for automated testing, building, and deploying containerized applications to Kubernetes clusters.",
    tech_stack: ["GitHub Actions", "Docker", "Kubernetes", "Bash"],
    github_url: "https://github.com",
    icon_name: "Server",
  },
  {
    id: "2",
    title: "Infrastructure as Code",
    description:
      "Terraform modules to provision scalable AWS infrastructure including VPCs, EKS clusters, and RDS databases with high availability.",
    tech_stack: ["Terraform", "AWS", "HCL", "Python"],
    github_url: "https://github.com",
    icon_name: "Cloud",
  },
  {
    id: "3",
    title: "Monitoring Stack",
    description:
      "Prometheus and Grafana setup with custom exporters to monitor application performance and alert on anomalies in real-time.",
    tech_stack: ["Prometheus", "Grafana", "Go", "Alertmanager"],
    github_url: "https://github.com",
    icon_name: "Database",
  },
  {
    id: "4",
    title: "CLI Automation Tool",
    description:
      "A powerful command-line interface written in Go to automate repetitive developer tasks and streamline local environment setup.",
    tech_stack: ["Go", "CLI", "Automation"],
    github_url: "https://github.com",
    icon_name: "Terminal",
  },
];
