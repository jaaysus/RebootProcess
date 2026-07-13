import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaFileAlt,
  FaEdit,
  FaTrash,
  FaUpload,
  FaPlus,
  FaPlug,
  FaSearch,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import AppNavbar from "../../../components/Navbar";
import {
  fetchWireData,
  createWireData,
  updateWireData,
  deleteWireData,
  deleteAllWireData,
  uploadWireData,
  fetchNodeLookup,
  selectWireData,
  selectWireDataLoading,
  selectWireDataUploading,
  selectWireDataError,
  selectNodeResult,
  selectNodeLoading,
  selectNodeError,
  clearError,
  clearNodeError,
  clearNodeResult,
} from "../../../redux/slices/wireDataSlice";

// ─── Wire Data ───────────────────────────────────────────────────────────────
const WIRE_COLUMNS = [
  { label: "Wire Nb" },
  { label: "CSA" },
  { label: "Length" },
  { label: "C1" },
  { label: "C2" },
  { label: "Loc" },
  { label: "Node" },
  { label: "EPN" },
  { label: "Cavity" },
  { label: "Module" },
  { label: "Station" },
  { label: "Twist" },
  { label: "Core" },
  { label: "Splice" },
  { label: "Actions", style: { width: 100 } },
];

const emptyWire = {
  wireNumber: "",
  csa: "",
  length: "",
  c1: "",
  c2: "",
  loc: "",
  node: "",
  epn: "",
  cavity: "",
  module: "",
  station: "",
  twist: "",
  core: "",
  splice: "",
};

export default function WorkInstructions() {
  const dispatch = useDispatch();

  // ── Redux state ─────────────────────────────────────────────────
  const wires = useSelector(selectWireData);
  const wiresLoading = useSelector(selectWireDataLoading);
  const uploadingWires = useSelector(selectWireDataUploading);
  const error = useSelector(selectWireDataError);
  const nodeResult = useSelector(selectNodeResult);
  const nodeLoading = useSelector(selectNodeLoading);
  const nodeError = useSelector(selectNodeError);

  // ── Local state ────────────────────────────────────────────────
  const [wireFile, setWireFile] = useState(null);
  const [wireForm, setWireForm] = useState(emptyWire);
  const [selectedWire, setSelectedWire] = useState(null);
  const [showWireAdd, setShowWireAdd] = useState(false);
  const [showWireEdit, setShowWireEdit] = useState(false);
  const [showWireDelete, setShowWireDelete] = useState(false);
  const [nodeQuery, setNodeQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ════════════════════════════════════════════════════════════════
  //  Fetch data on mount
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    dispatch(fetchWireData());
  }, [dispatch]);

  // ════════════════════════════════════════════════════════════════
  //  Search filtering
  // ════════════════════════════════════════════════════════════════
  const searchKeys = ["WireNumber", "Node", "Epn", "Module", "Station", "Loc"];
  const filteredWires = wires.filter(wire => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return searchKeys.some(key => {
      const value = wire[key];
      return value && String(value).toLowerCase().includes(query);
    });
  });

  // ════════════════════════════════════════════════════════════════
  //  Wire CRUD
  // ════════════════════════════════════════════════════════════════
  const handleWireInput = (e) =>
    setWireForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleWireUpload = async (e) => {
    e.preventDefault();
    if (!wireFile) return;
    dispatch(clearError());
    const result = await dispatch(uploadWireData(wireFile));
    if (uploadWireData.fulfilled.match(result)) {
      setWireFile(null);
      document.getElementById("wire-file-input").value = "";
    }
  };

  const handleAddWire = async () => {
    const result = await dispatch(createWireData(wireForm));
    if (createWireData.fulfilled.match(result)) {
      setWireForm(emptyWire);
      setShowWireAdd(false);
      dispatch(clearError());
    }
  };

  const handleEditWire = async () => {
    if (!selectedWire) return;
    const result = await dispatch(updateWireData({ id: selectedWire.Id, body: wireForm }));
    if (updateWireData.fulfilled.match(result)) {
      setShowWireEdit(false);
      setSelectedWire(null);
      setWireForm(emptyWire);
      dispatch(clearError());
    }
  };

  const handleDeleteWire = async () => {
    if (!selectedWire) return;
    const result = await dispatch(deleteWireData(selectedWire.Id));
    if (deleteWireData.fulfilled.match(result)) {
      setShowWireDelete(false);
      setSelectedWire(null);
      dispatch(clearError());
    }
  };

  const handleDeleteAllWires = async () => {
    const result = await dispatch(deleteAllWireData());
    if (deleteAllWireData.fulfilled.match(result)) {
      dispatch(clearError());
    }
  };

  const renderWireRow = (w) => (
    <tr key={w.id}>
      <td className="fw-semibold text-danger">{w.wireNumber}</td>
      <td>{w.csa}</td>
      <td>{w.length}</td>
      <td><span className="badge bg-secondary">{w.c1}</span></td>
      <td><span className="badge bg-secondary">{w.c2}</span></td>
      <td>{w.loc}</td>
      <td className="fw-semibold">{w.node}</td>
      <td><code>{w.epn}</code></td>
      <td>{w.cavity}</td>
      <td>{w.module}</td>
      <td>{w.station}</td>
      <td>{w.twist}</td>
      <td>{w.core}</td>
      <td>{w.splice}</td>
      <td>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-warning"
            onClick={() => {
              setSelectedWire(w);
              setWireForm({
                id: w.id,
                wireNumber: w.wireNumber, csa: w.csa, length: w.length,
                c1: w.c1, c2: w.c2, loc: w.loc, node: w.node, epn: w.epn,
                cavity: w.cavity, module: w.module, station: w.station,
                twist: w.twist, core: w.core, splice: w.splice,
              });
              setShowWireEdit(true);
            }}
          >
            <FaEdit />
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => { setSelectedWire(w); setShowWireDelete(true); }}
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  );

  // ════════════════════════════════════════════════════════════════
  //  Node lookup
  // ════════════════════════════════════════════════════════════════
  const handleNodeLookup = async (e) => {
    e.preventDefault();
    if (!nodeQuery.trim()) return;
    dispatch(clearNodeResult());
    dispatch(clearNodeError());
    await dispatch(fetchNodeLookup(nodeQuery));
  };

  // ════════════════════════════════════════════════════════════════
  //  Render
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <AppNavbar />
      <main className="container-fluid p-4 flex-grow-1">

        {/* Page header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="bg-danger text-white p-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center">
            <FaFileAlt size={24} />
          </div>
          <div>
            <h2 className="mb-0 fw-bold text-dark">Work Instructions</h2>
            <p className="text-muted mb-0 small">
              Manage wire data, run node lookups, and control instruction configurations.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4 shadow-sm" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => dispatch(clearError())} />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            SECTION — Wire Data
        ══════════════════════════════════════════════════════════ */}
        <div className="row g-4">
          {/* Upload + Node lookup card */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-3 mb-3">
              <div className="card-header py-3" style={{ backgroundColor: "#1a1a2e" }}>
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 text-white">
                  <FaUpload /> Upload Wire Data Excel
                </h5>
              </div>
              <div className="card-body py-4">
                <form onSubmit={handleWireUpload}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted small">SELECT EXCEL FILE</label>
                    <input
                      id="wire-file-input"
                      type="file"
                      className="form-control"
                      accept=".xlsx,.xls"
                      onChange={(e) => e.target.files?.[0] && setWireFile(e.target.files[0])}
                      required
                    />
                    <div className="form-text text-muted small mt-2">
                      Requires columns: <code>Wire Nb</code>, <code>csa</code>, <code>length</code>,{" "}
                      <code>C1</code>, <code>C2</code>, <code>Loc</code>, <code>Node</code>,{" "}
                      <code>EPN</code>, <code>Total cav</code>, <code>Cavity</code>, <code>Module</code>,{" "}
                      <code>Station</code>. Uploading overwrites all existing wire data.
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 text-white"
                    style={{ backgroundColor: "#1a1a2e" }}
                    disabled={!wireFile || uploadingWires}
                  >
                    {uploadingWires
                      ? <span className="spinner-border spinner-border-sm" role="status" />
                      : <FaUpload />}
                    {uploadingWires ? "Processing..." : "Upload & Overwrite"}
                  </button>
                </form>
              </div>
            </div>

            <button
              className="btn btn-sm btn-danger w-100 mb-3"
              onClick={handleDeleteAllWires}
            >
              Delete All Wires
            </button>

            {/* Node lookup card */}
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header py-3" style={{ backgroundColor: "#16213e" }}>
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 text-white">
                  <FaSearch /> Node Lookup
                </h5>
              </div>
              <div className="card-body py-4">
                <form onSubmit={handleNodeLookup} className="mb-3">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. CM49A1"
                      value={nodeQuery}
                      onChange={(e) => setNodeQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn text-white"
                      style={{ backgroundColor: "#16213e" }}
                      disabled={nodeLoading}
                    >
                      {nodeLoading
                        ? <span className="spinner-border spinner-border-sm" />
                        : "Lookup"}
                    </button>
                  </div>
                </form>

                {nodeError && (
                  <div className="alert alert-warning py-2 small d-flex justify-content-between align-items-center">
                    {nodeError}
                    <button type="button" className="btn-close btn-close-sm" onClick={() => dispatch(clearNodeError())} />
                  </div>
                )}

                {nodeResult && (
                  <div>
                    <div className="mb-2">
                      <span className="fw-bold">Node:</span> <code>{nodeResult.NodeName}</code>
                    </div>
                    <div className="mb-2">
                      <span className="fw-bold">EPN:</span> <code>{nodeResult.Epn}</code>
                      {nodeResult.EpnId && (
                        <span className="ms-2 badge bg-secondary">ID #{nodeResult.EpnId}</span>
                      )}
                    </div>
                    <div className="mb-2">
                      <span className="fw-bold">Cavity Count:</span> {nodeResult.CavityCount}
                    </div>
                    {nodeResult.NeedsCoordination && (
                      <div className="alert alert-warning py-1 small mb-2">
                        ⚠ EPN coordinates not set yet.
                      </div>
                    )}

                    {/* Cavity Colors */}
                    <div className="mb-2">
                      <span className="fw-bold small d-block mb-1">Cavity Colors (from wire data):</span>
                      <div className="d-flex flex-wrap gap-1">
                        {Object.entries(nodeResult.CavityColors || {}).map(([cav, colors]) => (
                          <span key={cav} className="badge rounded-pill text-bg-dark small">
                            Cav {cav}: {colors.join(" / ")}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Wires table */}
                    <div className="table-responsive mt-2" style={{ maxHeight: 250, overflowY: "auto" }}>
                      <table className="table table-sm table-bordered align-middle mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>Wire</th><th>Cav</th><th>C1</th><th>C2</th><th>Module</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(nodeResult.Wires || []).map((w) => (
                            <tr key={w.Id}>
                              <td><code>{w.WireNumber}</code></td>
                              <td>{w.Cavity}</td>
                              <td><span className="badge bg-secondary">{w.C1}</span></td>
                              <td><span className="badge bg-secondary">{w.C2}</span></td>
                              <td>{w.Module}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Wire Data table */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-header py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1a1a2e" }}>
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 text-white">
                  <FaPlug /> Wire Data
                </h5>
                <button
                  className="btn btn-sm d-flex align-items-center gap-1 text-white"
                  style={{ backgroundColor: "#0f1623" }}
                  onClick={() => { setWireForm(emptyWire); setShowWireAdd(true); }}
                >
                  <FaPlus /> Add Wire
                </button>
              </div>
              <div className="card-body py-4">
                {/* Search bar */}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search wire, node, EPN, module..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setSearchQuery("")}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="form-text text-muted small mt-1">
                    Showing {filteredWires.length} of {wires.length} wires
                  </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        {WIRE_COLUMNS.map((col, i) => (
                          <th key={i} style={col.style}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {wiresLoading ? (
                        <tr>
                          <td colSpan={WIRE_COLUMNS.length} className="text-center py-4">
                            <div className="spinner-border spinner-border-sm" role="status" />
                          </td>
                        </tr>
                      ) : filteredWires.length === 0 ? (
                        <tr>
                          <td
                            colSpan={WIRE_COLUMNS.length}
                            className="text-center text-muted py-4"
                          >
                            {searchQuery
                              ? "No wires match your search."
                              : "No wire data imported yet. Use the upload panel to import Excel data."}
                          </td>
                        </tr>
                      ) : (
                        filteredWires.map(renderWireRow)
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
          WIRE MODALS
      ═══════════════════════════════════════════════════════════ */}
      {showWireAdd && (
        <ModalWrapper title="Add Wire" headerClass="text-white" headerStyle={{ backgroundColor: "#1a1a2e" }} onClose={() => setShowWireAdd(false)}>
          <WireForm form={wireForm} onChange={handleWireInput} />
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowWireAdd(false)}>Cancel</button>
            <button className="btn text-white" style={{ backgroundColor: "#1a1a2e" }} onClick={handleAddWire}>Create</button>
          </div>
        </ModalWrapper>
      )}

      {showWireEdit && (
        <ModalWrapper title="Edit Wire" headerClass="bg-warning text-dark" onClose={() => setShowWireEdit(false)}>
          <WireForm form={wireForm} onChange={handleWireInput} />
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowWireEdit(false)}>Cancel</button>
            <button className="btn btn-warning" onClick={handleEditWire}>Save Changes</button>
          </div>
        </ModalWrapper>
      )}

      {showWireDelete && (
        <ModalWrapper title="Delete Wire" headerClass="text-white" headerStyle={{ backgroundColor: "#1a1a2e" }} onClose={() => setShowWireDelete(false)}>
          <div className="modal-body">
            <p>Are you sure you want to delete wire <strong>{selectedWire?.WireNumber}</strong>?</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowWireDelete(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteWire}>Delete</button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  Shared modal wrapper
// ──────────────────────────────────────────────────────────────────────────────
function ModalWrapper({ title, headerClass = "", headerStyle = {}, onClose, children }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className={`modal-header ${headerClass}`} style={headerStyle}>
            <h5 className="modal-title fw-bold">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  Wire form fields
// ──────────────────────────────────────────────────────────────────────────────
function WireForm({ form, onChange }) {
  const fields = [
    { label: "Wire Number", name: "wireNumber" },
    { label: "CSA", name: "csa", type: "number" },
    { label: "Length", name: "length", type: "number" },
    { label: "C1 (color code)", name: "c1" },
    { label: "C2 (color code)", name: "c2" },
    { label: "Loc", name: "loc" },
    { label: "Node", name: "node" },
    { label: "EPN", name: "epn" },
    { label: "Cavity", name: "cavity" },
    { label: "Module", name: "module" },
    { label: "Station", name: "station" },
    { label: "Twist", name: "twist" },
    { label: "Core", name: "core" },
    { label: "Splice", name: "splice" },
  ];
  return (
    <div className="modal-body">
      <div className="row g-3">
        {fields.map(({ label, name, type = "text" }) => (
          <div className="col-6" key={name}>
            <label className="form-label small fw-semibold">{label}</label>
            <input
              type={type}
              className="form-control form-control-sm"
              name={name}
              value={form[name]}
              onChange={onChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
