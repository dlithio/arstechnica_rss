'use client';

import { useState } from 'react';

import { useFeed } from '../contexts/FeedContext';

export default function BlockedPhrasesManager() {
  const {
    blockedPhrases,
    removeBlockedPhrase,
    clearBlockedPhrases
  } = useFeed();

  const [isBlockedPhrasesOpen, setIsBlockedPhrasesOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Toggle blocked phrases visibility
  const toggleBlockedPhrases = () => {
    setIsBlockedPhrasesOpen(!isBlockedPhrasesOpen);
  };

  // Handle click on Clear All button
  const handleClearAllClick = (e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowClearConfirm(true);
  };

  // Handle canceling the clear confirmation
  const handleCancelClear = (e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowClearConfirm(false);
  };

  // Handle confirming the clear
  const handleConfirmClear = async (e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await clearBlockedPhrases();
    setShowClearConfirm(false);
  };

  // If there are no blocked phrases, don't render anything
  if (!blockedPhrases?.length) {
    return null;
  }

  // Stats moved to FilterStatusInfo component

  return (
    <div className="mt-4 rounded-lg border border-[var(--blocked-border)] bg-[var(--blocked-bg)] shadow-sm">
      {/* Header - always visible */}
      <div
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-opacity-80"
        onClick={toggleBlockedPhrases}
      >
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-[var(--blocked-text)]">
            Blocked Phrases ({blockedPhrases.length})
          </h3>
        </div>

        {/* Chevron icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`text-[var(--blocked-text)] transition-transform duration-300 ${isBlockedPhrasesOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Collapsible content */}
      <div
        style={{
          maxHeight: isBlockedPhrasesOpen ? '500px' : '0',
          opacity: isBlockedPhrasesOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.3s ease',
        }}
      >
        <div className="px-4 pb-4">
          {/* List of blocked phrases */}
          <div className="mb-4">
            <h4 className="text-xs text-[var(--text-secondary)] mb-2">Current blocked phrases:</h4>
            <div className="flex flex-wrap gap-1 mb-2">
              {blockedPhrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="inline-flex items-center bg-[var(--blocked-tag-bg)] text-[var(--blocked-tag-text)] text-xs px-2 py-0.5 rounded-full"
                >
                  <span className="mr-1">
                    {phrase.phrase} 
                    <span className="text-[0.65rem] opacity-60 ml-1">
                      {phrase.match_title && phrase.match_content ? '(all)' : 
                        phrase.match_title ? '(title)' : '(content)'}
                      {phrase.case_sensitive ? ' [Aa]' : ''}
                    </span>
                  </span>
                  <button
                    onClick={() => removeBlockedPhrase(phrase.id!)}
                    title="Remove phrase"
                    className="hover:opacity-80"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Clear All Button */}
          <div className="flex justify-center">
            {!showClearConfirm ? (
              <button
                className="text-xs text-[var(--blocked-text)] hover:opacity-80 px-3 py-1 border border-[var(--blocked-border)] rounded"
                onClick={handleClearAllClick}
              >
                Clear All Blocked Phrases
              </button>
            ) : (
              <div className="text-center">
                <p className="text-xs text-[var(--blocked-text)] mb-2">
                  Are you sure you want to clear all blocked phrases?
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={handleConfirmClear}
                  >
                    Yes, Clear All
                  </button>
                  <button
                    className="text-xs bg-[var(--blocked-tag-bg)] text-[var(--blocked-text)] px-3 py-1 rounded hover:opacity-80"
                    onClick={handleCancelClear}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}