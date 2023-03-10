# Convex Fullstack App

This example demonstrates a fullstack application built with Convex, React, Next.js, and Auth0.

The app is a very simple Asana-style task management app that allows users to create, view, and manage tasks. The app features:

- [x] Basic Authentication & Authorization, implemented with Auth0 and Convex
- [x] Task creation, where each task may have:
  - [x] Owner
  - [x] Title
  - [x] Description
  - [x] Status (New | In Progress | Done | Cancelled)
  - [x] Comments
  - [x] File attachments (from a fixed collection to prevent abuse)
- [ ] Task management, allowing users/task owner to:
  - [x] Add a comment
  - [x] Change status (owner only)
  - [x] Reassign ownership (owner only)
- [ ] Optional email reminders, set by the owner to be sent at a certain interval
- [ ] Filter tasks by ticket status, creator, or owner
- [ ] Search tasks by title, description, or comments
- [x] Infinite-scroll pagination to support very large task collections

---

This application is built with Next.js, bootstrapped with [`create-next-app`](https://nextjs.org/docs/api-reference/create-next-app) and the official [Next.js `convex` example](https://github.com/vercel/next.js/tree/canary/examples/convex).

## Deploy your own

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=next-example):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/vercel/next.js/tree/canary/examples/convex&project-name=convex&repository-name=convex)

## How to use

Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init), [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/), or [pnpm](https://pnpm.io) to bootstrap the example:

```bash
npx create-next-app --example convex convex-app
# or
yarn create-next-app --example convex convex-app
# or
pnpm create-next-app --example convex convex-app
```

Run

```bash
npm run dev
```

to run `next dev` and a Convex file watcher at the same time. This command will log you into Convex, so you'll need to create a Convex account if this is your first project.

Once everything is working, commit your code and deploy it to the cloud with [Vercel](https://vercel.com/new?utm_source=github&utm_medium=readme&utm_campaign=next-example) ([Documentation](https://nextjs.org/docs/deployment)).

Use `npx convex deploy && npm run build` as the build command and set the `CONVEX_DEPLOY_KEY` environmental variable in Vercel ([Documentation](https://docs.convex.dev/getting-started/deployment/hosting/vercel)).
