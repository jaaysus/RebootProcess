import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../api'

const BASE_URL = 'http://localhost:5148'

// ════════════════════════════════════════════════════════════════════════════
//  Thunks — EPN
// ════════════════════════════════════════════════════════════════════════════

export const fetchEpns = createAsyncThunk('epns/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/epn')
    return res.data
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

export const fetchEpnById = createAsyncThunk('epns/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/epn/${id}`)
    return res.data
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

export const createEpn = createAsyncThunk('epns/create', async (body, { rejectWithValue }) => {
  // body: { epn: string, cavityCount: number }
  try {
    const res = await api.post('/epn', body)
    return res.data
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

export const updateEpn = createAsyncThunk('epns/update', async ({ id, body }, { rejectWithValue }) => {
  // body: { epn: string, cavityCount: number, cavities?: {} }
  try {
    const res = await api.put(`/epn/${id}`, body)
    return res.data
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

export const deleteEpn = createAsyncThunk('epns/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/epn/${id}`)
    return id
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

export const setCavities = createAsyncThunk('epns/setCavities', async ({ id, cavities }, { rejectWithValue }) => {
  // cavities: { "1": { X, Y, Size, Shape }, ... }
  try {
    const res = await api.patch(`/epn/${id}/cavities`, cavities)
    return res.data
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

export const matchPhoto = createAsyncThunk('epns/matchPhoto', async (id, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/epn/${id}/match-photo`)
    return res.data
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

export const importEpnsFromExcel = createAsyncThunk('epns/importFromExcel', async (file, { rejectWithValue }) => {
  try {
    const fd = new FormData()
    fd.append('file', file)

    const res = await api.post('/epn/import', fd)
    return res.data // { totalRows, created, skipped, errors, rows: [{ row, epn, status, message }] }
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

// ════════════════════════════════════════════════════════════════════════════
//  Thunks — EPN Photos
// ════════════════════════════════════════════════════════════════════════════

export const fetchPhotos = createAsyncThunk('epns/fetchPhotos', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/epnphoto')
    return res.data
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

export const uploadPhotoBulk = createAsyncThunk('epns/uploadPhotoBulk', async (files, { rejectWithValue }) => {
  try {
    const dimensions = await Promise.all(
      Array.from(files).map(file => new Promise(resolve => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }) }
        img.src = url
      }))
    )

    const fd = new FormData()
    Array.from(files).forEach((file, i) => {
      fd.append('files', file)
      fd.append('widths', dimensions[i].width)
      fd.append('heights', dimensions[i].height)
    })

    const res = await api.post('/epnphoto/upload-bulk', fd)
    return res.data // { succeeded: [], failed: [] }
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

export const deletePhoto = createAsyncThunk('epns/deletePhoto', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/epnphoto/${id}`)
    return id
  } catch (err) {
    const errorMessage = typeof err.response?.data === 'string'
      ? err.response.data
      : err.response?.data?.message || err.message
    return rejectWithValue(errorMessage)
  }
})

// ════════════════════════════════════════════════════════════════════════════
//  Slice
// ════════════════════════════════════════════════════════════════════════════

const epnsSlice = createSlice({
  name: 'epns',
  initialState: {
    items: [],
    photos: [],
    loading: false,
    photosLoading: false,
    error: null,
    importResult: null,
  },
  reducers: {
    clearError(state) { state.error = null },
  },
  extraReducers: builder => {
    builder
      // ── fetchEpns ──────────────────────────────────────────────────────────
      .addCase(fetchEpns.pending,   state => { state.loading = true;  state.error = null })
      .addCase(fetchEpns.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(fetchEpns.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload })

      // ── createEpn ──────────────────────────────────────────────────────────
      .addCase(createEpn.pending,   state => { state.loading = true;  state.error = null })
      .addCase(createEpn.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(createEpn.fulfilled, (state, { payload }) => { state.loading = false; state.items.push(payload) })

      // ── updateEpn ──────────────────────────────────────────────────────────
      .addCase(updateEpn.pending,   state => { state.loading = true;  state.error = null })
      .addCase(updateEpn.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(updateEpn.fulfilled, (state, { payload }) => {
        state.loading = false
        const idx = state.items.findIndex(e => e.id === payload.id)
        if (idx !== -1) state.items[idx] = payload
      })

      // ── deleteEpn ──────────────────────────────────────────────────────────
      .addCase(deleteEpn.pending,   state => { state.loading = true;  state.error = null })
      .addCase(deleteEpn.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(deleteEpn.fulfilled, (state, { payload: id }) => {
        state.loading = false
        state.items = state.items.filter(e => e.id !== id)
      })

      // ── setCavities ────────────────────────────────────────────────────────
      .addCase(setCavities.pending,   state => { state.loading = true;  state.error = null })
      .addCase(setCavities.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(setCavities.fulfilled, (state, { payload }) => {
        state.loading = false
        const idx = state.items.findIndex(e => e.id === payload.id)
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload }
      })

      // ── matchPhoto ─────────────────────────────────────────────────────────
      .addCase(matchPhoto.pending,   state => { state.loading = true;  state.error = null })
      .addCase(matchPhoto.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(matchPhoto.fulfilled, (state, { payload }) => {
        state.loading = false
        const idx = state.items.findIndex(e => e.id === payload.id)
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload }
      })

      // ── importEpnsFromExcel ────────────────────────────────────────────────
      .addCase(importEpnsFromExcel.pending,   state => { state.loading = true;  state.error = null })
      .addCase(importEpnsFromExcel.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(importEpnsFromExcel.fulfilled, (state, { payload }) => {
        state.loading = false
        state.importResult = payload // { totalRows, created, skipped, errors, rows }
      })
      // ── fetchPhotos ────────────────────────────────────────────────────────
      .addCase(fetchPhotos.pending,   state => { state.photosLoading = true;  state.error = null })
      .addCase(fetchPhotos.rejected,  (state, { payload }) => { state.photosLoading = false; state.error = payload })
      .addCase(fetchPhotos.fulfilled, (state, { payload }) => { state.photosLoading = false; state.photos = payload })

      // ── uploadPhotoBulk ────────────────────────────────────────────────────
      .addCase(uploadPhotoBulk.pending,   state => { state.photosLoading = true;  state.error = null })
      .addCase(uploadPhotoBulk.rejected,  (state, { payload }) => { state.photosLoading = false; state.error = payload })
      .addCase(uploadPhotoBulk.fulfilled, (state, { payload }) => {
        state.photosLoading = false
        if (payload.succeeded?.length) state.photos.push(...payload.succeeded)
      })

      // ── deletePhoto ────────────────────────────────────────────────────────
      .addCase(deletePhoto.pending,   state => { state.photosLoading = true;  state.error = null })
      .addCase(deletePhoto.rejected,  (state, { payload }) => { state.photosLoading = false; state.error = payload })
      .addCase(deletePhoto.fulfilled, (state, { payload: id }) => {
        state.photosLoading = false
        state.photos = state.photos.filter(p => p.id !== id)
      })
  },
})

export const { clearError } = epnsSlice.actions
export default epnsSlice.reducer

// ════════════════════════════════════════════════════════════════════════════
//  Selectors
// ════════════════════════════════════════════════════════════════════════════

export const selectEpns          = s => s.epns.items
export const selectEpnById       = id => s => s.epns.items.find(e => e.id === id)
export const selectEpnByCode     = code => s => s.epns.items.find(e => e.epn === code)
export const selectEpnsLoading   = s => s.epns.loading
export const selectEpnsError     = s => s.epns.error
export const selectPhotos        = s => s.epns.photos
export const selectPhotosLoading = s => s.epns.photosLoading
export const selectEpnImportResult = s => s.epns.importResult
export const photoUrl = filePath => filePath ? `${BASE_URL}${filePath}` : null