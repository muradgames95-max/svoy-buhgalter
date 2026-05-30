import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { inn, token } = await req.json() as { inn: string; token: string }
  if (!inn || !token) return NextResponse.json({ ok: false, error: 'Missing credentials' }, { status: 400 })

  try {
    const res = await fetch('https://lknpd.nalog.ru/api/v1/taxpayer', {
      headers: {
        Authorization: `Bearer ${token}`,
        Inn: inn,
      },
      signal: AbortSignal.timeout(10000),
    })
    return NextResponse.json({ ok: res.ok })
  } catch (e) {
    console.error('[nalog/test] fetch failed', e)
    return NextResponse.json({ ok: false })
  }
}
