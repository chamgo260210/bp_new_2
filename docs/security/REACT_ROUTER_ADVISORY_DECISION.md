# React Router GHSA-qwww-vcr4-c8h2 Decision

- Decision date: 2026-07-31
- Owner: frontend maintainers
- Review deadline: 2026-10-31
- Advisory: `GHSA-qwww-vcr4-c8h2`
- Package scope: `pkg:npm/react-router@7.18.1`
- Finding path: `frontEnd/package-lock.json`
- Decision: temporarily not affected; use a scoped, expiring Trivy exception

## Advisory and application exposure

The GitHub-reviewed advisory affects `react-router >=7.12.0,<8.3.0` and explicitly
states that an application is affected only when it uses the unstable React Server
Components APIs. The vulnerable behavior is a server-side RSC action path that may
execute an action before rejecting a cross-origin request.

`package.json` requests `react-router-dom ^7.11.0`; the lockfile resolves both
`react-router-dom` and its exact `react-router` dependency to `7.18.1`. Trivy reports
the transitive `react-router` package from `frontEnd/package-lock.json`.

This repository does not expose that path:

- `frontEnd/src/main.jsx` mounts a client-only Vite application with
  `ReactDOM.createRoot` and declarative `BrowserRouter`.
- Routes are JSX `<Routes>/<Route>` declarations. There is no
  `createBrowserRouter`, route `loader`/`action`, React Router framework plugin,
  server route module, or server action.
- There is no React Router Node adapter, SSR entry, RSC entry, hydration server,
  or Node process serving application actions.
- The production frontend image contains only Nginx and the static Vite `dist`
  output.
- The production bundle contains none of the RSC request/action symbols named by
  the unstable API documentation.

The vulnerable package is present in the lockfile and client bundle, but the
server-only unstable RSC execution path is neither configured nor reachable.

## Options considered

### Upgrade to React Router 8.3.0

This removes the finding. The project already meets the minimum Node, React, and
Vite versions. However, React Router v8 removes `react-router-dom`; this repository
has imports from that compatibility package in 80 production and test source files.
An immediate upgrade therefore requires a cross-cutting import migration and full
route regression verification. It is suitable for a dedicated dependency PR, not
as an unreviewed security-gate workaround.

### Scoped exception

This is the selected temporary treatment because the advisory's only affected
feature is absent. `.trivyignore.yaml` binds the exception to the advisory, exact
PURL, and lockfile path, and expires on 2026-10-31. Other Trivy findings remain
blocking.

### Remove React Router

Removing routing would require replacing a core UI facility and is disproportionate
to an unreachable RSC code path.

## Revalidation triggers

Reassess and remove the exception immediately when any of these occurs:

- introduction of React Router Framework or unstable RSC APIs;
- introduction of SSR, server actions, route modules, loaders/actions, or a Node
  React Router adapter;
- migration from declarative `BrowserRouter` to a Data Router;
- a React Router 7.x patch becomes available;
- work begins on a shared or production deployment;
- the package version, advisory scope, or lockfile path changes;
- the review deadline is reached.

The preferred permanent resolution is a dedicated React Router 8 migration that
replaces `react-router-dom` imports and reruns route, Docker, and browser E2E checks.
