import { configureStore } from '@reduxjs/toolkit';
import operatorReducer from './slices/operatorSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    operator: operatorReducer,
    user: userReducer,
  },
});
