'use client';

import dynamic from "next/dynamic";

// Import the RSS feed viewer with dynamic import to avoid SSR issues
const RSSFeedViewer = dynamic(() => import("./components/RSSFeedViewer"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="min-h-screen p-4">
      <RSSFeedViewer />
    </div>
  );
}
