export interface ImgflipTemplate {
  id: string;
  name: string;
  altName: string | null;
}

const TEMPLATES_URL = "https://imgflip.com/popular-meme-ids";
let cache: ImgflipTemplate[] | null = null;

export async function fetchMemeTemplates(): Promise<ImgflipTemplate[]> {
  if (cache) return cache;
  const response = await fetch(TEMPLATES_URL);
  if (!response.ok) throw new Error(`Failed to fetch meme templates: ${response.status}`);
  const html = await response.text();
  cache = parseMemeTemplatesHtml(html);
  return cache;
}

export function parseMemeTemplatesHtml(html: string): ImgflipTemplate[] {
  const templates: ImgflipTemplate[] = [];
  const rowRegex = /<tr><td>(\d+)<\/td><td>([^<]+)<\/td><td>([^<]*)<\/td><\/tr>/g;
  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(html)) !== null) {
    templates.push({
      id: match[1],
      name: decodeHtmlEntities(match[2]),
      altName: decodeHtmlEntities(match[3].trim()) || null
    });
  }
  return templates;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
