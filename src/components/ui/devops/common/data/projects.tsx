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
    icon_name: "server",
  },
  {
    id: "2",
    title: "Infrastructure as Code",
    description:
      "Terraform modules to provision scalable AWS infrastructure including VPCs, EKS clusters, and RDS databases with high availability.",
    tech_stack: ["Terraform", "AWS", "HCL", "Python"],
    github_url: "https://github.com",
    icon_name: "cloud",
  },
  {
    id: "3",
    title: "Monitoring Stack",
    description:
      "Prometheus and Grafana setup with custom exporters to monitor application performance and alert on anomalies in real-time.",
    tech_stack: ["Prometheus", "Grafana", "Go", "Alertmanager"],
    github_url: "https://github.com",
    icon_name: "database",
  },
  {
    id: "4",
    title: "CLI Automation Tool",
    description:
      "A powerful command-line interface written in Go to automate repetitive developer tasks and streamline local environment setup.",
    tech_stack: ["Go", "CLI", "Automation"],
    github_url: "https://github.com",
    icon_name: "terminal",
  },
  {
    id: "5",
    title: "GitOps Workflow",
    description:
      "ArgoCD-based GitOps setup that syncs Kubernetes cluster state from Git, enabling declarative, auditable, and automated deployments.",
    tech_stack: ["ArgoCD", "Kubernetes", "Helm", "Git"],
    github_url: "https://github.com",
    icon_name: "gitbranch",
  },
  {
    id: "6",
    title: "Container Security Scanner",
    description:
      "Automated vulnerability scanning pipeline integrating Trivy into CI to block container images with critical CVEs before deployment.",
    tech_stack: ["Trivy", "Docker", "GitHub Actions", "Python"],
    github_url: "https://github.com",
    icon_name: "shield",
  },
  {
    id: "7",
    title: "Log Aggregation Platform",
    description:
      "Centralised logging with the ELK stack — Filebeat ships logs from all pods, Logstash transforms them, Kibana visualises trends.",
    tech_stack: ["Elasticsearch", "Logstash", "Kibana", "Filebeat"],
    github_url: "https://github.com",
    icon_name: "monitor",
  },
  {
    id: "8",
    title: "Service Mesh Setup",
    description:
      "Istio service mesh deployment for inter-service mTLS, traffic shaping, and distributed tracing across a microservices architecture.",
    tech_stack: ["Istio", "Kubernetes", "Jaeger", "Envoy"],
    github_url: "https://github.com",
    icon_name: "network",
  },
];
