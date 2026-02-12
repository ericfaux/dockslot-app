import { NextResponse } from 'next/server'

// Stub: return empty tags until the tags database migration is applied
export async function GET() {
  return NextResponse.json({ tags: [] })
}
