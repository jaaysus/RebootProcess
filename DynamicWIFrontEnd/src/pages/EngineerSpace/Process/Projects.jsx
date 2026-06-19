import React, { useState } from "react";
import AppNavbar from "../../../components/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaFolder, FaIndustry, FaPlus, FaChevronDown, FaChevronRight, FaEdit } from "react-icons/fa";

/* ───────── DATA ───────── */
const projectData = {
  id: "p1",
  name: "L461",
  image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbgFEtO7qnywt9CZ6U17tNwpBWKSC5jKXBYw&s",
  stations: [
    ...Array.from({ length: 16 }, (_, i) => `Preassembly ${i + 12}`),
    ...Array.from({ length: 17 }, (_, i) => `Cell ${i + 1}`),
  ],
};

const tableColumns = [
  "Description", "Extra", "Sortie", "Component", "Added Items", "Core",
  "SP Loc", "CSA", "LENGTH", "Wire Name",
  "C1", "C2", "C3",
  "Node 1", "Cav. 1", "Node 2", "Cav2", "Module", "STATION"
];

/* ───────── DYNAMIC MOCK ROWS ───────── */
const mockRows = [];
const actions = [
  "Prendre",
  "Positionner le connecteur dans leur contrepartie et mettre les circuits au fourche \"L\" défini",
  "Séparer le circuit et encliqueter de l'autre extrémité",
  "Installer le GROMMET et positionner le circuit correctement",
  "Vérifier l'orientation du connecteur",
  "Appliquer du spray lubrifiant pour faciliter l'insertion",
  "Contrôler la continuité du câble",
  "Régler la position du module sur le rack",
  "Fixer les circuits avec le clip de maintien",
  "Mesurer la longueur du câble avant insertion",
  "Connecter les circuits aux nodes désignés",
  "Étiqueter le câble selon le plan",
  "Séparer les circuits et préparer pour le test",
  "Effectuer une inspection visuelle",
  "Vérifier l'identification des connecteurs",
  "Aligner les câbles sur le chemin prévu"
];
const wireColors = ["GN", "BU", "VT", "WH", "GY", "BK", "YE"];
const modules = ["MD100", "MD150", "MD162", "MD220", "MD364", "MD372"];
const cores = ["Yes", "No"];

projectData.stations.forEach((station, idx) => {
  const rowCount = Math.floor(Math.random() * 4) + 4;
  for (let i = 0; i < rowCount; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const module = modules[Math.floor(Math.random() * modules.length)];
    const core = cores[Math.floor(Math.random() * cores.length)];
    const c1 = wireColors[Math.floor(Math.random() * wireColors.length)];
    const c2 = wireColors[Math.floor(Math.random() * wireColors.length)];
    const c3 = wireColors[Math.floor(Math.random() * wireColors.length)];

    mockRows.push({
      Description: action,
      Extra: i % 2 === 0 ? `Core 30-${idx + 1} action ${i + 1}` : "",
      Sortie: `Core30-P${idx * 5 + i + 26}`,
      Component: i % 2 === 0 ? `C4CC${10 + i}A` : "",
      "Added Items": i % 2 === 0 ? `E0557${200 + i}` : "",
      Core: i % 2 === 0 ? core : "",
      "SP Loc": (i % 2 === 0 ? 0.75 : 0.35).toString(),
      CSA: (4050 + i + idx).toString(),
      LENGTH: "",
      "Wire Name": i % 2 === 0 ? `CCL2${i}AB` : `RCL2${i}AB`,
      C1: c1,
      C2: c2,
      C3: c3,
      "Node 1": "",
      "Cav. 1": "",
      "Node 2": "",
      Cav2: "",
      Module: module,
      STATION: station,
    });
  }
});
export { mockRows };

/* ───────── COMPONENT ───────── */
export default function Projects() {
  const [projects, setProjects] = useState([projectData]);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [rows, setRows] = useState(mockRows);

  /* NEW STATES */
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [modelName, setModelName] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [projectImage, setProjectImage] = useState("");
  const [newStationName, setNewStationName] = useState("");
  const [expandedInstructions, setExpandedInstructions] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeInstructionIndex, setActiveInstructionIndex] = useState(null);
  const [editedInstruction, setEditedInstruction] = useState(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;
  const stations = selectedProject?.stations || [];

  const filteredRows = selectedStation
    ? rows.filter((row) => row.STATION === selectedStation)
    : [];

  const breadcrumbs = [
    { label: "Projects", link: "/" },
    ...(selectedProject ? [{ label: selectedProject.name, link: "/projects" }] : []),
    ...(selectedStation ? [{ label: selectedStation, link: null }] : [])
  ];

  const handleCreateProject = () => {
    const projectName = modelName.trim() || `New Project ${projects.length + 1}`;
    const finalName = modelYear.trim() ? `${projectName} (${modelYear.trim()})` : projectName;
    const finalImage = projectImage || "https://via.placeholder.com/640x360?text=Project+Image";

    if (editingProjectId) {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === editingProjectId
            ? { ...project, name: finalName, image: finalImage }
            : project
        )
      );
      setSelectedProjectId(editingProjectId);
    } else {
      const projectId = `p${Date.now()}`;
      const project = {
        id: projectId,
        name: finalName,
        image: finalImage,
        stations: [],
      };
      setProjects((prev) => [...prev, project]);
      setExpandedProjects((prev) => ({ ...prev, [projectId]: true }));
      setSelectedProjectId(projectId);
    }

    setSelectedStation(null);
    setShowAddProject(false);
    setEditingProjectId(null);
    setModelName("");
    setModelYear("");
    setProjectImage("");
    setNewStationName("");
  };

  const handleAddStation = () => {
    if (!selectedProjectId || !newStationName.trim()) return;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === selectedProjectId
          ? { ...project, stations: [...project.stations, newStationName.trim()] }
          : project
      )
    );
    setNewStationName("");
  };

  const handleInstructionChange = (column, value) => {
    setEditedInstruction((prev) => ({ ...prev, [column]: value }));
  };

  const handleSaveInstruction = () => {
    if (activeInstructionIndex === null || !editedInstruction) return;

    setRows((prev) =>
      prev.map((row, idx) => (idx === activeInstructionIndex ? editedInstruction : row))
    );
    setShowEditModal(false);
    setActiveInstructionIndex(null);
    setEditedInstruction(null);
  };

  const handleProjectImageFile = (file) => {
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setProjectImage(imageUrl);
  };

  const openCreateProjectForm = () => {
    setEditingProjectId(null);
    setModelName("");
    setModelYear("");
    setProjectImage("");
    setShowAddProject(true);
  };

  const openEditProjectForm = (project) => {
    setEditingProjectId(project.id);
    setModelName(project.name);
    setModelYear("");
    setProjectImage(project.image);
    setShowAddProject(true);
  };

  const handleDeleteProject = (projectId) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setExpandedProjects((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
      setSelectedStation(null);
    }
    if (editingProjectId === projectId) {
      setShowAddProject(false);
      setEditingProjectId(null);
      setModelName("");
      setModelYear("");
      setProjectImage("");
    }
  };

  return (
    <>
      <AppNavbar />
      <div className="container-fluid mt-4">

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <li
                key={idx}
                className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? "active" : ""}`}
                style={{ cursor: crumb.link ? "pointer" : "default" }}
                onClick={() => crumb.link && console.log("Navigate to:", crumb.link)}
              >
                {crumb.label}
              </li>
            ))}
          </ol>
        </nav>

        <div className="row">
          {/* Tree View */}
          <div className="col-md-3 border-end" style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
            <button
              className="btn btn-outline-danger w-100 mb-3 d-flex align-items-center justify-content-center"
              style={{ height: "48px", fontSize: "20px" }}
              onClick={openCreateProjectForm}
            >
              <FaPlus className="me-2" />
              New Project
            </button>

            {projects.map((project) => {
              const isExpanded = !!expandedProjects[project.id];
              const isSelectedProject = selectedProjectId === project.id;
              return (
                <div key={project.id} className="card shadow-sm mb-3">
                  <div style={{ width: "100%", height: "180px", overflow: "hidden" }}>
                    <img
                      src={project.image}
                      alt={project.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  </div>

                  <div className="card-body p-2">
                    <div
                      className={`fw-bold d-flex align-items-center ${isSelectedProject ? "text-danger" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setSelectedStation(null);
                        setExpandedProjects((prev) => ({ ...prev, [project.id]: !isExpanded }));
                      }}
                    >
                      <FaFolder style={{ marginRight: "6px" }} />
                      <span className="me-2">{project.name}</span>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditProjectForm(project);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    {isExpanded && (
                      <ul
                        className="list-group list-group-flush mt-2"
                        style={{ maxHeight: "40vh", overflowY: "auto" }}
                      >
                        {project.stations.map((station) => (
                          <li
                            key={`${project.id}-${station}`}
                            className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                              isSelectedProject && selectedStation === station ? "active" : ""
                            }`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setSelectedStation(station);
                              setShowAddProject(false);
                              setEditingProjectId(null);
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <FaIndustry style={{ marginRight: "6px" }} />
                              {station}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main View */}
          <div className="col-md-9">

            {/* MAIN CONTENT */}
            <div className="flex-grow-1">
              {showAddProject ? (
                <div className="card shadow-sm">
                  <div className="card-header fw-bold text-danger">
                    {editingProjectId ? "Edit Project" : "Add New Project"}
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <label>Model Name</label>
                      <input className="form-control" value={modelName} onChange={e=>setModelName(e.target.value)} />
                    </div>
                    <div className="mb-2">
                      <label>Model Year</label>
                      <input className="form-control" value={modelYear} onChange={e=>setModelYear(e.target.value)} />
                    </div>
                    <div className="mb-2">
                      <label>Project Image URL</label>
                      <input
                        className="form-control"
                        value={projectImage}
                        placeholder="https://..."
                        onChange={e=>setProjectImage(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>Or Upload Project Image</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => handleProjectImageFile(e.target.files?.[0])}
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <button className="btn btn-danger" onClick={handleCreateProject}>
                        {editingProjectId ? "Save Project" : "Create Project"}
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setShowAddProject(false);
                          setEditingProjectId(null);
                        }}
                      >
                        Close
                      </button>
                    </div>

                    <hr/>

                    <h6>Add Station To Selected Project</h6>
                    <div className="d-flex mb-2">
                      <input
                        className="form-control me-2"
                        placeholder="Station name"
                        value={newStationName}
                        onChange={e=>setNewStationName(e.target.value)}
                      />
                      <button className="btn btn-danger" onClick={handleAddStation}>+</button>
                    </div>

                    <ul className="list-group">
                      {stations.map((s,i)=>(
                        <li key={i} className="list-group-item">{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : !selectedStation ? (
                <div className="alert alert-secondary">
                  Select a station to view work instructions.
                </div>
              ) : (
                <div className="card shadow-sm">
                  <div className="card-header fw-bold text-danger d-flex justify-content-between align-items-center">
                    <span>{selectedStation} — Work Instructions</span>
                  </div>

                  <div className="card-body">

                    {/* COLLAPSIBLE WORK INSTRUCTIONS */}
                    <div
                      className="d-flex align-items-center mb-2"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setExpandedInstructions(prev => ({
                          ...prev,
                          [selectedStation]: !prev[selectedStation]
                        }))
                      }
                    >
                      {expandedInstructions[selectedStation] ? <FaChevronDown/> : <FaChevronRight/>}
                      <span className="ms-2 fw-bold">Instruction Set</span>
                    </div>

                    {expandedInstructions[selectedStation] && (
                      <div className="border rounded p-2 mb-3">

                        {/* FILE INPUT */}
                        <div className="mb-2">
                          <label className="fw-bold">Instruction Images</label>
                          <input type="file" className="form-control" multiple />
                        </div>

                        {/* INSTRUCTIONS LIST */}
                        {filteredRows.slice(0,6).map((row,i)=>(
                          <div
                            key={i}
                            className="border rounded p-2 mb-1 d-flex justify-content-between align-items-center"
                            style={{ cursor:"pointer" }}
                            onClick={()=>{
                              setActiveInstructionIndex(rows.indexOf(row));
                              setEditedInstruction({ ...row });
                              setShowEditModal(true);
                            }}
                          >
                            <span>{row.Description}</span>
                            <FaEdit />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* EXISTING TABLE (UNCHANGED) */}
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm table-hover mb-0">
                        <thead className="table-danger">
                          <tr>
                            {tableColumns.map((col) => (
                              <th key={col} style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.map((row, i) => (
                            <tr key={i}>
                              {tableColumns.map((col) => (
                                <td key={col} style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                                  {row[col]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal show d-block" style={{ background:"rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Instruction</h5>
                <button className="btn-close" onClick={()=>setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {tableColumns.map((column) => (
                    <div key={column} className="col-md-6 mb-2">
                      <label>{column}</label>
                      <input
                        className="form-control"
                        value={editedInstruction?.[column] ?? ""}
                        onChange={(e) => handleInstructionChange(column, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setActiveInstructionIndex(null);
                    setEditedInstruction(null);
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleSaveInstruction}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
