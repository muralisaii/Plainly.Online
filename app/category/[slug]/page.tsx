import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import Link from "next/link"

export const revalidate = 300

type Article = {
  id: string
  title: string
  slug: string
  trending_score: number
  image_url: string | null
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

export default async function CategoryPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single()

  if (!category) {
    return notFound()
  }

  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, trending_score, image_url")
    .eq("category_id", category.id)
    .order("trending_score", { ascending: false })

  return (
    <main className="p-6 max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        {category.name}
      </h1>

      {!articles?.length && (
        <p className="text-gray-500">
          No articles in this category.
        </p>
      )}

      {articles?.map((article: Article) => (
        <Link key={article.id} href={`/news/${article.slug}`}>
          <div className="flex gap-4 mb-6 hover:bg-gray-50 p-3 rounded cursor-pointer">

            <img
              src={
                article.image_url ||
                getCategoryFallback(category.slug)
              }
              alt={article.title}
              className="w-28 h-20 object-cover rounded"
            />

            <h2 className="text-xl font-semibold">
              {article.title}
            </h2>

          </div>
        </Link>
      ))}
    </main>
  )
}