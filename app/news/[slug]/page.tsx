import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"

export const revalidate = 300

type Article = {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  image_url: string | null
  source: string | null
  published_at: string | null
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

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      description,
      content,
      image_url,
      source,
      published_at,
      trending_score,
      categories:category_id (
        name,
        slug
      )
    `)
    .eq("slug", slug)
    .single()

  if (error || !data) {
    return notFound()
  }

  const article = data as Article

  return (
    <main className="p-6 max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-4">
        {article.title}
      </h1>

      <p className="text-sm text-gray-500 mb-4">
        {article.categories?.[0]?.name}
      </p>

      <img
        src={
          article.image_url ||
          getCategoryFallback(article.categories?.[0]?.slug)
        }
        alt={article.title}
        className="mb-6 rounded w-full h-96 object-cover"
      />

      <div className="space-y-4">
        <p>{article.description}</p>
        <p>{article.content}</p>
      </div>
    </main>
  )
}