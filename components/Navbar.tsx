import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default async function Navbar() {
  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug")
    .order("name", { ascending: true })

  return (
    <nav className="border-b p-4 flex flex-wrap gap-4">
      <Link href="/" className="font-bold">
        Plainly Online
      </Link>

      {categories?.map((cat) => (
        <Link
          key={cat.slug}
          href={`/category/${cat.slug}`}
          className="text-sm text-gray-600 hover:text-black"
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  )
}