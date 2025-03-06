'use client';

import { useEffect, useState } from 'react';

import { FeedProvider } from '../contexts/FeedContext';
import BlockedCategoriesManager from './BlockedCategoriesManager';
import FeedControls from './FeedControls';
import FeedList from './FeedList';
import HelpText from './HelpText';
import StagedCategoriesBanner from './StagedCategoriesBanner';
import ThemeToggle from './ThemeToggle';

function RSSFeedViewerContent() {
  const [mounted, setMounted] = useState(false);

  // After mounting, render is safe
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, don't render to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto relative pb-4">
      <FeedControls />
      <StagedCategoriesBanner />
      <FeedList />
      <BlockedCategoriesManager />
      <ThemeToggle />
      <HelpText />
    </div>
  );
}

export default function RSSFeedViewer() {
  return (
    <FeedProvider>
      <RSSFeedViewerContent />
    </FeedProvider>
  );
}
