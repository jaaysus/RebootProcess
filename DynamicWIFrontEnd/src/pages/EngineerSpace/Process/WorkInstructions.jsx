import React, { useEffect, useState } from "react";
import { FaFileAlt, FaEdit, FaTrash, FaUpload, FaPlus } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import AppNavbar from "../../../components/Navbar";
import AccordionTable from "../../../components/AccordionTable";
import { api } from "../../../redux/api";

const emptyFormData = { ljsOrd: "", module: "", composite: "" };

const COLUMNS = [
  { label: "LJS_ord" },
  { label: "Module" },
  { label: "Composite" },
  { label: "Actions", style: { width: 100 } },
];

export default function WorkInstructions() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState(emptyFormData);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [error, setError] = useState("");

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await api.get("/workinstructions");
      setModules(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch modules list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleInputChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    try {
      const res = await api.post("/workinstructions/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setModules(res.data);
      setFile(null);
      const fileInput = document.getElementById("excel-file-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error(err);
      setError(err.response?.data || "Failed to upload Excel file.");
    } finally {
      setUploading(false);
    }
  };

  const openAddModal = () => {
    setFormData(emptyFormData);
    setShowAddModal(true);
  };

  const openEditModal = (m) => {
    setSelectedModule(m);
    setFormData({ ljsOrd: m.ljsOrd, module: m.module, composite: m.composite });
    setShowEditModal(true);
  };

  const openDeleteModal = (m) => {
    setSelectedModule(m);
    setShowDeleteModal(true);
  };

  const handleAddModule = async () => {
    try {
      const payload = {
        ljsOrd: parseInt(formData.ljsOrd, 10) || 0,
        module: formData.module,
        composite: formData.composite,
      };
      await api.post("/workinstructions", payload);
      fetchModules();
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      setError("Failed to create module.");
    }
  };

  const handleEditModule = async () => {
    if (!selectedModule) return;
    try {
      const payload = {
        id: selectedModule.id,
        ljsOrd: parseInt(formData.ljsOrd, 10) || 0,
        module: formData.module,
        composite: formData.composite,
      };
      await api.put(`/workinstructions/${selectedModule.id}`, payload);
      fetchModules();
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      setError("Failed to update module.");
    }
  };

  const handleDeleteModule = async () => {
    if (!selectedModule) return;
    try {
      await api.delete(`/workinstructions/${selectedModule.id}`);
      fetchModules();
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
      setError("Failed to delete module.");
    }
  };

  const renderRow = (m, globalIndex) => (
    <tr key={m.id}>
      <td>{m.ljsOrd}</td>
      <td className="fw-semibold text-danger">{m.module}</td>
      <td>{m.composite}</td>
      <td>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-warning" onClick={() => openEditModal(m)}>
            <FaEdit />
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => openDeleteModal(m)}>
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger text-white p-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center">
              <FaFileAlt size={24} />
            </div>
            <div>
              <h2 className="mb-0 fw-bold text-dark">Work Instructions</h2>
              <p className="text-muted mb-0 small">Manage module lists, upload composite structures, and control instruction configurations.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4 shadow-sm" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}

        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-danger text-white py-3">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <FaUpload /> Upload Module Excel
                </h5>
              </div>
              <div className="card-body py-4">
                <form onSubmit={handleUpload}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted small">SELECT EXCEL FILE</label>
                    <input
                      id="excel-file-input"
                      type="file"
                      className="form-control"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      required
                    />
                    <div className="form-text text-muted small mt-2">
                      Upload should contain <code>LJS_ord</code>, <code>module</code>, and <code>composite</code> columns. Uploading a new sheet will overwrite existing entries.
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    disabled={!file || uploading}
                  >
                    {uploading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <FaUpload />
                    )}
                    {uploading ? "Processing Excel..." : "Upload & Overwrite"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="accordion shadow-sm rounded-3" id="workInstructionsAccordion">
              <AccordionTable
                id="modulesListTable"
                icon={<FaFileAlt className="text-white" />}
                title="Modules List"
                defaultOpen={true}
                toolbar={
                  <button className="btn btn-sm btn-danger d-flex align-items-center gap-1" onClick={openAddModal}>
                    <FaPlus /> Add Module
                  </button>
                }
                totalCount={modules.length}
                totalLabel="modules"
                columns={COLUMNS}
                data={modules}
                loading={loading}
                renderRow={renderRow}
                emptyText="No modules imported yet. Use the upload panel to import Excel data."
                searchable={true}
                searchPlaceholder="Search module or composite..."
                searchKeys={["module", "composite"]}
              />
            </div>
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Add Module</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">LJS_ord</label>
                  <input
                    type="number"
                    className="form-control"
                    name="ljsOrd"
                    value={formData.ljsOrd}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Module</label>
                  <input
                    type="text"
                    className="form-control"
                    name="module"
                    value={formData.module}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Composite</label>
                  <input
                    type="text"
                    className="form-control"
                    name="composite"
                    value={formData.composite}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleAddModule}>
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title fw-bold">Edit Module</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">LJS_ord</label>
                  <input
                    type="number"
                    className="form-control"
                    name="ljsOrd"
                    value={formData.ljsOrd}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Module</label>
                  <input
                    type="text"
                    className="form-control"
                    name="module"
                    value={formData.module}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Composite</label>
                  <input
                    type="text"
                    className="form-control"
                    name="composite"
                    value={formData.composite}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-warning" onClick={handleEditModule}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Delete Module</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete module <strong>{selectedModule?.module}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteModule}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
