/**
 * Shared newsletter HTML template — wraps admin-authored body HTML
 * in the TruthStrike24 brand template. Matches the welcome email style.
 */

export interface NewsletterTemplateArgs {
  subject: string;
  preHeader?: string;
  bodyHtml: string;
  unsubUrl: string;
  /** Optional "From the Newsroom" block (already pre-rendered HTML) */
  latestArticlesHtml?: string;
  siteUrl: string;
}

export function renderNewsletterEmail(args: NewsletterTemplateArgs): string {
  const {
    subject,
    preHeader = "",
    bodyHtml,
    unsubUrl,
    latestArticlesHtml = "",
    siteUrl,
  } = args;

  const year = new Date().getFullYear();
  // Hidden pre-header span — most clients show first ~80 chars
  const preHeaderBlock = preHeader
    ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
        preHeader
      )}</div>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(
    subject
  )}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;">
${preHeaderBlock}
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 16px; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">TruthStrike24</h1>
    <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 6px 0 0; font-weight: 500;">Breaking news, delivered.</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px;">
    <div style="color:#1f2937;font-size:15px;line-height:1.65;">
      ${bodyHtml}
    </div>
    ${latestArticlesHtml}
    <div style="border-top: 1px solid #e5e7eb; margin: 28px 0 0; padding-top: 18px;">
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
        Don't want these emails? <a href="${unsubUrl}" style="color: #dc2626; text-decoration: underline; font-weight: 600;">Unsubscribe with one click</a>.
      </p>
      <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 8px 0 0;">
        You're receiving this because you subscribed at <a href="${siteUrl}" style="color: #6b7280; text-decoration: none;">truthstrike24.com</a>.
      </p>
    </div>
  </div>
  <p style="text-align: center; font-size: 11px; color: #9ca3af; margin: 18px 0 0;">
    TruthStrike24 &middot; Independent journalism &middot; ${year}
  </p>
</div>
</body></html>`;
}

export interface LatestArticle {
  title: string;
  slug: string;
  summary: string;
}

export function renderLatestArticlesBlock(
  articles: LatestArticle[],
  siteUrl: string
): string {
  if (articles.length === 0) return "";
  const items = articles
    .map(
      (a) => `
    <div style="padding:14px 0;border-bottom:1px solid #f3f4f6;">
      <a href="${siteUrl}/${a.slug}" style="color:#111827;font-weight:700;font-size:15px;text-decoration:none;display:block;margin-bottom:4px;">${escapeHtml(
        a.title
      )}</a>
      <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">${escapeHtml(
        truncate(a.summary, 140)
      )}</p>
    </div>`
    )
    .join("");

  return `
    <div style="margin-top:32px;padding-top:24px;border-top:2px solid #dc2626;">
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
