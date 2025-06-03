'use client';

import { useFeed } from '../contexts/FeedContext';
import { formatRelativeTime } from '../utils/dateUtils';
import BlockedPhraseInput from './BlockedPhraseInput';
import BlockedPhrasesManager from './BlockedPhrasesManager';
import FeedItemComponent from './FeedItem';

export default function FeedList() {
  const {
    feed,
    filteredItems,
    blockedCategories,
    stagedCategories,
    stageCategory,
    lastVisit,
    searchPhrase,
    getPhraseMatches,
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
            searchPhrase={searchPhrase}
            getPhraseMatches={getPhraseMatches}
          />
        ))}
      </div>

      {lastVisit && (
        <div className="text-center my-6 py-2 border-t border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-[var(--text-secondary)]">
            Last Visit: {formatRelativeTime(lastVisit)}
          </span>
        </div>
      )}

      {/* Add the BlockedPhraseInput between last visit and blocked phrases */}
      <BlockedPhraseInput />

      {/* Add the BlockedPhrasesManager component showing current phrases */}
      <BlockedPhrasesManager />
    </div>
  );
}
