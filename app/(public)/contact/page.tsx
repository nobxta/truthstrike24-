import type { Metadata } from "next";
import { Mail, MapPin, Clock, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — TruthStrike24",
  description: "Get in touch with TruthStrike24. Reach out for news tips, corrections, or general inquiries.",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-navy mb-4">
        Contact Us
      </h1>
      <p className="text-lg text-gray-500 mb-10">
        Have a news tip, correction, or question? We&apos;d love to hear from you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm">
          <Mail size={28} className="text-accent mx-auto mb-3" />
          <h3 className="font-semibold text-navy text-sm mb-1">Email</h3>
          <p className="text-sm text-gray-500">contact@truthstrike24.com</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm">
          <MapPin size={28} className="text-accent mx-auto mb-3" />
          <h3 className="font-semibold text-navy text-sm mb-1">Location</h3>
          <p className="text-sm text-gray-500">India</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm">
          <Clock size={28} className="text-accent mx-auto mb-3" />
          <h3 className="font-semibold text-navy text-sm mb-1">Coverage</h3>
          <p className="text-sm text-gray-500">24/7, 365 days</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-serif font-bold text-navy mb-6">
          Send a Message
        </h2>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              placeholder="What is this about?"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              rows={5}
              placeholder="Your message..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-2 bg-navy text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
          >
            <Send size={14} />
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
