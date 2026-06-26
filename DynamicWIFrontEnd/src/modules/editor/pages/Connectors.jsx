import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { getEPNs, findEPN } from './epnsStore';
import {
  getConnectors,
  addConnector,
  deleteConnector,
  findConnector,
  bulkAddConnectors
} from './connectorsStore';
import { DEFAULT_CAVITY_COLORS, CAVITY_COLOR_OPTIONS } from './CavityEditor/cavityEditorConstants';
import {
  getCavityFillStyle,
  getEmptyCheckBackground,
} from './CavityEditor/cavityEditorUtils';
import Modal from '../components/Modal';
import '../components/Modal.css';
import './EPNs/EPNs.css';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getMockImageName(name) {
  return `${name}.jpg`;
}

function prepareConnectorForExport(connector) {
  return {
    ...connector,
    photo: getMockImageName(connector.name),
  };
}

function mergeConnectorCoordinates(epnCoordinates, connectorCoordinates) {
  if (!epnCoordinates?.cavities) return connectorCoordinates || null;

  const connectorCavities = connectorCoordinates?.cavities || {};
  const cavities = Object.fromEntries(
    Object.entries(epnCoordinates.cavities).map(([key, cavity]) => {
      const colors = connectorCavities[key]?.colors || DEFAULT_CAVITY_COLORS;

      return [
        key,
        {
          ...cavity,
          colors,
          segmentCount:
            connectorCavities[key]?.segmentCount ||
            Math.max(1, colors.filter(Boolean).length),
        },
      ];
    })
  );

  return {
    ...epnCoordinates,
    cavities,
  };
}

function stripCoordinateColors(coordinates) {
  if (!coordinates?.cavities) return coordinates || null;

  return {
    ...coordinates,
    cavities: Object.fromEntries(
      Object.entries(coordinates.cavities).map(([key, cavity]) => [
        key,
        {
          x: cavity.x,
          y: cavity.y,
          size: cavity.size,
          shape: cavity.shape,
        },
      ])
    ),
  };
}

function getConnectorEditorRow(connector) {
  const epnObj = findEPN(connector.epn);

  return {
    ...connector,
    photo: epnObj?.photo || connector.photo,
    coordinates: mergeConnectorCoordinates(epnObj?.coordinates, connector.coordinates),
  };
}

export default function Connectors({ onCoordinateCavities }) {
  const [connectors, setConnectors] = useState(getConnectors());
  const [form, setForm] = useState({ name: '', epn: '' });
  const [error, setError] = useState('');
  const [modalConnector, setModalConnector] = useState(null);

  // Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingConnectors, setPendingConnectors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  function refresh() {
    setConnectors(getConnectors());
  }

  function handleAdd(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Connector name is required');
    if (!form.epn) return setError('EPN is required');
    if (findConnector(form.name.trim())) return setError('Connector name already exists');

    const epnObj = findEPN(form.epn);
    if (!epnObj) return setError('Selected EPN not found');

    const newConnector = {
      name: form.name.trim(),
      epn: epnObj.epn,
      photo: epnObj.photo,
      coordinates: stripCoordinateColors(epnObj.coordinates),
    };

    addConnector(newConnector);
    setForm({ name: '', epn: '' });
    refresh();
  }

  function handleDelete(name) {
    if (window.confirm('Delete this Connector?')) {
      deleteConnector(name);
      refresh();
    }
  }

  function handleFile(e) {
    setForm(f => ({
      ...f,
      photo: e.target.files[0],
    }));
  }

  function handleDownloadJson() {
    downloadJson('connectors.json', connectors.map(prepareConnectorForExport));
  }

  async function handleImportExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const connectorsMap = {};
        let lastConnector = "";
        let lastEPN = "";

        rows.forEach(row => {
          const keys = Object.keys(row);
          const name = String(row["Connector Name"] || row["connector"] || row[keys[0]] || "").trim();
          const epn = String(row["EPN"] || row["epn"] || row[keys[1]] || "").trim();
          const cavityId = String(row["Cavity ID"] || row["cavity"] || row[keys[2]] || "").trim();
          
          const currentName = name || lastConnector;
          const currentEPN = epn || lastEPN;

          if (!currentName || !currentEPN || !cavityId) return;

          lastConnector = currentName;
          lastEPN = currentEPN;

          if (!connectorsMap[currentName]) {
            connectorsMap[currentName] = {
              name: currentName,
              epn: currentEPN,
              cavities: {}
            };
          }

          const c1 = String(row["C1"] || "").trim().toUpperCase();
          const c2 = String(row["C2"] || "").trim().toUpperCase();
          const c3 = String(row["C3"] || "").trim().toUpperCase();

          const mapColor = (code) => {
            if (!code) return null;
            const opt = CAVITY_COLOR_OPTIONS.find(o => o.code === code);
            return opt ? opt.value : null;
          };

          connectorsMap[currentName].cavities[cavityId] = [
            mapColor(c1),
            mapColor(c2),
            mapColor(c3)
          ];
        });

        const results = Object.values(connectorsMap).map(conn => {
          const epnObj = findEPN(conn.epn);
          const alreadyExists = findConnector(conn.name);

          return {
            ...conn,
            epnExists: !!epnObj,
            alreadyExists: !!alreadyExists,
            epnNeedsCoordination: epnObj?.needsCoordination,
            cavityCount: Object.keys(conn.cavities).length
          };
        });

        setPendingConnectors(results);
        setIsImportModalOpen(true);
      } catch (err) {
        console.error('Import failed', err);
        alert('Failed to parse Excel file');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  }

  function confirmImport() {
    const toAdd = pendingConnectors
      .filter(p => p.epnExists && !p.alreadyExists)
      .map(p => {
        const epnObj = findEPN(p.epn);
        // Base coordinates from EPN, then overlay colors from Excel
        const baseCoords = stripCoordinateColors(epnObj.coordinates);
        const cavities = { ...baseCoords.cavities };

        Object.entries(p.cavities).forEach(([id, colors]) => {
          if (cavities[id]) {
            cavities[id] = {
              ...cavities[id],
              colors: colors,
              segmentCount: Math.max(1, colors.filter(Boolean).length)
            };
          }
        });

        return {
          name: p.name,
          epn: p.epn,
          photo: epnObj.photo,
          coordinates: {
            ...baseCoords,
            cavities
          }
        };
      });

    bulkAddConnectors(toAdd);
    setIsImportModalOpen(false);
    setPendingConnectors([]);
    refresh();
  }

  function renderCavities(coords) {
    if (!coords) return null;

    const refW = coords.imageWidth || 0;
    const refH = coords.imageHeight || 0;
    const usePercent = refW > 0 && refH > 0;

    const cavitiesObj = coords.cavities || coords;

    return Object.entries(cavitiesObj)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([key, c]) => {
        const rawColors = c.colors || null;
        const hasAnyColor = (rawColors || []).some(Boolean);
        const colors = rawColors || DEFAULT_CAVITY_COLORS;
        const segmentCount = Math.max(1, (colors || DEFAULT_CAVITY_COLORS).filter(Boolean).length);
        const baseStyle = usePercent
          ? {
              left: `${(c.x / refW) * 100}%`,
              top: `${(c.y / refH) * 100}%`,
              width: `${(c.size / refW) * 100}%`,
              height: `${(c.size / refH) * 100}%`,
            }
          : {
              left: c.x,
              top: c.y,
              width: c.size,
              height: c.size,
            };

        return (
          <div
            key={key}
            className={`cavity-dot cavity-dot--${c.shape || 'round'}`}
            style={{
              ...baseStyle,
              borderColor:
                segmentCount === 1
                  ? colors[0] || '#b0b0b0'
                  : colors[0] || DEFAULT_CAVITY_COLORS[0] || '#b0b0b0',
            }}
          >
            <div className="cavity-dot__clip">
              <div
                className={`cavity-dot__fill cavity-dot__fill--${segmentCount}`}
                style={
                  !hasAnyColor
                    ? { background: '#000', position: 'absolute', inset: 0 }
                    : c.shape === 'round'
                    ? getCavityFillStyle(c)
                    : segmentCount === 1
                    ? colors[0]
                      ? { background: colors[0], position: 'absolute', inset: 0 }
                      : { ...getEmptyCheckBackground(Math.max(4, Math.round(c.size / 6))), position: 'absolute', inset: 0 }
                    : undefined
                }
              >
                {/* Render-only: show red X when no colors are set */}
                {!hasAnyColor && (
                  <svg className="cavity-dot__empty-x" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100" y2="100" stroke="#ff0000" strokeWidth="2" strokeLinecap="square" />
                    <line x1="100" y1="0" x2="0" y2="100" stroke="#ff0000" strokeWidth="2" strokeLinecap="square" />
                  </svg>
                )}

                {(c.shape === 'square' ? segmentCount > 1 : false) &&
                  colors.slice(0, segmentCount).map((color, segmentIndex) => (
                    <div
                      key={segmentIndex}
                      className={`cavity-dot__segment cavity-dot__segment--${segmentIndex + 1} cavity-dot__segment-count--${segmentCount}`}
                      style={
                        color
                          ? { background: color }
                          : getEmptyCheckBackground(Math.max(4, Math.round(c.size / 6)))
                      }
                    />
                  ))}
              </div>
            </div>
            <span className="cavity-dot__label">{key}</span>
          </div>
        );
      });
  }

  // Get all EPNs as available options
  const allEpns = getEPNs();
  const epnOptions = allEpns.map(e => ({ 
    value: e.epn, 
    label: e.epn, 
    needsCoordination: !!e.needsCoordination 
  }));


  const [epnOpen, setEpnOpen] = useState(false);
  const [epnSearch, setEpnSearch] = useState("");

  const filteredEpns = epnOptions.filter(o =>
    o.label.toLowerCase().includes(epnSearch.toLowerCase())
  );

  return (
    <div className="epns-page">
      <div className="epns-header">
        <h1 className="epns-title">Connectors</h1>
        <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="epns-import-btn" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? 'Processing...' : 'Import Excel file'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
            />
            <button type="button" className="epns-download-btn" onClick={handleDownloadJson}>
              Download JSON
            </button>
        </div>
      </div>

      {/* FORM */}
      <form className="epns-form" onSubmit={handleAdd} autoComplete="off">
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Connector Name"
          className="epns-input"
        />
<div className={`epn-select-input${epnOpen ? ' open' : ''}`}>
  <div onClick={() => setEpnOpen(v => !v)}>
    {epnOptions.find(o => o.value === form.epn)?.label || "Select EPN"}
  </div>

  {epnOpen && (
    <div className="epn-select-dropdown">
      <input
        value={epnSearch}
        onChange={e => setEpnSearch(e.target.value)}
        placeholder="Search EPN"
      />

      {filteredEpns.map(o => (
        <div
          key={o.value}
          onClick={() => {
            if (o.needsCoordination) return;
            setForm(f => ({ ...f, epn: o.value }));
            setEpnOpen(false);
            setEpnSearch("");
          }}
          className={o.needsCoordination ? 'disabled' : ''}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            opacity: o.needsCoordination ? 0.6 : 1,
            cursor: o.needsCoordination ? 'not-allowed' : 'pointer',
            background: o.needsCoordination ? '#fafafa' : undefined
          }}
        >
          {o.label}
          {o.needsCoordination && (
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
              <polygon points="7,2 13,12 1,12" fill="#e67e22" />
            </svg>
          )}
        </div>
      ))}
    </div>
  )}
</div>
        <button type="submit" className="epns-add-btn">Add Connector</button>
        {error && <div className="epns-error">{error}</div>}
      </form>

      {/* CARDS */}
      <div className="epns-grid">
        {connectors.length === 0 && (
          <div className="epns-empty">No Connectors found</div>
        )}

        {connectors.map(conn => (
          <div className="epns-card" key={conn.name}>
            <div className="card-header">
              <span className="part-num">{conn.name}</span>
              <span className="variant" style={{ visibility: 'hidden' }}></span>
            </div>
            <div className="epn-bar">{conn.epn}</div>
            
            <div className="epns-card-image">
              {conn.photo && <img src={conn.photo} alt={conn.epn} />}
              {renderCavities(conn.coordinates)}
            </div>
            <div className="epns-card-body">
              <div className="epns-card-actions">
                <button
                  className="btn primary"
                  onClick={() => onCoordinateCavities?.(getConnectorEditorRow(conn), 'connector')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Coordinate
                  {!conn.coordinates && (
                    <svg width="14" height="14" viewBox="0 0 14 14" style={{ marginLeft: 2 }}>
                      <polygon points="7,2 13,12 1,12" fill="#e67e22" />
                    </svg>
                  )}
                </button>
                <button
                  className="btn"
                  onClick={() => setModalConnector(getConnectorEditorRow(conn))}
                >
                  Display
                </button>
                <button
                  className="btn danger"
                  onClick={() => handleDelete(conn.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

<Modal isOpen={!!modalConnector} onClose={() => setModalConnector(null)} className="modal-box--square">
  {modalConnector && (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ flexShrink: 0, margin:"3px" }}>
        <button className="modal-box__num-toggler">NumToggler</button>
      </div>
        <button className="modal-box__dismiss" onClick={() => setModalConnector(null)}>−</button>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {modalConnector.photo && (
          <img
            src={modalConnector.photo}
            alt={modalConnector.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        )}
        {renderCavities(modalConnector.coordinates)}
      </div>

      
    </>
  )}
</Modal>

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
        <div className="import-modal">
          <h2 className="import-modal-title">Import Connectors</h2>
          <div className="import-list">
            {pendingConnectors.map(p => (
              <div key={p.name} className="import-row">
                <div className="import-info">
                  <strong>{p.name}</strong>
                  <span className="import-cavity-count">EPN: {p.epn} ({p.cavityCount} cavities)</span>
                </div>
                <div className="import-status">
                  {p.alreadyExists ? (
                    <span className="import-status-error">Already exists</span>
                  ) : !p.epnExists ? (
                    <span className="import-status-error">EPN not found</span>
                  ) : p.epnNeedsCoordination ? (
                    <span className="import-status-warning">⚠️ EPN needs coordination</span>
                  ) : (
                    <span className="import-status-ok">Ready</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="import-actions">
            <button className="btn" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
            <button 
              className="btn primary" 
              onClick={confirmImport}
              disabled={pendingConnectors.length === 0 || !pendingConnectors.some(p => p.epnExists && !p.alreadyExists)}
            >
              Import {pendingConnectors.filter(p => p.epnExists && !p.alreadyExists).length} Connectors
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
