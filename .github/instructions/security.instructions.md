---
description: "Use when: reviewing or fixing security vulnerabilities, preventing injection attacks, hardening authentication, validating inputs, protecting sensitive data, or performing zero-trust audits. Triggers on SQL, XSS, CSRF, auth, injection, Supabase, API keys, tokens, CORS, secrets."
applyTo: "**"
---

# Security & Vulnerability Prevention Instructions

Apply these rules whenever you write or review code that touches user input, API routes, authentication, or sensitive data:

## 1. Prevent SQL Injection
- Never interpolate user input into SQL queries. Always use parameterized queries.
- For Supabase, rely on PostgREST parameterization (never interpolate values into query strings).
- For direct PostgreSQL queries, use placeholders (e.g., `$1`) and pass values as parameters.

## 2. Error Handling
- Always check for errors in API/database responses and handle them securely.

## 3. Sensitive Data
- Never log or expose sensitive data (API keys, tokens, passwords) in client code or error messages.

Follow these rules to ensure zero vulnerabilities and secure code.