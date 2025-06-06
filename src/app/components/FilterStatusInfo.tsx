'use client';

import { useFeed } from '../contexts/FeedContext';

export default function FilterStatusInfo() {
  const { feed } = useFeed();

  const hiddenItemsCount = feed?.filterStats?.blockedCount || 0;

  // Only show if there are actually items being hidden by filters
  if (hiddenItemsCount <= 0) {
    return null;
  }

  // Stats about filter status

  return (
    <div className="mt-6 mb-2 p-3 rounded-lg text-center text-sm border bg-[var(--blocked-bg)] text-[var(--blocked-text)] border-[var(--blocked-border)]">
      <p>
        <strong>
          {hiddenItemsCount} {hiddenItemsCount === 1 ? 'item' : 'items'} hidden
        </strong>{' '}
        by your filters.
      </p>
    </div>
  );
}
