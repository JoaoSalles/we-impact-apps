import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index('./routes/home/app.tsx'),
  route('auth', './routes/auth/index.tsx'),
  route('institutions', './routes/institutions/index.tsx'),
  route('institutions/:id', './routes/institutions/view/index.tsx'),
  route('institutions/:institutionID/projects/:projectID', './routes/projects/view/index.tsx')
  ] satisfies RouteConfig;