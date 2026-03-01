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
        // 1️⃣ Fetch categories once
        const { data: categories } = await supabaseAdmin
            .from("categories")
            .select("id, slug")

        if (!categories) {
            throw new Error("Categories not found")
        }

        // 2️⃣ Define feeds
        const feeds = [
            { name: "BBC", url: "https://feeds.bbci.co.uk/news/rss.xml" },
            { name: "Reuters", url: "https://feeds.reuters.com/reuters/topNews" },
            { name: "NYT", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" }
        ]

        let allRows: any[] = []

        // 3️⃣ Fetch each feed safely
        for (const feed of feeds) {
            try {
                const articles = await fetchRSS(feed.url)

                const rows = articles.slice(0, 10).map((article) => {
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

                allRows.push(...rows)

            } catch (err) {
                console.error(`Feed failed: ${feed.name}`, err)
                continue
            }
        }

        // 4️⃣ Batch upsert all feeds together
        const { error } = await supabaseAdmin
            .from("articles")
            .upsert(allRows, { onConflict: "source_url" })

        if (error) {
            throw error
        }

        return NextResponse.json({ message: "RSS fetch complete" })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: "Failed" },
            { status: 500 }
        )
    }
}