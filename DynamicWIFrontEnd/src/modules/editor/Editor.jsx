import { useRef, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import { CavityEditor } from './pages/CavityEditor'
import EPNs from './pages/EPNs/EPNs'
import Connectors from './pages/Connectors'
import Wires from './pages/Wires'
import AppNavbar from '../../components/Navbar'
import { photoUrl } from '../../redux/slices/epnsSlice'

import './Editor.css'

function Editor() {
  const navigate = useNavigate()

  const fileInputRef = useRef(null)
  const [cavityEditorLoad, setCavityEditorLoad] = useState(null)

  // Called from EPNs/Connectors pages
  function handleCoordinateCavities(row, mode = 'epn') {
    console.log('row received:', row)
    const load = {
      photo: photoUrl(row.photo),
      epn: row.epn,
      epnId: row.id, // Add EPN ID for backend API calls
      cavityCount: row.cavityCount, // Add original cavity count for validation
      connector: row.name || '',
      coordinates: {
        cavities: row.cavities,
        imageWidth: row.photoWidth,
        imageHeight: row.photoHeight,
      },
      mode,
    }
    console.log('cavityEditorLoad built:', load)
    setCavityEditorLoad(load)

    navigate('/editor/cavity-editor')
  }

  return (
    <>
      <AppNavbar />
      <div className="editor-module">
        {/* ROUTES */}
        <Routes>
        <Route path="/" element={<Navigate to="epns" replace />} />

        <Route
          path="epns"
          element={
            <EPNs onCoordinateCavities={handleCoordinateCavities} />
          }
        />

        <Route
          path="connectors"
          element={
            <Connectors onCoordinateCavities={handleCoordinateCavities} />
          }
        />

        <Route path="wires" element={<Wires />} />

        <Route
          path="cavity-editor"
          element={
            <>
              <input
                ref={fileInputRef}
                className="sr-only-input"
                type="file"
                accept="image/*"
              />

              <CavityEditor
                key={`${cavityEditorLoad?.mode ?? 'full'}-${cavityEditorLoad?.connector ?? ''}-${cavityEditorLoad?.photo ?? 'no-preload'}`}
                fileInputRef={fileInputRef}
                preloadImage={cavityEditorLoad?.photo}
                preloadEpn={cavityEditorLoad?.epn}
                preloadEpnId={cavityEditorLoad?.epnId}
                preloadCavityCount={cavityEditorLoad?.cavityCount}
                preloadConnector={cavityEditorLoad?.connector}
                preloadCoordinates={cavityEditorLoad?.coordinates}
                editorMode={cavityEditorLoad?.mode}
              />
            </>
          }
        />
      </Routes>
    </div>
    </>
  )
}

export default Editor