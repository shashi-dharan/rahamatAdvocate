# Sanity CMS Setup

The public React/Vite site reads published blog posts from Sanity's public read API and CDN. Sanity Studio is a separate hosted editorial interface. Publishing content does not require a GitHub commit or a Vercel deployment.

## 1. Create the Sanity project

1. Create a Sanity account using an address controlled by the site owner and create a new project for Rahmat Advocate.
2. Choose a project name such as `Rahmat Advocate` and the `production` dataset.
3. In the Sanity project settings, copy the Project ID. Do not invent or reuse a placeholder as a real ID.
4. Configure the `production` dataset for public read access. The website intentionally uses anonymous, read-only API/CDN requests; it does not need a read token.
5. In the project's API/CORS settings, allow `https://www.rahmatadvocate.com`, `https://rahmatadvocate.com`, and `http://localhost:5173` without credential access.

## 2. Configure the website

Copy `.env.example` to `.env.local` at the repository root and replace the placeholders:

```dotenv
VITE_SANITY_PROJECT_ID=the_real_project_id
VITE_SANITY_DATASET=production
```

These values are public identifiers, not secrets. The `.env.local` file is ignored by Git. Restart Vite after changing it with `npm run dev`.

The Studio has its own configuration. Copy `sanity/.env.example` to `sanity/.env` and enter the same project and dataset:

```dotenv
SANITY_STUDIO_PROJECT_ID=the_real_project_id
SANITY_STUDIO_DATASET=production
```

## 3. Run Sanity Studio

From the repository root:

```powershell
cd sanity
npm install
npm run dev
```

Open the local URL printed by Sanity CLI and sign in with the Sanity account that owns or is a member of this project. The Studio schema is in `sanity/schemas/blogPost.js`. Drafts and published documents use Sanity's native workflow; drafts are excluded by all public GROQ queries.

## 4. Deploy Studio

Choose a unique Studio hostname when prompted, then run:

```powershell
cd sanity
npm run deploy
```

Sanity will provide a hosted Studio URL, typically `https://your-chosen-name.sanity.studio`. Share that URL with the client, not the source repository or deployment accounts. Studio hosting is separate from the Vercel website.

## 5. Invite the client

1. In Sanity project settings, open project members and invite the client's own email address.
2. Grant the built-in **Editor** role (or the narrowest available role that permits creating, editing, publishing, and unpublishing content). Do not grant Administrator or Developer access.
3. The client accepts the Sanity invitation and signs in at the hosted Studio URL with their own Sanity account.

The client does not need GitHub, Vercel, source-code access, an API token, or the owner's Sanity credentials. Sanity organization/project roles determine content permissions; publishing does not expose project settings through the site.

## 6. Write and publish

In Studio, choose **Blog post** and create a document:

1. Enter the required title, excerpt, featured image, and category. Generate or edit the slug from the title.
2. Enter author, publish date, and read time when applicable. The author default is `Pankaj Jaykrishhna Dixit`.
3. Write in the Article editor. It supports paragraphs, headings, bold, italic, links, numbered/bulleted lists, quotes, and inline images with alt text. No Markdown is required.
4. Optionally set SEO meta title, meta description, and social sharing image. The page title/excerpt/featured image are the fallbacks.
5. Use **Save** to keep a draft. Drafts are not returned by the public website or sitemap.
6. Use **Publish** when ready. To remove an article from public view, use Sanity's unpublish action; it remains editable as a draft. Delete it only when permanent removal is intended.

## 7. Migrate the existing three articles

The original Markdown and local images are intentionally retained in `src/content/blog` and `public/images/blog` until migration has been verified. The import script converts the existing headings, paragraphs, lists, metadata, and featured images to Sanity documents/assets. It does not modify or delete the source files.

Create a temporary Sanity API token with dataset write permission in the Sanity project settings. Never use this token in the browser, a `VITE_*` variable, Vercel, or a committed file. From the repository root, set the values in the current PowerShell session and run:

```powershell
$env:VITE_SANITY_PROJECT_ID = "the_real_project_id"
$env:VITE_SANITY_DATASET = "production"
$env:SANITY_API_TOKEN = "paste_the_temporary_write_token_here"
npm run migrate:sanity
Remove-Item Env:SANITY_API_TOKEN
```

The script uses stable document IDs, so rerunning it replaces the imported entries and reuses each existing featured image asset when available. Check all three articles and images in Studio, then publish any entry that should be public. Keep the local source until the migration is confirmed. Revoke the temporary token after import.

## 8. Configure Vercel

In the Vercel project's Environment Variables, add these non-secret values for Production (and Preview if preview deployments should read the dataset):

- `VITE_SANITY_PROJECT_ID`: the actual Sanity Project ID.
- `VITE_SANITY_DATASET`: `production` (or the actual public dataset name).

Redeploy once after adding/changing these variables so the frontend bundle receives them. Do not add `SANITY_API_TOKEN`, GitHub OAuth values, or any write credential. Subsequent Sanity publishing does not trigger or require a Vercel deployment.

The Vercel function serves `/sitemap.xml` from the current published Sanity slugs. Direct requests to `/our-blog/:slug` receive Sanity-derived title, description, canonical, Open Graph/Twitter metadata, and Article JSON-LD in the initial HTML for crawlers; React Router continues to render the existing client-side design.

## 9. Content delivery and caching

Published blog queries use Sanity's CDN. The browser's in-memory query cache is one minute; Vercel's HTML and sitemap responses are cached for two minutes with stale-while-revalidate. New posts or unpublishing changes should normally appear within a few minutes, without a React change or deployment. Sanity CDN propagation can add a short delay.

The build-generated `public/sitemap.xml` is only a fallback containing the existing static routes. On Vercel, the explicit `/sitemap.xml` rewrite points to the runtime function, which adds published posts and never includes drafts. The existing robots.txt sitemap location remains unchanged. For local Vercel-function testing, use `vercel dev`; plain `vite dev` runs the React frontend but not `/api` functions.

## 10. Troubleshooting

- **Studio says project ID or dataset is missing:** verify `sanity/.env` variable names and restart Sanity CLI.
- **Studio cannot connect:** check the project ID, dataset, Sanity membership, and account login.
- **The public blog is empty:** confirm the project/dataset values in Vercel, that the dataset permits public reads, and that documents are published with a slug.
- **Images are missing:** ensure the featured image upload completed and inspect the referenced Sanity asset in Studio.
- **A draft appears missing:** this is expected on the public site; publish it to make it visible.
- **A new post is not visible yet:** allow a few minutes for CDN and Vercel cache expiry, then refresh.
- **Sitemap has only static routes:** check Vercel function logs and the two public Sanity variables; the function retains core site URLs if Sanity is temporarily unavailable.
- **Import fails with authorization error:** create a temporary token with write access to the selected dataset and set it only in the local terminal environment.

## Project files

- `src/lib/sanity.js`: public client, published-only GROQ queries, one-minute query cache, and image URL builder.
- `sanity/`: independently installable and deployable Sanity Studio.
- `scripts/migrate-blogs-to-sanity.mjs`: one-time legacy content and image import.
- `api/blog-page.js`: crawler-friendly initial HTML for article URLs.
- `api/sitemap.js`: runtime sitemap containing published posts only.