import { NextResponse } from 'next/server';

// GitHub's own `schedule` (cron) trigger is documented as best-effort/lowest-priority
// and can be delayed or silently dropped under load. Vercel Cron has none of that
// slack, so it's used here purely as a reliable trigger: it calls this route, which
// fires a `workflow_dispatch` on the existing scraper workflow (which runs immediately,
// unlike `schedule`). The workflow itself is unchanged.
const GITHUB_OWNER = 'swade1';
const GITHUB_REPO = 'animal-humane-sql';
const WORKFLOW_FILE = 'scraper-schedule.yml';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      body: JSON.stringify({ ref: 'main' }),
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
