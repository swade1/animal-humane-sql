import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://new.shelterluv.com/api/v3/available-animals/1255', {
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { ids: [], error: `Shelterluv request failed with status ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const animals = Array.isArray(data?.animals) ? data.animals : [];

    const ids = animals
      .filter((animal: Record<string, unknown>) => {
        const species = typeof animal.species === 'string' ? animal.species : '';
        return species.toLowerCase() === 'dog';
      })
      .map((animal: Record<string, unknown>) => {
        const rawId = animal.nid ?? animal.id;
        return Number(rawId);
      })
      .filter((id: number) => Number.isFinite(id));

    return NextResponse.json({ ids });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ids: [], error: message }, { status: 500 });
  }
}
