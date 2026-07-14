import { useEffect, useRef, useState, useCallback } from "react";
import { Upload, Trash2, X, AlertTriangle, CheckCircle, ImagePlus, XCircle, LayoutGrid, List, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPhotos,
  uploadPhotoBulk,
  deletePhoto,
  selectPhotos,
  selectPhotosLoading,
  photoUrl,
} from "../../../../redux/slices/epnsSlice";

// ─── constants ───────────────────────────────────────────────────────────────
const BATCH_SIZE = 10;

// ─── helpers ─────────────────────────────────────────────────────────────────

function stripName(filePath) {
  if (!filePath) return "";
  const fileName = filePath.split("/").pop();
  return fileName
    .replace(/_\d{14}(?=\.[^.]+$)/, "")
    .replace(/\.[^.]+$/, "")
    .toLowerCase();
}

function fileBaseName(file) {
  return file.name.replace(/\.[^.]+$/, "").toLowerCase();
}

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── DeleteModal ──────────────────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="component-modal-overlay">
      <div className="component-modal-box">
        <button className="component-modal-close" onClick={onCancel}>
          <X size={16} />
        </button>
        <div className="component-modal-icon">
          <Trash2 size={28} color="#d9534f" />
        </div>
        <h3 className="component-modal-title">Delete Photo</h3>
        <p className="component-modal-text">
          Are you sure you want to delete this photo? This action cannot be undone.
        </p>
        <div className="component-modal-actions">
          <button className="component-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="component-modal-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── DeleteSelectedModal ──────────────────────────────────────────────────────

function DeleteSelectedModal({ count, onConfirm, onCancel }) {
  return (
    <div className="component-modal-overlay">
      <div className="component-modal-box">
        <button className="component-modal-close" onClick={onCancel}>
          <X size={16} />
        </button>
        <div className="component-modal-icon">
          <Trash2 size={28} color="#d9534f" />
        </div>
        <h3 className="component-modal-title">Delete Selected Photos</h3>
        <p className="component-modal-text">
          Are you sure you want to delete <strong>{count}</strong> photo{count !== 1 ? "s" : ""}? This action cannot be undone.
        </p>
        <div className="component-modal-actions">
          <button className="component-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="component-modal-confirm" onClick={onConfirm}>Delete {count}</button>
        </div>
      </div>
    </div>
  );
}

// ─── UploadPreviewModal ──────────────────────────────────────────────────────

/**
 * fileStatuses: Record<filename, 'idle' | 'uploading' | 'done' | 'failed' | 'skipped'>
 */
function UploadPreviewModal({
  files,
  existingNames,
  overwrite,
  onOverwriteChange,
  fileStatuses,
  onProceed,
  onCancel,
  uploading,
  progress,   // { done, total }
}) {
  const newFiles      = files.filter(f => !existingNames.has(fileBaseName(f)));
  const existingFiles = files.filter(f =>  existingNames.has(fileBaseName(f)));
  const toUpload      = overwrite ? files : newFiles;
  const skipped       = overwrite ? 0 : existingFiles.length;
  const isDone        = uploading && progress.done === progress.total && progress.total > 0;

  const succeededCount = Object.values(fileStatuses).filter(s => s === "done").length;
  const failedCount    = Object.values(fileStatuses).filter(s => s === "failed").length;

  const statusIcon = (file) => {
    const st = fileStatuses[file.name];
    if (st === "uploading") return <span className="upv-row-spinner" />;
    if (st === "done")      return <CheckCircle  size={14} color="#16a34a" />;
    if (st === "failed")    return <XCircle      size={14} color="#d9534f" />;
    if (st === "skipped")   return <span className="upv-row-skip-icon">—</span>;
    // idle
    if (existingNames.has(fileBaseName(file))) return <AlertTriangle size={14} color="#e6a817" />;
    return <CheckCircle size={14} color="#16a34a" />;
  };

  const rowClass = (file) => {
    const st  = fileStatuses[file.name];
    const dup = existingNames.has(fileBaseName(file));
    if (st === "uploading") return "upv-row upv-row--uploading";
    if (st === "done")      return "upv-row upv-row--done";
    if (st === "failed")    return "upv-row upv-row--failed";
    if (st === "skipped")   return "upv-row upv-row--skipped";
    if (dup)                return "upv-row upv-row--dup";
    return "upv-row";
  };

  const batchCount = Math.ceil(toUpload.length / BATCH_SIZE);

  return (
    <div className="component-modal-overlay">
      <div className="upv-modal">

        {/* ── Header ── */}
        <div className="upv-header">
          <div className="upv-header-left">
            <ImagePlus size={18} />
            <span>Upload Preview</span>
          </div>
          <button className="component-modal-close upv-close" onClick={onCancel} disabled={uploading && !isDone}>
            <X size={16} />
          </button>
        </div>

        {/* ── Summary row ── */}
        <div className="upv-summary">
          <span className="upv-badge upv-badge--new">
            <CheckCircle size={12} /> {newFiles.length} new
          </span>
          {existingFiles.length > 0 && (
            <span className="upv-badge upv-badge--dup">
              <AlertTriangle size={12} /> {existingFiles.length} exist
            </span>
          )}
          <span className="upv-badge upv-badge--total">{files.length} total</span>
          {batchCount > 1 && (
            <span className="upv-badge upv-badge--batch">
              {batchCount} batch{batchCount > 1 ? "es" : ""} of {BATCH_SIZE}
            </span>
          )}
        </div>

        {/* ── Overwrite toggle (only relevant when there are duplicates) ── */}
        {existingFiles.length > 0 && !uploading && (
          <label className="upv-overwrite-row">
            <input
              type="checkbox"
              className="upv-overwrite-check"
              checked={overwrite}
              onChange={e => onOverwriteChange(e.target.checked)}
            />
            <span>
              <strong>Overwrite existing</strong>
              <span className="upv-overwrite-hint">
                {overwrite
                  ? "All files will be uploaded — existing ones re-uploaded."
                  : `${skipped} existing file${skipped !== 1 ? "s" : ""} will be skipped.`}
              </span>
            </span>
          </label>
        )}

        {/* ── Progress bar (shown while uploading) ── */}
        {uploading && progress.total > 0 && (
          <div className="upv-progress-wrap">
            <div className="upv-progress-track">
              <div
                className="upv-progress-fill"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
            <span className="upv-progress-label">
              {isDone
                ? `Done — ${succeededCount} uploaded${failedCount ? `, ${failedCount} failed` : ""}`
                : `Uploading ${progress.done} / ${progress.total}…`}
            </span>
          </div>
        )}

        {/* ── File list ── */}
        <ul className="upv-list">
          {files.map((file, i) => (
            <li key={i} className={rowClass(file)}>
              <span className="upv-row-icon">{statusIcon(file)}</span>
              <span className="upv-row-name" title={file.name}>{file.name}</span>
              <span className="upv-row-size">{fmtSize(file.size)}</span>
              {existingNames.has(fileBaseName(file)) && fileStatuses[file.name] === undefined && (
                <span className="upv-row-tag">exists</span>
              )}
              {fileStatuses[file.name] === "skipped" && (
                <span className="upv-row-tag upv-row-tag--skip">skipped</span>
              )}
              {fileStatuses[file.name] === "failed" && (
                <span className="upv-row-tag upv-row-tag--fail">failed</span>
              )}
            </li>
          ))}
        </ul>

        {/* ── Actions ── */}
        <div className="upv-actions">
          {isDone ? (
            <button className="upv-btn-proceed" onClick={onCancel}>
              <CheckCircle size={14} /> Close
            </button>
          ) : (
            <>
              <button className="component-modal-cancel" onClick={onCancel} disabled={uploading}>
                Cancel
              </button>
              <button
                className="upv-btn-proceed"
                onClick={onProceed}
                disabled={uploading || toUpload.length === 0}
              >
                {uploading ? (
                  <><span className="upv-spinner" /> Uploading…</>
                ) : (
                  <><Upload size={14} /> Upload {toUpload.length} file{toUpload.length !== 1 ? "s" : ""}</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EPNphotos ────────────────────────────────────────────────────────────────

export default function EPNphotos() {
  const dispatch     = useDispatch();
  const fileInputRef = useRef(null);

  const photos  = useSelector(selectPhotos);
  const loading = useSelector(selectPhotosLoading);

  const [deleteId,     setDeleteId]     = useState(null);
  const [pendingFiles, setPendingFiles] = useState(null);     // File[] | null
  const [overwrite,    setOverwrite]    = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [progress,     setProgress]     = useState({ done: 0, total: 0 });
  const [fileStatuses, setFileStatuses] = useState({});       // { [filename]: status }
  const [viewMode, setViewMode]         = useState("grid");
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());  // Set of photo IDs
  const [deleteSelectedId, setDeleteSelectedId] = useState(null);   // For delete confirmation

  useEffect(() => { dispatch(fetchPhotos()); }, [dispatch]);

  const existingNames = new Set(photos.map(p => stripName(p.filePath)));

  // ── file picker ────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (!files.length) return;
    setFileStatuses({});
    setProgress({ done: 0, total: 0 });
    setOverwrite(false);
    setPendingFiles(files);
  };

  // ── set individual file status ─────────────────────────────────────────────
  const setStatus = useCallback((filename, status) => {
    setFileStatuses(prev => ({ ...prev, [filename]: status }));
  }, []);

  // ── batched upload ─────────────────────────────────────────────────────────
  const handleProceed = async () => {
    if (!pendingFiles?.length) return;

    const toUpload = overwrite
      ? pendingFiles
      : pendingFiles.filter(f => !existingNames.has(fileBaseName(f)));

    const skipped = pendingFiles.filter(f => !overwrite && existingNames.has(fileBaseName(f)));

    // Mark skipped immediately
    skipped.forEach(f => setStatus(f.name, "skipped"));

    if (!toUpload.length) return;

    setUploading(true);
    setProgress({ done: 0, total: toUpload.length });

    // Split into batches of BATCH_SIZE
    const batches = [];
    for (let i = 0; i < toUpload.length; i += BATCH_SIZE) {
      batches.push(toUpload.slice(i, i + BATCH_SIZE));
    }

    let totalDone = 0;

    for (const batch of batches) {
      // Animate this batch as "uploading"
      batch.forEach(f => setStatus(f.name, "uploading"));

      const result = await dispatch(uploadPhotoBulk(batch));

      if (uploadPhotoBulk.fulfilled.match(result)) {
        const { succeeded = [], failed = [] } = result.payload;

        // Mark by matching name heuristic (server strips + timestamps)
        const succeededNames = new Set(
          succeeded.map(p => stripName(p.filePath))
        );

        batch.forEach(f => {
          const base = fileBaseName(f);
          if (succeededNames.has(base) || succeededNames.size === batch.length) {
            // If the server returned all as succeeded, trust it
            setStatus(f.name, "done");
          } else {
            setStatus(f.name, "failed");
          }
        });

        // If server gives us per-file results, prefer those
        if (succeeded.length + failed.length === batch.length) {
          succeeded.forEach((_, idx) => batch[idx] && setStatus(batch[idx].name, "done"));
          failed.forEach((_, idx) => batch[succeeded.length + idx] && setStatus(batch[succeeded.length + idx].name, "failed"));
        }
      } else {
        // Whole batch failed
        batch.forEach(f => setStatus(f.name, "failed"));
      }

      totalDone += batch.length;
      setProgress({ done: totalDone, total: toUpload.length });
    }

    setUploading(false);
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (deleteId) { dispatch(deletePhoto(deleteId)); setDeleteId(null); }
  };

  // ── selection handlers ─────────────────────────────────────────────────────
  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.size === filteredPhotos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(filteredPhotos.map(p => p.id)));
    }
  };

  const confirmDeleteSelected = () => {
    if (deleteSelectedId !== "confirm") return;
    selectedPhotos.forEach(photoId => {
      dispatch(deletePhoto(photoId));
    });
    setSelectedPhotos(new Set());
    setDeleteSelectedId(null);
  };

  const getDisplayName = (filePath) => {
    if (!filePath) return "";
    return filePath.split("/").pop()
      .replace(/_\d{14}(?=\.[^.]+$)/, "")
      .replace(/\.[^.]+$/, "");
  };

  const filteredPhotos = photos.filter(photo => {
    if (!searchQuery) return true;
    const name = getDisplayName(photo.filePath).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div>
      {deleteId && (
        <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
      )}

      {deleteSelectedId && (
        <DeleteSelectedModal 
          count={selectedPhotos.size}
          onConfirm={confirmDeleteSelected}
          onCancel={() => setDeleteSelectedId(null)}
        />
      )}

      {pendingFiles && (
        <UploadPreviewModal
          files={pendingFiles}
          existingNames={existingNames}
          overwrite={overwrite}
          onOverwriteChange={setOverwrite}
          fileStatuses={fileStatuses}
          onProceed={handleProceed}
          onCancel={() => { if (!uploading) { setPendingFiles(null); setFileStatuses({}); } else setPendingFiles(null); }}
          uploading={uploading}
          progress={progress}
        />
      )}

      <main>
        <div className="component-page">
          <div className="component-upload-box" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ display: "flex", background: "#f0f0f0", borderRadius: "8px", padding: "4px" }}>
                <button
                  onClick={() => setViewMode("grid")}
                  style={{
                    background: viewMode === "grid" ? "#fff" : "transparent",
                    color: viewMode === "grid" ? "#111" : "#666",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s"
                  }}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  style={{
                    background: viewMode === "table" ? "#fff" : "transparent",
                    color: viewMode === "table" ? "#111" : "#666",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s"
                  }}
                  title="Table View"
                >
                  <List size={18} />
                </button>
              </div>

              {viewMode === "table" && (
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
                  <input
                    type="text"
                    placeholder="Search photos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: "8px 10px 8px 32px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      outline: "none",
                      width: "200px"
                    }}
                  />
                </div>
              )}

              {viewMode === "table" && selectedPhotos.size > 0 && (
                <button
                  onClick={() => setDeleteSelectedId("confirm")}
                  className="btn btn-danger d-flex align-items-center gap-2"
                  title={`Delete ${selectedPhotos.size} selected photo${selectedPhotos.size !== 1 ? "s" : ""}`}
                >
                  <Trash2 size={14} />
                  Delete Selected ({selectedPhotos.size})
                </button>
              )}
            </div>

            <div className="d-flex">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <button
                className="btn btn-danger d-flex align-items-center gap-2"
                onClick={() => fileInputRef.current.click()}
                disabled={loading || !!pendingFiles}
              >
                <Upload size={16} />
                {loading ? "Uploading..." : "Upload Image(s)"}
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="component-grid">
              {filteredPhotos.map((photo) => (
              <div key={photo.id} className="component-card">
                <img
                  src={photoUrl(photo.filePath)}
                  alt={getDisplayName(photo.filePath)}
                  className="component-image"
                />
                <div className="component-file-name">{getDisplayName(photo.filePath)}</div>
                <span className="component-size-overlay">
                  {photo.photoWidth} × {photo.photoHeight}
                </span>
                <button
                  className="component-delete-overlay"
                  onClick={() => setDeleteId(photo.id)}
                  title="Delete photo"
                  aria-label="Delete photo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #ddd", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #ddd" }}>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444", width: "40px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedPhotos.size === filteredPhotos.length && filteredPhotos.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: "pointer" }}
                        title={selectedPhotos.size === filteredPhotos.length && filteredPhotos.length > 0 ? "Deselect all" : "Select all"}
                      />
                    </th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444" }}>Preview</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444" }}>File Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444" }}>Dimensions</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPhotos.map((photo) => (
                    <tr key={photo.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px 16px", width: "40px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedPhotos.has(photo.id)}
                          onChange={() => togglePhotoSelection(photo.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "12px 16px", width: "100px" }}>
                        <img
                          src={photoUrl(photo.filePath)}
                          alt={getDisplayName(photo.filePath)}
                          style={{ width: "60px", height: "auto", borderRadius: "4px", background: "#f0f0f0" }}
                        />
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "500", color: "#222" }}>
                        {getDisplayName(photo.filePath)}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#666", fontSize: "13px" }}>
                        {photo.photoWidth} × {photo.photoHeight}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setDeleteId(photo.id)}
                          title="Delete photo"
                          aria-label="Delete photo"
                          style={{ background: "none", border: "none", color: "#d9534f", cursor: "pointer", padding: "6px" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPhotos.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#888" }}>
                        No photos found matching "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}