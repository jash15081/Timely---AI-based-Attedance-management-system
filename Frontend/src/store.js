import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counterSlice';
import authReducer from './features/auth/authSlice';
import configureReducer from './features/configuration/configureSlice';
export default configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    configure: configureReducer,
  },
});
