import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { Routes, Route, NavLink, Outlet } from 'react-router-dom';
import Home from '../components/Home';
import Configure from '../components/Configure';

function HomePage() {
  const dispatch = useDispatch();
  const isSuperuser = useSelector((state) => state.auth.superuser);

  return (
    <div className='flex min-h-[91vh] bg-gray-100'>
      {/* Sidebar Navigation */}
      <aside className='w-64 bg-green-700 text-white flex flex-col justify-between'>
        <div>
          <div className='p-6 text-2xl font-bold border-b border-green-600'>
            Timely Admin
          </div>
          <nav className='flex flex-col space-y-2 p-4'>
            <NavLink
              to='/'
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded hover:bg-green-600 transition ${
                  isActive ? 'bg-green-600' : ''
                }`
              }
            >
              Home
            </NavLink>
            {isSuperuser && (
              <NavLink
                to='/configure'
                className={({ isActive }) =>
                  `px-4 py-2 rounded hover:bg-green-600 transition ${
                    isActive ? 'bg-green-600' : ''
                  }`
                }
              >
                Configure
              </NavLink>
            )}
          </nav>
        </div>

        <div className='p-4 border-t border-green-600'>
          <button
            onClick={() => dispatch(logoutUser())}
            className='w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded transition text-white'
          >
            Logout
          </button>
          {isSuperuser && (
            <p className='text-sm text-green-200 mt-2'>
              You have superuser privileges!
            </p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className='flex-1 p-8 overflow-auto'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/configure' element={<Configure />} />
        </Routes>
      </main>
    </div>
  );
}

export default HomePage;
