/**
 * Newsletter HTML templates — 4 polished brand-themed wrappers.
 * Each features the TruthStrike24 logo image at the top.
 */

export type NewsletterTheme = "classic" | "minimal" | "alert" | "magazine";

const LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL ||
  "https://res.cloudinary.com/dumhqc5k6/image/upload/f_auto,q_auto/v1780221602/ChatGPT_Image_May_31_2026_03_29_40_PM_sgjcd2.png";

export interface NewsletterTemplateArgs {
  subject: string;
  preHeader?: string;
  bodyHtml: string;
  unsubUrl: string;
  /** Optional "From the Newsroom" block (already pre-rendered HTML) */
  latestArticlesHtml?: string;
  siteUrl: string;
  theme?: NewsletterTheme;
}

/**
 * Rewrites every <a href="..."> in the HTML to go through the click-tracking
 * redirect. Leaves the unsubscribe link alone (already a tracked route) and
 * skips mailto:/tel:/anchor links.
 */
export function rewriteLinksForTracking(
  html: string,
  siteUrl: string,
  campaignId: string,
  email: string,
  unsubUrl: string
): string {
  return html.replace(
    /<a\s+([^>]*?)href=(["'])(.*?)\2([^>]*)>/gi,
    (_match, before: string, quote: string, href: string, after: string) => {
      // Skip non-trackable hrefs
      if (
        !href ||
        href === unsubUrl ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return `<a ${before}href=${quote}${href}${quote}${after}>`;
      }
      // Resolve relative URLs to absolute
      const abs = href.startsWith("http")
        ? href
        : `${siteUrl}${href.startsWith("/") ? href : `/${href}`}`;
      const tracked = `${siteUrl}/api/newsletter/track/click?c=${campaignId}&e=${encodeURIComponent(
        email
      )}&u=${encodeURIComponent(abs)}`;
      return `<a ${before}href=${quote}${tracked}${quote}${after}>`;
    }
  );
}

/** Builds the open-tracking pixel <img> tag. */
export function openPixelHtml(
  siteUrl: string,
  campaignId: string,
  email: string
): string {
  const src = `${siteUrl}/api/newsletter/track/open?c=${campaignId}&e=${encodeURIComponent(
    email
  )}`;
  return `<img src="${src}" alt="" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" />`;
}

export function renderNewsletterEmail(args: NewsletterTemplateArgs): string {
  const {
    subject,
    preHeader = "",
    bodyHtml,
    unsubUrl,
    latestArticlesHtml = "",
    siteUrl,
    theme = "classic",
  } = args;

  const year = new Date().getFullYear();
  const preHeaderBlock = preHeader
    ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
        preHeader
      )}</div>`
    : "";

  let inner = "";

  if (theme === "minimal") {
    inner = `
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="padding: 32px 32px 24px; border-bottom: 1px solid #f3f4f6; text-align: center;">
        <a href="${siteUrl}" style="text-decoration:none;display:inline-block;">
          <img src="${LOGO_URL}" alt="TruthStrike24" width="200" style="height:auto;max-width:200px;display:block;margin:0 auto 8px;" />
        </a>
        <p style="color: #6b7280; font-size: 11px; margin: 0; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">Independent Investigative Journalism</p>
      </div>
      <div style="padding: 32px;">
        <div style="color:#1f2937;font-size:15px;line-height:1.7;">${bodyHtml}</div>
        ${latestArticlesHtml}
      </div>
      ${footerHtml(unsubUrl, siteUrl, "#111827")}
    </div>`;
  } else if (theme === "alert") {
    inner = `
    <div style="background: #0a0a0a; padding: 28px 24px; border-radius: 16px 16px 0 0; text-align: center; border-bottom: 4px solid #ef4444;">
      <div style="display:inline-block;background:#ef4444;color:#fff;padding:5px 14px;border-radius:4px;font-size:10px;font-weight:800;letter-spacing:3px;margin-bottom:14px;">⚠ BREAKING NEWS</div>
      <a href="${siteUrl}" style="text-decoration:none;display:inline-block;">
        <img src="${LOGO_URL}" alt="TruthStrike24" width="220" style="height:auto;max-width:220px;display:block;margin:0 auto;filter:brightness(0) invert(1);" />
      </a>
    </div>
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px;">
      <div style="color:#1f2937;font-size:15px;line-height:1.65;">${bodyHtml}</div>
      ${latestArticlesHtml}
      ${footerHtml(unsubUrl, siteUrl, "#ef4444")}
    </div>`;
  } else if (theme === "magazine") {
    inner = `
    <div style="background: linear-gradient(135deg, #fef9f3 0%, #fef3e7 100%); padding: 40px 32px 32px; border-radius: 16px 16px 0 0; text-align: center; border-bottom: 1px solid #f5e6d3;">
      <p style="color: #92400e; font-size: 10px; margin: 0 0 10px; font-weight: 700; letter-spacing: 5px;">— ISSUE · ${year} —</p>
      <a href="${siteUrl}" style="text-decoration:none;display:inline-block;">
        <img src="${LOGO_URL}" alt="TruthStrike24" width="240" style="height:auto;max-width:240px;display:block;margin:0 auto;" />
      </a>
      <p style="color: #a16207; font-style: italic; font-size: 13px; margin: 12px 0 0; font-family: Georgia, 'Times New Roman', serif;">Investigations · Analysis · Truth</p>
    </div>
    <div style="background: #ffffff; border: 1px solid #f5e6d3; border-top: none; border-radius: 0 0 16px 16px; padding: 40px 32px;">
      <div style="color:#1f2937;font-size:16px;line-height:1.75;font-family:Georgia,'Times New Roman',serif;">${bodyHtml}</div>
      ${latestArticlesHtml}
      ${footerHtml(unsubUrl, siteUrl, "#7c2d12")}
    </div>`;
  } else {
    // classic (default)
    inner = `
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 36px 24px 32px; border-radius: 16px 16px 0 0; text-align: center;">
      <a href="${siteUrl}" style="text-decoration:none;display:inline-block;">
        <img src="${LOGO_URL}" alt="TruthStrike24" width="240" style="height:auto;max-width:240px;display:block;margin:0 auto;filter:brightness(0) invert(1);" />
      </a>
      <p style="color: rgba(255,255,255,0.85); font-size: 12px; margin: 12px 0 0; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">Breaking news, delivered</p>
    </div>
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px;">
      <div style="color:#1f2937;font-size:15px;line-height:1.65;">${bodyHtml}</div>
      ${latestArticlesHtml}
      ${footerHtml(unsubUrl, siteUrl, "#dc2626")}
    </div>`;
  }

  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(
    subject
  )}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;">
${preHeaderBlock}
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 16px; background: #f5f5f5;">
  ${inner}
  <p style="text-align: center; font-size: 11px; color: #9ca3af; margin: 18px 0 0;">
    <a href="${siteUrl}" style="color:#9ca3af;text-decoration:none;">TruthStrike24</a> &middot; Independent journalism &middot; ${year}
  </p>
</div>
</body></html>`;
}

function footerHtml(unsubUrl: string, siteUrl: string, accent: string): string {
  return `<div style="border-top: 1px solid #e5e7eb; margin: 28px 0 0; padding-top: 18px;">
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
        Don't want these emails? <a href="${unsubUrl}" style="color: ${accent}; text-decoration: underline; font-weight: 600;">Unsubscribe with one click</a>.
      </p>
      <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 8px 0 0;">
        You're receiving this because you subscribed at <a href="${siteUrl}" style="color: #6b7280; text-decoration: none;">truthstrike24.com</a>.
      </p>
    </div>`;
}

export interface LatestArticle {
  title: string;
  slug: string;
  summary: string;
  featuredImage?: string;
}

export function renderLatestArticlesBlock(
  articles: LatestArticle[],
  siteUrl: string,
  accent: string = "#dc2626"
): string {
  if (articles.length === 0) return "";
  const items = articles
    .map(
      (a) => `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:14px 0;border-bottom:1px solid #f3f4f6;">
      <tr>
        ${a.featuredImage
          ? `<td valign="top" style="width:100px;padding-right:14px;">
              <a href="${siteUrl}/${a.slug}" style="text-decoration:none;display:block;">
                <img src="${a.featuredImage}" alt="" width="100" style="display:block;width:100px;height:64px;border-radius:6px;object-fit:cover;" />
              </a>
             </td>`
          : ""}
        <td valign="top">
          <a href="${siteUrl}/${a.slug}" style="color:#111827;font-weight:700;font-size:15px;text-decoration:none;display:block;margin-bottom:4px;line-height:1.3;">${escapeHtml(
            a.title
          )}</a>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">${escapeHtml(
            truncate(a.summary, 130)
          )}</p>
        </td>
      </tr>
    </table>`
    )
    .join("");

  return `
    <div style="margin-top:32px;padding-top:24px;border-top:2px solid ${accent};">
      <h3 style="color:#111827;font-size:16px;font-weight:800;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">From the Newsroom</h3>
      <p style="color:#6b7280;font-size:12px;margin:0 0 12px;">Latest from TruthStrike24</p>
      ${items}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
