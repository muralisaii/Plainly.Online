import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = Number(searchParams.get("from") || 0)
  const to = Number(searchParams.get("to") || 9)
  const lastDate = searchParams.get("lastDate") || new Date().toISOString()

const { data, error } = await supabase
  .from("articles")
  .select(`
    id,
    title,
    slug,
    image_url,
    published_at,
    source,
    categories:category_id (
      name,
      slug
    )
  `)
  .lt("published_at", lastDate)
  .order("published_at", { ascending: false })
  .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}