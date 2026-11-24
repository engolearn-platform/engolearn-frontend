# ⚛️ React Feature-Based Architecture Boilerplate

A scalable React + Vite + TypeScript boilerplate following **feature-based architecture**.

This project provides a clean, modular structure to help you build large React applications that are easy to maintain, test, and grow over time.

---

## 📁 Project Structure

```bash
src/
├── core/                # Global configuration, assets, styles, layouts
├── shared/              # Shared utilities, hooks, components, services
├── features/            # Feature-based modules (e.g. Post, Product)
│   └── Post/
│       ├── components/
│       ├── hooks/
│       ├── types/
│       ├── views/
│       └── routes.ts
├── router.tsx           # Central route aggregation
└── main.tsx             # App entry point
```

> Detailed structure rules: `docs/architecture/project-structure.md` — it wins on conflicts.

---

## 🏗️ Architecture Entities

### `core/`

**Purpose**: Contains global application infrastructure that affects the entire app.

| Folder | Description |
|--------|-------------|
| `assets/` | Global assets like images, fonts, and CSS files |
| `layouts/` | Application layouts (e.g., FullLayout with Header/Footer) |
| `components/` | Third-party UI component wrappers (e.g., shadcn/ui) |

**When to use**: Place files here that configure or style the entire application, not specific features.

---

### `features/`

**Purpose**: Independently maintainable modules that own capabilities within a business domain. Each feature encapsulates its implementation and may publish a contract for other features that consume its capabilities.

**Structure of a feature:**

```bash
features/
└── FeatureName/
    ├── components/      # UI components specific to this feature
    ├── contract/        # Optional public capability API
    ├── hooks/           # Custom hooks for this feature's logic
    ├── types/           # TypeScript interfaces and types
    ├── views/           # Page-level components
    └── routes.ts        # Feature-specific route definitions
```

**Key principles:**
- Cross-feature capability dependencies use only the provider's public `contract/index.ts` entry point.
- Consumers must not import another feature's internal implementation. Providers must not depend on consumer implementations or form dependency cycles.
- Use `shared/` for generic, feature-neutral functionality without a single business-domain owner. Keep domain-specific capabilities in their owning feature.
- Features can import appropriate shared functionality and app-shell infrastructure from `core/`.
- Feature views and routes depend on the capability surface the module owns.

---

### `shared/`

**Purpose**: Cross-feature reusable code that doesn't belong to any specific feature.

| Folder | Description |
|--------|-------------|
| `components/` | Reusable UI components (Card, Loading, EmptyState) |
| `hooks/` | Generic React hooks (useFetch, useLoading) |
| `services/` | API service layer and HTTP utilities |
| `utils/` | Utility functions (formatters, cn class merger) |
| `constants/` | Application-wide constants (API URLs, routes) |
| `types/` | Shared TypeScript interfaces |

**When to use**: For generic, feature-neutral functionality without a single business-domain owner. Reuse across features alone does not make domain-specific capability shared code.

---

## 📦 Import Aliases

The project includes path aliases for cleaner imports:

```tsx
import { useFetch } from "@shared/hooks";
import { Card } from "@shared/components";
import FullLayout from "@/core/layouts/FullLayout";
```

`@features/<provider>/contract` resolves to that feature's `contract/index.ts`. A feature publishes a contract when another feature needs its domain capability. Keep generic reusable functionality in `shared/` when no feature owns it. See [the project structure guide](docs/architecture/project-structure.md) for detailed boundaries and import examples.

| Alias | Path |
|-------|------|
| `@/` | `src/` |
| `@features/` | `src/features/` |
| `@shared/` | `src/shared/` |

---

## 🚀 Features

- ✅ Feature-based architecture
- ⚡️ Vite for fast development
- 🧠 TypeScript support
- 🔀 Modular routing per feature
- 🎨 Organized global styles and layouts
- 🧱 Clean and scalable file structure
- 🔧 Shared utilities and services layer

---

## 📦 Tech Stack

- React 19
- Vite
- TypeScript
- React Router DOM (v7)
- Tailwind CSS

---

## 🛠️ Getting Started

```bash
# Clone the repo
git clone https://github.com/engolearn-platform/engolearn-frontend.git

# Install dependencies
cd engolearn-frontend
npm install

# Start dev server
npm run dev
```

---

## 📂 Feature Example

Here's how the `Post` feature is organized:

```bash
features/
└── Post/
    ├── components/
    │   ├── PostItem.tsx
    │   └── PostList.tsx
    ├── hooks/
    │   └── usePost.ts
    ├── types/
    │   └── post.types.ts
    ├── views/
    │   └── PostView.tsx
    └── routes.ts
```

---

## 🌐 Routing Example

Each feature can define its own routes in `routes.ts`, then the app combines all routes centrally:

```tsx
// features/Post/routes.ts
export const PostRoutes = [
  { path: "/posts", Component: FullLayout, children: [...] }
];

// router.tsx
import { PostRoutes } from "@features/Post/routes";
export const appRoutes = [...PostRoutes, ...ProductRoutes];
```

## Learner periodic assessment

[F01/F02 routes, timing, UI and integration](docs/features/assessment/README.md). Uses the shared cookie-auth session and real backend API.
