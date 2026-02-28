import Parser from "rss-parser"

const parser = new Parser()

export async function fetchRSS(url: string) {
  const feed = await parser.parseURL(url)

  return feed.items.map((item) => ({
    title: item.title || "",
    description: item.contentSnippet || "",
    content: item.content || "",
    link: item.link || "",
    published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
  }))
}