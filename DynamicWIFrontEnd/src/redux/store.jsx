import { configureStore } from '@reduxjs/toolkit';
import operatorReducer from './slices/operatorSlice';
import userReducer from './slices/userSlice';
import epnsReducer from './slices/epnsSlice';
import compositesReducer from './slices/compositeSlice';
import moduleListsReducer from './slices/moduleListsSlice';

export const store = configureStore({
  reducer: {
    operator: operatorReducer,
    user: userReducer,
    epns: epnsReducer,
    composites: compositesReducer,
    moduleLists: moduleListsReducer,
  },
});