import React, { useState } from "react";
import {
  FaTable,
  FaEdit,
  FaTrash,
  FaUpload,
  FaPlus,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import AppNavbar from "../../../components/Navbar";

// Empty composite form
const emptyComposite = { composite: "", compositeCode: "" };

// Composite table columns (used in modal)
const COMPOSITE_COLUMNS = [
  { label: "Composite" },
  { label: "Composite Code" },
  { label: "Actions", style: { width: 100 } },
];

// Module list file table columns
const MODULE_LIST_COLUMNS = [
  { label: "File Name" },
  { label: "Upload Date" },
  { label: "Actions", style: { width: 100 } },
];

export default function ModuleLists() {
  // Composite state
  const [composites, setComposites] = useState([]);
  const [compositeForm, setCompositeForm] = useState(emptyComposite);
  const [selectedComposite, setSelectedComposite] = useState(null);
  const [showCompositeAdd, setShowCompositeAdd] = useState(false);
  const [showCompositeEdit, setShowCompositeEdit] = useState(false);
  const [showCompositeDelete, setShowCompositeDelete] = useState(false);
  const [showCompositesModal, setShowCompositesModal] = useState(false);

  // Module list file state
  const [moduleListFiles, setModuleListFiles] = useState([]);
  const [moduleListFile, setModuleListFile] = useState(null);
  const [uploadingModuleList, setUploadingModuleList] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");

  const [error, setError] = useState("");

  // Composite CRUD handlers
  const handleCompositeInput = (e) => {
    const { name, value } = e.target;
    // Only allow digits for composite code (preserves leading zeros), allow empty string
    if (name === "compositeCode" && value !== "" && !/^\d+$/.test(value)) {
      return;
    }
    setCompositeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddComposite = () => {
    if (!compositeForm.composite || !compositeForm.compositeCode) {
      setError("Please fill in both composite name and code.");
      return;
    }
    const newComposite = {
      id: Date.now(),
      ...compositeForm,
    };
    setComposites([...composites, newComposite]);
    setCompositeForm(emptyComposite);
    setShowCompositeAdd(false);
    setError("");
  };

  const handleEditComposite = () => {
    if (!selectedComposite) return;
    setComposites(
      composites.map((c) =>
        c.id === selectedComposite.id
          ? { ...c, ...compositeForm }
          : c
      )
    );
    setShowCompositeEdit(false);
    setSelectedComposite(null);
    setCompositeForm(emptyComposite);
    setError("");
  };

  const handleDeleteComposite = () => {
    if (!selectedComposite) return;
    setComposites(composites.filter((c) => c.id !== selectedComposite.id));
    setShowCompositeDelete(false);
    setSelectedComposite(null);
    setError("");
  };

  const renderCompositeRow = (c) => (
    <tr key={c.id}>
      <td className="fw-semibold text-danger">{c.composite}</td>
      <td>{c.compositeCode}</td>
      <td>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-warning"
            onClick={() => {
              setSelectedComposite(c);
              setCompositeForm({
                composite: c.composite,
                compositeCode: c.compositeCode,
              });
              setShowCompositeEdit(true);
            }}
          >
            <FaEdit />
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => {
              setSelectedComposite(c);
              setShowCompositeDelete(true);
            }}
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  );

  // Module list file handlers
  const handleModuleListUpload = async (e) => {
    e.preventDefault();
    if (!moduleListFile) return;

    setUploadingModuleList(true);
    setError("");

    try {
      const text = await moduleListFile.text();
      const lines = text.split("\n").filter((line) => line.trim());

      // Find all unique codes in the CSV (first column of data lines, excluding BOF and EOF)
      const codes = new Set();
      lines.forEach((line) => {
        const parts = line.split(";");
        if (parts.length > 0 && parts[0] && parts[0] !== "BOF" && parts[0] !== "EOF") {
          codes.add(parts[0].trim()); // Trim whitespace and preserve as string
        }
      });

      // Validate that all codes exist in composites (string comparison)
      const missingCodes = [];
      codes.forEach((code) => {
        const exists = composites.some((c) => String(c.compositeCode).trim() === String(code).trim());
        if (!exists) {
          missingCodes.push(code);
        }
      });

      if (missingCodes.length > 0) {
        setError(
          `Cannot upload: The following composite codes do not exist: ${missingCodes.join(", ")}`
        );
        setUploadingModuleList(false);
        return;
      }

      // Add file to list
      const newFile = {
        id: Date.now(),
        fileName: moduleListFile.name,
        uploadDate: new Date().toLocaleString(),
        content: text,
      };
      setModuleListFiles([...moduleListFiles, newFile]);
      setModuleListFile(null);
      document.getElementById("module-list-file-input").value = "";
      setError("");
    } catch (err) {
      setError("Failed to process file. Please ensure it's a valid CSV file.");
    } finally {
      setUploadingModuleList(false);
    }
  };

  const handlePreview = (file) => {
    setPreviewContent(file.content);
    setPreviewFileName(file.fileName);
    setShowPreviewModal(true);
  };

  const handleDeleteModuleList = (id) => {
    setModuleListFiles(moduleListFiles.filter((f) => f.id !== id));
  };

  const renderModuleListRow = (f) => (
    <tr key={f.id}>
      <td className="fw-semibold">{f.fileName}</td>
      <td className="text-muted small">{f.uploadDate}</td>
      <td>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => handlePreview(f)}
            title="Preview"
          >
            <FaEye />
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDeleteModuleList(f.id)}
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <AppNavbar />
      <main className="container-fluid p-4 flex-grow-1">

        {/* Page header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="bg-danger text-white p-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center">
            <FaTable size={24} />
          </div>
          <div>
            <h2 className="mb-0 fw-bold text-dark">Module Lists</h2>
            <p className="text-muted mb-0 small">
              Manage composite codes and upload module list files.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4 shadow-sm" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")} />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — Composites Management
        ══════════════════════════════════════════════════════════ */}
        <div className="row g-4 mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-body py-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-danger text-white p-3 rounded-3 d-flex align-items-center justify-content-center">
                    <FaTable size={24} />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark">Composite Management</h5>
                    <p className="text-muted mb-0 small">
                      Manage composite codes for module list validation
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-danger d-flex align-items-center gap-2"
                  onClick={() => setShowCompositesModal(true)}
                >
                  <FaPlus /> Manage Composites
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — Module List File Upload
        ══════════════════════════════════════════════════════════ */}
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-header bg-danger text-white py-3">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <FaUpload /> Upload Module List
                </h5>
              </div>
              <div className="card-body py-4">
                <form onSubmit={handleModuleListUpload}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted small">
                      SELECT CSV FILE
                    </label>
                    <input
                      id="module-list-file-input"
                      type="file"
                      className="form-control"
                      accept=".csv"
                      onChange={(e) =>
                        e.target.files?.[0] && setModuleListFile(e.target.files[0])
                      }
                      required
                    />
                    <div className="form-text text-muted small mt-2">
                      Upload CSV files with composite codes. Codes must be defined in the
                      composite management section first.
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    disabled={!moduleListFile || uploadingModuleList}
                  >
                    {uploadingModuleList ? (
                      <span className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                      <FaUpload />
                    )}
                    {uploadingModuleList ? "Processing..." : "Upload File"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-header bg-danger text-white py-3">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <FaTable /> Uploaded Module Lists
                </h5>
              </div>
              <div className="card-body py-4">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        {MODULE_LIST_COLUMNS.map((col, i) => (
                          <th key={i} style={col.style}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {moduleListFiles.length === 0 ? (
                        <tr>
                          <td
                            colSpan={MODULE_LIST_COLUMNS.length}
                            className="text-center text-muted py-4"
                          >
                            No module lists uploaded yet. Use the upload panel to add files.
                          </td>
                        </tr>
                      ) : (
                        moduleListFiles.map(renderModuleListRow)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════
          COMPOSITES MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showCompositesModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Manage Composites</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCompositesModal(false)}
                />
              </div>
              <div className="modal-body">
                {/* Add composite form */}
                <div className="card bg-light mb-3">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Add New Composite</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          Composite Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter composite name"
                          value={compositeForm.composite}
                          onChange={(e) =>
                            setCompositeForm({
                              ...compositeForm,
                              composite: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">
                          Composite Code
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., 093"
                          value={compositeForm.compositeCode}
                          onChange={handleCompositeInput}
                          name="compositeCode"
                        />
                      </div>
                      <div className="col-md-2 d-flex align-items-end">
                        <button
                          className="btn btn-danger w-100"
                          onClick={handleAddComposite}
                        >
                          <FaPlus /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Composites table */}
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        {COMPOSITE_COLUMNS.map((col, i) => (
                          <th key={i} style={col.style}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {composites.length === 0 ? (
                        <tr>
                          <td
                            colSpan={COMPOSITE_COLUMNS.length}
                            className="text-center text-muted py-4"
                          >
                            No composites added yet.
                          </td>
                        </tr>
                      ) : (
                        composites.map(renderCompositeRow)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCompositesModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          COMPOSITE EDIT MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showCompositeEdit && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title fw-bold">Edit Composite</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCompositeEdit(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Composite Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={compositeForm.composite}
                    onChange={(e) =>
                      setCompositeForm({
                        ...compositeForm,
                        composite: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Composite Code (numbers only, preserves leading zeros)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={compositeForm.compositeCode}
                    onChange={handleCompositeInput}
                    name="compositeCode"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCompositeEdit(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-warning" onClick={handleEditComposite}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          COMPOSITE DELETE MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showCompositeDelete && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Delete Composite</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCompositeDelete(false)}
                />
              </div>
              <div className="modal-body">
                Are you sure you want to delete composite{" "}
                <strong>{selectedComposite?.composite}</strong>?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCompositeDelete(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteComposite}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          PREVIEW MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showPreviewModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Preview: {previewFileName}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPreviewModal(false)}
                />
              </div>
              <div className="modal-body">
                <div
                  className="table-responsive"
                  style={{ maxHeight: "500px", overflowY: "auto" }}
                >
                  <pre className="mb-0" style={{ fontSize: "12px" }}>
                    {previewContent}
                  </pre>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}