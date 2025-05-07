'use client';

import { useCallback, useEffect, useState } from 'react';

import { FeedItem as FeedItemType } from '../../types/feed';
import { PhraseMatch } from '../services/blockedPhrases';

type FeedItemProps = {
  item: FeedItemType;
  blockedCategories: string[];
  stagedCategories: string[];
  stageCategory: (category: string) => void;
  lastVisit: Date | null;
  searchPhrase: string;
  getPhraseMatches: (text: string | undefined, isTitle: boolean) => PhraseMatch[];
};

export default function FeedItem({
  item,
  blockedCategories,
  stagedCategories,
  stageCategory,
  lastVisit,
  searchPhrase,
  getPhraseMatches,
}: FeedItemProps) {
  const [titleWithHighlights, setTitleWithHighlights] = useState<React.ReactNode>(item.title);
  const [contentWithHighlights, setContentWithHighlights] = useState<React.ReactNode>(item.contentSnippet);
  
  // Highlight text based on current search phrase input (live preview)
  const highlightSearchPhrase = useCallback((text: string, isTitle: boolean) => {
    if (!searchPhrase?.trim()) {
      isTitle ? setTitleWithHighlights(text) : setContentWithHighlights(text);
      return;
    }
    
    // Simple case-insensitive search
    const parts = text.split(new RegExp(`(${searchPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    
    const highlighted = (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchPhrase?.toLowerCase() ? 
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-700">{part}</mark> : 
            part
        )}
      </>
    );
    
    isTitle ? setTitleWithHighlights(highlighted) : setContentWithHighlights(highlighted);
  }, [searchPhrase]);
  
  // Highlight text based on blocked phrases
  const highlightBlockedPhrases = useCallback((text: string, matches: PhraseMatch[], isTitle: boolean) => {
    // Sort all match indexes from all phrases
    const allPositions: Array<{index: number, length: number}> = [];
    
    matches.forEach(match => {
      match.indexes.forEach(index => {
        allPositions.push({
          index,
          length: match.phrase.phrase.length
        });
      });
    });
    
    // Sort positions by index
    allPositions.sort((a, b) => a.index - b.index);
    
    // Merge overlapping highlight positions
    const mergedPositions: Array<{start: number, end: number}> = [];
    
    for (const pos of allPositions) {
      const currentEnd = pos.index + pos.length;
      
      if (mergedPositions.length === 0) {
        mergedPositions.push({ start: pos.index, end: currentEnd });
      } else {
        // Since we've already checked that length is > 0, this is safe to assert
        const lastPosition = mergedPositions[mergedPositions.length - 1]!;
        if (pos.index > lastPosition.end) {
          mergedPositions.push({ start: pos.index, end: currentEnd });
        } else {
          lastPosition.end = Math.max(lastPosition.end, currentEnd);
        }
      }
    }
    
    // Build highlighted content
    let lastIndex = 0;
    const parts: React.ReactNode[] = [];
    
    mergedPositions.forEach((pos, i) => {
      // Add text before highlight
      if (pos.start > lastIndex) {
        parts.push(text.substring(lastIndex, pos.start));
      }
      
      // Add highlighted part
      parts.push(
        <mark key={`mark-${i}`} className="bg-yellow-200 dark:bg-yellow-700">
          {text.substring(pos.start, pos.end)}
        </mark>
      );
      
      lastIndex = pos.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    isTitle ? setTitleWithHighlights(<>{parts}</>) : setContentWithHighlights(<>{parts}</>);
  }, []);

  // Update highlighting when search phrase changes
  useEffect(() => {
    // Handle title highlighting
    if (item.title) {
      if (searchPhrase?.trim()) {
        // Simple highlight for the search input (live preview)
        highlightSearchPhrase(item.title, true);
      } else {
        // Check for matches against saved blocked phrases
        const titleMatches = getPhraseMatches(item.title, true);
        if (titleMatches.length > 0) {
          highlightBlockedPhrases(item.title, titleMatches, true);
        } else {
          setTitleWithHighlights(item.title);
        }
      }
    }
    
    // Handle content highlighting
    if (item.contentSnippet) {
      if (searchPhrase?.trim()) {
        // Simple highlight for the search input (live preview)
        highlightSearchPhrase(item.contentSnippet, false);
      } else {
        // Check for matches against saved blocked phrases
        const contentMatches = getPhraseMatches(item.contentSnippet, false);
        if (contentMatches.length > 0) {
          highlightBlockedPhrases(item.contentSnippet, contentMatches, false);
        } else {
          setContentWithHighlights(item.contentSnippet);
        }
      }
    }
  }, [
    item, 
    searchPhrase, 
    getPhraseMatches, 
    highlightSearchPhrase, 
    highlightBlockedPhrases, 
    setTitleWithHighlights, 
    setContentWithHighlights
  ]);

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
          {titleWithHighlights}
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
      {item.contentSnippet && <p className="text-[var(--text-primary)]">{contentWithHighlights}</p>}
    </article>
  );
}