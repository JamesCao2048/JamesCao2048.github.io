import rss from "@astrojs/rss";
import { getWriting } from "@/utils/content";
export async function GET() {
  return rss({
    title: "Junming Cao — Blogs",
    description: "Articles by Junming Cao.",
    site: "https://jamescao2048.github.io",
    items: (await getWriting()).map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt!,
      link: `/writing/${post.data.slug}/`,
    })),
    customData: "<language>en</language>",
  });
}
