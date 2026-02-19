import { NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    seedData();
    const offices = db.prepare(`
      SELECT id, name, type, parent_id as parentId, color, github_org as githubOrg,
             telegram_group_id as telegramGroupId
      FROM offices ORDER BY type, name
    `).all();
    return NextResponse.json({ offices });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch offices', detail: String(error) },
      { status: 500 }
    );
  }
}
