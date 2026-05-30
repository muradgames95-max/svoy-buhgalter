import { NextResponse } from 'next/server'

function extractRate(charCode: string, xml: string): number | null {
  // Matches the entire <Valute> block containing the given CharCode, then extracts <Value>
  const regex = new RegExp(
    `<Valute[^>]*>[\\s\\S]*?<CharCode>${charCode}<\\/CharCode>[\\s\\S]*?<Value>([\\d,]+)<\\/Value>[\\s\\S]*?<\\/Valute>`,
  )
  const match = xml.match(regex)
  if (!match) return null
  return parseFloat(match[1].replace(',', '.'))
}

export async function GET() {
  try {
    const res = await fetch('https://www.cbr.ru/scripts/XML_daily.asp', {
      next: { revalidate: 3600 }, // cache 1 hour on Vercel edge
    })
    if (!res.ok) throw new Error(`CBR responded ${res.status}`)

    const text = await res.text()

    const usd = extractRate('USD', text)
    const eur = extractRate('EUR', text)

    if (!usd || !eur) throw new Error('Failed to parse CBR XML')

    return NextResponse.json({
      usd: Math.round(usd * 100) / 100,
      eur: Math.round(eur * 100) / 100,
      source: 'cbr',
      date: new Date().toLocaleDateString('ru-RU'),
    })
  } catch {
    // Return last known approximate rates so UI doesn't break
    return NextResponse.json(
      { usd: 80, eur: 87, source: 'fallback', date: null },
      { status: 200 },
    )
  }
}
