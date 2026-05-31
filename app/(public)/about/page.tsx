import type { Metadata } from "next";
import { Shield, Users, Globe, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — TruthStrike24",
  description:
    "Learn about TruthStrike24, your trusted source for breaking news and in-depth journalism delivered 24/7.",
};

const values = [
  {
    icon: Shield,
    title: "Truth & Accuracy",
    desc: "Every story is verified and fact-checked before publication, ensuring our readers get reliable information.",
  },
  {
    icon: Zap,
    title: "Speed & Timeliness",
    desc: "Breaking news delivered around the clock. We cover events as they unfold, keeping you informed in real-time.",
  },
  {
    icon: Users,
    title: "Reader First",
    desc: "Our editorial decisions are driven by what matters to our readers, not advertisers or special interests.",
  },
  {
    icon: Globe,
    title: "Global Perspective",
    desc: "We cover stories from around the world with multilingual support, making news accessible to everyone.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-navy mb-4">
        About TruthStrike24
      </h1>
      <p className="text-lg text-gray-500 leading-relaxed mb-10">
        TruthStrike24 is a modern news platform committed to delivering
        accurate, timely, and impactful journalism. We believe in the power of
        information to shape a better world.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {values.map((v) => (
          <div
            key={v.title}
            className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"
          >
            <v.icon size={28} className="text-accent mb-3" />
            <h3 className="font-semibold text-navy mb-2">{v.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-navy rounded-xl p-8 text-white">
        <h2 className="text-xl font-serif font-bold mb-3">Our Mission</h2>
        <p className="text-gray-300 leading-relaxed">
          In an era of information overload, TruthStrike24 stands as a beacon
          of reliable journalism. Our team works around the clock to bring you
          stories that matter — from breaking news to in-depth analysis. We
          leverage AI-assisted tools to enhance our coverage speed while
          maintaining the editorial standards our readers trust.
        </p>
      </div>
    </div>
  );
}
