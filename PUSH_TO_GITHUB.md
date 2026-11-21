# Push A2AConnect to GitHub from your machine

Your working copy should be:

```text
/home/ashishsverma/Downloads/a2aconnect
```

## 1) Refresh local files from this zip

```bash
cd /home/ashishsverma/Downloads
rm -rf a2aconnect
unzip ~/Downloads/a2aconnect-source.zip   # or wherever you saved the artifact
cd a2aconnect
```

## 2) Init git (if needed) and push to your repo

```bash
cd /home/ashishsverma/Downloads/a2aconnect
git init
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/ashishodu2023/a2aconnect.git
git add -A
git commit -m "A2AConnect: Python core, Next.js site, demos, docs"
git branch -M main
git push -u origin main
```

If the GitHub repo already has commits, use:

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

Or with SSH:

```bash
git remote set-url origin git@github.com:ashishodu2023/a2aconnect.git
git push -u origin main
```

## 3) After GitHub has the code

Deploy `apps/web` (Vercel root directory `apps/web`) or confirm Cursor **Publish** for slug `a2aconnect`.
