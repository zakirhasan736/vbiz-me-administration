import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'This command endpoint has moved to the secured backend assistant service.' },
    { status: 410 }
  )
}
