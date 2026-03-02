import { supabase } from "@/lib/supabase"
import Link from "next/link"

export const revalidate = 300

type Article = {
  id: string
  title: string
  slug: string
  description: string | null
  image_url: string | null
  trending_score: number
  categories: { name: string; slug: string }[] | null
}

function getCategoryFallback(slug?: string) {
  switch (slug) {
    case "technology":
      return "/images/tech-default.jpg"
    case "india":
      return "/images/india-default.jpg"
    case "world":
      return "/images/world-default.jpg"
    case "business":
      return "/images/business-default.jpg"
    default:
      return "/images/default-news.jpg"
  }
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

  const { data: breaking } = await supabase
    .from("articles")
    .select(baseQuery)
    .order("trending_score", { ascending: false })
    .limit(1)
    .returns<Article[]>()

  const { data: trending } = await supabase
    .from("articles")
    .select(baseQuery)
    .order("trending_score", { ascending: false })
    .range(1, 4)
    .returns<Article[]>()

  const { data: more } = await supabase
    .from("articles")
    .select(baseQuery)
    .order("trending_score", { ascending: false })
    .range(5, 14)
    .returns<Article[]>()

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-12">

      {/* Breaking */}
      {breaking?.[0] && (
        <section>
          <h2 className="text-2xl font-bold mb-4">🔥 Breaking</h2>

          <Link href={`/news/${breaking[0].slug}`}>
            <div className="cursor-pointer space-y-4">
              <img
                src={
                  breaking[0].image_url ||
                  getCategoryFallback(breaking[0].categories?.[0]?.slug)
                }
                alt={breaking[0].title}
                className="w-full h-96 object-cover rounded-lg"
              />

              <h1 className="text-4xl font-bold">
                {breaking[0].title}
              </h1>

              <p className="text-gray-600">
                {breaking[0].description}
              </p>
            </div>
          </Link>
        </section>
      )}

      {/* Trending */}
      {trending?.length ? (
        <section>
          <h2 className="text-2xl font-bold mb-4">📈 Trending</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trending.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`}>
                <div className="border rounded-lg overflow-hidden hover:shadow transition cursor-pointer">

                  <img
                    src={
                      article.image_url ||
                      getCategoryFallback(article.categories?.[0]?.slug)
                    }
                    alt={article.title}
                    className="w-full h-40 object-cover"
                  />

                  <div className="p-4">
                    <p className="text-sm text-gray-500 mb-1">
                      {article.categories?.[0]?.name}
                    </p>

                    <h3 className="font-semibold line-clamp-2">
                      {article.title}
                    </h3>
                  </div>

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

          <div className="space-y-6">
            {more.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`}>
                <div className="flex gap-4 items-start cursor-pointer hover:bg-gray-50 p-3 rounded">

                  <img
                    src={
                      article.image_url ||
                      getCategoryFallback(article.categories?.[0]?.slug)
                    }
                    alt={article.title}
                    className="w-28 h-20 object-cover rounded"
                  />

                  <div>
                    <p className="text-sm text-gray-500">
                      {article.categories?.[0]?.name}
                    </p>

                    <h3 className="font-semibold">
                      {article.title}
                    </h3>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

    </main>
  )
}