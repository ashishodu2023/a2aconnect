# Connected to GitHub

**Source of truth:** https://github.com/ashishodu2023/a2aconnect  
**Live site:** https://www.a2aconnect.dev  
**Enhancement branch (this agent):** `cursor/a2aconnect-enhance-4e2c`

## Pull enhancements onto GitHub (from your machine)

```bash
cd /home/ashishsverma/Downloads/a2aconnect
git remote -v
# ensure origin points at github.com/ashishodu2023/a2aconnect.git

# Option A — apply files from the agent zip
unzip -o /path/to/a2aconnect-source.zip
# or copy updated README.md + apps/web/src/app/* from the zip

git add README.md CHANGELOG.md docs/hosting-a2aconnect-dev.md \
  apps/web/src/app/layout.tsx apps/web/src/app/robots.ts apps/web/src/app/sitemap.ts \
  .gitignore
git commit -m "Enhance: architecture README, SEO sitemap/robots, Open Graph"
git push origin main
```

Vercel will redeploy `apps/web` automatically after the push.

## This agent

- Fetches `github/main` via the `github` remote
- Pushes working branches to Cursor Origin
- Cannot push to GitHub without your credentials — you push `main` from Downloads
