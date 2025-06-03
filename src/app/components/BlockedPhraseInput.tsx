'use client';

import { KeyboardEvent } from 'react';

import { useFeed } from '../contexts/FeedContext';

export default function BlockedPhraseInput() {
  const {
    searchPhrase,
    setSearchPhrase,
    searchMatchTitle,
    setSearchMatchTitle,
    searchMatchContent,
    setSearchMatchContent,
    searchCaseSensitive,
    setSearchCaseSensitive,
    addBlockedPhrase,
  } = useFeed();

  // Handle Enter key press in the input field
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchPhrase.trim()) {
      e.preventDefault();
      addBlockedPhrase();
    }
  };

  return (
    <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-[var(--background)]">
      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
        Block Content by Phrase
      </h3>

      {/* Input field */}
      <div className="mb-3">
        <div className="relative">
          <input
            type="text"
            value={searchPhrase}
            onChange={(e) => setSearchPhrase(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter phrase to block... (highlights as you type)"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-[var(--background)] text-[var(--text)]"
          />
          <button
            onClick={() => addBlockedPhrase()}
            disabled={!searchPhrase.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-50"
            title="Add phrase to block list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
        <label className="flex items-center space-x-1 cursor-pointer">
          <input
            type="checkbox"
            checked={searchMatchTitle}
            onChange={(e) => setSearchMatchTitle(e.target.checked)}
            className="rounded text-blue-500 focus:ring-blue-500"
          />
          <span>Match Title</span>
        </label>

        <label className="flex items-center space-x-1 cursor-pointer">
          <input
            type="checkbox"
            checked={searchMatchContent}
            onChange={(e) => setSearchMatchContent(e.target.checked)}
            className="rounded text-blue-500 focus:ring-blue-500"
          />
          <span>Match Content</span>
        </label>

        <label className="flex items-center space-x-1 cursor-pointer">
          <input
            type="checkbox"
            checked={searchCaseSensitive}
            onChange={(e) => setSearchCaseSensitive(e.target.checked)}
            className="rounded text-blue-500 focus:ring-blue-500"
          />
          <span>Case Sensitive</span>
        </label>
      </div>
    </div>
  );
}
