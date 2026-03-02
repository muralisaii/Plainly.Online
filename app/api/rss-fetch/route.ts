import { NextResponse } from "next/server"
import { fetchRSS } from "@/lib/rss"
import { supabaseAdmin } from "@/lib/supabase-admin"

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100)
}

function calculateTrendingScore(publishedAt: Date) {
  const hoursOld =
    (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60)

  return Math.max(1, 100 - Math.floor(hoursOld))
}

function mapCategory(title: string, categories: any[]) {
  const lower = title.toLowerCase()

  if (lower.includes("india")) {
    return categories.find(c => c.slug === "india")?.id
  }

  if (lower.includes("tech") || lower.includes("ai")) {
    return categories.find(c => c.slug === "technology")?.id
  }

  return categories.find(c => c.slug === "world")?.id
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (authHeader !== `Bearer ${process.env.RSS_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    // 1️⃣ Fetch categories
    const { data: categories, error: categoryError } =
      await supabaseAdmin
        .from("categories")
        .select("id, slug")

    if (categoryError || !categories) {
      throw new Error("Failed to fetch categories")
    }

    // 2️⃣ Define feeds
    const feeds = [
      { name: "BBC", url: "https://feeds.bbci.co.uk/news/rss.xml" },
      { name: "Reuters", url: "https://feeds.reuters.com/reuters/topNews" },
      { name: "NYT", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" }
    ]

    let allRows: any[] = []
    let totalProcessed = 0

    // 3️⃣ Fetch feeds safely
    for (const feed of feeds) {
      try {
        const articles = await fetchRSS(feed.url)

        if (!articles || articles.length === 0) {
          console.warn(`No articles from ${feed.name}`)
          continue
        }

        const rows = articles
          .slice(0, 10)
          .filter(a => a.title && a.link) // Skip bad entries
          .map((article) => {
            const slug = generateSlug(article.title)

            const categoryId = mapCategory(
              article.title,
              categories
            )

            const trendingScore = calculateTrendingScore(
              article.published_at
            )

            return {
              title: article.title,
              slug,
              description: article.description,
              content: article.content,
              image_url: null,
              source: feed.name,
              source_url: article.link,
              published_at: article.published_at,
              trending_score: trendingScore,
              category_id: categoryId,
            }
          })

        totalProcessed += rows.length
        allRows.push(...rows)

      } catch (err) {
        console.error(`Feed failed: ${feed.name}`, err)
        continue
      }
    }

    if (allRows.length === 0) {
      console.warn("No rows prepared for upsert")
      return NextResponse.json({
        message: "No new articles found",
      })
    }

    // 4️⃣ Batch upsert
    const { error: upsertError } = await supabaseAdmin
      .from("articles")
      .upsert(allRows, { onConflict: "source_url" })

    if (upsertError) {
      throw upsertError
    }

    // 5️⃣ Retention cleanup (7 days)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)

    const { error: deleteError } = await supabaseAdmin
      .from("articles")
      .delete()
      .lt("published_at", cutoffDate.toISOString())

    if (deleteError) {
      console.error("Cleanup failed:", deleteError)
    }

    console.log(`Processed ${totalProcessed} articles`)

    return NextResponse.json({
      message: "RSS fetch complete",
      processed: totalProcessed
    })

  } catch (error) {
    console.error("RSS ingestion failed:", error)
    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    )
  }
}