import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"
import InfiniteMoreNews from "@/components/InfiniteMoreNews"

export const revalidate = 300

type Article = {
  id: string
  title: string
  slug: string
  description: string | null
  image_url: string | null
  published_at: string | null
  source: string | null
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

function timeAgo(dateString?: string | null) {
  if (!dateString) return ""

  const now = new Date()
  const published = new Date(dateString)
  const diffMs = now.getTime() - published.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default async function Home() {

  const baseQuery = `
  id,
  title,
  slug,
  description,
  image_url,
  published_at,
  source,
  trending_score,
  categories:category_id (
    name,
    slug
  )
`

  const { data: breaking } = await supabase
    .from("articles")
    .select(baseQuery)
    .order("published_at", { ascending: false })
    .limit(1)

  const { data: trending } = await supabase
    .from("articles")
    .select(baseQuery)
    .order("published_at", { ascending: false })
    .range(1, 4)

  const { data: more } = await supabase
    .from("articles")
    .select(baseQuery)
    .order("published_at", { ascending: false })
    .range(5, 14)

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-12">

      {/* Breaking */}
      {breaking?.[0] && (
        <section className="space-y-6">

          <h2 className="text-2xl font-bold">🔥 Breaking</h2>

          <Link href={`/news/${breaking[0].slug}`}>

            <article className="cursor-pointer space-y-6 group">

              <div className="relative w-full h-[420px] rounded-xl overflow-hidden">

                <Image
                  src={
                    breaking[0].image_url ||
                    getCategoryFallback(breaking[0].categories?.[0]?.slug)
                  }
                  alt={breaking[0].title}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 1200px"
                  quality={90}
                  priority
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              </div>

              <div className="space-y-3">

                <p className="text-sm text-gray-500">
                  {breaking[0].categories?.[0]?.name} {" "}
                  {timeAgo(breaking[0].published_at)} •{" "}
                  {breaking[0].source}
                </p>

                <h1 className="text-4xl md:text-5xl font-bold leading-tight group-hover:text-gray-800 transition-colors">
                  {breaking[0].title}
                </h1>

                <p className="text-lg text-gray-600 max-w-3xl">
                  {breaking[0].description}
                </p>

              </div>

            </article>

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

                  <div className="relative w-full h-40">

                    <Image
                      src={
                        article.image_url ||
                        getCategoryFallback(article.categories?.[0]?.slug)
                      }
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 50vw, 25vw"
                      quality={90}
                    />

                  </div>

                  <div className="p-4">

                    <p className="text-xs text-gray-500 mb-2">
                      {article.categories?.[0]?.name} {" "}
                      {timeAgo(article.published_at)} •{" "}
                      {article.source}
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

      {/* Infinite Scroll Section */}

      <InfiniteMoreNews initialArticles={more || []} />

    </main>
  )
}