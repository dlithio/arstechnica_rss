'use client';

import Image from "next/image";
import dynamic from "next/dynamic";

// Import the RSS feed viewer with dynamic import to avoid SSR issues
const RSSFeedViewer = dynamic(() => import("./components/RSSFeedViewer"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col items-center mb-12">
        <Image
          className="dark:invert mb-6"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-3xl font-bold mb-2">RSS Feed Viewer</h1>
        <p className="text-center text-gray-600 max-w-xl">
          Paste any RSS feed URL below to view its contents.
        </p>
      </header>
      
      <main className="mb-16">
        <RSSFeedViewer />
      </main>
      
      <footer className="flex gap-6 flex-wrap items-center justify-center border-t border-gray-200 pt-8">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-gray-600"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn Next.js
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-gray-600"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          View Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-gray-600"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Next.js Docs
        </a>
      </footer>
    </div>
  );
}
