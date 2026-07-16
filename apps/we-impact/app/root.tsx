import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  type MetaFunction, 
  type LinksFunction
} from "react-router";

import { QueryClientProvider } from '@tanstack/react-query'

import { SessionProvider } from './auth/session-context'
import { RequireAuth } from './auth/require-auth'
import { RootLayout } from './layouts/RootLayout'
import { Toaster } from './components/ui/sonner'
import { queryClient } from './query-client'
import appStylesHref from './app.css?url'

export const meta: MetaFunction = () => ([{
  title: "We Impact",
}]);

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            {children}
          </SessionProvider>
        </QueryClientProvider>
        <Toaster richColors />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
    return (
      <RequireAuth>
        <RootLayout />
      </RequireAuth>
    );
}
