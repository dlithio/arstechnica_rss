'use client';

import { FeedItem as FeedItemType } from '../../types/feed';

type FeedItemProps = {
  item: FeedItemType;
  blockedCategories: string[];
  stagedCategories: string[];
  stageCategory: (category: string) => void;
  lastVisit: Date | null;
};

export default function FeedItem({
  item,
  blockedCategories,
  stagedCategories,
  stageCategory,
  lastVisit,
}: FeedItemProps) {
  const isPreviouslySeen = (): boolean => {
    if (!lastVisit || !item.pubDate) return false;
    const pubDate = new Date(item.pubDate);
    return pubDate < lastVisit;
  };

  const seen = isPreviouslySeen();
  return (
    <article
      className={`py-4 ${seen ? 'opacity-60 hover:opacity-100 transition-opacity border-l-4 border-l-gray-300 dark:border-l-gray-600 pl-2' : ''}`}
    >
      <h3 className="text-xl font-semibold mb-2 flex items-center">
        {seen && (
          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded mr-2">
            Seen
          </span>
        )}
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`hover:text-[var(--blue-hover)] hover:underline ${seen ? 'text-[var(--text-secondary)]' : 'text-[var(--blue-link)]'}`}
        >
          {item.title}
        </a>
      </h3>
      {item.pubDate && (
        <div className="mb-2">
          <p className="text-sm text-[var(--text-secondary)]">
            {new Date(item.pubDate).toLocaleDateString()}
            {item.creator && ` • ${item.creator}`}
          </p>

          {item.categories && item.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.categories.map((category, i) => (
                <span
                  key={i}
                  className={`inline-block text-xs px-2 py-0.5 rounded-full cursor-pointer ${
                    blockedCategories.includes(category)
                      ? 'bg-[var(--blocked-tag-bg)] text-[var(--blocked-tag-text)]'
                      : stagedCategories.includes(category)
                        ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200'
                        : 'bg-[var(--category-bg)] text-[var(--category-text)] hover:opacity-80'
                  }`}
                  onClick={() => stageCategory(category)}
                  title="Click to stage this category for blocking"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {item.contentSnippet && <p className="text-[var(--text-primary)]">{item.contentSnippet}</p>}
    </article>
  );
}
