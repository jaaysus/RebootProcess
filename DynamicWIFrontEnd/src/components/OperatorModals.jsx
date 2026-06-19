import React from "react";

const modalBackdrop = { backgroundColor: "rgba(0,0,0,0.5)" };

export default function OperatorModals({
  opForm, setOpForm,
  selectedOperator,
  selectedOperatorBadges,
  getOperatorFullName,
  showOpAdd, setShowOpAdd, addOperator,
  showOpEdit, setShowOpEdit, editOperator,
  showOpDelete, setShowOpDelete, deleteOperator,
  showOpBulkDelete, setShowOpBulkDelete, deleteSelectedOperators,
}) {
  return (
    <>
      {showOpAdd && (
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5>Add Operator</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowOpAdd(false)} />
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" placeholder="Full Name" value={opForm.fullName} onChange={(e) => setOpForm({ ...opForm, fullName: e.target.value })} />
                <input className="form-control" placeholder="Badge" value={opForm.badge} onChange={(e) => setOpForm({ ...opForm, badge: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowOpAdd(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={addOperator}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOpEdit && (
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5>Edit Operator</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowOpEdit(false)} />
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" value={opForm.fullName} onChange={(e) => setOpForm({ ...opForm, fullName: e.target.value })} />
                <input className="form-control" value={opForm.badge} onChange={(e) => setOpForm({ ...opForm, badge: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowOpEdit(false)}>Cancel</button>
                <button className="btn btn-warning" onClick={editOperator}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOpDelete && (
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5>Delete Operator</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowOpDelete(false)} />
              </div>
              <div className="modal-body">
                Are you sure you want to delete <strong>{getOperatorFullName(selectedOperator)}</strong>?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowOpDelete(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={deleteOperator}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOpBulkDelete && (
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5>Delete Selected Operators</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowOpBulkDelete(false)} />
              </div>
              <div className="modal-body">Delete {selectedOperatorBadges.length} selected operator(s)?</div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowOpBulkDelete(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={deleteSelectedOperators}>Delete All</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}