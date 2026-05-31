import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — TruthStrike24",
  description: "TruthStrike24 privacy policy. Learn how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-navy mb-4">
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-gray max-w-none prose-headings:font-serif prose-headings:text-navy">
        <h2>1. Information We Collect</h2>
        <p>
          TruthStrike24 is a public news website. We do not require user registration or collect personal information to read our articles. We may collect:
        </p>
        <ul>
          <li>Anonymous usage data through Google Analytics (page views, session duration, device type)</li>
          <li>Information voluntarily submitted through our contact form</li>
          <li>Cookies necessary for Google Translate functionality and analytics</li>
        </ul>

        <h2>2. How We Use Information</h2>
        <p>
          Any information we collect is used solely to:
        </p>
        <ul>
          <li>Improve our website content and user experience</li>
          <li>Respond to inquiries submitted through our contact form</li>
          <li>Analyze website traffic and performance</li>
        </ul>

        <h2>3. Third-Party Services</h2>
        <p>
          Our website uses the following third-party services:
        </p>
        <ul>
          <li><strong>Google Analytics</strong> — for anonymous website analytics</li>
          <li><strong>Google Translate</strong> — for multilingual support</li>
          <li><strong>Cloudinary</strong> — for image hosting and delivery</li>
          <li><strong>Vercel</strong> — for website hosting</li>
        </ul>

        <h2>4. Cookies</h2>
        <p>
          We use essential cookies for website functionality and analytics cookies through Google Analytics. You can control cookie settings through your browser preferences.
        </p>

        <h2>5. Data Security</h2>
        <p>
          We implement appropriate security measures to protect against unauthorized access, alteration, or destruction of data. Our website is served over HTTPS, and we follow industry best practices for data protection.
        </p>

        <h2>6. Children&apos;s Privacy</h2>
        <p>
          Our website is not directed at children under 13. We do not knowingly collect personal information from children.
        </p>

        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this privacy policy periodically. Changes will be posted on this page with an updated revision date.
        </p>

        <h2>8. Contact</h2>
        <p>
          For questions about this privacy policy, please contact us at{" "}
          <strong>contact@truthstrike24.com</strong>.
        </p>
      </div>
    </div>
  );
}
