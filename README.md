# Chandan Kumar — Portfolio Site

A Behance-style portfolio with its own admin panel.

- **Site:** profile sidebar, Work / About / Experience / **Resume** tabs, a filterable project grid, and full-width case-study pages.
- **Resume tab:** visitors read your CV on the page and download it as **PDF** or **Word (.docx)**. Both files are created from your resume content, so they always match what you last saved.
- **Admin panel (`/admin`):** add and edit projects the Behance way (images, text, photo grids, video/Figma embeds, spacers, background colour, cover, tags, draft/published), edit your profile, and edit your resume.

It's a plain static site (HTML, CSS, JS) with no build step and no server, so it's free to host.

| Content | File |
| --- | --- |
| Projects | `data/projects.json` |
| Profile (name, photo, about, skills, tools) | `data/site.json` |
| Resume | `data/resume.json` |
| Uploaded images, videos, files | `assets/uploads/` |

You normally never touch these files — the admin panel edits them for you.

---

## 1. Preview on your Mac

The site loads its content with JavaScript, so open it through a small local server
(double-clicking `index.html` won't load the projects).

```bash
cd ~/Documents/"Chandan portfolio site"
python3 -m http.server 5500
```

- Site: http://localhost:5500
- Admin: http://localhost:5500/admin

Press `Ctrl + C` in Terminal to stop. (In Cursor/VS Code you can also use the *Live Server* extension.)

### Edit locally (before the site is online)
Open http://localhost:5500/admin in **Chrome or Edge** → **Choose site folder** → pick
`Documents/Chandan portfolio site`. Everything you save is written straight into that folder.

---

## 2. Put it online — GitHub Pages (free)

1. Create a free account at https://github.com.
2. **New repository** → name it exactly **`<your-username>.github.io`** → **Public** → Create.
3. Install **GitHub Desktop** (https://desktop.github.com) and sign in.
   *File → Add local repository* → choose `Documents/Chandan portfolio site` → **Publish repository**
   (untick "Keep this code private"), and pick the repository you just created.
4. On github.com, open the repository → **Settings → Pages** → Source: *Deploy from a branch*,
   Branch: `main`, Folder: `/ (root)` → **Save**.
5. About a minute later your site is live at `https://<your-username>.github.io`.

## 3. Use the admin panel on the live site

1. Create an access token (one time):
   https://github.com/settings/personal-access-tokens/new
   - **Repository access:** Only select repositories → your portfolio repository
   - **Permissions → Repository permissions → Contents:** *Read and write*
   - Expiration: up to 1 year → **Generate token** → copy it.
2. Open `https://<your-username>.github.io/admin`, paste the token, tick
   *Remember me on this computer*, and click **Connect & edit**.
3. Edit, then **Save** (or Ctrl/Cmd + S). Each save is one commit; the live site updates in about a minute.

The token only works for this one repository and is stored only in your own browser.
Treat it like a password: don't share it, and use *Settings → Forget token* on shared computers.
The admin page itself is public but useless without your token.

### Adding a project
1. **Projects → New project.**
2. Right panel: upload a **cover** (auto-cropped to 4:3), fill in title, summary, category
   (becomes a filter chip), client, role, year, tools, tags.
3. Build the canvas like Behance: **Image**, **Text**, **Photo grid**, **Video / embed**
   (YouTube, Vimeo, Loom, Figma links, or upload an MP4), **Spacer**. Drag images straight onto the
   canvas. Hover a block to move it, duplicate it or delete it; use the **+** between blocks to insert.
4. Optional: pick a **canvas background** colour.
5. Keep it as **Draft** while you work; switch to **Published** when ready. **Preview** shows unsaved changes.
6. **Save.** Drag project cards on the Projects screen to change their order.

Images are resized for the web automatically (covers 1600 × 1200, content images up to 2400 px wide).

### Editing your resume
**Resume** in the admin: header, summary, expertise groups, experience (one achievement per line),
education, certifications, key projects, languages. The live preview updates as you type, and
**Test PDF / Test Word** download the exact files visitors will get. If you'd rather share a
specially designed file, upload your own PDF/Word under *Download files*.

---

## 4. Custom domain (optional, ~₹800–1,500/year)

1. Buy a domain (e.g. `chandankumar.design`) from GoDaddy, Hostinger, Namecheap or Cloudflare.
2. Repository → **Settings → Pages → Custom domain** → enter it → Save.
3. At your domain provider, add DNS records:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www` → `<your-username>.github.io`
4. Wait for DNS (minutes to a few hours), then tick **Enforce HTTPS**.

The admin keeps working at `https://yourdomain/admin` (it still saves to the GitHub repository).

## Other hosting

**Netlify / Cloudflare Pages (free):** connect the same GitHub repo, leave the build command empty,
output directory `/`. The admin works the same way because it saves to GitHub.

**cPanel shared hosting (Hostinger, GoDaddy):** upload the folder contents to `public_html`. The site works,
but the admin's GitHub saving won't reach that server — edit locally with *Choose site folder* and re-upload
`data/` and `assets/uploads/`, or use the host's Git deployment.

## What's in the folder

```
index.html              the site
404.html                page shown for broken links
admin/                  the admin panel
assets/css, assets/js   site styles and scripts
assets/vendor/          PDF, Word, drag-and-drop and text-formatting libraries (bundled, no CDN needed)
assets/uploads/         your images and files
data/                   your content (projects, profile, resume)
```
