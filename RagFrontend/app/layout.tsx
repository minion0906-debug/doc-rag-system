import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Providers } from "@/components/Providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://askdoc.dilip.website"),
  title: {
    default: "AskDoc | Enterprise-Grade Document AI Chat",
    template: "%s | AskDoc",
  },
  description: "Advanced Retrieval-Augmented Generation (RAG) document intelligence platform powered by Google Gemini and Pinecone. Upload documents and chat with your data instantly.",
  keywords: ["AskDoc", "RAG", "AI", "Chat", "Document Analysis", "PDF Chat", "Gemini", "Pinecone", "Vector Database", "Next.js", "FastAPI"],
  authors: [{ name: "Dilip Meghwal", url: "https://dilipmeghwal.in" }],
  creator: "Dilip Meghwal",
  publisher: "Dilip Meghwal",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://askdoc.dilip.website",
    title: "AskDoc | Enterprise-Grade Document AI Chat",
    description: "Chat with your documents using advanced AI. Powered by Google Gemini and Pinecone vector search.",
    siteName: "AskDoc",
    images: [
      {
        url: "/djraglogo.png",
        width: 1200,
        height: 630,
        alt: "AskDoc - Advanced RAG Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AskDoc | Enterprise-Grade Document AI Chat",
    description: "Chat with your documents using advanced AI. Powered by Google Gemini and Pinecone vector search.",
    images: ["/djraglogo.png"],
    creator: "@dilip_maurya",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${cormorantGaramond.variable}`}>
      <body
        suppressHydrationWarning
        className={`${jakarta.variable} ${cormorantGaramond.variable} antialiased font-sans bg-[var(--bg-main)] text-[var(--text-main)]`}
      >
        <Providers>
          <ThemeProvider>
            <OfflineBanner />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
