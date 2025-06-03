import { act, render } from '@testing-library/react';
import React from 'react';

import RSSFeedViewer from '../RSSFeedViewer';

/**
 * Mocks for RSSFeedViewer tests
 */

// Theme provider mock
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

// Auth context mock
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

// localStorage utilities mock
jest.mock('../../utils/localStorage', () => ({
  getItem: jest.fn().mockImplementation(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  STORAGE_KEYS: {
    BLOCKED_CATEGORIES: 'rssViewerBlockedCategories',
    BLOCKED_PHRASES: 'rssViewerBlockedPhrases',
  },
}));

// blockedCategories service mock
jest.mock('../../services/blockedCategories', () => ({
  getLatestBlockedCategories: jest.fn().mockResolvedValue([]),
  saveBlockedCategories: jest.fn().mockResolvedValue(undefined),
}));

// blockedPhrases service mock
jest.mock('../../services/blockedPhrases', () => ({
  getLatestBlockedPhrases: jest.fn().mockResolvedValue([]),
  saveBlockedPhrase: jest.fn().mockResolvedValue(undefined),
  deleteBlockedPhrase: jest.fn().mockResolvedValue(undefined),
  clearBlockedPhrases: jest.fn().mockResolvedValue(undefined),
  findPhraseMatches: jest.fn().mockReturnValue([]),
  PhraseMatch: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ items: [] }),
  })
) as jest.Mock;

// Child component mocks
jest.mock('../FeedItem', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="feed-item" />),
}));

jest.mock('../ThemeToggle', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="theme-toggle" />),
}));

jest.mock('../StagedCategoriesBanner', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="staged-categories-banner" />),
}));

jest.mock('../BlockedCategoriesManager', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="blocked-categories-manager" />),
}));

jest.mock('../BlockedPhrasesManager', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="blocked-phrases-manager" />),
}));

describe('RSSFeedViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(<RSSFeedViewer />);
    });
    // Component renders successfully if no error is thrown
  });

  it('initializes correctly', async () => {
    await act(async () => {
      render(<RSSFeedViewer />);
    });
    // Just verify component renders without errors
    expect(document.querySelector('.w-full')).toBeInTheDocument();
  });

  it('fetches RSS feed on mount', async () => {
    await act(async () => {
      render(<RSSFeedViewer />);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/fetchFilteredRSS', expect.any(Object));
  });
});
