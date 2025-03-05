import React from 'react';
import { render, act } from '@testing-library/react';
import RSSFeedViewer from '../RSSFeedViewer';

// Mock next/themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

// Mock context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

// Mock our localStorage utility
jest.mock('../../utils/localStorage', () => ({
  getItem: jest.fn().mockImplementation(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  STORAGE_KEYS: {
    FEED_DATA: 'rssViewerFeedData',
    BLOCKED_CATEGORIES: 'rssViewerBlockedCategories',
  },
}));

// Mock blockedCategories service
jest.mock('../../services/blockedCategories', () => ({
  getLatestBlockedCategories: jest.fn().mockResolvedValue([]),
  saveBlockedCategories: jest.fn().mockResolvedValue(undefined),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ items: [] }),
  })
) as jest.Mock;

// Mock child components
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

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/fetchRSS'));
  });
});
