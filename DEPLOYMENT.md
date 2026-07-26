# Deployment

Frontend on **Cloudflare Pages**, Express API on **Render**, both driven from
GitHub Actions.

## The ordering problem, first

These two settings depend on each other:

- The web build needs `VITE_API_URL` (the Render origin), because Vite compiles
  the API address **into the bundle** at build time.
- The API needs `WEB_ORIGIN` (the Pages origin) to allow the browser through CORS.

Neither URL exists until its service is created, so do it in this order and the
circle breaks cleanly:

1. Deploy the API. `WEB_ORIGIN` stays blank; it boots fine without it.
2. Deploy the web app, pointing at the API URL from step 1.
3. Set `WEB_ORIGIN` on Render to the Pages URL from step 2.

Step 3 is not optional. Skip it and the site loads but every API call fails with
a CORS error in the console.

---

## 1. API on Render

Push this repo, then in the Render dashboard choose **New → Blueprint** and
select it. Render reads `render.yaml` and creates a service called `eileen-api`.

It will prompt for the values marked `sync: false`. **All of them are optional —
leave every one blank and the app still works**, generating real images through
Pollinations, which needs no key.

| Variable         | Enter                                                        |
| ---------------- | ------------------------------------------------------------ |
| `WEB_ORIGIN`     | Leave blank for now. Filled in at step 3.                    |
| `GEMINI_API_KEY` | Recommended. Free, no card: https://aistudio.google.com/apikey |
| `GROQ_API_KEY`   | Optional, chat only: https://console.groq.com/keys            |
| `OPENAI_API_KEY` | Optional and **paid**. Billed per image.                      |
| `IMAGE_PROVIDER` | Leave blank to auto-detect from the keys above.                |
| `CHAT_PROVIDER`  | Leave blank to auto-detect.                                   |

Adding `GEMINI_API_KEY` is the one upgrade worth making: it switches on true
conversational image editing instead of re-rendering, and powers the chat layer
with the same key.

When it goes live, confirm the providers it picked:

```bash
curl https://YOUR-API.onrender.com/api/health
```

Copy that base URL — you need it next.

## 2. GitHub secrets and variables

Get a Cloudflare API token at **My Profile → API Tokens → Create Token**, using
the **Edit Cloudflare Workers** template or a custom token with
**Account → Cloudflare Pages → Edit**. Your Account ID is on the right-hand side
of any domain's overview page.

```bash
# Secrets (masked in logs)
gh secret set CLOUDFLARE_API_TOKEN      # paste the token
gh secret set CLOUDFLARE_ACCOUNT_ID     # paste the account id

# Variable, not a secret: it is compiled into the public JS bundle anyway, and
# masking it would only make build logs harder to read. No trailing slash.
gh variable set VITE_API_URL --body https://YOUR-API.onrender.com
```

## 3. Deploy the web app

Pushing to `main` triggers it. To run it without a code change:

```bash
gh workflow run "Deploy web"
gh run watch
```

The workflow creates the Pages project on first run, so there is no dashboard
setup. It fails fast with an explicit message if `VITE_API_URL` is missing,
rather than shipping a build whose API calls all 404.

The deployment URL is printed in the run summary — typically
`https://eileen-gallery.pages.dev`.

## 4. Close the CORS loop

Back on Render, set `WEB_ORIGIN` to that Pages URL and save. The service
restarts automatically.

`WEB_ORIGIN` accepts a comma-separated list, which is what you want once a custom
domain exists:

```
https://eileen-gallery.pages.dev,https://eileen.art
```

Branch and commit previews on `*.pages.dev` are allowed automatically, so you do
not need to list them. Set `ALLOW_PAGES_PREVIEWS=false` to turn that off.

---

## Where each key lives

| Key                    | Lives in            | Why                                  |
| ---------------------- | ------------------- | ------------------------------------ |
| `GEMINI_API_KEY`       | Render dashboard    | Server-side only; never reaches the browser |
| `GROQ_API_KEY`         | Render dashboard    | Same                                 |
| `OPENAI_API_KEY`       | Render dashboard    | Same                                 |
| `WEB_ORIGIN`           | Render dashboard    | Server-side CORS policy              |
| `CLOUDFLARE_API_TOKEN` | GitHub secret       | Only CI needs it                     |
| `CLOUDFLARE_ACCOUNT_ID`| GitHub secret       | Only CI needs it                     |
| `VITE_API_URL`         | GitHub **variable** | Public, compiled into the bundle     |

No key belongs in the frontend. Anything Vite inlines is readable by anyone who
opens devtools, so image and chat credentials stay on Render.

## Pipelines

`ci.yml` typechecks and builds both workspaces on every branch and PR.

`deploy-web.yml` runs on pushes to `main`, verifies `VITE_API_URL` is set,
typechecks, builds with the API origin inlined, and deploys to Pages.

The API deploys through Render's own GitHub integration
(`autoDeployTrigger: commit` in `render.yaml`), so no workflow pushes it. Note
this means the API deploys even if CI fails. To gate it, set the service to
**No auto-deploy** in Render, create a Deploy Hook, store it as
`RENDER_DEPLOY_HOOK_URL`, and `curl` it from a job that runs after `check`.

## Two things that will bite you

**Render's free tier sleeps after ~15 minutes idle**, and the next request pays a
cold start of roughly 50 seconds. On top of image generation that reads as a
hung page. Either warm it with an uptime pinger, upgrade the plan, or set
expectations when demoing.

**Sessions and orders are in-memory.** They live in `Map`s in
`apps/api/src/index.ts`, so every deploy, restart, and free-tier sleep wipes
them — a customer mid-conversation loses their painting, and placed orders
disappear. Fine for a proof of concept, unacceptable once real money moves. Move
them to Postgres before launch; Render offers a managed instance.
