import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

import { BlockedPhrase } from '@/app/services/blockedPhrases';
import { FeedItem } from '@/types/feed';

/**
 * Server-side filtering of RSS feed items
 * This ensures no unfiltered content ever reaches the client
 */
async function filterFeedItem(
  item: FeedItem,
  blockedCategories: string[],
  blockedPhrases: BlockedPhrase[]
): Promise<boolean> {
  // First check categories
  if (item.categories && item.categories.length > 0) {
    // If any category is blocked, filter out the item
    for (const category of item.categories) {
      if (blockedCategories.includes(category)) {
        console.log(`[Filter] Blocked by category "${category}": ${item.title}`);
        return false;
      }
    }
  }

  // Then check for blocked phrases
  for (const phrase of blockedPhrases) {
    // Check title if match_title is true
    if (phrase.match_title && item.title) {
      const searchText = phrase.case_sensitive ? item.title : item.title.toLowerCase();
      const searchTerm = phrase.case_sensitive ? phrase.phrase : phrase.phrase.toLowerCase();
      if (searchText.includes(searchTerm)) {
        console.log(`[Filter] Blocked by phrase "${phrase.phrase}" in title: ${item.title}`);
        return false;
      }
    }

    // Check content if match_content is true
    if (phrase.match_content && (item.content || item.contentSnippet)) {
      const content = item.content || item.contentSnippet || '';
      const searchText = phrase.case_sensitive ? content : content.toLowerCase();
      const searchTerm = phrase.case_sensitive ? phrase.phrase : phrase.phrase.toLowerCase();
      if (searchText.includes(searchTerm)) {
        console.log(`[Filter] Blocked by phrase "${phrase.phrase}" in content: ${item.title}`);
        return false;
      }
    }
  }

  return true;
}

/**
 * API route to fetch, parse, and filter an RSS feed
 * All filtering happens server-side to prevent race conditions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, userId, blockedCategoriesLocal, blockedPhrasesLocal } = body;
    
    console.log('[fetchFilteredRSS] Request received:', {
      url,
      userId,
      blockedCategoriesLocal,
      blockedPhrasesLocal
    });

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Step 1: Load filter lists (from database if userId provided, otherwise from client)
    let blockedCategories: string[] = [];
    let blockedPhrases: BlockedPhrase[] = [];

    // Always use the filters provided by the client
    // The client already handles loading from DB/localStorage
    blockedCategories = blockedCategoriesLocal || [];
    blockedPhrases = blockedPhrasesLocal || [];
    
    console.log('[fetchFilteredRSS] Using filters:', {
      blockedCategories: blockedCategories.length + ' categories',
      blockedPhrases: blockedPhrases.length + ' phrases',
      userId: userId || 'anonymous'
    });

    // Step 2: Fetch and parse RSS feed
    const parser = new Parser();
    const feed = await parser.parseURL(url);

    // Step 3: Filter items server-side
    console.log(`[fetchFilteredRSS] Filtering ${feed.items.length} items...`);
    const filteredItems = await Promise.all(
      feed.items.map(async (item) => {
        const feedItem: FeedItem = {
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || '',
          creator: item.creator || '',
          content: item.content || '',
          contentSnippet: item.contentSnippet || '',
          categories: item.categories || [],
        };

        const shouldInclude = await filterFeedItem(feedItem, blockedCategories, blockedPhrases);
        return shouldInclude ? feedItem : null;
      })
    );

    // Remove filtered items
    const finalItems = filteredItems.filter((item): item is FeedItem => item !== null);

    console.log(`[fetchFilteredRSS] Result: ${finalItems.length} items after filtering (blocked ${feed.items.length - finalItems.length})`);

    // Return filtered feed
    return NextResponse.json({
      title: feed.title,
      description: feed.description,
      items: finalItems,
      // Include filter counts for transparency
      filterStats: {
        totalItems: feed.items.length,
        filteredItems: finalItems.length,
        blockedCount: feed.items.length - finalItems.length,
      },
    });
  } catch (error) {
    console.error('Error in fetchFilteredRSS:', error);
    return NextResponse.json(
      { error: 'Failed to fetch or parse RSS feed' },
      { status: 500 }
    );
  }
}