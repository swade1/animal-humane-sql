import { NextResponse } from 'next/server';

// GitHub's own `schedule` (cron) trigger is documented as best-effort/lowest-priority
// and can be delayed or silently dropped under load, so scheduling is handled externally
// (cron-job.org calling this route 6x/day) instead. This route just fires a
// `workflow_dispatch` on the existing scraper workflow, which runs immediately.
const GITHUB_OWNER = 'swade1';
const GITHUB_REPO = 'animal-humane-sql';
const WORKFLOW_FILE = 'scraper-schedule.yml';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const secretParam = url.searchParams.get('secret');
  const expected = process.env.CRON_SECRET;
  const authorized = authHeader === `Bearer ${expected}` || (!!expected && secretParam === expected);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Passed through as the 'slot' workflow_dispatch input so the workflow can gate its
  // once-daily unlisted-returns check to a specific run (see scraper-schedule.yml).
  const slot = url.searchParams.get('slot') ?? '';

  const githubToken = process.env.GITHUB_DISPATCH_TOKEN;
  if (!githubToken) {
    return NextResponse.json({ error: 'Missing GITHUB_DISPATCH_TOKEN' }, { status: 500 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'animal-humane-sql-cron',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main', inputs: { slot } }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: 'GitHub dispatch failed', status: res.status, body: text },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
