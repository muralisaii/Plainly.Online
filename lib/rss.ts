import Parser from "rss-parser"

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
})

function extractImage(item: any): string | null {
  // 1️⃣ Enclosure
  if (item.enclosure?.url) {
    return item.enclosure.url
  }

  // 2️⃣ media:content
  if (item.mediaContent?.length > 0 && item.mediaContent[0]?.$.url) {
    return item.mediaContent[0].$.url
  }

  // 3️⃣ media:thumbnail
  if (item.mediaThumbnail?.length > 0 && item.mediaThumbnail[0]?.$.url) {
    return item.mediaThumbnail[0].$.url
  }

  // 4️⃣ Try extracting <img> from multiple HTML fields
  const possibleHtmlFields = [
    item.content,
    item.contentSnippet,
    item.summary,
    item.description,
  ]

  for (const field of possibleHtmlFields) {
    if (field) {
      const match = field.match(/<img[^>]+src="([^">]+)"/i)
      if (match && match[1]) {
        return match[1]
      }
    }
  }

  return null
}

export async function fetchRSS(url: string) {
  const feed = await parser.parseURL(url)

  return feed.items.map((item: any) => ({
    title: item.title || "",
    description: item.contentSnippet || "",
    content: item.content || "",
    link: item.link || "",
    image_url: extractImage(item),
    published_at: item.pubDate
      ? new Date(item.pubDate)
      : new Date(),
  }))
}