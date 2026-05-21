function toSafeHref(rawHref) {
  if (!rawHref) return null;
  const href = String(rawHref).trim();
  if (!href) return null;

  // Allow simple relative links
  if (href.startsWith("/") || href.startsWith("#")) return href;

  // Allow a small set of safe absolute schemes
  try {
    const url = new URL(href);
    const protocol = url.protocol?.toLowerCase();
    if (
      protocol === "http:" ||
      protocol === "https:" ||
      protocol === "mailto:"
    ) {
      return href;
    }
  } catch {
    // Not a valid absolute URL
  }
  return null;
}

function trimTrailingPunctuation(value) {
  // Common punctuation that tends to get stuck to the end of URLs in prose
  return String(value).replace(/[\]\)\}\>,.;:!?]+$/g, "");
}

/**
 * Parses a line of notice text into [{ type: 'text'|'link', value|href|text }].
 * Supports Markdown links: [text](href) and bare URLs (http(s)/mailto).
 */
export function parseNoticeLine(line) {
  const input = line ?? "";
  const tokenRe =
    /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<]+|mailto:[^\s<]+)/g;
  const parts = [];

  let lastIndex = 0;
  for (const match of input.matchAll(tokenRe)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push({ type: "text", value: input.slice(lastIndex, start) });
    }

    const mdText = match[1];
    const mdHref = match[2];
    const rawUrl = match[3];

    if (mdText !== undefined && mdHref !== undefined) {
      const cleanedHref = toSafeHref(trimTrailingPunctuation(mdHref));
      if (cleanedHref) {
        parts.push({ type: "link", href: cleanedHref, text: mdText });
      } else {
        parts.push({ type: "text", value: match[0] });
      }
    } else if (rawUrl) {
      const cleanedHref = toSafeHref(trimTrailingPunctuation(rawUrl));
      if (cleanedHref) {
        parts.push({ type: "link", href: cleanedHref, text: cleanedHref });
      } else {
        parts.push({ type: "text", value: match[0] });
      }
    }

    lastIndex = start + match[0].length;
  }

  if (lastIndex < input.length) {
    parts.push({ type: "text", value: input.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", value: input }];
}
