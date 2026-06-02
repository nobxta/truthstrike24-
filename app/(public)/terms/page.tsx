import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — TruthStrike24",
  description:
    "Terms governing your use of TruthStrike24 — content use, disclaimers, DMCA, corrections policy, newsletter terms, and limitation of liability.",
  openGraph: {
    title: "Terms of Service — TruthStrike24",
    description: "The terms under which you use truthstrike24.com.",
    type: "article",
  },
};

const sections = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "content-use", title: "Use of Content" },
  { id: "disclaimer", title: "Editorial Disclaimer" },
  { id: "corrections", title: "Corrections & Accuracy" },
  { id: "newsletter", title: "Newsletter Terms" },
  { id: "user-conduct", title: "User Conduct" },
  { id: "dmca", title: "DMCA &amp; Copyright" },
  { id: "trademarks", title: "Trademarks" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "indemnification", title: "Indemnification" },
  { id: "termination", title: "Termination" },
  { id: "governing-law", title: "Governing Law" },
  { id: "changes", title: "Changes to These Terms" },
  { id: "contact", title: "Contact" },
];

export default function TermsPage() {
  const updated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <article className="lg:col-span-9 max-w-[800px]">
          <h1 className="text-4xl font-serif font-bold text-navy dark:text-white mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
            Effective date: {updated}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-navy dark:prose-headings:text-white prose-a:text-accent">
            <section id="acceptance">
              <h2>Acceptance of Terms</h2>
              <p>
                These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
                use of truthstrike24.com and any related services
                (collectively, the &ldquo;Service&rdquo;) operated by TruthStrike24
                (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing the
                Service you agree to these Terms. If you do not agree, do not
                use the Service.
              </p>
            </section>

            <section id="content-use">
              <h2>Use of Content</h2>
              <p>
                All articles, investigations, images, and other content
                published on TruthStrike24 are protected by copyright and other
                intellectual-property laws. You may:
              </p>
              <ul>
                <li>Read content for personal, non-commercial use.</li>
                <li>Share links to our articles on social media and elsewhere.</li>
                <li>
                  Quote short excerpts (under 250 words) with attribution and a
                  link back to the original article, under fair-use principles.
                </li>
              </ul>
              <p>You may <strong>not</strong>, without our written permission:</p>
              <ul>
                <li>Republish full articles on other websites or in any commercial publication.</li>
                <li>Train machine-learning models on our content.</li>
                <li>Scrape the Service systematically.</li>
                <li>Remove copyright notices, watermarks, or attribution.</li>
              </ul>
            </section>

            <section id="disclaimer">
              <h2>Editorial Disclaimer</h2>
              <p>
                TruthStrike24 publishes investigative journalism, news
                reporting, and opinion. Our investigations represent the
                results of our research at the time of publication. Where we
                describe schemes, projects, or individuals as fraudulent,
                misleading, or scams, those characterizations reflect our
                editorial judgment based on the evidence we have gathered.
              </p>
              <p>
                <strong>Our content is not legal, financial, or investment
                advice.</strong> Nothing on the Service should be relied on as
                the sole basis for any legal, financial, or investment
                decision. Consult a qualified professional before acting.
              </p>
              <p>
                Cryptocurrency markets are volatile and high-risk. Past
                performance does not predict future results. Many tokens,
                exchanges, and platforms covered by our reporting carry
                substantial risk of total loss.
              </p>
            </section>

            <section id="corrections">
              <h2>Corrections &amp; Accuracy</h2>
              <p>
                We take accuracy seriously. If you believe a story contains a
                factual error, email{" "}
                <strong>contact@truthstrike24.com</strong> with the subject
                line &ldquo;Correction Request&rdquo; and include:
              </p>
              <ul>
                <li>A link to the article in question.</li>
                <li>The specific passage you believe is inaccurate.</li>
                <li>The correct information, with supporting evidence.</li>
              </ul>
              <p>
                We will review every correction request and respond within 7
                business days. Verified corrections are published with a note
                at the top of the article preserving the original wording.
              </p>
            </section>

            <section id="newsletter">
              <h2>Newsletter Terms</h2>
              <p>
                By subscribing to our newsletter you agree to receive
                periodic emails from TruthStrike24 at the address you
                provided. We send:
              </p>
              <ul>
                <li>Curated story round-ups and investigation alerts.</li>
                <li>Breaking-news bulletins on stories we are actively covering.</li>
                <li>Occasional service messages (updates to these Terms, privacy changes).</li>
              </ul>
              <p>
                Every newsletter contains a one-click unsubscribe link. You
                may also email <strong>contact@truthstrike24.com</strong> at
                any time and we will remove you within 7 days.
              </p>
            </section>

            <section id="user-conduct">
              <h2>User Conduct</h2>
              <p>When using the Service (contact forms, tip submissions, dispute reports), you agree not to:</p>
              <ul>
                <li>Submit false, misleading, defamatory, or unlawful content.</li>
                <li>Impersonate another person or entity.</li>
                <li>Interfere with the operation of the Service.</li>
                <li>Attempt to gain unauthorized access to any part of the Service.</li>
                <li>Use the Service to harass, threaten, or defraud anyone.</li>
              </ul>
              <p>
                We reserve the right to refuse service, remove content, or
                cooperate with law enforcement in response to violations.
              </p>
            </section>

            <section id="dmca">
              <h2>DMCA &amp; Copyright Complaints</h2>
              <p>
                If you believe content on the Service infringes your
                copyright, send a written notice that includes:
              </p>
              <ul>
                <li>Identification of the copyrighted work.</li>
                <li>The URL of the allegedly infringing content.</li>
                <li>Your contact information.</li>
                <li>
                  A statement that you have a good-faith belief the use is
                  not authorized.
                </li>
                <li>
                  A statement, under penalty of perjury, that the information
                  is accurate and you are authorized to act on behalf of the
                  copyright owner.
                </li>
                <li>Your physical or electronic signature.</li>
              </ul>
              <p>
                Send notices to <strong>contact@truthstrike24.com</strong>{" "}
                with the subject line &ldquo;DMCA Notice.&rdquo; We respond to
                valid notices promptly and may remove or disable access to
                the disputed material. Filing false notices may result in
                legal liability.
              </p>
            </section>

            <section id="trademarks">
              <h2>Trademarks</h2>
              <p>
                &ldquo;TruthStrike24,&rdquo; the TruthStrike24 logo, and related
                marks are trademarks of TruthStrike24. Third-party names and
                logos mentioned in our reporting are the property of their
                respective owners and are used for identification and
                editorial commentary only.
              </p>
            </section>

            <section id="liability">
              <h2>Limitation of Liability</h2>
              <p>
                <strong>
                  The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo;
                  without warranties of any kind, express or implied.
                </strong>{" "}
                We do not guarantee the Service will be uninterrupted,
                secure, or error-free, or that information will be complete
                or up to date.
              </p>
              <p>
                To the fullest extent permitted by law, TruthStrike24, its
                contributors, and its operators shall not be liable for any
                indirect, incidental, special, consequential, or punitive
                damages, or any loss of profits or revenues, whether incurred
                directly or indirectly, arising from your use of the Service.
              </p>
            </section>

            <section id="indemnification">
              <h2>Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless TruthStrike24 and
                its contributors from any claim, demand, loss, or damages
                arising out of your use of the Service or violation of these
                Terms.
              </p>
            </section>

            <section id="termination">
              <h2>Termination</h2>
              <p>
                We may suspend or terminate your access to the Service at any
                time, for any reason, without notice. You may stop using the
                Service at any time. Provisions that by their nature should
                survive termination will survive.
              </p>
            </section>

            <section id="governing-law">
              <h2>Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of
                Delaware, United States, without regard to its conflict-of-
                law principles. Any dispute will be resolved exclusively in
                the state and federal courts located in Delaware, and you
                consent to personal jurisdiction there.
              </p>
            </section>

            <section id="changes">
              <h2>Changes to These Terms</h2>
              <p>
                We may revise these Terms from time to time. The
                &ldquo;Effective date&rdquo; at the top will change when we do.
                Continued use of the Service after a revision constitutes
                acceptance of the new Terms.
              </p>
            </section>

            <section id="contact">
              <h2>Contact</h2>
              <p>
                For questions about these Terms:
                <br />
                <strong>contact@truthstrike24.com</strong>
              </p>
            </section>
          </div>
        </article>

        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-3">
              On this page
            </p>
            <ul className="space-y-2 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-gray-600 dark:text-gray-300 hover:text-accent transition-colors"
                    dangerouslySetInnerHTML={{ __html: s.title }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
