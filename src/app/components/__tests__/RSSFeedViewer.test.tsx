import React from 'react';
import { render, screen } from '@testing-library/react';
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

  it('renders without crashing', () => {
    render(<RSSFeedViewer />);
    // Component renders successfully if no error is thrown
  });

  it('shows loading state', () => {
    render(<RSSFeedViewer />);
    expect(screen.getByText(/Loading feed/i)).toBeInTheDocument();
  });
});
