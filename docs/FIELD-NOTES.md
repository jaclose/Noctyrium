# Field Notes

## Live Deployment

Noctyrium Alpha has a hosted web instance for demos, testing, and website embedding:

- **Hosted Alpha:** https://noctyrium-cktjdhuhw-jacloses-projects.vercel.app/#dashboard
- **Package download:** pending GitHub release/package link

Use the hosted Alpha when you want the full Vercel deployment path: static Vite
app, serverless `/api/*` routes, optional Postgres sync, and mock/real AI
endpoints through environment variables.

Use the downloadable package when you want a local-first copy that opens without
localhost. The package can still export/import JSON backups, but cloud sync needs
the hosted deployment because it depends on serverless functions.
