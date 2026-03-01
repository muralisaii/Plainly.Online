import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 300 // 5 minutes
type Article = {
  id: string
  title: string
  slug: string
  trending_score: number
}

export default async function CategoryPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // 1️⃣ Get category by slug
  const { data: category } = await supabase
    .from("categories")
    .select("id, name")
    .eq("slug", slug)
    .single()

  if (!category) {
    return notFound()
  }

  // 2️⃣ Fetch articles for that category
  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, trending_score")
    .eq("category_id", category.id)
    .order("trending_score", { ascending: false })

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {category.name}
      </h1>

      {!articles?.length && (
        <p className="text-gray-500">No articles in this category.</p>
      )}

      {articles?.map((article) => (
        <div key={article.id} className="mb-4">
          <Link href={`/news/${article.slug}`}>
            <h2 className="text-xl font-semibold">
              {article.title}
            </h2>
          </Link>
        </div>
      ))}
    </main>
  )
}