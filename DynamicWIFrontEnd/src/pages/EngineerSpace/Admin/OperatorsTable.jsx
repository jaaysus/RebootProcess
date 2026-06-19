import React, { useEffect, useRef, useState } from "react";
import { FaTools, FaEdit, FaTrash, FaSync, FaDownload, FaFileExcel } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import AppNavbar from "../../../components/Navbar";
import { fetchOperators, createOperator, updateOperator as updateOperatorByBadge, deleteOperator as deleteOperatorByBadge, regenerateCredentials, downloadQr, uploadOperatorsExcel } from "../../../redux/slices/operatorSlice";
import { QRCodeCanvas } from "qrcode.react";
import AccordionTable from "../../../components/AccordionTable";
import OperatorModals from "../../../components/OperatorModals";

const OPERATOR_COLUMNS = [
  { label: "", style: { width: 40 } },
  { label: "#" },
  { label: "Full Name" },
  { label: "Badge" },
  { label: "Password" },
  { label: "QR" },
  { label: "Actions" },
];

export default function OperatorsTable() {
  const dispatch = useDispatch();
  const { operators, loading: operatorsLoading } = useSelector((s) => s.operator);

  const [selectedOperator, setSelectedOperator] = useState(null);
  const [selectedOperatorBadges, setSelectedOperatorBadges] = useState([]);
  const [opForm, setOpForm] = useState({ fullName: "", badge: "" });
  const [showOpAdd, setShowOpAdd] = useState(false);
  const [showOpEdit, setShowOpEdit] = useState(false);
  const [showOpDelete, setShowOpDelete] = useState(false);
  const [showOpBulkDelete, setShowOpBulkDelete] = useState(false);
  const excelInputRef = useRef(null);

  useEffect(() => { dispatch(fetchOperators()); }, [dispatch]);

  const getOperatorId = (op) => op?.id ?? op?.Id;
  const getOperatorBadge = (op) => op?.badge ?? op?.Badge;
  const getOperatorFullName = (op) => op?.fullName ?? op?.FullName ?? "";
  const getOperatorPassword = (op) => op?.password ?? op?.Password ?? "";

  const operatorBadges = operators.map(getOperatorBadge).filter(Boolean);
  const someOperatorsSelected = selectedOperatorBadges.length > 0;
  const toggleSelectOperator = (badge) => badge && setSelectedOperatorBadges((prev) => prev.includes(badge) ? prev.filter((x) => x !== badge) : [...prev, badge]);
  const toggleSelectAllOperators = () => setSelectedOperatorBadges(selectedOperatorBadges.length === operatorBadges.length ? [] : operatorBadges);

  const addOperator = async () => { await dispatch(createOperator({ fullName: opForm.fullName, badge: opForm.badge })); setShowOpAdd(false); setOpForm({ fullName: "", badge: "" }); };
  const editOperator = async () => {
    if (!selectedOperator) return;
    await dispatch(updateOperatorByBadge({ badge: getOperatorBadge(selectedOperator), data: { fullName: opForm.fullName, badge: opForm.badge } }));
    setSelectedOperator(null); setShowOpEdit(false); setOpForm({ fullName: "", badge: "" });
  };
  const deleteOperator = async () => {
    if (!selectedOperator) return;
    const badge = getOperatorBadge(selectedOperator);
    await dispatch(deleteOperatorByBadge(badge));
    setSelectedOperatorBadges((prev) => prev.filter((x) => x !== badge));
    setSelectedOperator(null); setShowOpDelete(false);
  };
  const deleteSelectedOperators = async () => { await Promise.all(selectedOperatorBadges.map((badge) => dispatch(deleteOperatorByBadge(badge)))); setSelectedOperatorBadges([]); setShowOpBulkDelete(false); };
  const regeneratePassword = (badge) => dispatch(regenerateCredentials(badge));
  const downloadOperatorQr = async (op) => {
    const opBadge = getOperatorBadge(op);
    if (!opBadge) return;
    const action = await dispatch(downloadQr(opBadge));
    if (!downloadQr.fulfilled.match(action)) return;
    const link = document.createElement("a");
    link.href = action.payload;
    link.download = `${(getOperatorFullName(op) || "operator").trim().replace(/[\\/:*?"<>|]/g, "_")}.png`;
    document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(action.payload);
  };
  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await dispatch(uploadOperatorsExcel(file));
    await dispatch(fetchOperators());
    e.target.value = "";
  };

  const renderOperatorRow = (op, idx) => {
    const opBadge = getOperatorBadge(op);
    const opName = getOperatorFullName(op);
    const opPassword = getOperatorPassword(op);
    return (
      <tr key={getOperatorId(op) ?? opBadge ?? idx}>
        <td>
          <input className="form-check-input" type="checkbox" checked={selectedOperatorBadges.includes(opBadge)}
            onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
            onChange={() => toggleSelectOperator(opBadge)} />
        </td>
        <td>{idx}</td>
        <td onClick={() => toggleSelectOperator(opBadge)} style={{ cursor: "pointer" }}>{opName}</td>
        <td>{opBadge}</td>
        <td style={{ fontSize: "11px", maxWidth: 220, wordBreak: "break-all" }}>{opPassword}</td>
        <td><QRCodeCanvas value={`${opName}|${opPassword}|${opBadge}`} size={64} /></td>
        <td>
          <button type="button" className="btn btn-outline-secondary btn-sm me-1" onClick={() => { setSelectedOperator(op); setOpForm({ fullName: opName, badge: opBadge ?? "" }); setShowOpEdit(true); }}><FaEdit /></button>
          <button type="button" className="btn btn-outline-danger btn-sm me-1" onClick={() => { setSelectedOperator(op); setShowOpDelete(true); }}><FaTrash /></button>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => regeneratePassword(opBadge)}><FaSync /></button>
          <button type="button" className="btn btn-outline-success btn-sm ms-1" onClick={() => downloadOperatorQr(op)}><FaDownload /></button>
        </td>
      </tr>
    );
  };

  return (
    <>
      <AppNavbar />
      <div className="container mt-4">
        <h3 className="fw-bold mb-4">Manage <span className="text-danger">Dashboard</span></h3>
        <div className="accordion border rounded shadow-sm">
          <AccordionTable
            id="collapseOperators"
            icon={<FaTools />}
            title="Operators"
            defaultOpen
            loading={operatorsLoading}
            data={operators}
            columns={OPERATOR_COLUMNS}
            totalLabel="operators"
            emptyText="No operators found."
            renderRow={renderOperatorRow}
            searchable
            searchPlaceholder="Search operators..."
            getSearchText={(op) => `${getOperatorFullName(op)} ${getOperatorBadge(op)} ${getOperatorPassword(op)}`}
            toolbar={
              <>
                <div className="btn-group">
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setShowOpAdd(true)}>+ Add Operator</button>
                  <button type="button" className="btn btn-danger btn-sm border-start" onClick={() => excelInputRef.current?.click()} title="Import from Excel">
                    <FaFileExcel />
                  </button>
                </div>
                {someOperatorsSelected && (
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setShowOpBulkDelete(true)}>
                    <FaTrash className="me-1" />Delete Selected ({selectedOperatorBadges.length})
                  </button>
                )}
                <input ref={excelInputRef} type="file" accept=".xlsx,.xls" className="d-none" onChange={handleExcelImport} />
              </>
            }
          />
        </div>
      </div>

      <OperatorModals
        opForm={opForm} setOpForm={setOpForm}
        selectedOperator={selectedOperator} selectedOperatorBadges={selectedOperatorBadges}
        getOperatorFullName={getOperatorFullName}
        showOpAdd={showOpAdd} setShowOpAdd={setShowOpAdd} addOperator={addOperator}
        showOpEdit={showOpEdit} setShowOpEdit={setShowOpEdit} editOperator={editOperator}
        showOpDelete={showOpDelete} setShowOpDelete={setShowOpDelete} deleteOperator={deleteOperator}
        showOpBulkDelete={showOpBulkDelete} setShowOpBulkDelete={setShowOpBulkDelete} deleteSelectedOperators={deleteSelectedOperators}
      />
    </>
  );
}
