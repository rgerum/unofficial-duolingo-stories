export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Duostories Story";
  const name = searchParams.get("name") ?? "Language";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#f7fbff" />
      <rect x="48" y="48" width="1104" height="534" rx="40" fill="#dff2ff" />
      <text x="96" y="190" font-size="74" font-family="Nunito, Arial, sans-serif" font-weight="800" fill="#0d3550">${title}</text>
      <text x="96" y="280" font-size="36" font-family="Nunito, Arial, sans-serif" fill="#28556f">${name} story on duostories.org</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
