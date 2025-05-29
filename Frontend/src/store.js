import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import configureReducer from './features/configuration/configureSlice';
import adminReducer from './features/admin/adminSlice';
import employeesReducer from './features/employee/employeeSlice';
import manageEmployeeReducer from './features/employee/ManageEmployeeSlice';
import employeePhotoReducer from './features/employee/employeePhotosSlice';
export default configureStore({
  reducer: {
    auth: authReducer,
    configure: configureReducer,
    admins: adminReducer,
    employees: employeesReducer,
    manageEmployee: manageEmployeeReducer,
    employeePhotos: employeePhotoReducer,
  },
});
