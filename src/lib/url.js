/**
 * URL helpers.
 */

export function getLinkDomainFromUrl(urlString) {
  if (!urlString) return "";
  try {
    const url = new URL(urlString);

    if (url.protocol === "blob:") {
      // blob URLs are of the form: blob:<origin>/<uuid>
      try {
        const originUrl = new URL(url.pathname);
        return originUrl.host;
      } catch {
        return "";
      }
    }

    return url.host;
  } catch {
    return "";
  }
}
