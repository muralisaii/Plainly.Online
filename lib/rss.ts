import Parser from "rss-parser"

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

  if (url.includes("ichef.bbci.co.uk")) {
    return url
      .replace("/240/", "/1280/")
      .replace("/320/", "/1280/")
      .replace("/480/", "/1280/")
      .replace("/640/", "/1280/")
  }

  return url
}

export async function fetchRSS(url: string) {
  const feed = await parser.parseURL(url)

  return feed.items.map((item: any) => {
    let image = null

    if (item.mediaContent?.length) {
      image = item.mediaContent[0]?.$?.url
    }

    if (!image && item.enclosure?.url) {
      image = item.enclosure.url
    }

    if (!image && item.mediaThumbnail?.length) {
      image = item.mediaThumbnail[0]?.$?.url
    }

    image = upgradeImageResolution(image)

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