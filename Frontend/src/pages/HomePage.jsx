import React from 'react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';


function HomePage() {
    const dispatch = useDispatch();
    const isSuperuser = useSelector((state) => state.auth.superuser);
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
      <p className="text-lg text-gray-700">This is the main landing page of our application.</p>
      <button className="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300" onClick={()=>{dispatch(logoutUser())}}>
       LOGOUT 

    </button>
        {isSuperuser && (
            <p className="mt-4 text-green-600">You have superuser privileges!</p>
        )}
    </div>
  );
}

export default HomePage;