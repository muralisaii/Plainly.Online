import Parser from "rss-parser"
import * as cheerio from "cheerio"

async function extractOGImage(articleUrl: string) {
  try {
    const res = await fetch(articleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    })

    const html = await res.text()
    const $ = cheerio.load(html)

    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content")

    return ogImage || null
  } catch {
    return null
  }
}

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }]
    ]
  }
})

function upgradeImageResolution(url: string | null) {
  if (!url) return null

  // BBC
  if (url.includes("ichef.bbci.co.uk")) {
    return url
      .replace("/240/", "/1280/")
      .replace("/320/", "/1280/")
      .replace("/480/", "/1280/")
      .replace("/640/", "/1280/")
  }

  // Reuters
  if (url.includes("reuters.com")) {
    return url.replace("300x", "1200x")
  }

  // Generic thumbnails
  url = url.replace("240x240", "1200x1200")
  url = url.replace("300x300", "1200x1200")
  url = url.replace("400x400", "1200x1200")

  return url
}

export async function fetchRSS(url: string) {
  const feed = await parser.parseURL(url)

  return feed.items.map(async (item: any) => {
    let image = null

    // 1️⃣ media content
    if (item.mediaContent?.length) {
      image = item.mediaContent[0]?.$?.url
    }

    // 2️⃣ enclosure
    if (!image && item.enclosure?.url) {
      image = item.enclosure.url
    }

    // 3️⃣ thumbnail
    if (!image && item.mediaThumbnail?.length) {
      image = item.mediaThumbnail[0]?.$?.url
    }

    // 4️⃣ upgrade BBC resolution
    image = upgradeImageResolution(image)

    // 5️⃣ if still missing → scrape article page
    if (!image && item.link) {
      image = await extractOGImage(item.link)
    }

    return {
      title: item.title || "",
      description: item.contentSnippet || "",
      content: item.content || "",
      link: item.link || "",
      image_url: image,
      published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
    }
  })
}