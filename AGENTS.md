# AI Agent Guidelines for WeImpact

This is an Nx monorepo containing a full-stack React Router application. This file helps AI agents understand the project structure and conventions.

## Tech Stack

- **Monorepo**: Nx 23 with integrated plugins
- **Frontend**: React 19 with React Router 7.14 (full-stack)
- **Bundler**: Vite
- **Language**: TypeScript
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Code Quality**: ESLint + Prettier

## Project Structure

```
we-impact/
├── apps/
│   ├── we-impact/              # Main React Router app
│   │   └── app/
│   │       ├── routes.tsx       # Type-safe route config
│   │       ├── routes/          # Route components
│   │       ├── root.tsx         # Root layout
│   │       ├── entry.server.tsx # Server entry
│   │       └── entry.client.tsx # Client entry
│   └── we-impact-e2e/           # Playwright e2e tests
├── nx.json                       # Nx configuration
├── tsconfig.base.json            # Shared TypeScript config
└── eslint.config.mjs             # ESLint configuration
```

## Common Development Tasks

### Running the Application

```bash
# Development dev (auto-reload on port 4200)
pnpm exec nx dev we-impact

# Production build
pnpm exec nx build we-impact

# View all available tasks
pnpm exec nx show project we-impact
```

### Testing

```bash
# Run unit tests
pnpm exec nx test we-impact

# Run e2e tests
pnpm exec nx e2e we-impact-e2e

# Test with coverage
pnpm exec nx test we-impact --coverage
```

### Code Quality

```bash
# Lint
pnpm exec nx lint we-impact

# Type check
pnpm exec nx typecheck we-impact

# Format (Prettier)
pnpm exec nx format:write apps/we-impact
```

## React Router Architecture

- **Routes defined in**: `apps/we-impact/app/routes.tsx` using type-safe route config
- **Route components**: Stored in `apps/we-impact/app/routes/` folder
- **Root layout**: `root.tsx` - wraps all routes
- **Main app**: `app.tsx` - root page component
- **Server/Client split**: Full-stack with separate entry points for hydration

### Adding New Routes

1. Create component in `apps/we-impact/app/routes/my-route.tsx`
2. Add route definition in `routes.tsx` using the route builder:
   ```typescript
   route('my-route', './routes/my-route.tsx')
   ```
3. Nx automatically infers build/dev/start tasks

## Code Conventions

- **Module boundaries**: Enforced by ESLint - modules must respect logical boundaries
- **CSS**: CSS Modules available (`*.module.css`) - uncomment imports to enable
- **TypeScript**: Strict mode in shared `tsconfig.base.json`
- **File naming**: camelCase for components, kebab-case for route files (convention)

## Nx Task Automation

Nx plugins automatically infer tasks:
- `@nx/react/router-plugin` - handles build/dev/start for React Router apps
- `@nx/eslint/plugin` - provides lint tasks
- `@nx/js/typescript` - provides typecheck tasks

## Key Files for Configuration

- **Vite**: `apps/we-impact/vite.config.mts`
- **React Router**: `apps/we-impact/react-router.config.ts`
- **TypeScript**: `tsconfig.base.json` (shared), `apps/we-impact/tsconfig.json` (app-specific)
- **Prettier/ESLint**: `eslint.config.mjs` (flat config format)

## Important Patterns

### Full-Stack Rendering
This project uses React Router's server-side rendering:
- `entry.server.tsx`: Handles server requests
- `entry.client.tsx`: Client hydration
- Route components can use loaders (server-side) and actions (form handling)

### Import Resolution
Nx enforces clear module boundaries. When creating new files:
- Keep related components together
- Respect the `apps/` and `libs/` structure
- Use relative imports within modules, absolute paths across module boundaries (when allowed by ESLint)

## When Adding Dependencies

After running `npm install` or `yarn add`, you may need to regenerate Nx plugin metadata:
```bash
pnpm exec nx reset
```

## Troubleshooting

- **Build issues**: Clear Nx cache: `pnpm exec nx reset`
- **Type errors**: Run typecheck before building: `pnpm exec nx typecheck we-impact`
- **Module boundary errors**: Check ESLint config - some imports may not be allowed
- **Dev server won't start**: Ensure port 4200 is available, or check `vite.config.mts`
