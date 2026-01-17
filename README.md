# Warmfly III
Warmfly III is an alternate web app for viewing your Firefly III instance. Its purpose is to display your transactions in a way that is friendlier to users who are not so technically inclined.

Some things to consider:
- At the moment, this is for viewing only. No write operations can be made.
- It has no authentication, it must be used locally or deployed behind other security solutions (e.g. Cloudflare tunnels, oauth2-proxy).
- This is developed for personal use.

## Setup

### Using npm

Install dependencies, and then either run `npm run dev` or `npm run build`, followed by `npm run start`.

You need to create a `.env.local` file in the root repository. Use `.env.example` as a template.

### Using Docker

Build the image:

```
docker build . -t warmfly-iii:local
```

Run the image, setting the needed environment variables:

```
docker run --rm -ti -p 3000:3000 -e FIREFLY_III_BASE_URL=... -e FIREFLY_III_API_TOKEN=... warmfly-iii:local
```
