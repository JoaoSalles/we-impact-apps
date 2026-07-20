import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index('./routes/home/app.tsx'),
  route('auth', './routes/auth/index.tsx'),
  route('institutions', './routes/institutions/index.tsx'),
  route('institutions/:id/edit', './routes/institutions/edit/index.tsx'),
  route('projects/:id/edit', './routes/projectsView/index.tsx')
  ] satisfies RouteConfig;