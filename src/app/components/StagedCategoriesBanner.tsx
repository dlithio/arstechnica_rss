'use client';

import { useFeed } from '../contexts/FeedContext';

export default function StagedCategoriesBanner() {
  const { stagedCategories, unstageCategoryToggle, setStagedCategories, applyBlockedCategories } =
    useFeed();

  if (stagedCategories.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 mb-4 p-3 bg-amber-100 dark:bg-amber-900/40 rounded-md shadow-md">
      <div className="flex flex-wrap gap-1 mb-2">
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Categories staged for blocking:
        </span>
        {stagedCategories.map((category, index) => (
          <span
            key={index}
            className="inline-flex items-center bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80"
            onClick={() => unstageCategoryToggle(category)}
            title="Click to remove from staging"
          >
            {category}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setStagedCategories([])}
          className="text-xs text-amber-800 dark:text-amber-200 bg-amber-200 dark:bg-amber-800 px-3 py-1 rounded hover:opacity-80"
        >
          Cancel
        </button>
        <button
          onClick={applyBlockedCategories}
          className="text-xs text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
        >
          Apply Blocks
        </button>
      </div>
    </div>
  );
}
