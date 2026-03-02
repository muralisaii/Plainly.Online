import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"

export const revalidate = 300 // 5 minutes
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

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  console.log("Slug param:", slug)

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

      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="mb-6 rounded"
        />
      )}

      <div className="space-y-4">
        <p>{article.description}</p>
        <p>{article.content}</p>
      </div>
    </main>
  )
}
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data } = await supabase
    .from("articles")
    .select("title, description, image_url")
    .eq("slug", slug)
    .single()

  if (!data) {
    return {
      title: "Article Not Found",
    }
  }

  return {
    title: data.title,
    description: data.description || "",
    openGraph: {
      title: data.title,
      description: data.description || "",
      images: data.image_url ? [data.image_url] : [],
    },
  }
}