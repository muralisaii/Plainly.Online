"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import page from "@/app/news/[slug]/page"

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

function SkeletonCard() {
    return (
        <div className="flex gap-4 items-start p-3 animate-pulse">
            <div className="w-28 h-20 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-300 rounded w-3/4" />
            </div>
        </div>
    )
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
        const observer = new IntersectionObserver(
            async (entries) => {
                if (entries[0].isIntersecting && !loading && hasMore) {
                    setLoading(true)

                    const lastArticle = articles[articles.length - 1]

                    const res = await fetch(
                        `/api/load-more?lastDate=${lastArticle?.published_at}`
                    )
                    const data: Article[] = await res.json()

                    if (data.length > 0) {
                        setArticles((prev) => {
                            const existingIds = new Set(prev.map(a => a.id))
                            const filtered = data.filter(a => !existingIds.has(a.id))
                            return [...prev, ...filtered]
                        })
                    } else {
                        setHasMore(false)
                    }

                    setLoading(false)
                }
            },
            { threshold: 1 }
        )

        if (loaderRef.current) {
            observer.observe(loaderRef.current)
        }

        return () => observer.disconnect()
    }, [page, loading, hasMore])

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
                                    "/images/default-news.jpg"
                                }
                                alt={article.title}
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 mb-1">
                                {article.categories?.[0]?.name}{" "}
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
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                )}

                {!hasMore && (
                    <p className="text-sm text-gray-400 mt-4">
                        No more articles
                    </p>
                )}
            </div>
        </section>
    )
}