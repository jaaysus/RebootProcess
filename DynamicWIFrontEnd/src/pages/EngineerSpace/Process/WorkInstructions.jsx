import React, { useEffect, useState } from "react";
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
import AccordionTable from "../../../components/AccordionTable";
import { api } from "../../../redux/api";

// ─── Module List ────────────────────────────────────────────────────────────
const emptyModule = { ljsOrd: "", module: "", composite: "" };

const MODULE_COLUMNS = [
  { label: "LJS_ord" },
  { label: "Module" },
  { label: "Composite" },
  { label: "Actions", style: { width: 100 } },
];

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
  { label: "Total Cav" },
  { label: "Cavity" },
  { label: "Module" },
  { label: "Station" },
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
  totalCav: "",
  cavity: "",
  module: "",
  station: "",
};

export default function WorkInstructions() {
  // ── Module state ───────────────────────────────────────────────
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleFile, setModuleFile] = useState(null);
  const [uploadingModules, setUploadingModules] = useState(false);
  const [moduleForm, setModuleForm] = useState(emptyModule);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showModuleAdd, setShowModuleAdd] = useState(false);
  const [showModuleEdit, setShowModuleEdit] = useState(false);
  const [showModuleDelete, setShowModuleDelete] = useState(false);

  // ── Wire state ─────────────────────────────────────────────────
  const [wires, setWires] = useState([]);
  const [wiresLoading, setWiresLoading] = useState(false);
  const [wireFile, setWireFile] = useState(null);
  const [uploadingWires, setUploadingWires] = useState(false);
  const [wireForm, setWireForm] = useState(emptyWire);
  const [selectedWire, setSelectedWire] = useState(null);
  const [showWireAdd, setShowWireAdd] = useState(false);
  const [showWireEdit, setShowWireEdit] = useState(false);
  const [showWireDelete, setShowWireDelete] = useState(false);

  // ── Node lookup ────────────────────────────────────────────────
  const [nodeQuery, setNodeQuery] = useState("");
  const [nodeResult, setNodeResult] = useState(null);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [nodeError, setNodeError] = useState("");

  const [error, setError] = useState("");

  // ════════════════════════════════════════════════════════════════
  //  Fetch helpers
  // ════════════════════════════════════════════════════════════════
  const fetchModules = async () => {
    setModulesLoading(true);
    try {
      const res = await api.get("/workinstructions");
      setModules(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch module list.");
    } finally {
      setModulesLoading(false);
    }
  };

  const fetchWires = async () => {
    setWiresLoading(true);
    try {
      const res = await api.get("/wiredata");
      setWires(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch wire data.");
    } finally {
      setWiresLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
    fetchWires();
  }, []);

  // ════════════════════════════════════════════════════════════════
  //  Module CRUD
  // ════════════════════════════════════════════════════════════════
  const handleModuleInput = (e) =>
    setModuleForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleModuleUpload = async (e) => {
    e.preventDefault();
    if (!moduleFile) return;
    setUploadingModules(true);
    setError("");
    const fd = new FormData();
    fd.append("file", moduleFile);
    try {
      const res = await api.post("/workinstructions/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setModules(res.data);
      setModuleFile(null);
      document.getElementById("module-file-input").value = "";
    } catch (err) {
      setError(err.response?.data || "Failed to upload Module Excel.");
    } finally {
      setUploadingModules(false);
    }
  };

  const handleAddModule = async () => {
    try {
      await api.post("/workinstructions", {
        ljsOrd: parseInt(moduleForm.ljsOrd, 10) || 0,
        module: moduleForm.module,
        composite: moduleForm.composite,
      });
      fetchModules();
      setShowModuleAdd(false);
    } catch {
      setError("Failed to create module.");
    }
  };

  const handleEditModule = async () => {
    if (!selectedModule) return;
    try {
      await api.put(`/workinstructions/${selectedModule.id}`, {
        id: selectedModule.id,
        ljsOrd: parseInt(moduleForm.ljsOrd, 10) || 0,
        module: moduleForm.module,
        composite: moduleForm.composite,
      });
      fetchModules();
      setShowModuleEdit(false);
    } catch {
      setError("Failed to update module.");
    }
  };

  const handleDeleteModule = async () => {
    if (!selectedModule) return;
    try {
      await api.delete(`/workinstructions/${selectedModule.id}`);
      fetchModules();
      setShowModuleDelete(false);
    } catch {
      setError("Failed to delete module.");
    }
  };

  const renderModuleRow = (m) => (
    <tr key={m.id}>
      <td>{m.ljsOrd}</td>
      <td className="fw-semibold text-danger">{m.module}</td>
      <td>{m.composite}</td>
      <td>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-warning"
            onClick={() => {
              setSelectedModule(m);
              setModuleForm({ ljsOrd: m.ljsOrd, module: m.module, composite: m.composite });
              setShowModuleEdit(true);
            }}
          >
            <FaEdit />
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => { setSelectedModule(m); setShowModuleDelete(true); }}
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  );

  // ════════════════════════════════════════════════════════════════
  //  Wire CRUD
  // ════════════════════════════════════════════════════════════════
  const handleWireInput = (e) =>
    setWireForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleWireUpload = async (e) => {
    e.preventDefault();
    if (!wireFile) return;
    setUploadingWires(true);
    setError("");
    const fd = new FormData();
    fd.append("file", wireFile);
    try {
      const res = await api.post("/wiredata/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setWires(res.data);
      setWireFile(null);
      document.getElementById("wire-file-input").value = "";
    } catch (err) {
      setError(err.response?.data || "Failed to upload Wire Data Excel.");
    } finally {
      setUploadingWires(false);
    }
  };

  const handleAddWire = async () => {
    try {
      await api.post("/wiredata", {
        ...wireForm,
        csa: parseFloat(wireForm.csa) || 0,
        length: parseFloat(wireForm.length) || 0,
        totalCav: parseInt(wireForm.totalCav, 10) || 0,
      });
      fetchWires();
      setShowWireAdd(false);
    } catch {
      setError("Failed to create wire.");
    }
  };

  const handleEditWire = async () => {
    if (!selectedWire) return;
    try {
      await api.put(`/wiredata/${selectedWire.id}`, {
        id: selectedWire.id,
        ...wireForm,
        csa: parseFloat(wireForm.csa) || 0,
        length: parseFloat(wireForm.length) || 0,
        totalCav: parseInt(wireForm.totalCav, 10) || 0,
      });
      fetchWires();
      setShowWireEdit(false);
    } catch {
      setError("Failed to update wire.");
    }
  };

  const handleDeleteWire = async () => {
    if (!selectedWire) return;
    try {
      await api.delete(`/wiredata/${selectedWire.id}`);
      fetchWires();
      setShowWireDelete(false);
    } catch {
      setError("Failed to delete wire.");
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
      <td>{w.totalCav}</td>
      <td>{w.cavity}</td>
      <td>{w.module}</td>
      <td>{w.station}</td>
      <td>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-warning"
            onClick={() => {
              setSelectedWire(w);
              setWireForm({
                wireNumber: w.wireNumber, csa: w.csa, length: w.length,
                c1: w.c1, c2: w.c2, loc: w.loc, node: w.node, epn: w.epn,
                totalCav: w.totalCav, cavity: w.cavity, module: w.module, station: w.station,
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
    setNodeLoading(true);
    setNodeError("");
    setNodeResult(null);
    try {
      const res = await api.get(`/wiredata/node/${encodeURIComponent(nodeQuery.trim())}`);
      setNodeResult(res.data);
    } catch (err) {
      setNodeError(err.response?.data?.message || `No wires found for node "${nodeQuery}".`);
    } finally {
      setNodeLoading(false);
    }
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
              Manage module lists, wire data, upload composite structures, and control instruction configurations.
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
            SECTION 1 — Module List
        ══════════════════════════════════════════════════════════ */}
        <div className="row g-4 mb-5">
          {/* Upload card */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-header bg-danger text-white py-3">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <FaUpload /> Upload Module Excel
                </h5>
              </div>
              <div className="card-body py-4">
                <form onSubmit={handleModuleUpload}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted small">SELECT EXCEL FILE</label>
                    <input
                      id="module-file-input"
                      type="file"
                      className="form-control"
                      accept=".xlsx,.xls"
                      onChange={(e) => e.target.files?.[0] && setModuleFile(e.target.files[0])}
                      required
                    />
                    <div className="form-text text-muted small mt-2">
                      Requires <code>LJS_ord</code>, <code>module</code>, <code>composite</code> columns.
                      Uploading overwrites existing entries.
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    disabled={!moduleFile || uploadingModules}
                  >
                    {uploadingModules
                      ? <span className="spinner-border spinner-border-sm" role="status" />
                      : <FaUpload />}
                    {uploadingModules ? "Processing..." : "Upload & Overwrite"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Module accordion */}
          <div className="col-12 col-lg-8">
            <div className="accordion shadow-sm rounded-3" id="modulesAccordion">
              <AccordionTable
                id="modulesListTable"
                icon={<FaFileAlt className="text-white" />}
                title="Modules List"
                defaultOpen
                toolbar={
                  <button className="btn btn-sm btn-danger d-flex align-items-center gap-1" onClick={() => { setModuleForm(emptyModule); setShowModuleAdd(true); }}>
                    <FaPlus /> Add Module
                  </button>
                }
                totalCount={modules.length}
                totalLabel="modules"
                columns={MODULE_COLUMNS}
                data={modules}
                loading={modulesLoading}
                renderRow={renderModuleRow}
                emptyText="No modules imported yet. Use the upload panel to import Excel data."
                searchable
                searchPlaceholder="Search module or composite..."
                searchKeys={["module", "composite"]}
              />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — Wire Data
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
                  <div className="alert alert-warning py-2 small">{nodeError}</div>
                )}

                {nodeResult && (
                  <div>
                    <div className="mb-2">
                      <span className="fw-bold">Node:</span> <code>{nodeResult.nodeName}</code>
                    </div>
                    <div className="mb-2">
                      <span className="fw-bold">EPN:</span> <code>{nodeResult.epn}</code>
                      {nodeResult.epnId && (
                        <span className="ms-2 badge bg-secondary">ID #{nodeResult.epnId}</span>
                      )}
                    </div>
                    <div className="mb-2">
                      <span className="fw-bold">Cavity Count:</span> {nodeResult.cavityCount}
                    </div>
                    {nodeResult.needsCoordination && (
                      <div className="alert alert-warning py-1 small mb-2">
                        ⚠ EPN coordinates not set yet.
                      </div>
                    )}

                    {/* Cavity Colors */}
                    <div className="mb-2">
                      <span className="fw-bold small d-block mb-1">Cavity Colors (from wire data):</span>
                      <div className="d-flex flex-wrap gap-1">
                        {Object.entries(nodeResult.cavityColors || {}).map(([cav, colors]) => (
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
                          {(nodeResult.wires || []).map((w) => (
                            <tr key={w.id}>
                              <td><code>{w.wireNumber}</code></td>
                              <td>{w.cavity}</td>
                              <td><span className="badge bg-secondary">{w.c1}</span></td>
                              <td><span className="badge bg-secondary">{w.c2}</span></td>
                              <td>{w.module}</td>
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

          {/* Wire Data accordion */}
          <div className="col-12 col-lg-8">
            <div className="accordion shadow-sm rounded-3" id="wireDataAccordion">
              <AccordionTable
                id="wireDataTable"
                icon={<FaPlug className="text-white" />}
                title="Wire Data"
                defaultOpen
                toolbar={
                  <button
                    className="btn btn-sm d-flex align-items-center gap-1 text-white"
                    style={{ backgroundColor: "#1a1a2e" }}
                    onClick={() => { setWireForm(emptyWire); setShowWireAdd(true); }}
                  >
                    <FaPlus /> Add Wire
                  </button>
                }
                totalCount={wires.length}
                totalLabel="wires"
                columns={WIRE_COLUMNS}
                data={wires}
                loading={wiresLoading}
                renderRow={renderWireRow}
                emptyText="No wire data imported yet. Use the upload panel to import Excel data."
                searchable
                searchPlaceholder="Search wire, node, EPN, module..."
                searchKeys={["wireNumber", "node", "epn", "module", "station", "loc"]}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════
          MODULE MODALS
      ═══════════════════════════════════════════════════════════ */}
      {showModuleAdd && (
        <ModalWrapper title="Add Module" headerClass="bg-danger text-white" onClose={() => setShowModuleAdd(false)}>
          <ModuleForm form={moduleForm} onChange={handleModuleInput} />
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModuleAdd(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleAddModule}>Create</button>
          </div>
        </ModalWrapper>
      )}

      {showModuleEdit && (
        <ModalWrapper title="Edit Module" headerClass="bg-warning text-dark" onClose={() => setShowModuleEdit(false)}>
          <ModuleForm form={moduleForm} onChange={handleModuleInput} />
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModuleEdit(false)}>Cancel</button>
            <button className="btn btn-warning" onClick={handleEditModule}>Save Changes</button>
          </div>
        </ModalWrapper>
      )}

      {showModuleDelete && (
        <ModalWrapper title="Delete Module" headerClass="bg-danger text-white" onClose={() => setShowModuleDelete(false)}>
          <div className="modal-body">
            <p>Are you sure you want to delete module <strong>{selectedModule?.module}</strong>?</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModuleDelete(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteModule}>Delete</button>
          </div>
        </ModalWrapper>
      )}

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
            <p>Are you sure you want to delete wire <strong>{selectedWire?.wireNumber}</strong>?</p>
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
//  Module form fields
// ──────────────────────────────────────────────────────────────────────────────
function ModuleForm({ form, onChange }) {
  return (
    <div className="modal-body">
      <div className="mb-3">
        <label className="form-label">LJS_ord</label>
        <input type="number" className="form-control" name="ljsOrd" value={form.ljsOrd} onChange={onChange} />
      </div>
      <div className="mb-3">
        <label className="form-label">Module</label>
        <input type="text" className="form-control" name="module" value={form.module} onChange={onChange} />
      </div>
      <div className="mb-3">
        <label className="form-label">Composite</label>
        <input type="text" className="form-control" name="composite" value={form.composite} onChange={onChange} />
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
    { label: "Total Cavities", name: "totalCav", type: "number" },
    { label: "Cavity", name: "cavity" },
    { label: "Module", name: "module" },
    { label: "Station", name: "station" },
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
