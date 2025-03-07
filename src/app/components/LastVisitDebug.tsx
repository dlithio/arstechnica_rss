'use client';

import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

import { useFeed } from '../contexts/FeedContext';
import { getDebugLogs, getLastVisitFromLocalStorage } from '../services/lastVisitService';

export default function LastVisitDebug() {
  const { lastVisit: contextLastVisit } = useFeed();

  const [debugInfo, setDebugInfo] = useState<{
    currentTime: string;
    localStorageLastVisit: string;
    supabaseLastVisit: string;
    contextLastVisit: string;
    userId: string;
    logs: string[];
  }>({
    currentTime: 'Loading...',
    localStorageLastVisit: 'Loading...',
    supabaseLastVisit: 'Loading...',
    contextLastVisit: 'Loading...',
    userId: 'Not logged in',
    logs: [],
  });

  useEffect(() => {
    async function fetchDebugInfo() {
      // Get current time
      const now = new Date();

      // Get localStorage lastVisit
      const localLastVisit = getLastVisitFromLocalStorage();

      // Get debug logs
      const logs = getDebugLogs();

      // Get user and Supabase lastVisit
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let supabaseLastVisit = 'Not logged in';
      let userId = 'Not logged in';

      if (user) {
        userId = user.id;

        const { data, error } = await supabase
          .from('last_visit')
          .select('last_visited_at')
          .eq('user_id', user.id)
          .order('last_visited_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          supabaseLastVisit = `Error: ${error.message}`;
        } else if (data) {
          supabaseLastVisit = data.last_visited_at;
        } else {
          supabaseLastVisit = 'No data found';
        }
      }

      setDebugInfo({
        currentTime: now.toISOString(),
        localStorageLastVisit: localLastVisit ? localLastVisit.toISOString() : 'null',
        supabaseLastVisit,
        contextLastVisit: contextLastVisit ? contextLastVisit.toISOString() : 'null',
        userId,
        logs,
      });
    }

    fetchDebugInfo();

    // Set up interval to update every 3 seconds
    const interval = setInterval(fetchDebugInfo, 3000);
    return () => clearInterval(interval);
  }, [contextLastVisit]);

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 p-4 mb-4 rounded-md text-black dark:text-white text-sm">
      <h2 className="font-bold mb-2">Last Visit Debug Info:</h2>
      <ul className="mb-4">
        <li>
          <strong>Current Time:</strong> {debugInfo.currentTime}
        </li>
        <li>
          <strong>LocalStorage LastVisit:</strong> {debugInfo.localStorageLastVisit}
        </li>
        <li>
          <strong>Supabase LastVisit:</strong> {debugInfo.supabaseLastVisit}
        </li>
        <li>
          <strong>Context LastVisit:</strong> {debugInfo.contextLastVisit}
        </li>
        <li>
          <strong>User ID:</strong> {debugInfo.userId}
        </li>
      </ul>

      <div>
        <h3 className="font-bold mb-1">Debug Logs:</h3>
        <div className="bg-white dark:bg-gray-800 p-2 rounded-md max-h-60 overflow-y-auto">
          {debugInfo.logs.length > 0 ? (
            <ul className="list-disc pl-5">
              {debugInfo.logs.map((log, index) => (
                <li key={index} className="text-xs mb-1">
                  {log}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs italic">
              No logs yet. Actions that update last visit will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
