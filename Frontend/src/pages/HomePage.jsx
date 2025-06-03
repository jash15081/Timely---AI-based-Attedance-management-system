import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Home from '../components/Home';
import Configure from '../components/Configure';
import Admins from '../components/Admins';
import Employees from '../components/Employees';
import AddEmployee from '../components/AddEmployee';
import EditEmployee from '../components/EditEmployee';
import ModelManager from '../components/ModelManager';
import EmployeeDetails from '../components/EmployeeDetails';
import EmployeePage from '../components/EmployeePage';

function HomePage() {
  const dispatch = useDispatch();
  const role = useSelector((state) => state.auth.role);
  const navigate = useNavigate()
  useEffect(()=>{navigate("/")},[])
  return (
    <div className='flex min-h-[91vh] bg-gray-100'>
      {/* Sidebar */}
      <div className='w-64 relative'>
        <aside className='w-64 bg-emerald-800 text-white flex flex-col justify-between shadow-xl rounded-2xl h-[93vh] fixed'>
          <div>
            <div className='p-6 text-2xl font-bold bg-emerald-900 border-b border-emerald-700 rounded-2xl'>
              Timely Admin
            </div>
            <nav className='flex flex-col p-4 space-y-2'>
              {(role=='admin'||role=='superuser')&&<NavLink
                to='/'
                end
                className={({ isActive }) =>
                  `px-4 flex items-start py-2 rounded-lg font-medium transition duration-200 ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow'
                      : 'hover:bg-emerald-700 hover:text-white text-emerald-100'
                  }`
                }
              >
                🏠 Home
              </NavLink>}
              {(role=='admin'||role=='superuser')&&<NavLink
                to='/employees'
                className={({ isActive }) =>
                  `px-4 py-2 flex items-start flex items-start rounded-lg font-medium transition duration-200 ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow'
                      : 'hover:bg-emerald-700 hover:text-white text-emerald-100'
                  }`
                }
              >
                👥 Employees
              </NavLink>}
              
              {(role=='admin'||role=='superuser')&&<NavLink
                  to='/manage-model'
                  className={({ isActive }) =>
                    `px-4 py-2 flex items-start rounded-lg font-medium transition duration-200 ${
                      isActive
                        ? 'bg-white text-emerald-800 shadow'
                        : 'hover:bg-emerald-700 hover:text-white text-emerald-100'
                    }`
                  }
                >
                🛠️  Model Manager
                </NavLink>}
              {role=='superuser' && (
                <NavLink
                  to='/configure'
                  className={({ isActive }) =>
                    `px-4 py-2 flex items-start rounded-lg font-medium transition duration-200 ${
                      isActive
                        ? 'bg-white text-emerald-800 shadow'
                        : 'hover:bg-emerald-700 hover:text-white text-emerald-100'
                    }`
                  }
                >
                  ⚙️ Configure
                </NavLink>
              )}
              {role=='superuser' && (
                <NavLink
                  to='/admins'
                  className={({ isActive }) =>
                    `px-4 py-2 flex items-start rounded-lg font-medium transition duration-200 ${
                      isActive
                        ? 'bg-white text-emerald-800 shadow'
                        : 'hover:bg-emerald-700 hover:text-white text-emerald-100'
                    }`
                  }
                >
                  🛡️ Admins
                </NavLink>
              )}
            </nav>
          </div>

          <div className='p-4 border-t border-emerald-700'>
            <button
              onClick={() => dispatch(logoutUser())}
              className='w-full px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200'
            >
              Logout
            </button>
            {role=='superuser' && (
              <p className='text-xs text-emerald-200 mt-2'>
                Superuser Access Enabled
              </p>
            )}
          </div>
        </aside>
      </div>
      {/* Main Content */}
      <main className='flex-1 p-6 overflow-auto w-full'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/configure' element={<Configure />} />
          <Route path='/admins' element={<Admins />} />
          <Route path='/employees' element={<Employees />} />
          <Route path='/employees/add-employee' element={<AddEmployee />} />
          <Route path='/employees/edit-employee/:id' element={<EditEmployee />} />
          <Route path='/manage-model' element={<ModelManager/>}/>
          <Route path='/employees/employee-details/:id' element={<EmployeeDetails/>}/>
        </Routes>
      </main>
    </div>
  );
}

export default HomePage;
