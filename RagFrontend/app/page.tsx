import Link from "next/link";
import { Github, Globe, Linkedin } from "lucide-react";
import { HealthStatus } from "@/components/HealthStatus";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustStrip } from "@/components/home/TrustStrip";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FeatureCardsSection } from "@/components/home/FeatureCardsSection";
import { LiveDemoPreview } from "@/components/home/LiveDemoPreview";
import { ArchitecturePipelineSection } from "@/components/home/ArchitecturePipelineSection";
import { CtaBanner } from "@/components/home/CtaBanner";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AskDoc",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Enterprise-grade Retrieval-Augmented Generation (RAG) platform powered by Google Gemini and Pinecone.",
    "author": {
      "@type": "Person",
      "name": "Dilip Meghwal",
      "url": "https://dilipmeghwal.in"
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col font-serif selection:bg-[var(--accent-color)] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[var(--bg-main)]/85 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-color)] to-amber-500 bg-clip-text text-transparent cursor-pointer">
            AskDoc
          </Link>
          <div className="flex gap-2.5 sm:gap-3 items-center">
            <HealthStatus />
            <ThemeToggle />
            <a
              href="https://github.com/DJ-InfinityCoder/RAG"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-all text-xs sm:text-sm font-semibold text-[var(--text-main)] hidden sm:flex items-center gap-2"
            >
              <Github className="w-4 h-4 text-[var(--text-main)]" />
              <span>Star on GitHub</span>
            </a>
            <Link
              href="/chat"
              className="h-9 px-5 rounded-full bg-[var(--accent-color)] text-white text-xs sm:text-sm font-bold hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Blueprint Landing Sections */}
      <main className="flex-1 flex flex-col space-y-4">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Social Proof / Trust Strip */}
        <TrustStrip />

        {/* 3. How It Works (3-Step RAG Loop) */}
        <HowItWorksSection />

        {/* 4. Feature Cards (4-Card Stack & Capabilities) */}
        <FeatureCardsSection />

        {/* 5. Live Demo / Interactive Preview */}
        <LiveDemoPreview />

        {/* 6. Under the Hood Architecture Pipeline */}
        <ArchitecturePipelineSection />

        {/* 7. CTA Banner */}
        <CtaBanner />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-10">
            <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-color)] to-amber-500 bg-clip-text text-transparent mb-3">
                AskDoc
              </div>
              <p className="text-[var(--text-muted)] max-w-sm text-sm font-medium">
                An advanced RAG (Retrieval-Augmented Generation) platform built for seamless document interaction and intelligence.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-3 text-[var(--text-main)] text-base">Project</h4>
              <ul className="space-y-2 text-[var(--text-muted)] text-sm font-medium">
                <li><a href="https://github.com/DJ-InfinityCoder/RAG" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-color)] transition-colors">Source Code</a></li>
                <li><Link href="/chat" className="hover:text-[var(--accent-color)] transition-colors">Live Demo</Link></li>
                <li><Link href="/docs" className="hover:text-[var(--accent-color)] transition-colors">Documentation</Link></li>
                <li><Link href="/evaluation" className="hover:text-[var(--accent-color)] transition-colors">Evaluation Report</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-3 text-[var(--text-main)] text-base">Developer</h4>
              <ul className="space-y-2 text-[var(--text-muted)] text-sm font-medium">
                <li>
                  <a href="https://dilipmeghwal.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[var(--accent-color)] transition-colors">
                    <Globe className="w-4 h-4" /> Portfolio
                  </a>
                </li>
                <li>
                  <a href="https://github.com/DJ-InfinityCoder" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[var(--accent-color)] transition-colors">
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/in/dilipmeghwal13/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[var(--accent-color)] transition-colors">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[var(--text-muted)] font-medium">
            <p>© 2026 AskDoc. Built with ❤️ by Dilip Meghwal.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-[var(--text-main)] transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[var(--text-main)] transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
