
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../api'

const normalizeOperator = (op = {}) => {
  const id = op.id ?? op.Id ?? null
  const badge = op.badge ?? op.Badge ?? null
  const fullName = op.fullName ?? op.FullName ?? null
  const password = op.password ?? op.Password ?? op.generatedPassword ?? op.newPassword ?? null

  return {
    id,
    Id: id,
    badge,
    Badge: badge,
    fullName,
    FullName: fullName,
    password,
    Password: password,
  }
}

const toErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (typeof err?.response?.data === 'string' ? err.response.data : null) ||
  err?.message ||
  'Request failed'

const initialState = {
  token: localStorage.getItem('op_token'),
  operator: (() => {
    const raw = localStorage.getItem('op_user')
    return raw ? normalizeOperator(JSON.parse(raw)) : null
  })(),
  operators: [],
  loading: false,
  error: null,
  qrImage: null,
  uploadResult: null,
}

// Async thunks for API calls
export const fetchOperators = createAsyncThunk('operator/fetchOperators', async (_, thunkAPI) => {
  try {
    const res = await api.get('/operators')
    return (res.data || []).map(normalizeOperator)
  } catch (err) {
    return thunkAPI.rejectWithValue(toErrorMessage(err))
  }
})

export const fetchOperatorByBadge = createAsyncThunk('operator/fetchOperatorByBadge', async (badge, thunkAPI) => {
  try {
    const res = await api.get(`/operators/${badge}`)
    return normalizeOperator(res.data)
  } catch (err) {
    return thunkAPI.rejectWithValue(toErrorMessage(err))
  }
})

export const createOperator = createAsyncThunk('operator/createOperator', async (payload, thunkAPI) => {
  try {
    const res = await api.post('/operators', payload)
    return normalizeOperator({
      ...res.data,
      Badge: res.data?.Badge ?? payload?.badge ?? payload?.Badge,
      FullName: res.data?.FullName ?? payload?.fullName ?? payload?.FullName,
      Password: res.data?.Password ?? res.data?.generatedPassword,
    })
  } catch (err) {
    return thunkAPI.rejectWithValue(toErrorMessage(err))
  }
})

export const regenerateCredentials = createAsyncThunk('operator/regenerateCredentials', async (badge, thunkAPI) => {
  try {
    const res = await api.post(`/operators/${badge}/regenerate-credentials`)
    return normalizeOperator({
      Badge: res.data?.badge ?? badge,
      FullName: res.data?.fullName,
      Password: res.data?.newPassword,
    })
  } catch (err) {
    return thunkAPI.rejectWithValue(toErrorMessage(err))
  }
})

export const viewQr = createAsyncThunk('operator/viewQr', async (badge, thunkAPI) => {
  try {
    const res = await api.get(`/operators/${badge}/qr`, { responseType: 'blob' })
    return URL.createObjectURL(res.data)
  } catch (err) {
    return thunkAPI.rejectWithValue(toErrorMessage(err))
  }
})

export const downloadQr = createAsyncThunk('operator/downloadQr', async (badge, thunkAPI) => {
  try {
    const res = await api.get(`/operators/${badge}/qr/download`, { responseType: 'blob' })
    // Download logic can be handled in the component, here just return blob URL
    return URL.createObjectURL(res.data)
  } catch (err) {
    return thunkAPI.rejectWithValue(toErrorMessage(err))
  }
})

export const updateOperator = createAsyncThunk('operator/updateOperator', async ({ badge, data }, thunkAPI) => {
  try {
    const res = await api.put(`/operators/${badge}`, data)
    return {
      ...normalizeOperator({
      ...res.data,
      Badge: res.data?.Badge ?? data?.badge ?? data?.Badge ?? badge,
      FullName: res.data?.FullName ?? data?.fullName ?? data?.FullName,
      Password: data?.password ?? data?.Password,
      }),
      previousBadge: badge,
    }
  } catch (err) {
    return thunkAPI.rejectWithValue(toErrorMessage(err))
  }
})

export const deleteOperator = createAsyncThunk('operator/deleteOperator', async (badge, thunkAPI) => {
  try {
    await api.delete(`/operators/${badge}`)
    return badge
  } catch (err) {
    return thunkAPI.rejectWithValue(toErrorMessage(err))
  }
})

export const uploadOperatorsExcel = createAsyncThunk('operator/uploadOperatorsExcel', async (file, thunkAPI) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/operators/upload-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(toErrorMessage(err))
  }
})


const operatorSlice = createSlice({
  name: 'operator',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      const { token, operatorInfo } = action.payload
      state.token = token
      state.operator = normalizeOperator(operatorInfo)
      localStorage.setItem('op_token', token)
      localStorage.setItem('op_user', JSON.stringify(normalizeOperator(operatorInfo)))
    },
    logout(state) {
      state.token = null
      state.operator = null
      state.expiresAt = null
      localStorage.removeItem('op_token')
      localStorage.removeItem('op_user')
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all operators
      .addCase(fetchOperators.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOperators.fulfilled, (state, action) => {
        state.loading = false
        state.operators = action.payload
      })
      .addCase(fetchOperators.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch operator by badge
      .addCase(fetchOperatorByBadge.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOperatorByBadge.fulfilled, (state, action) => {
        state.loading = false
        state.operator = action.payload
      })
      .addCase(fetchOperatorByBadge.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create operator
      .addCase(createOperator.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOperator.fulfilled, (state, action) => {
        state.loading = false
        state.operators.push(action.payload)
      })
      .addCase(createOperator.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Regenerate credentials
      .addCase(regenerateCredentials.pending, (state) => {
        state.error = null
      })
      .addCase(regenerateCredentials.fulfilled, (state, action) => {
        const badge = action.payload?.badge ?? action.payload?.Badge
        const index = state.operators.findIndex(
          (op) => (op.badge ?? op.Badge) === badge
        )
        if (index !== -1) {
          state.operators[index] = {
            ...state.operators[index],
            ...action.payload,
          }
        }
      })
      .addCase(regenerateCredentials.rejected, (state, action) => {
        state.error = action.payload
      })

      // View QR
      .addCase(viewQr.pending, (state) => {
        state.error = null
      })
      .addCase(viewQr.fulfilled, (state, action) => {
        state.qrImage = action.payload
      })
      .addCase(viewQr.rejected, (state, action) => {
        state.error = action.payload
      })

      // Download QR
      .addCase(downloadQr.pending, (state) => {
        state.error = null
      })
      .addCase(downloadQr.fulfilled, (state, action) => {
        state.qrImage = action.payload
      })
      .addCase(downloadQr.rejected, (state, action) => {
        state.error = action.payload
      })

      // Update operator
      .addCase(updateOperator.pending, (state) => {
        state.error = null
      })
      .addCase(updateOperator.fulfilled, (state, action) => {
        const badge = action.payload?.badge ?? action.payload?.Badge
        const previousBadge = action.payload?.previousBadge
        const operatorPayload = { ...(action.payload || {}) }
        delete operatorPayload.previousBadge
        const index = state.operators.findIndex(
          (op) => (op.badge ?? op.Badge) === badge || (op.badge ?? op.Badge) === previousBadge
        )
        if (index !== -1) {
          const existingPassword = state.operators[index]?.password ?? state.operators[index]?.Password
          state.operators[index] = {
            ...state.operators[index],
            ...operatorPayload,
            password: operatorPayload?.password ?? operatorPayload?.Password ?? existingPassword,
            Password: operatorPayload?.Password ?? operatorPayload?.password ?? existingPassword,
          }
        }
      })
      .addCase(updateOperator.rejected, (state, action) => {
        state.error = action.payload
      })

      // Delete operator
      .addCase(deleteOperator.pending, (state) => {
        state.error = null
      })
      .addCase(deleteOperator.fulfilled, (state, action) => {
        state.operators = state.operators.filter(
          (op) => (op.Badge ?? op.badge) !== action.payload
        )
      })
      .addCase(deleteOperator.rejected, (state, action) => {
        state.error = action.payload
      })

      // Upload Excel
      .addCase(uploadOperatorsExcel.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadOperatorsExcel.fulfilled, (state, action) => {
        state.loading = false
        state.uploadResult = action.payload
      })
      .addCase(uploadOperatorsExcel.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { loginSuccess, logout } = operatorSlice.actions
export default operatorSlice.reducer
