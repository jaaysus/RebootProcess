import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../api'

// ════════════════════════════════════════════════════════════════════════════
//  Thunks — Module Lists
// ════════════════════════════════════════════════════════════════════════════

export const fetchModuleLists = createAsyncThunk('moduleLists/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/modulelists')
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const fetchModuleListById = createAsyncThunk('moduleLists/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/modulelists/${id}`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const uploadModuleList = createAsyncThunk('moduleLists/upload', async (file, { rejectWithValue }) => {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/modulelists/upload', fd)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const deleteModuleList = createAsyncThunk('moduleLists/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/modulelists/${id}`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

// ════════════════════════════════════════════════════════════════════════════
//  Slice
// ════════════════════════════════════════════════════════════════════════════

const moduleListsSlice = createSlice({
  name: 'moduleLists',
  initialState: {
    items: [],       // summary list: { id, fileName, uploadDate, uploadedBy, entryCount, composites }
    selected: null,  // full detail w/ entries, set by fetchModuleListById
    loading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    clearError(state) { state.error = null },
    clearSelected(state) { state.selected = null },
  },
  extraReducers: builder => {
    builder
      // ── fetchModuleLists ───────────────────────────────────────────────────
      .addCase(fetchModuleLists.pending,   state => { state.loading = true;  state.error = null })
      .addCase(fetchModuleLists.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(fetchModuleLists.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload })

      // ── fetchModuleListById ────────────────────────────────────────────────
      .addCase(fetchModuleListById.pending,   state => { state.loading = true;  state.error = null })
      .addCase(fetchModuleListById.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(fetchModuleListById.fulfilled, (state, { payload }) => { state.loading = false; state.selected = payload })

      // ── uploadModuleList ───────────────────────────────────────────────────
      .addCase(uploadModuleList.pending,   state => { state.uploading = true;  state.error = null })
      .addCase(uploadModuleList.rejected,  (state, { payload }) => { state.uploading = false; state.error = payload })
      .addCase(uploadModuleList.fulfilled, (state, { payload }) => {
        state.uploading = false
        state.items.push(payload)
      })

      // ── deleteModuleList ───────────────────────────────────────────────────
      .addCase(deleteModuleList.pending,   state => { state.loading = true;  state.error = null })
      .addCase(deleteModuleList.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(deleteModuleList.fulfilled, (state, { payload: id }) => {
        state.loading = false
        state.items = state.items.filter(f => f.id !== id)
      })
  },
})

export const { clearError, clearSelected } = moduleListsSlice.actions
export default moduleListsSlice.reducer

// ════════════════════════════════════════════════════════════════════════════
//  Selectors
// ════════════════════════════════════════════════════════════════════════════

export const selectModuleLists         = s => s.moduleLists.items
export const selectSelectedModuleList  = s => s.moduleLists.selected
export const selectModuleListsLoading  = s => s.moduleLists.loading
export const selectModuleListsUploading = s => s.moduleLists.uploading
export const selectModuleListsError    = s => s.moduleLists.error