// This file is deprecated in favor of Next.js structure (app/ directory).
// Keeping a default export to prevent build errors in environments still referencing index.tsx.

import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Application Migrated to Next.js</h1>
      <p>Please run the application using <code>npm run dev</code> and access it at localhost:3000.</p>
    </div>
  );
}