'use client';

import { useEffect, useState } from 'react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'lastVisit' | 'feed' | 'info';
}

export default function DebugLog() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Listen for debug log events
    const handleDebugLog = (event: CustomEvent) => {
      const { message, type } = event.detail;
      const timestamp = new Date().toISOString();

      setLogEntries((prev) =>
        [{ timestamp, message, type: type || 'info' }, ...prev].slice(0, 100)
      ); // Keep only the last 100 entries to avoid memory issues
    };

    // Add event listener
    window.addEventListener('debug-log' as any, handleDebugLog as EventListener);

    // Function to dump all lastVisit data sources
    const dumpAllLastVisitData = async () => {
      try {
        // Get localStorage value
        const localStorageVal = localStorage.getItem('last_visit_time');
        window.emitDebugLog(
          `INIT STATUS - localStorage lastVisit: ${localStorageVal || 'null'}`,
          'lastVisit'
        );

        // Get Supabase value via API
        const response = await fetch('/api/debug/lastVisit', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }).catch((_err) => {
          // API doesn't exist yet, just log it
          window.emitDebugLog(`INIT STATUS - No debug API endpoint for Supabase data`, 'lastVisit');
          return null;
        });

        if (response && response.ok) {
          const data = await response.json();
          window.emitDebugLog(
            `INIT STATUS - Supabase lastVisit: ${JSON.stringify(data)}`,
            'lastVisit'
          );
        }
      } catch (err) {
        window.emitDebugLog(
          `Error getting lastVisit state: ${err instanceof Error ? err.message : String(err)}`,
          'lastVisit'
        );
      }
    };

    // Dump all lastVisit data on component mount
    setTimeout(() => {
      window.emitDebugLog('--------- DEBUG LOG INITIALIZED ---------', 'info');
      dumpAllLastVisitData();
    }, 1000);

    // Clean up
    return () => {
      window.removeEventListener('debug-log' as any, handleDebugLog as EventListener);
    };
  }, []);

  // Function to emit log events that can be called from anywhere
  if (typeof window !== 'undefined' && !window.hasOwnProperty('emitDebugLog')) {
    (window as any).emitDebugLog = (message: string, type?: 'lastVisit' | 'feed' | 'info') => {
      const event = new CustomEvent('debug-log', {
        detail: { message, type: type || 'info' },
      });
      window.dispatchEvent(event);
    };
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-bl-md z-50"
      >
        Show Debug
      </button>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-800 text-white text-xs p-2 max-h-64 overflow-y-auto z-50 border-b border-gray-600">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">Debug Log ({logEntries.length} entries)</h3>
        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">
          Hide
        </button>
      </div>
      <div className="space-y-1">
        {logEntries.map((entry, index) => (
          <div
            key={index}
            className={`font-mono ${
              entry.type === 'lastVisit'
                ? 'text-yellow-400'
                : entry.type === 'feed'
                  ? 'text-green-400'
                  : 'text-gray-300'
            }`}
          >
            [{entry.timestamp.split('T')?.[1]?.split('.')?.[0] || ''}] {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// Add TypeScript declarations for our global functions
declare global {
  interface Window {
    emitDebugLog: (message: string, type?: 'lastVisit' | 'feed' | 'info') => void;
  }
}
