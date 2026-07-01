import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../api'

// ════════════════════════════════════════════════════════════════════════════
//  Thunks — Composites
// ════════════════════════════════════════════════════════════════════════════

export const fetchComposites = createAsyncThunk('composites/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/composites')
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const createComposite = createAsyncThunk('composites/create', async (body, { rejectWithValue }) => {
  // body: { compositeName: string, compositeCode: string }
  try {
    const res = await api.post('/composites', body)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const updateComposite = createAsyncThunk('composites/update', async ({ id, body }, { rejectWithValue }) => {
  // body: { id: number, compositeName: string, compositeCode: string }
  try {
    const res = await api.put(`/composites/${id}`, body)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

export const deleteComposite = createAsyncThunk('composites/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/composites/${id}`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data || err.message)
  }
})

// ════════════════════════════════════════════════════════════════════════════
//  Slice
// ════════════════════════════════════════════════════════════════════════════

const compositesSlice = createSlice({
  name: 'composites',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError(state) { state.error = null },
  },
  extraReducers: builder => {
    builder
      // ── fetchComposites ────────────────────────────────────────────────────
      .addCase(fetchComposites.pending,   state => { state.loading = true;  state.error = null })
      .addCase(fetchComposites.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(fetchComposites.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload })

      // ── createComposite ────────────────────────────────────────────────────
      .addCase(createComposite.pending,   state => { state.loading = true;  state.error = null })
      .addCase(createComposite.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(createComposite.fulfilled, (state, { payload }) => { state.loading = false; state.items.push(payload) })

      // ── updateComposite ────────────────────────────────────────────────────
      .addCase(updateComposite.pending,   state => { state.loading = true;  state.error = null })
      .addCase(updateComposite.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(updateComposite.fulfilled, (state, { payload }) => {
        state.loading = false
        const idx = state.items.findIndex(c => c.id === payload.id)
        if (idx !== -1) state.items[idx] = payload
      })

      // ── deleteComposite ────────────────────────────────────────────────────
      .addCase(deleteComposite.pending,   state => { state.loading = true;  state.error = null })
      .addCase(deleteComposite.rejected,  (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(deleteComposite.fulfilled, (state, { payload: id }) => {
        state.loading = false
        state.items = state.items.filter(c => c.id !== id)
      })
  },
})

export const { clearError } = compositesSlice.actions
export default compositesSlice.reducer

// ════════════════════════════════════════════════════════════════════════════
//  Selectors
// ════════════════════════════════════════════════════════════════════════════

export const selectComposites        = s => s.composites.items
export const selectCompositeById     = id => s => s.composites.items.find(c => c.id === id)
export const selectCompositeByCode   = code => s => s.composites.items.find(c => c.compositeCode === code)
export const selectCompositesLoading = s => s.composites.loading
export const selectCompositesError   = s => s.composites.error