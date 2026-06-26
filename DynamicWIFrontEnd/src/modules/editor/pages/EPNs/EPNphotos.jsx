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
    <div style={styles.modalOverlay}>
      <div style={styles.modalBox}>
        <button style={styles.modalClose} onClick={onCancel}>
          <X size={16} />
        </button>
        <div style={styles.modalIcon}>
          <Trash2 size={28} color="#d9534f" />
        </div>
        <h3 style={styles.modalTitle}>Delete Photo</h3>
        <p style={styles.modalText}>
          Are you sure you want to delete this photo? This action cannot be undone.
        </p>
        <div style={styles.modalActions}>
          <button style={styles.modalCancel} onClick={onCancel}>
            Cancel
          </button>
          <button style={styles.modalConfirm} onClick={onConfirm}>
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

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <AppNavbar />

      {deleteId && (
        <DeleteModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <main className="container-fluid p-4 flex-grow-1">
        <div style={styles.page}>
          <div style={styles.uploadBox}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <button
              style={styles.uploadBtn}
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
            >
              <Upload size={16} />
              {loading ? "Uploading..." : "Upload Image(s)"}
            </button>
          </div>

          <div style={styles.grid}>
            {photos.map((photo) => (
              <div key={photo.id} style={styles.card}>
                <img
                  src={photoUrl(photo.filePath)}
                  alt=""
                  style={styles.image}
                />
                <span style={styles.sizeOverlay}>
                  {photo.photoWidth} × {photo.photoHeight}
                </span>
                <button
                  style={styles.deleteOverlay}
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

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },

  uploadBox: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "30px",
  },

  uploadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    background: '#2c3e2b',
    color: '#ece8df',
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    letterSpacing: "1px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
    gap: "20px",
  },

  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#fff",
    position: "relative",
  },

  image: {
    width: "100%",
    height: "260px",
    objectFit: "contain",
    display: "block",
    background: "#f9f9f9",
  },

  sizeOverlay: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "rgba(0, 0, 0, 0.3)",
    color: "rgba(255, 255, 255, 0.8)",
    padding: "3px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "500",
    pointerEvents: "none",
  },

  deleteOverlay: {
    position: "absolute",
    bottom: "8px",
    left: "8px",
    border: "none",
    background: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#d9534f",
  },

  // Modal styles
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalBox: {
    background: "#fff",
    borderRadius: "12px",
    padding: "32px 28px 24px",
    width: "100%",
    maxWidth: "360px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  },
  modalClose: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#aaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
  },
  modalIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#fdf0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "700",
    color: "#222",
  },
  modalText: {
    margin: 0,
    fontSize: "13px",
    color: "#777",
    textAlign: "center",
    lineHeight: "1.6",
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    width: "100%",
    marginTop: "8px",
  },
  modalCancel: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "7px",
    background: "#fff",
    color: "#555",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  modalConfirm: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "7px",
    background: "#d9534f",
    color: "#fff",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
};