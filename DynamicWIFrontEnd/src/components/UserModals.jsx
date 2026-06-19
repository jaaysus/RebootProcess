import React from "react";
import { FaTrash } from "react-icons/fa";

const modalBackdrop = { backgroundColor: "rgba(0,0,0,0.5)" };

export default function UserModals({
  roles,
  rolesLoading,
  formData,
  handleInputChange,
  selectedUser,
  selectedIds,
  showAddModal, setShowAddModal, handleAddUser,
  showEditModal, setShowEditModal, handleEditUser,
  showDeleteModal, setShowDeleteModal, handleDeleteUser,
  showBulkDeleteModal, setShowBulkDeleteModal, handleBulkDelete,
}) {
  return (
    <>
      {showAddModal && (
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5>Add User</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)} />
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" placeholder="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} />
                <input className="form-control mb-2" placeholder="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} />
                <input className="form-control mb-2" placeholder="Password" type="password" name="password" value={formData.password} onChange={handleInputChange} />
                <select className="form-select" name="role" value={formData.role} onChange={handleInputChange} disabled={rolesLoading}>
                  <option value="">Select role</option>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn btn-danger" disabled={!formData.fullName || !formData.email || !formData.password || !formData.role} onClick={handleAddUser}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5>Edit User</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowEditModal(false)} />
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" placeholder="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} />
                <input className="form-control mb-2" placeholder="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} />
                <select className="form-select" name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="">Select role</option>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="btn btn-warning" disabled={!formData.fullName || !formData.email || !formData.role} onClick={handleEditUser}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5>Delete User</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)} />
              </div>
              <div className="modal-body">
                Are you sure you want to delete <strong>{selectedUser?.fullName ?? selectedUser?.FullName}</strong>?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDeleteUser}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5>Delete Selected Users</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowBulkDeleteModal(false)} />
              </div>
              <div className="modal-body">Delete {selectedIds.length} selected user(s)?</div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowBulkDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleBulkDelete}>Delete All</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}