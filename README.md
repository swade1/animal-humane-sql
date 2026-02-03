This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Animal Data Scraper Pipeline

The animal data pipeline is automated and runs on a schedule via GitHub Actions. The workflow is defined in `.github/workflows/scraper-schedule.yml` and performs the following steps:

1. **Fetch animal data** from the Animal Humane API endpoints.
2. **Enrich and upsert** the data into the Supabase `dogs` table.
3. **Check for adoptions** and update the status of animals in Supabase.

This is orchestrated by the script:

```bash
npx tsx src/utils/run-scraper-pipeline.ts
```

You can run this pipeline locally (with the correct environment variables set) or let it run automatically on the GitHub schedule.

**Environment variables required:**
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

See `.env.local.example` for details.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Jan 22, 3:16pm
Jan 26, 1:42pm
Jan 26, 1:44pm
Jan 26, 1:46pm
Feb 1, 9:23am
Feb 1, 9:27am
Feb 2, 2:08pm
