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
│  ├─ photo.jpg              (placeholder — replace with your real photo)
│  ├─ CV.pdf                  (placeholder — replace with your real CV)
│  ├─ favicon.svg / favicon.png
│  ├─ og-image.jpg            (social-share preview image)
│  └─ projects/
│     ├─ example.pdf          (placeholder PDF used by the in-browser preview)
│     ├─ example-cover.jpg
│     ├─ smart-grid-cover.jpg
│     └─ wind-farm-cover.jpg
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

## How editing works (there is no login on the page, on purpose)

This is a static site — the files that make up the page live in **your**
GitHub repository, and GitHub Pages just serves them as-is. There is no
server-side code here, so a real "log in to edit" box on the page itself
would not actually be secure — anyone could open the browser console and
bypass it. A fake password box would just be theater.

Instead, **GitHub itself is the login.** Only you can change the site,
because only you can sign in to your GitHub account at github.com with your
password (and any two-factor step you have set up) and push changes to this
repository. Visitors to the live site can only view the page — they have no
way to edit anything, because they never get access to your GitHub account.

So: to change anything about the site, go to github.com, sign in, open this
repository, and edit or upload files there. Everything below assumes you are
doing that.

## Updating your content (no code changes needed)

### Add a PDF project (opens as an in-page preview)

1. On github.com, open this repo and navigate into `assets/projects/`.
2. Click **Add file → Upload files** and upload your PDF (e.g.
   `my-report.pdf`).
3. Open `data/projects.json` (click the file, then the pencil/edit icon) and
   add a new entry to the array:

   ```json
   {
     "title": "Your project title",
     "description": "One or two sentences describing the project.",
     "type": "pdf",
     "file": "assets/projects/my-report.pdf",
     "image": "assets/projects/my-report-cover.jpg"
   }
   ```

4. Commit the change. Visitors who click this card will get a reader-style
   preview right on the page — not a download, not a link away.

### Add a link project (opens the URL in a new tab)

Add an entry with `"type": "link"` and a `"url"` instead of a `"file"`:

```json
{
  "title": "Your project title",
  "description": "One or two sentences describing the project.",
  "type": "link",
  "url": "https://your-project-url.com",
  "image": "assets/projects/your-cover.jpg"
}
```

### Change a project's cover image

Upload a new image into `assets/projects/` (any filename), then update the
`"image"` field of that project's entry in `data/projects.json` to point at
the new filename.

### Add or edit an article

Open `data/articles.json` and add a new entry. `body` is a list of
paragraphs — add as many as you like, in the order they should appear:

```json
{
  "title": "What I Learned Commissioning My First Microgrid",
  "date": "2026-06-01",
  "body": [
    "This is the first paragraph. Write it just like a normal paragraph of text.",
    "This is the second paragraph. Each entry in this list becomes its own paragraph on the page, so break your writing up wherever a new paragraph would naturally start.",
    "You can add a third, fourth, or as many paragraphs as you want, just keep adding strings to this list."
  ],
  "source": "Personal notes",
  "url": ""
}
```

`source` and `url` are optional. If you set `url` to a real link, a "read
more" link with that source name appears under the article. Leave both as
empty strings (`""`) if the article only lives on this page.

### Replace your photo or CV

Upload your real files as `assets/photo.jpg` and `assets/CV.pdf` (using
**Add file → Upload files**, choosing the same filename), overwriting the
placeholders. Keep the exact filenames so nothing in `index.html` needs to
change.

### Update contact links

Email, phone, and LinkedIn links live directly in `index.html` (hero,
contact section, and footer) — search for `mailto:`, `tel:`, and
`linkedin.com` to update them in all three places.

## Uploading changes via the GitHub website

1. Go to your repository on github.com and sign in.
2. Click **Add file → Upload files** (for new files) or open an existing
   file and click the pencil icon (to edit it directly in the browser).
3. Make your change, write a short commit message, and click **Commit
   changes**.
4. GitHub Pages redeploys automatically, usually within about a minute.

## Accessibility & performance notes

- Semantic HTML throughout (`nav`, `main`, `section`, `footer`, proper
  heading order, a skip-to-content link).
- All interactive elements — nav links, buttons, project cards, the PDF
  preview dialog — are keyboard-reachable with visible focus states.
- The PDF preview uses the native `<dialog>` element, which handles Escape
  and focus containment automatically.
- Color contrast targets WCAG AA in both the light (default) and dark
  themes.
- Respects `prefers-color-scheme` by default; the manual toggle in the nav
  persists via `localStorage`.
- Respects `prefers-reduced-motion` — entrance animation, scroll reveals,
  hover lift/zoom, and parallax are all skipped for users who request
  reduced motion.
- No external font, icon, or script requests — everything needed to render
  the page ships in this repository (project cover images and articles you
  link out to are the only exceptions).
