# Guy Erreich — Personal Portfolio

My personal portfolio website — a highly interactive, visually rich single-page app built with React 19, TypeScript, and Three.js. Features immersive 3D WebGL backgrounds, GSAP-orchestrated animations, and a headless admin panel backed by Supabase and Cloudflare R2.

## Tech Stack

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Framework     | React 19 + TypeScript + Vite          |
| Styling       | Tailwind CSS v4                       |
| 3D / WebGL    | Three.js via React Three Fiber & Drei |
| Animations    | GSAP, Framer Motion                   |
| Particles     | tsparticles                           |
| Backend / DB  | Supabase (Postgres + Auth)            |
| Media Storage | Cloudflare R2                         |
| Routing       | React Router v7                       |
| Deployment    | Cloudflare Pages                      |

## Project Structure

```
src/
├── components/
│   ├── backgrounds/
│   │   ├── three/        # Three.js / R3F 3D background scenes
│   │   └── tsparticles/  # 2D particle effects
│   ├── admin/            # Admin panel components
│   └── ui/               # Reusable UI components
├── pages/                # Route-level page components
├── hooks/                # Custom React hooks
└── lib/                  # Supabase client, animation orchestration, sound utils
```

## Getting Started

### Prerequisites

- Node.js (version specified in `.node-version`)
- npm

### Environment Variables

Create a `.env.local` file at the root with the following variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

R2 credentials are **not** stored in the browser bundle. They live as Supabase secrets and are used exclusively inside the `r2-presign` edge function. Set them once via the Supabase CLI:

```bash
supabase secrets set R2_ACCOUNT_ID=<your-cloudflare-account-id>
supabase secrets set R2_ACCESS_KEY_ID=<your-r2-access-key>
supabase secrets set R2_SECRET_ACCESS_KEY=<your-r2-secret-key>
supabase secrets set R2_BUCKET_NAME=<your-bucket-name>
supabase secrets set R2_PUBLIC_URL=<your-r2-public-url>
```

Deploy the edge function after setting secrets:

```bash
supabase functions deploy r2-presign
```

### Install & Run

```bash
npm install
npm run dev
```

### Other Commands

```bash
npm run build   # Type-check + production build
npm run lint    # ESLint
npm run preview # Serve the production build locally
```

## CI / CD

| Workflow            | Trigger                     | Description                                       |
| ------------------- | --------------------------- | ------------------------------------------------- |
| `test.yml`          | push / PR → `dev`, `master` | Lint + build validation                           |
| `deploy.yml`        | push → `dev`                | Deploy to Cloudflare Pages                        |
| `license-check.yml` | push / PR → `dev`, `master` | Verify MIT headers on all `src/` files            |
| `pr-labeler.yml`    | PR opened / updated         | Auto-apply labels from file paths and branch name |
| `codeql.yml`        | push / PR → `dev`, `master` | GitHub CodeQL security analysis                   |

## License

[MIT](LICENSE) © Guy Erreich
