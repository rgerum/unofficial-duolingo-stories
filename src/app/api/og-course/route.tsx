export const runtime = "edge";

function get_flag_id(iso: string | null): number {
  const order = [
    "en", //0
    "es", //1
    "fr", //2
    "de", //3
    "ja", //4
    "it", //5
    "ko", //6
    "zh", //7
    "ru", //8
    "pt", //9
    "tr", //10
    "nl", //11
    "sv", //12
    "ga", //13
    "el", //14
    "he", //15
    "pl", //16
    "no", //17
    "vi", //18
    "da", //19
    "hv", //20
    "ro", //21
    "sw", //22
    "eo", //23
    "hu", //24
    "cy", //25
    "uk", //26
    "tlh", //27
    "cs", //28
    "hi", //29
    "id", //30
    "hw", //31
    "nv", //32
    "ar", //33
    "ca", //34
    "th", //35
    "gn", //36
    "world", //37
    "duo", //38
    "tools", //39
    "reader", //40
    "la", //41
    "gd", //42
    "fi", //43
    "yi", //44
    "ht", //45
    "tl", //46
    "zu", //47
  ];
  let flag = 0;
  for (let i = 0; i < order.length; i++) {
    if (order[i] === (iso || "world")) flag = i;
  }
  return flag;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const flagOffset = get_flag_id(searchParams.get("lang"));
  const name = searchParams.get("name") ?? "Language";
  const count = searchParams.get("count") ?? "4";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#ffffff" />
      <rect x="48" y="48" width="1104" height="534" rx="40" fill="#edf7ef" />
      <text x="96" y="170" font-size="30" font-family="Nunito, Arial, sans-serif" fill="#58745c">Flag ${flagOffset}</text>
      <text x="96" y="250" font-size="78" font-family="Nunito, Arial, sans-serif" font-weight="800" fill="#17361c">${name}</text>
      <text x="96" y="330" font-size="38" font-family="Nunito, Arial, sans-serif" fill="#36543a">${count} community translated stories</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
