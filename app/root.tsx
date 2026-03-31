import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from '@remix-run/react';
import type { LinksFunction } from '@remix-run/node';

export const links: LinksFunction = () => [];

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-gray-50 text-gray-900">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <html lang="en">
      <head>
        <title>Error</title>
        <Meta />
        <Links />
      </head>
      <body className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            {isRouteErrorResponse(error)
              ? `${error.status} ${error.statusText}`
              : 'Unexpected Error'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isRouteErrorResponse(error)
              ? error.data
              : 'Something went wrong. Please try again.'}
          </p>
          <a href="/" className="mt-4 inline-block text-blue-600 underline">
            Go home
          </a>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
