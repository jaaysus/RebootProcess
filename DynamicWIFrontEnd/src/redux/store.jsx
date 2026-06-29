import { configureStore } from '@reduxjs/toolkit';
import operatorReducer from './slices/operatorSlice';
import userReducer from './slices/userSlice';
import epnsReducer from './slices/epnsSlice';

export const store = configureStore({
  reducer: {
    operator: operatorReducer,
    user: userReducer,
    epns: epnsReducer
  },
});
