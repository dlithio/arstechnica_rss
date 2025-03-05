import React from 'react';
import { render, act } from '@testing-library/react';
import RSSFeedViewer from '../RSSFeedViewer';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ items: [] }),
  })
) as jest.Mock;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('RSSFeedViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
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
});
