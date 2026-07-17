import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index('./routes/home/app.tsx'),
  route('about', './routes/about/about.tsx'),
  route('auth', './routes/auth/index.tsx'),
  route('institutions', './routes/institutions/index.tsx'),
  route('institutions/:id/edit', './routes/institutions/edit/index.tsx')
  ] satisfies RouteConfig;