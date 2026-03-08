"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"

type Article = {
    id: string
    title: string
    slug: string
    image_url: string | null
    published_at: string | null
    source: string | null
    categories: { name: string; slug: string }[] | null
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

export default function InfiniteMoreNews({
    initialArticles,
}: {
    initialArticles: Article[]
}) {

    const [articles, setArticles] = useState(initialArticles)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const loaderRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {

        const observer = new IntersectionObserver(async (entries) => {

            if (!entries[0].isIntersecting) return
            if (loading || !hasMore) return

            setLoading(true)

            try {

                const last = articles[articles.length - 1]

                const res = await fetch(`/api/load-more?lastDate=${last?.published_at}`)

                const data: Article[] = await res.json()

                if (!data || data.length === 0) {
                    setHasMore(false)
                    setLoading(false)
                    return
                } else {

                    setArticles((prev) => {

                        const ids = new Set(prev.map((a) => a.id))

                        const filtered = data.filter((a) => !ids.has(a.id))

                        return [...prev, ...filtered]

                    })

                }

            } catch (err) {
                console.error(err)
            }

            setLoading(false)

        })

        if (loaderRef.current) {
            observer.observe(loaderRef.current)
        }
        return () => observer.disconnect()

    }, [articles, loading, hasMore])

    return (

        <section className="space-y-6">

            <h2 className="text-2xl font-bold">📰 More News</h2>

            {articles.map((article) => (

                <Link key={article.id} href={`/news/${article.slug}`}>

                    <div className="flex gap-4 items-start hover:bg-gray-50 p-3 rounded cursor-pointer">

                        <div className="relative w-28 h-20 rounded overflow-hidden">

                            <Image
                                src={
                                    article.image_url ||
                                    getCategoryFallback(article.categories?.[0]?.slug)
                                }
                                alt={article.title}
                                fill
                                className="object-cover"
                                sizes="112px"
                                quality={90}
                            />

                        </div>

                        <div>

                            <p className="text-xs text-gray-500 mb-1">
                                {article.categories?.[0]?.name} {" "}
                                {timeAgo(article.published_at)} •{" "}
                                {article.source}
                            </p>

                            <h3 className="font-semibold">
                                {article.title}
                            </h3>

                        </div>

                    </div>

                </Link>

            ))}

            <div ref={loaderRef} className="h-10 flex items-center justify-center">

                {loading && (
                    <p className="text-sm text-gray-500">
                        Loading more news...
                    </p>
                )}

                {!hasMore && (
                    <p className="text-sm text-gray-400">
                        No more articles
                    </p>
                )}

            </div>

        </section>
    )
}