export function GET() {
  return new Response(
    "User-agent: *\nAllow: /\nSitemap: https://jamescao2048.github.io/sitemap-index.xml\n",
    { headers: { "Content-Type": "text/plain" } }
  );
}
