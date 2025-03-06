'use client';

import { useFeed } from '../contexts/FeedContext';
import { formatRelativeTime } from '../utils/dateUtils';
import FeedItemComponent from './FeedItem';

export default function FeedList() {
  const {
    feed,
    filteredItems,
    blockedCategories,
    stagedCategories,
    stageCategory,
    lastVisit,
    clearBlockedCategories,
  } = useFeed();

  if (!feed) return null;

  return (
    <div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {filteredItems.map((item, index) => (
          <FeedItemComponent
            key={index}
            item={item}
            blockedCategories={blockedCategories}
            stagedCategories={stagedCategories}
            stageCategory={stageCategory}
            lastVisit={lastVisit}
          />
        ))}
      </div>

      {feed.items.length > 0 && filteredItems.length === 0 && (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-[var(--text-secondary)]">
            All items are filtered due to blocked categories.
          </p>
          <button
            onClick={clearBlockedCategories}
            className="mt-2 text-[var(--blue-link)] hover:text-[var(--blue-hover)] hover:underline text-sm"
          >
            Clear all filters
          </button>
        </div>
      )}

      {lastVisit && (
        <div className="text-center my-6 py-2 border-t border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-[var(--text-secondary)]">
            Last Visit: {formatRelativeTime(lastVisit)}
          </span>
        </div>
      )}
    </div>
  );
}
