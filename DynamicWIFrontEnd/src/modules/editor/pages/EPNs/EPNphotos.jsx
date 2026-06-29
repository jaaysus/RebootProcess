import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPhotos,
  uploadPhotoBulk,
  deletePhoto,
  selectPhotos,
  selectPhotosLoading,
  photoUrl,
} from "../../../../redux/slices/epnsSlice";
import AppNavbar from "../../../../components/Navbar";

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="component-modal-overlay">
      <div className="component-modal-box">
        <button className="component-modal-close" onClick={onCancel}>
          <X size={16} />
        </button>
        <div className="component-modal-icon">
          <Trash2 size={28} color="#d9534f" />
        </div>
        <h3 className="component-modal-title">Delete Photo</h3>
        <p className="component-modal-text">
          Are you sure you want to delete this photo? This action cannot be undone.
        </p>
        <div className="component-modal-actions">
          <button className="component-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="component-modal-confirm" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EPNphotos() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [deleteId, setDeleteId] = useState(null);

  const photos = useSelector(selectPhotos);
  const loading = useSelector(selectPhotosLoading);

  useEffect(() => {
    dispatch(fetchPhotos());
  }, [dispatch]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    await dispatch(uploadPhotoBulk(files));
    e.target.value = "";
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      dispatch(deletePhoto(deleteId));
      setDeleteId(null);
    }
  };

  const getDisplayName = (filePath) => {
    if (!filePath) return "";
    const fileName = filePath.split("/").pop();
    return fileName.replace(/_\d{14}(?=\.[^.]+$)/, "")
    .replace(/\.[^.]+$/, "");    
  };

  return (
    <div>
      {deleteId && (
        <DeleteModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <main>
        <div className="component-page">
          <div className="component-upload-box">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <button
              className="component-upload-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
            >
              <Upload size={16} />
              {loading ? "Uploading..." : "Upload Image(s)"}
            </button>
          </div>

          <div className="component-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="component-card">
                <img
                  src={photoUrl(photo.filePath)}
                  alt={getDisplayName(photo.filePath)}
                  className="component-image"
                />

                <div className="component-file-name">
                  {getDisplayName(photo.filePath)}
                </div>

                <span className="component-size-overlay">
                  {photo.photoWidth} × {photo.photoHeight}
                </span>

                <button
                  className="component-delete-overlay"
                  onClick={() => handleDeleteClick(photo.id)}
                  title="Delete photo"
                  aria-label="Delete photo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}