import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { Routes, Route, NavLink } from 'react-router-dom';
import Home from '../components/Home';
import Configure from '../components/Configure';
import Admins from '../components/Admins';
import Employees from '../components/Employees';
import AddEmployee from '../components/AddEmployee';
import EditEmployee from '../components/EditEmployee';

function HomePage() {
  const dispatch = useDispatch();
  const isSuperuser = useSelector((state) => state.auth.superuser);

  return (
    <div className='flex min-h-[91vh] bg-gray-100'>
      {/* Sidebar */}
      <div class='w-64 relative'>
        <aside className='w-64 bg-emerald-800 text-white flex flex-col justify-between shadow-xl rounded-2xl h-[93vh] fixed'>
          <div>
            <div className='p-6 text-2xl font-bold bg-emerald-900 border-b border-emerald-700 rounded-2xl'>
              Timely Admin
            </div>
            <nav className='flex flex-col p-4 space-y-2'>
              <NavLink
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
              </NavLink>
              <NavLink
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
              </NavLink>
              {isSuperuser && (
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
              {isSuperuser && (
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
            {isSuperuser && (
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
          <Route path='/add-employee' element={<AddEmployee />} />
          <Route path='/edit-employee/:id' element={<EditEmployee />} />
        </Routes>
      </main>
    </div>
  );
}

export default HomePage;
