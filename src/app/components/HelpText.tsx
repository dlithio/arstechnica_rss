'use client';

export default function HelpText() {
  return (
    <div
      className="mt-12 mb-4 p-4 rounded-lg text-center text-sm border transition-colors"
      style={{
        backgroundColor: 'var(--blocked-bg)',
        color: 'var(--blocked-text)',
        borderColor: 'var(--blocked-border)',
      }}
    >
      <p>
        <strong>Tip:</strong> Click on article category bubbles to block unwanted topics or enter a
        phrase to block above. Sign in to sync your blocked categories and article seen status
        across devices.
      </p>
    </div>
  );
}
