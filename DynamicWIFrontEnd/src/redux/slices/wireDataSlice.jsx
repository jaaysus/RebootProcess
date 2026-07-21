import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../api'

// ════════════════════════════════════════════════════════════════════════════
//  Thunks — Wire Data
// ════════════════════════════════════════════════════════════════════════════

export const fetchWireData = createAsyncThunk('wireData/fetchAll', async ({ page = 1, pageSize = 50, filters = {} } = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/wire', { params: { page, pageSize, ...filters } })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const fetchWireDataById = createAsyncThunk('wireData/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/wire/${id}`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const createWireData = createAsyncThunk('wireData/create', async (body, { rejectWithValue }) => {
  try {
    const res = await api.post('/wiredata', {
      wireNumber: body.wireNumber,
      csa: parseFloat(body.csa) || 0,
      length: parseFloat(body.length) || 0,
      c1: body.c1,
      c2: body.c2,
      loc: body.loc,
      node: body.node,
      epn: body.epn,
      cavity: body.cavity,
      module: body.module,
      station: body.station,
      twist: body.twist,
      core: body.core,
      splice: body.splice,
    })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const updateWireData = createAsyncThunk('wireData/update', async ({ id, body }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/wiredata/${id}`, {
      id: id,
      wireNumber: body.wireNumber,
      csa: parseFloat(body.csa) || 0,
      length: parseFloat(body.length) || 0,
      c1: body.c1,
      c2: body.c2,
      loc: body.loc,
      node: body.node,
      epn: body.epn,
      cavity: body.cavity,
      module: body.module,
      station: body.station,
      twist: body.twist,
      core: body.core,
      splice: body.splice,
    })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const deleteWireData = createAsyncThunk('wireData/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/wire/${id}`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const deleteAllWireData = createAsyncThunk('wireData/deleteAll', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/wire')
    return true
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const uploadWireData = createAsyncThunk('wireData/upload', async (file, { rejectWithValue }) => {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/wire/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const fetchNodeLookup = createAsyncThunk('wireData/nodeLookup', async (nodeQuery, { rejectWithValue }) => {
  try {
    const res = await api.get(`/wiredata/node/${encodeURIComponent(nodeQuery.trim())}`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

// ════════════════════════════════════════════════════════════════════════════
//  Slice
// ════════════════════════════════════════════════════════════════════════════

const wireDataSlice = createSlice({
  name: 'wireData',
  initialState: {
    items: [],
    nodeResult: null,
    loading: false,
    uploading: false,
    nodeLoading: false,
    error: null,
    nodeError: null,
    pagination: {
      totalCount: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    },
  },
  reducers: {
    clearWireError(state) { state.error = null },
    clearNodeError(state) { state.nodeError = null },
    clearNodeResult(state) { state.nodeResult = null },
  },
  extraReducers: builder => {
    builder
      // ── fetchWireData ───────────────────────────────────────────────────────
      .addCase(fetchWireData.pending,   state => { state.loading = true;  state.error = null })
      .addCase(fetchWireData.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(fetchWireData.fulfilled, (state, { payload }) => {
        state.loading = false
        if (payload && payload.data) {
          state.items = Array.isArray(payload.data) ? payload.data : []
          state.pagination = {
            totalCount: payload.totalCount || 0,
            page: payload.page || 1,
            pageSize: payload.pageSize || 50,
            totalPages: payload.totalPages || 0,
          }
        } else {
          // Fallback for non-paginated response
          state.items = Array.isArray(payload) ? payload : []
        }
      })

      // ── createWireData ──────────────────────────────────────────────────────
      .addCase(createWireData.pending,   state => { state.loading = true;  state.error = null })
      .addCase(createWireData.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(createWireData.fulfilled, (state, { payload }) => { state.loading = false; state.items.push(payload) })

      // ── updateWireData ──────────────────────────────────────────────────────
      .addCase(updateWireData.pending,   state => { state.loading = true;  state.error = null })
      .addCase(updateWireData.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(updateWireData.fulfilled, (state, { payload }) => {
        state.loading = false
        const idx = state.items.findIndex(w => w.Id === payload.Id)
        if (idx !== -1) state.items[idx] = payload
      })

      // ── deleteWireData ──────────────────────────────────────────────────────
      .addCase(deleteWireData.pending,   state => { state.loading = true;  state.error = null })
      .addCase(deleteWireData.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(deleteWireData.fulfilled, (state, { payload: id }) => {
        state.loading = false
        state.items = state.items.filter(w => w.Id !== id)
      })

      // ── deleteAllWireData ───────────────────────────────────────────────────
      .addCase(deleteAllWireData.pending,   state => { state.loading = true;  state.error = null })
      .addCase(deleteAllWireData.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(deleteAllWireData.fulfilled, (state) => {
        state.loading = false
        state.items = []
        state.pagination = {
          totalCount: 0,
          page: 1,
          pageSize: 50,
          totalPages: 0,
        }
      })

      // ── uploadWireData ─────────────────────────────────────────────────────
      .addCase(uploadWireData.pending,   state => { state.uploading = true;  state.error = null })
      .addCase(uploadWireData.rejected,  (state, { payload }) => { state.uploading = false; state.error = payload })
      .addCase(uploadWireData.fulfilled, (state) => {
        state.uploading = false
        state.error = null
        state.pagination = {
          totalCount: 0,
          page: 1,
          pageSize: 50,
          totalPages: 0,
        }
        // Data will be refetched after upload
      })

      // ── fetchNodeLookup ─────────────────────────────────────────────────────
      .addCase(fetchNodeLookup.pending,   state => { state.nodeLoading = true;  state.nodeError = null })
      .addCase(fetchNodeLookup.rejected,  (state, { payload }) => { state.nodeLoading = false; state.nodeError = payload })
      .addCase(fetchNodeLookup.fulfilled, (state, { payload }) => { state.nodeLoading = false; state.nodeResult = payload })
  },
})

export const { clearWireError, clearNodeError, clearNodeResult } = wireDataSlice.actions
export default wireDataSlice.reducer

// ════════════════════════════════════════════════════════════════════════════
//  Selectors
// ════════════════════════════════════════════════════════════════════════════

export const selectWireData         = s => s.wireData.items
export const selectWireDataLoading  = s => s.wireData.loading
export const selectWireDataUploading = s => s.wireData.uploading
export const selectWireDataError    = s => s.wireData.error
export const selectWireDataPagination = s => s.wireData.pagination
export const selectNodeResult       = s => s.wireData.nodeResult
export const selectNodeLoading      = s => s.wireData.nodeLoading
export const selectNodeError        = s => s.wireData.nodeError
