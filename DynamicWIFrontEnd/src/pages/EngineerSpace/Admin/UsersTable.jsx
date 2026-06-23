import React, { useEffect, useState } from "react";
import { FaUsers, FaEdit, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import AppNavbar from "../../../components/Navbar";
import { fetchUsers, fetchRoles, createUser, updateUser, deleteUser, approveUser, suspendUser } from "../../../redux/slices/userSlice";
import AccordionTable from "../../../components/AccordionTable";
import UserModals from "../../../components/UserModals";

const emptyFormData = { fullName: "", email: "", password: "", role: "" };

const USER_COLUMNS = [
  { label: "", style: { width: 40 } },
  { label: "#" },
  { label: "Full Name" },
  { label: "Email" },
  { label: "Role" },
  { label: "Status" },
  { label: "Actions" },
];

export default function UsersTable() {
  const dispatch = useDispatch();
  const { users, usersLoading, roles, rolesLoading, user: currentUser } = useSelector((s) => s.user);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRoles());
  }, [dispatch]);

  const getUserId = (u) => u?.id ?? u?.Id;
  const currentUserId = getUserId(currentUser);
  const tableUsers = currentUserId ? users.filter((u) => getUserId(u) !== currentUserId) : users;
  const getUserRole = (u) => u?.role ?? u?.Role ?? "";
  const getUserEmail = (u) => u?.email ?? u?.Email ?? "";
  const getUserName = (u) => u?.fullName ?? u?.FullName ?? "";

  const getIsUserActive = (u) => {
    const s = String(u?.status ?? u?.userStatus ?? "").toLowerCase();
    if (s) return s === "active" || s === "approved";
    if (typeof u?.isActive === "boolean") return u.isActive;
    if (typeof u?.IsApproved === "boolean") return u.IsApproved;
    if (typeof u?.isApproved === "boolean") return u.isApproved;
    if (typeof u?.approved === "boolean") return u.approved;
    return false;
  };

  const handleInputChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const someSelected = selectedIds.length > 0;
  const toggleSelectOne = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    const allIds = tableUsers.map(getUserId).filter(Boolean);
    setSelectedIds(selectedIds.length === allIds.length ? [] : allIds);
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({ fullName: u?.fullName ?? u?.FullName ?? "", email: u?.email ?? u?.Email ?? "", password: "", role: u?.role ?? u?.Role ?? "" });
    setShowEditModal(true);
  };

  const handleAddUser = async () => { await dispatch(createUser(formData)); setFormData(emptyFormData); setShowAddModal(false); setSelectedIds([]); };
  const handleEditUser = async () => {
    if (!selectedUser) return;
    const updated = await dispatch(updateUser({ id: getUserId(selectedUser), userData: { fullName: formData.fullName, email: formData.email, role: formData.role } }));
    if (!updated) return;
    setFormData(emptyFormData); setSelectedUser(null); setShowEditModal(false);
  };
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    await dispatch(deleteUser(getUserId(selectedUser)));
    setSelectedIds((prev) => prev.filter((id) => id !== getUserId(selectedUser)));
    setSelectedUser(null); setShowDeleteModal(false);
  };
  const handleBulkDelete = async () => { await Promise.all(selectedIds.map((id) => dispatch(deleteUser(id)))); setSelectedIds([]); setShowBulkDeleteModal(false); };
  const handleStatusToggle = async (u) => {
    const userId = getUserId(u);
    if (!userId) return;
    getIsUserActive(u) ? await dispatch(suspendUser(userId)) : await dispatch(approveUser(userId));
  };

  const roleOptions = (roles || [])
    .map((r) => {
      if (typeof r === "string") return { label: r, value: r };
      const name = r?.name ?? r?.Name ?? r?.role ?? r?.Role;
      return name ? { label: name, value: name } : null;
    })
    .filter(Boolean);
  const userFilters = [
    { label: "Role", options: roleOptions, getValue: getUserRole },
    { label: "Status", options: [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }], getValue: (u) => (getIsUserActive(u) ? "active" : "inactive") },
  ];

  useEffect(() => {
    if (!currentUserId) return;
    setSelectedIds((prev) => prev.filter((id) => id !== currentUserId));
  }, [currentUserId]);

  const renderUserRow = (u, idx) => {
    const userId = getUserId(u);
    const isActive = getIsUserActive(u);
    return (
      <tr key={userId ?? idx}>
        <td>
          <input className="form-check-input" type="checkbox" checked={selectedIds.includes(userId)}
            onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
            onChange={() => toggleSelectOne(userId)} />
        </td>
        <td>{idx}</td>
        <td onClick={() => toggleSelectOne(userId)} style={{ cursor: "pointer" }}>{u?.fullName ?? u?.FullName}</td>
        <td>{u?.email ?? u?.Email}</td>
        <td>{u?.role ?? u?.Role}</td>
        <td>
          <div className="d-inline-flex align-items-center gap-2">
            <div className="form-check form-switch m-0">
              <input id={`st-${userId}`} className="form-check-input m-0" type="checkbox" role="switch"
                checked={isActive} onChange={() => handleStatusToggle(u)}
                style={{ width: "3rem", height: "1.5rem", cursor: "pointer", backgroundColor: isActive ? "#198754" : "#dc3545", borderColor: isActive ? "#198754" : "#dc3545" }} />
            </div>
            <label htmlFor={`st-${userId}`} className={`fw-semibold small mb-0 ${isActive ? "text-success" : "text-danger"}`} style={{ minWidth: 30, cursor: "pointer" }}>
              {isActive ? "ON" : "OFF"}
            </label>
          </div>
        </td>
        <td>
          <button className="btn btn-outline-secondary btn-sm me-1" onClick={() => openEditModal(u)}><FaEdit /></button>
          <button className="btn btn-outline-danger btn-sm" onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}><FaTrash /></button>
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
            id="collapseUsers"
            icon={<FaUsers />}
            title="Users"
            defaultOpen
            loading={usersLoading}
            data={tableUsers}
            columns={USER_COLUMNS}
            totalLabel="users"
            emptyText="No users found."
            renderRow={renderUserRow}
            searchable
            searchPlaceholder="Search users..."
            getSearchText={(u) => `${getUserName(u)} ${getUserEmail(u)} ${getUserRole(u)}`}
            filters={userFilters}
            toolbar={
              <>
                <button className="btn btn-danger btn-sm" onClick={() => setShowAddModal(true)}>+ Add User</button>
                {someSelected && (
                  <button className="btn btn-outline-danger btn-sm" onClick={() => setShowBulkDeleteModal(true)}>
                    <FaTrash className="me-1" />Delete Selected ({selectedIds.length})
                  </button>
                )}
              </>
            }
          />
        </div>
      </div>

      <UserModals
        roles={roles} rolesLoading={rolesLoading}
        formData={formData} handleInputChange={handleInputChange}
        selectedUser={selectedUser} selectedIds={selectedIds}
        showAddModal={showAddModal} setShowAddModal={setShowAddModal} handleAddUser={handleAddUser}
        showEditModal={showEditModal} setShowEditModal={setShowEditModal} handleEditUser={handleEditUser}
        showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal} handleDeleteUser={handleDeleteUser}
        showBulkDeleteModal={showBulkDeleteModal} setShowBulkDeleteModal={setShowBulkDeleteModal} handleBulkDelete={handleBulkDelete}
      />
    </>
  );
}
