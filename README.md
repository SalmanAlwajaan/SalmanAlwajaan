# Salman Alwajaan — Personal Site

A static, build-free personal profile page (link tree). Plain HTML, CSS, and
vanilla JavaScript — no framework, no build step. Deploys to GitHub Pages
with zero configuration.

## Structure

```
/
├─ index.html
├─ styles/
│  └─ main.css
├─ scripts/
│  └─ main.js
├─ data/
│  ├─ projects.json
│  └─ articles.json
├─ assets/
│  ├─ photo.jpg        (placeholder — replace with your real photo)
│  ├─ CV.pdf            (placeholder — replace with your real CV)
│  ├─ favicon.svg / favicon.png
│  └─ og-image.jpg      (social-share preview image)
└─ README.md
```

## Running locally

Fetching the JSON files requires an actual HTTP server — opening
`index.html` directly from `file://` will not work (browsers block `fetch`
on local files). From the project folder, run:

```bash
python3 -m http.server
```

Then open `http://localhost:8000` in your browser.

## Updating your content (no code changes needed)

### Add or edit a project
Open `data/projects.json` and add an entry to the array:

```json
{
  "title": "Your project title",
  "description": "One or two sentences describing the project.",
  "url": "https://link-to-the-project-or-repo",
  "image": "assets/your-thumbnail.jpg"
}
```

`image` can point to a file in `assets/` or to any image URL. Save the file
and refresh the page — no rebuild needed.

### Add or edit an article
Open `data/articles.json` and add an entry:

```json
{
  "title": "Article title",
  "source": "Publication name",
  "date": "2026-05-01",
  "url": "https://link-to-the-article"
}
```

### Add a new image
Drop the image file into `assets/` (e.g. `assets/wind-farm-thumb.jpg`), then
reference it by that path in `projects.json`. Keep images reasonably sized
(under ~300 KB) so the page stays fast.

### Replace your photo or CV
Save your real files as `assets/photo.jpg` and `assets/CV.pdf`, overwriting
the placeholders. Keep the exact filenames so nothing in `index.html` needs
to change.

### Update contact links
LinkedIn, GitHub, and email links live directly in `index.html` (hero
buttons and footer) — search for `linkedin.com`, `github.com`, and
`mailto:` to update them.

## Uploading more content later

Any time you want to add a project, an article, or an image:
1. Edit the relevant JSON file (or add a new image to `assets/`).
2. Commit and push the change (or upload via the GitHub web UI — see below).
3. GitHub Pages redeploys automatically within a minute or two.

## Deploying / updating via the GitHub website (no git required)

1. Go to your repository on github.com.
2. Click **Add file → Upload files**.
3. Drag in the changed file(s) (e.g. `data/projects.json`, or a new file in
   `assets/`) — make sure the folder structure is preserved (GitHub keeps
   the path if you drag a whole folder, or you can navigate into the
   subfolder first and upload there).
4. Write a short commit message and click **Commit changes**.
5. Wait ~1-2 minutes for GitHub Pages to redeploy, then refresh the live
   site.

## Accessibility & performance notes

- Semantic HTML throughout (`header`, `main`, `section`, `footer`, proper
  heading order).
- All interactive elements are keyboard-reachable with visible focus
  states.
- Color contrast targets WCAG AA in both light and dark mode.
- Respects `prefers-color-scheme` by default; manual toggle persists via
  `localStorage`.
- Respects `prefers-reduced-motion` — entrance animations are skipped
  entirely for users who request reduced motion.
- No external font or script requests — everything needed to render the
  page ships in this repository.
