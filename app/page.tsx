import { supabase } from "@/lib/supabase"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 300 // 5 minutes
type Article = {
  id: string
  title: string
  slug: string
  description: string | null
  image_url: string | null
  trending_score: number
  categories: { name: string; slug: string }[] | null
}

export default async function Home() {
  const baseQuery = `
    id,
    title,
    slug,
    description,
    image_url,
    trending_score,
    categories:category_id (
      name,
      slug
    )
  `

  // 🔥 Breaking (Top 1)
  const { data: breaking } = await supabase
    .from("articles")
    .select(baseQuery)
    .order("trending_score", { ascending: false })
    .limit(1)

  // 📈 Trending (Next 4)
  const { data: trending } = await supabase
    .from("articles")
    .select(baseQuery)
    .order("trending_score", { ascending: false })
    .range(1, 4)

  // 📰 More News (Next 10)
  const { data: more } = await supabase
    .from("articles")
    .select(baseQuery)
    .order("trending_score", { ascending: false })
    .range(5, 14)

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-12">
      
      {/* Breaking Section */}
      {breaking?.[0] && (
        <section>
          <h2 className="text-2xl font-bold mb-4">🔥 Breaking</h2>
          <Link href={`/news/${breaking[0].slug}`}>
            <h1 className="text-3xl font-bold">
              {breaking[0].title}
            </h1>
          </Link>
          <p className="text-gray-500 mt-2">
            {breaking[0].description}
          </p>
        </section>
      )}

      {/* Trending Section */}
      {trending?.length ? (
        <section>
          <h2 className="text-2xl font-bold mb-4">📈 Trending</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {trending.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`}>
                <div className="border p-4 rounded hover:shadow">
                  <h3 className="font-semibold">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* More News */}
      {more?.length ? (
        <section>
          <h2 className="text-2xl font-bold mb-4">📰 More News</h2>
          {more.map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`}>
              <div className="border-b py-3">
                {article.title}
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  )
}