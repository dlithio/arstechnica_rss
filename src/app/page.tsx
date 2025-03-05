'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import UserProfile from './components/UserProfile';

// Import the RSS feed viewer with dynamic import to avoid SSR issues
const RSSFeedViewer = dynamic(() => import('./components/RSSFeedViewer'), {
  ssr: false,
});

export default function Home() {
  const { user, isLoading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Track previous auth state to detect login event
  const [prevAuthState, setPrevAuthState] = useState<{ user: boolean }>({ user: false });

  // Set mounted state after component mounts to avoid hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect actual login event (not page refresh)
  useEffect(() => {
    if (!isLoading) {
      const wasLoggedIn = prevAuthState.user;
      const isLoggedIn = !!user;

      // Only set justLoggedIn if user transitioned from logged out to logged in
      if (!wasLoggedIn && isLoggedIn) {
        setJustLoggedIn(true);

        // Reset after 3 seconds (matching the component's timeout)
        const timer = setTimeout(() => {
          setJustLoggedIn(false);
        }, 3000);

        return () => clearTimeout(timer);
      }

      // Update previous auth state
      setPrevAuthState({ user: isLoggedIn });
    }
  }, [user, isLoading, prevAuthState]);

  // Don't render anything until component is mounted and auth state is loaded
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ars Technica Feed</h1>

        {user ? (
          <UserProfile user={user} onSignOut={signOut} />
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Sign In
          </button>
        )}
      </header>

      {/* Main content */}
      <RSSFeedViewer showSyncMessage={justLoggedIn} />

      {/* Auth modal */}
      {showAuthModal && !user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <AuthForm onAuthSuccess={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
