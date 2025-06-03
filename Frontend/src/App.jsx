import { use, useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import LoginPage from './pages/loginPage';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getme } from './features/auth/authSlice';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import { PulseLoader } from 'react-spinners';
function App() {
  const {isAuthenticated,loading} = useSelector((state)=>state.auth)
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getme());
  }, []);

  return (
    <>
      {loading ? (
        <div className='flex items-center justify-center min-h-screen'>
          <PulseLoader
            color='#36d7b7'
            size={15}
            aria-label='Loading Spinner'
            data-testid='loader'
          />
        </div>
      ) : (
        <Router>
          <Routes>
            <Route path='/*' element={isAuthenticated ? <HomePage /> : <LoginPage />} />
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;
