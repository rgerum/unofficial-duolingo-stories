export async function GET(_request: Request) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#ffffff" />
      <rect x="56" y="56" width="1088" height="518" rx="32" fill="#eef8ff" />
      <text x="96" y="180" font-size="82" font-family="Nunito, Arial, sans-serif" font-weight="800" fill="#102f46">Duostories</text>
      <text x="96" y="270" font-size="38" font-family="Nunito, Arial, sans-serif" fill="#204861">A community project to bring the original Duolingo Stories to new languages.</text>
      <text x="96" y="330" font-size="32" font-family="Nunito, Arial, sans-serif" fill="#35627b">Community translated stories for language learners.</text>
    </svg>
  `;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
