/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Cloud, Database, Server, Terminal } from "lucide-react";
import type { DevOpsProject } from "./types";

export const devOpsProjects: DevOpsProject[] = [
  {
    title: "Automated CI/CD Pipeline",
    description:
      "A robust GitHub Actions pipeline for automated testing, building, and deploying containerized applications to Kubernetes clusters.",
    tags: ["GitHub Actions", "Docker", "Kubernetes", "Bash"],
    link: "https://github.com",
    icon: <Server className="h-6 w-6 text-blue-400" />,
  },
  {
    title: "Infrastructure as Code",
    description:
      "Terraform modules to provision scalable AWS infrastructure including VPCs, EKS clusters, and RDS databases with high availability.",
    tags: ["Terraform", "AWS", "HCL", "Python"],
    link: "https://github.com",
    icon: <Cloud className="h-6 w-6 text-emerald-400" />,
  },
  {
    title: "Monitoring Stack",
    description:
      "Prometheus and Grafana setup with custom exporters to monitor application performance and alert on anomalies in real-time.",
    tags: ["Prometheus", "Grafana", "Go", "Alertmanager"],
    link: "https://github.com",
    icon: <Database className="h-6 w-6 text-violet-400" />,
  },
  {
    title: "CLI Automation Tool",
    description:
      "A powerful command-line interface written in Go to automate repetitive developer tasks and streamline local environment setup.",
    tags: ["Go", "CLI", "Automation"],
    link: "https://github.com",
    icon: <Terminal className="h-6 w-6 text-orange-400" />,
  },
];
