# Chandan Kumar — Portfolio Site

A Behance-style portfolio: profile sidebar, tabbed project grid, and full-width case-study pages.
It's a plain static site (HTML, CSS, JS) — no build step — so it runs on any host.
All content lives in two files, which you edit from a browser with **Pages CMS**:

| What | File |
| --- | --- |
| Projects / case studies | `data/projects.json` |
| Name, photo, CV, about, skills, experience, certifications | `data/site.json` |
| Uploaded images and PDFs | `assets/uploads/` |

---

## 1. Preview it on your Mac

The page loads its content with JavaScript, so open it through a small local server
(double-clicking `index.html` won't load the projects).

**Option A — Terminal (nothing to install):**
```bash
cd ~/Documents/"Chandan portfolio site"
python3 -m http.server 5500
```
Then open http://localhost:5500. Press `Ctrl + C` to stop.

**Option B — Cursor / VS Code:** open the folder, install the recommended *Live Server*
extension, right-click `index.html` → **Open with Live Server**.

**Option C — Node:** `npm run dev`, then open http://localhost:5500.

---

## 2. Put it online — GitHub Pages (free, recommended)

1. Create a free account at https://github.com (if you don't have one).
2. Click **New repository**. Name it exactly **`<your-username>.github.io`**
   (e.g. `chandankumar-ux.github.io`). Set it to **Public**. Create it.
3. Upload the site:
   - Easiest: install **GitHub Desktop** (https://desktop.github.com), sign in, choose
     *File → Add local repository* → pick `Documents/Chandan portfolio site` → *create a repository* →
     **Publish repository** to the repo you just made (untick "Keep this code private").
   - Or in the browser: *Add file → Upload files*, drag in everything in the folder.
     On a Mac, press `Cmd + Shift + .` in Finder to show hidden files so `.pages.yml` and
     `.nojekyll` are included.
4. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   Branch: `main`, folder: `/ (root)` → **Save**.
5. After a minute your site is live at `https://<your-username>.github.io`.

## 3. Turn on the admin panel (Pages CMS)

1. Go to https://app.pagescms.org and **Sign in with GitHub**.
2. When asked, **install the Pages CMS GitHub App** on your account and give it access to the
   portfolio repository.
3. Open the repository. You'll see **Projects (case studies)** and **Profile & site settings**.
4. Add a project: fill in the title, a unique URL name (e.g. `bank-onboarding-app`), category,
   summary, a 4:3 cover image, the case-study text, and gallery images (shown full-width,
   one after another — like Behance). **Save**.
5. Every save is a commit to GitHub, and GitHub Pages republishes the site within a minute or two.

Tips
- Category becomes a filter chip automatically. Reuse the same spelling to group projects.
- Export your Behance images while logged in to Behance, then upload them here as cover and gallery images.
- Recommended sizes: cover 1600 × 1200 (4:3); gallery images 1920 px wide, JPG/WebP under ~1 MB each.
- Add your profile photo and CV (PDF) under **Profile & site settings** — the CV button appears once a file is set.

## 4. Use your own domain (optional, ~₹800–1,500/year)

1. Buy a domain (e.g. `chandankumar.design` or `chandankumar.in`) from GoDaddy, Hostinger, Namecheap or Cloudflare.
2. In the repo: **Settings → Pages → Custom domain** → enter it → Save.
3. At your domain provider, add DNS records:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www` → `<your-username>.github.io`
4. Wait for DNS (minutes to a few hours), then tick **Enforce HTTPS**.

---

## Other hosting options

**Netlify / Cloudflare Pages (also free):** connect the same GitHub repo, leave the build command empty,
and set the publish/output directory to the repo root (`.` or `/`). Pages CMS works the same way.

**Shared hosting with cPanel (Hostinger, GoDaddy, Bluehost):** zip the folder contents, upload to
`public_html` with File Manager, and extract. Note: the CMS edits GitHub, so with this option you'd
re-upload `data/` and `assets/uploads/` after changes — or use the host's Git deployment feature.

## Editing by hand

If you prefer, edit `data/projects.json` directly. Each project looks like:

```json
{
  "slug": "my-project",
  "title": "My Project",
  "client": "Company",
  "category": "Mobile app",
  "domain": "Fintech",
  "year": "2025",
  "role": "Lead Product Designer",
  "tools": ["Figma"],
  "featured": false,
  "summary": "One line about the project.",
  "cover": "/assets/uploads/my-cover.jpg",
  "body": "## Overview\n\nMarkdown text…",
  "gallery": [{ "image": "/assets/uploads/screen-1.jpg", "caption": "Home screen" }],
  "link": ""
}
```
