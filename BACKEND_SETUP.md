# Backend Setup: MongoDB Atlas and Cloudinary

This guide configures the blog API used by the React/Vite site. MongoDB stores blog records, and Cloudinary stores uploaded blog images. Credentials belong only in the Node.js API environment; do not add them to `VITE_*` variables or frontend code.

## Required Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes for persistent blogs | MongoDB Atlas connection string for the application database user. |
| `MONGODB_DB_NAME` | No | Database name. Defaults to `rahmat_advocate`. |
| `CLOUDINARY_CLOUD_NAME` | Yes for persistent images | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Yes for persistent images | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Yes for persistent images | Cloudinary API secret. Keep this private. |
| `BLOG_ADMIN_USERNAME` | Yes for admin login | Admin login name; compared case-insensitively. |
| `BLOG_ADMIN_PASSWORD_HASH` | Yes for admin login | bcrypt hash of the admin password, not the plaintext password. |

If `MONGODB_URI` is absent, blog operations use a temporary in-memory demo store. If any Cloudinary credential is absent, image uploads return the supplied data URL instead of storing the image in Cloudinary. These fallbacks are for local testing only; data in process memory is not durable.

## MongoDB Atlas

1. Create or select an Atlas project and cluster.
2. In **Database Access**, create a database user for this app. Grant the minimum required role: `readWrite` on the database named `rahmat_advocate` (or the value you plan to use for `MONGODB_DB_NAME`). This is separate from your Atlas website login.
3. In **Network Access**, allow the IP address of your development machine. For Vercel, use the outbound IP restrictions or static egress option available to your plan where possible. Avoid leaving broad network access enabled longer than necessary.
4. Choose **Connect > Drivers**, select Node.js, and copy the connection string. Replace the username, password, and database placeholder. URL-encode special characters in the database username/password.
5. The app creates and uses the `blogs` collection in the selected database when the first request is made; no schema migration is needed.

Example URI format (replace all placeholders; do not commit real credentials):

```text
mongodb+srv://<db-user>:<url-encoded-password>@<cluster-host>/rahmat_advocate?retryWrites=true&w=majority
```

## Cloudinary

1. Create or select a Cloudinary account.
2. Open the Cloudinary **API Keys** page and copy the cloud name, API key, and API secret.
3. The server uses the Cloudinary Node SDK with signed uploads. Images are placed under the `rahmat-advocate/blog` folder. The server stores the returned secure URL and public ID with the blog record.
4. Keep `CLOUDINARY_API_SECRET` server-side. Never prefix it with `VITE_`, put it in browser code, or expose it in a public repository.

## Local Development on Windows PowerShell

The local API loads variables from the root `.env` file when `npm run dev` starts. Fill in the blank values in `.env`; it is ignored by Git and must not be committed.

The `.env` file contains comments beside each setting describing which dashboard value to enter. Do not prefix backend variables with `VITE_`; Vite-prefixed values can be exposed to browser code.

To make a bcrypt hash locally without putting the plaintext password in the command itself, enter it at the PowerShell prompt and pass it through a temporary environment variable:

```powershell
$env:ADMIN_PASSWORD_FOR_HASH = Read-Host 'Enter the admin password'
node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash(process.env.ADMIN_PASSWORD_FOR_HASH, 12))"
Remove-Item Env:ADMIN_PASSWORD_FOR_HASH
```

Copy the generated hash into `BLOG_ADMIN_PASSWORD_HASH`. Do not use the example placeholders as real credentials. Environment variables set this way apply only to the current PowerShell session.

The app starts the local API at `http://localhost:3001` and Vite at its displayed development URL. Restart `npm run dev` after changing environment variables.

## Vercel Deployment

1. Open the project in Vercel and go to **Settings > Environment Variables**.
2. Add all seven variables listed above to the environments where the site is deployed (Production, and Preview/Development as needed). Use the exact names; do not add a `VITE_` prefix.
3. Ensure the Atlas network access configuration permits connections from the Vercel deployment.
4. Redeploy after changing environment variables; existing deployments do not automatically receive updated values.
5. Verify the deployment using the checks below. Never print secrets in deployment logs or include them in client-side configuration.

## API Checks

The public blog endpoints are:

- `GET /api/blogs` returns published blogs.
- `GET /api/blogs/<slug>` returns one published blog.

Admin endpoints require a valid login session:

- `POST /api/auth/login`
- `GET /api/admin/blogs` and `POST /api/admin/blogs`
- `GET /api/admin/blogs/<id>`, `PUT /api/admin/blogs/<id>`, and `DELETE /api/admin/blogs/<id>`
- `POST /api/admin/upload`

Check that the public list endpoint returns JSON and that an admin login returns `200` with `{"authenticated":true,...}`. Then create a test blog and confirm its record appears in Atlas under the selected database's `blogs` collection and its image appears in Cloudinary's `rahmat-advocate/blog` folder.

## Troubleshooting

- **MongoDB server selection / timeout:** check the URI, URL-encoded database credentials, Atlas user permissions, and Atlas Network Access rules.
- **MongoDB data appears to disappear:** verify `MONGODB_URI` is set in the API environment. Without it, the API uses its in-memory demo store.
- **Cloudinary upload fails:** verify all three Cloudinary variables, check the secret for accidental whitespace, and check the server logs for the Cloudinary SDK error.
- **Admin login returns `500`:** confirm `BLOG_ADMIN_USERNAME` and `BLOG_ADMIN_PASSWORD_HASH` are both configured.
- **Image upload returns `413` on Vercel:** this API sends image data as base64 inside JSON, which is larger than the original image and subject to serverless request-size limits. Use a smaller image; the current editor accepts files up to 5 MB, but deployments may require a lower limit.

## Production Notes

- The current session store uses a process-local `Map`. Serverless instances do not share that memory, so login sessions may not survive requests routed to different instances or cold starts. A durable shared session store must be implemented before relying on this authentication flow in production.
- The editor currently submits rich-text HTML, which the public article page renders as HTML. Only trusted administrators should have access; sanitize content server-side before rendering if content authorship or access expands.
- Keep backups and use separate least-privilege credentials for development and production.