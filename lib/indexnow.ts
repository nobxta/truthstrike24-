/**
 * IndexNow — instant URL submission to Bing, Yandex, Seznam.
 *
 * Spec: https://www.indexnow.org/documentation
 *
 * How it works:
 *  1. Site owner generates a UUID key (one-time)
 *  2. Key file placed at /[key].txt with the same key as content
 *  3. Whenever a new/updated URL exists, ping IndexNow with the URL
 *  4. Bing/Yandex fetches the key file to verify ownership, then crawls
 *
 * The key is treated as a secret-ish but technically public — the key
 * file at /[key].txt is what proves ownership.
 */

const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || "a2b1d92cfba9ba4089e8a73f17ebf5ef";
const SITE_HOST = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.truthstrike24.com"
    ).host;
  } catch {
    return "www.truthstrike24.com";
  }
})();

const SITE_URL = `https://${SITE_HOST}`;

/**
 * Submit one or more URLs to IndexNow.
 * Returns true if accepted (any 200/202 response).
 *
 * Safe to fire-and-forget — failures are logged but don't throw.
 */
export async function pingIndexNow(
  urlOrUrls: string | string[]
): Promise<boolean> {
  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
  const normalized = urls
    .map((u) =>
      u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? u : `/${u}`}`
    )
    .filter((u, i, arr) => arr.indexOf(u) === i); // dedupe

  if (normalized.length === 0) return false;

  const body = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: normalized,
  };

  try {
    // Bing handles for both Bing and Yandex via shared protocol
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] ✓ submitted ${normalized.length} URL(s)`);
      return true;
    }
    console.warn(`[IndexNow] non-success status ${res.status}: ${await res.text()}`);
    return false;
  } catch (err) {
    console.error("[IndexNow] error:", err);
    return false;
  }
}
