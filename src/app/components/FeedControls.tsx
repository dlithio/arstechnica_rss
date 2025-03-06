'use client';

import { useFeed } from '../contexts/FeedContext';

export default function FeedControls() {
  const { loading, error, feed, fetchFeed } = useFeed();

  return (
    <>
      {loading && <p className="text-secondary">Loading...</p>}
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      {!loading && !error && !feed && (
        <button
          onClick={() => fetchFeed()}
          className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Reload Feed
        </button>
      )}
    </>
  );
}
