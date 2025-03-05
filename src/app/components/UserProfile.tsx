'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

type UserProfileProps = {
  user: User;
  onSignOut: () => void;
};

export default function UserProfile({ user, onSignOut }: UserProfileProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#user-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <div className="relative" id="user-dropdown">
      <button
        className="flex items-center text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          {user.email?.[0].toUpperCase() || 'U'}
        </div>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
            {user.email}
          </div>

          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
