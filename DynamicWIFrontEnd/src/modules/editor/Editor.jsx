import { useRef, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import { CavityEditor } from './pages/CavityEditor'
import EPNs from './pages/EPNs/EPNs'
import Connectors from './pages/Connectors'
import Wires from './pages/Wires'
import AppNavbar from '../../components/Navbar'

import './Editor.css'

function Editor() {
  const navigate = useNavigate()

  const fileInputRef = useRef(null)
  const [cavityEditorLoad, setCavityEditorLoad] = useState(null)

  // Called from EPNs/Connectors pages
  function handleCoordinateCavities(row, mode = 'epn') {
    setCavityEditorLoad({
      photo: row.photo,
      epn: row.epn,
      connector: row.name || '',
      coordinates: row.coordinates,
      mode,
    })

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