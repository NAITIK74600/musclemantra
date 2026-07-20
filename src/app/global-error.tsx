'use client';

import { useEffect } from 'react';

/**
 * Top-level fallback that also catches errors thrown in the root layout itself.
 * Must render its own <html>/<body> because it replaces the entire document.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          color: '#F5F5F5',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 440 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 15, opacity: 0.6, lineHeight: 1.6, margin: '0 0 28px' }}>
            A temporary error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#FF6B00',
              color: '#fff',
              border: 'none',
              padding: '13px 28px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
