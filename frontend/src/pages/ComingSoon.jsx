import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function ComingSoon({ title, description }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem 2rem' }}>
        <PackageOpen className="w-16 h-16 text-blue-500 mb-6 mx-auto" style={{ opacity: 0.8 }} />
        <h1 className="page-title">{title}</h1>
        <p className="text-muted" style={{ lineHeight: 1.6, marginTop: '1rem' }}>
          {description}
        </p>
        <div style={{ marginTop: '2rem', display: 'inline-block' }} className="status-badge warning">
          Prototype Module Placeholder
        </div>
      </div>
    </div>
  );
}
