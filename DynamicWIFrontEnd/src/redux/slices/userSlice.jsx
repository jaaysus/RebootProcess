import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';

const initialState = {
  token: localStorage.getItem('authToken') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: false,
  error: null,

  registerLoading: false,
  registerError: null,
  registerSuccessMessage: null,

  users: [],
  usersLoading: false,
  usersError: null,

  roles: [],
  rolesLoading: false,
  rolesError: null,
};

const getUserId = (user) => user?.id ?? user?.Id;

// -------------------- Async Thunks -------------------- //

export const loginUser = createAsyncThunk(
  'user/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', userData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/users');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const payload = {
        FullName: userData.fullName,
        Email: userData.email,
        PasswordHash: userData.password,
        Role: userData.role
      };
      await api.post('/users', payload);
      const res = await api.get('/users');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const payload = {
        FullName: userData?.fullName ?? userData?.FullName,
        Email: userData?.email ?? userData?.Email ?? '',
        Role: userData?.role ?? userData?.Role,
        PasswordHash: '',
      };
      const res = await api.put(`/users/${id}`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const approveUser = createAsyncThunk(
  'user/approveUser',
  async (id, { rejectWithValue }) => {
    try {
      await api.post(`/users/${id}/approve`);
      const res = await api.get('/users');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const suspendUser = createAsyncThunk(
  'user/suspendUser',
  async (id, { rejectWithValue }) => {
    try {
      await api.post(`/users/${id}/suspend`);
      const res = await api.get('/users');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const rejectUser = createAsyncThunk(
  'user/rejectUser',
  async (id, { rejectWithValue }) => {
    try {
      await api.post(`/users/${id}/reject`);
      const res = await api.get('/users');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchRoles = createAsyncThunk(
  'user/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/users/roles');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'user/logoutUser',
  async (_, { getState, dispatch }) => {
    const token = getState().user.token;
    try {
      if (token) await api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.warn('Logout failed', err);
    } finally {
      dispatch(logout());
    }
  }
);

// -------------------- Slice -------------------- //

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      state.users = [];
      state.usersError = null;
      state.roles = [];
      state.rolesError = null;

      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginUser.pending, state => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.token = token;
        state.user = user;
        state.loading = false;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // register
      .addCase(registerUser.pending, state => { state.registerLoading = true; state.registerError = null; state.registerSuccessMessage = null; })
      .addCase(registerUser.fulfilled, (state, action) => { state.registerLoading = false; state.registerSuccessMessage = action.payload.message; })
      .addCase(registerUser.rejected, (state, action) => { state.registerLoading = false; state.registerError = action.payload; })

      // users
      .addCase(fetchUsers.pending, state => { state.usersLoading = true; state.usersError = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.usersLoading = false; state.users = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.usersLoading = false; state.usersError = action.payload; })

      .addCase(createUser.fulfilled, (state, action) => { state.users = action.payload; })
      .addCase(updateUser.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.users.findIndex(u => getUserId(u) === getUserId(updated));
        if (index !== -1) state.users[index] = updated;
      })
      .addCase(deleteUser.fulfilled, (state, action) => { state.users = state.users.filter(u => getUserId(u) !== action.payload); })
      .addCase(approveUser.fulfilled, (state, action) => { state.users = action.payload; })
      .addCase(suspendUser.fulfilled, (state, action) => { state.users = action.payload; })
      .addCase(rejectUser.fulfilled, (state, action) => { state.users = action.payload; })

      // roles
      .addCase(fetchRoles.pending, state => { state.rolesLoading = true; state.rolesError = null; })
      .addCase(fetchRoles.fulfilled, (state, action) => { state.rolesLoading = false; state.roles = action.payload; })
      .addCase(fetchRoles.rejected, (state, action) => { state.rolesLoading = false; state.rolesError = action.payload; });
  }
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;