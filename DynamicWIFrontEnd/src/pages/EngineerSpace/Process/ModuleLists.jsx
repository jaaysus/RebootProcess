import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaTable,
  FaEdit,
  FaTrash,
  FaUpload,
  FaPlus,
  FaEye,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import AppNavbar from "../../../components/Navbar";

import {
  fetchComposites,
  createComposite,
  updateComposite,
  deleteComposite,
  selectComposites,
  clearError as clearCompositeError,
} from "../../../redux/slices/compositeSlice";

import {
  fetchModuleLists,
  fetchModuleListById,
  uploadModuleList,
  deleteModuleList,
  selectModuleLists,
  selectSelectedModuleList,
  selectModuleListsUploading,
  clearSelected,
} from "../../../redux/slices/moduleListsSlice";

const emptyComposite = { compositeName: "", compositeCode: "" };

const COMPOSITE_COLUMNS = [
  { label: "Composite" },
  { label: "Composite Code" },
  { label: "Actions", style: { width: 100 } },
];

const MODULE_LIST_COLUMNS = [
  { label: "File Name" },
  { label: "Upload Date" },
  { label: "Entries" },
  { label: "Composite(s)" },
  { label: "Actions", style: { width: 100 } },
];



const getPreviewColumns = (showFull) => [
  { label: "Composite" },
  { label: "#" },
  { label: "Quantity" },
  { label: "Module", clickable: true, showFull },
  { label: "CPN" },
];

export default function ModuleLists() {
  const dispatch = useDispatch();

  // Redux state
  const composites = useSelector(selectComposites);
  const moduleListFiles = useSelector(selectModuleLists);
  const selectedModuleList = useSelector(selectSelectedModuleList);
  const uploadingModuleList = useSelector(selectModuleListsUploading);

  // Composite modal/form state
  const [compositeForm, setCompositeForm] = useState(emptyComposite);
  const [selectedComposite, setSelectedComposite] = useState(null);
  const [showCompositeEdit, setShowCompositeEdit] = useState(false);
  const [showCompositeDelete, setShowCompositeDelete] = useState(false);
  const [showCompositesModal, setShowCompositesModal] = useState(false);

  // Module list state
  const [moduleListFile, setModuleListFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showModuleListDelete, setShowModuleListDelete] = useState(false);
  const [selectedModuleListForDelete, setSelectedModuleListForDelete] = useState(null);
  // Preview Modal state
  const [showFullModule, setShowFullModule] = useState(false);
  const truncateModule = (value) => {
    if (!value || value.length <= 4) return value;
    return value.slice(3, -1);
  };

  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(fetchComposites());
    dispatch(fetchModuleLists());
  }, [dispatch]);

  // ── Composite handlers ─────────────────────────────────────────────────
  const handleCompositeInput = (e) => {
    const { name, value } = e.target;
    if (name === "compositeCode" && value !== "" && !/^\d+$/.test(value)) {
      return;
    }
    setCompositeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddComposite = async () => {
    if (!compositeForm.compositeName || !compositeForm.compositeCode) {
      setError("Please fill in both composite name and code.");
      return;
    }
    const padded = {
      ...compositeForm,
      compositeCode: compositeForm.compositeCode.padStart(3, "0"),
    };
    const result = await dispatch(createComposite(padded));
    if (createComposite.fulfilled.match(result)) {
      setCompositeForm(emptyComposite);
      setError("");
    } else {
      setError(result.payload || "Failed to create composite.");
    }
  };

  const handleEditComposite = async () => {
    if (!selectedComposite) return;
    const padded = {
      ...compositeForm,
      compositeCode: compositeForm.compositeCode.padStart(3, "0"),
    };
    const result = await dispatch(
      updateComposite({ id: selectedComposite.id, body: { id: selectedComposite.id, ...padded } })
    );
    if (updateComposite.fulfilled.match(result)) {
      setShowCompositeEdit(false);
      setSelectedComposite(null);
      setCompositeForm(emptyComposite);
      setError("");
    } else {
      setError(result.payload || "Failed to update composite.");
    }
  };

  const handleDeleteComposite = async () => {
    if (!selectedComposite) return;
    const result = await dispatch(deleteComposite(selectedComposite.id));
    if (deleteComposite.fulfilled.match(result)) {
      setShowCompositeDelete(false);
      setSelectedComposite(null);
      setError("");
    } else {
      setError(result.payload || "Failed to delete composite.");
    }
  };

  const renderCompositeRow = (c) => (
    <tr key={c.id}>
      <td className="fw-semibold text-danger">{c.compositeName}</td>
      <td>{c.compositeCode}</td>
      <td>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-warning"
            onClick={() => {
              setSelectedComposite(c);
              setCompositeForm({
                compositeName: c.compositeName,
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

  // ── Module list handlers ──────────────────────────────────────────────
  // Backend now owns composite validation (via /modulelists/upload), so we
  // just submit the file and surface whatever error comes back.
  const handleModuleListUpload = async (e) => {
    e.preventDefault();
    if (!moduleListFile) return;

    setError("");
    const result = await dispatch(uploadModuleList(moduleListFile));

    if (uploadModuleList.fulfilled.match(result)) {
      setModuleListFile(null);
      document.getElementById("module-list-file-input").value = "";
      setError("");
    } else {
      setError(result.payload || "Failed to upload file.");
    }
  };

  const handlePreview = (file) => {
    dispatch(fetchModuleListById(file.id));
    setShowPreviewModal(true);
  };

  const closePreview = () => {
    setShowPreviewModal(false);
    setShowFullModule(false);
    dispatch(clearSelected());
  };

  const handleDeleteModuleList = async () => {
    if (!selectedModuleListForDelete) return;
    const result = await dispatch(deleteModuleList(selectedModuleListForDelete.id));
    if (deleteModuleList.fulfilled.match(result)) {
      setShowModuleListDelete(false);
      setSelectedModuleListForDelete(null);
    } else {
      setError(result.payload || "Failed to delete module list.");
    }
  };

  const renderModuleListRow = (f) => (
    <tr key={f.id}>
      <td className="fw-semibold">{f.fileName}</td>
      <td className="text-muted small">{new Date(f.uploadDate).toLocaleString()}</td>
      <td>{f.entryCount}</td>
      <td>
        {f.composites?.map((c) => (
          <span key={c.code} className="badge bg-danger-subtle text-danger-emphasis me-1">
            {c.code} — {c.name}
          </span>
        ))}
      </td>
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
            onClick={() => {
              setSelectedModuleListForDelete(f);
              setShowModuleListDelete(true);
            }}
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (!/\.\d{3}$/.test(file.name)) {
                          setError("Invalid file extension. Expected a numeric extension like .049 or .050.");
                          e.target.value = "";
                          setModuleListFile(null);
                          return;
                        }

                        setModuleListFile(file);
                        setError("");
                      }}
                      required
                    />
                  <div className="form-text text-muted small mt-2">
                    Upload module list files (any numeric extension, e.g. .049, .050). Composite codes
                    must be defined in the composite management section first.
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
                          placeholder="e.g., L460 LWB LHD"
                          value={compositeForm.compositeName}
                          onChange={(e) =>
                            setCompositeForm({
                              ...compositeForm,
                              compositeName: e.target.value.toUpperCase(),
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
                    value={compositeForm.compositeName}
                    onChange={(e) =>
                      setCompositeForm({
                        ...compositeForm,
                        compositeName: e.target.value.toUpperCase(),
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
                <strong>{selectedComposite?.compositeName}</strong>?
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
          MODULE LIST DELETE MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showModuleListDelete && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Delete Module List</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModuleListDelete(false)}
                />
              </div>
              <div className="modal-body">
                Are you sure you want to delete{" "}
                <strong>{selectedModuleListForDelete?.fileName}</strong>?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModuleListDelete(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteModuleList}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          PREVIEW MODAL (now table-based, backed by parsed entries)
      ═══════════════════════════════════════════════════════════ */}
      {showPreviewModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  Preview: {selectedModuleList?.fileName || "Loading..."}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closePreview}
                />
              </div>
              <div className="modal-body">
                <div
                  className="table-responsive"
                  style={{ maxHeight: "500px", overflowY: "auto" }}
                >
                  {!selectedModuleList ? (
                    <div className="text-center text-muted py-4">
                      <span className="spinner-border spinner-border-sm me-2" />
                      Loading entries...
                    </div>
                  ) : (
                  <table className="table table-hover align-middle table-sm">
                    <thead className="table-light">
                      <tr>
                        {getPreviewColumns(showFullModule).map((col, i) =>
                          col.clickable ? (
                            <th
                              key={i}
                              role="button"
                              className="text-primary text-decoration-underline"
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => setShowFullModule((prev) => !prev)}
                              title="Click to toggle full module code"
                            >
                              {col.showFull ? "Module (Full)" : "Module"}
                            </th>
                          ) : (
                            <th key={i}>{col.label}</th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedModuleList.entries.map((e) => (
                        <tr key={e.id}>
                          <td>
                            {e.composite}
                            {e.compositeName && (
                              <span className="text-muted ms-1 small">
                                ({e.compositeName})
                              </span>
                            )}
                          </td>
                          <td>{e.rowIndex}</td>
                          <td>{e.quantity}</td>
                          <td>{showFullModule ? e.module : truncateModule(e.module)}</td>
                          <td className="fw-semibold">{e.cpn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closePreview}>
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