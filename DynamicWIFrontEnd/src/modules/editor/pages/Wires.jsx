import { useState } from 'react';
import './EPNs.css';

export default function Wires() {
  const [wires, setWires] = useState([]);

  return (
    <div className="epns-page">
      <div className="epns-header">
        <h1 className="epns-title">Wires</h1>
        <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="epns-import-btn" disabled>
              Import Excel file
            </button>
            <button type="button" className="epns-download-btn" disabled>
              Download JSON
            </button>
        </div>
      </div>

      <div className="epns-grid">
        <div className="epns-empty">Wires coming soon...</div>
      </div>
    </div>
  );
}
