'use client';

import { useEffect, useState } from 'react';

import { FeedProvider } from '../contexts/FeedContext';
import BlockedCategoriesManager from './BlockedCategoriesManager';
import FeedControls from './FeedControls';
import FeedList from './FeedList';
import FilterStatusInfo from './FilterStatusInfo';
import HelpText from './HelpText';
import StagedCategoriesBanner from './StagedCategoriesBanner';
import ThemeToggle from './ThemeToggle';

/**
 * Internal component that handles the actual rendering of the RSS feed viewer
 * Uses a mounted state to prevent hydration mismatch issues with theme/localStorage
 */
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
      <FilterStatusInfo />
      <ThemeToggle />
      <HelpText />
    </div>
  );
}

/**
 * Main RSS feed viewer component that wraps content with FeedProvider
 */
export default function RSSFeedViewer() {
  return (
    <FeedProvider>
      <RSSFeedViewerContent />
    </FeedProvider>
  );
}
