import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees } from '../features/employee/employeeSlice';
import { PulseLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';

function Employees() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employees, isLoading, isError, message } = useSelector(
    (state) => state.employees
  );

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  return (
    <div className='mx-auto p-6 bg-white shadow-2xl rounded-2xl'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-emerald-800'>Employees</h1>
        <button
          onClick={() => navigate('/add-employee')}
          className='bg-emerald-600 text-white px-5 py-2 rounded-lg shadow hover:bg-green-700 text-sm transition duration-200'
        >
          + Add
        </button>
      </div>

      {isLoading && (
        <div className='flex justify-center my-8'>
          <PulseLoader color='#16A34A' size={10} />
        </div>
      )}

      {isError && (
        <p className='text-center text-red-600 text-sm'>
          {message || 'Failed to load employees.'}
        </p>
      )}

      {!isLoading && employees?.length === 0 && (
        <p className='text-center text-gray-500 text-sm'>No employees found.</p>
      )}

      <ul className='divide-y divide-gray-200'>
        {employees?.map((employee) => (
          <li
            key={employee.empid}
            className='flex justify-between items-center px-5 py-4 hover:bg-green-50 rounded-xl transition'
          >
            <div className='flex items-center space-x-4'>
              <img
                src={employee.photoUrl}
                alt={employee.name}
                className='w-12 h-12 rounded-full object-cover border border-gray-300'
              />
              <div className='flex flex-col'>
                <p className='text-lg font-medium text-gray-800'>
                  {employee.name}
                </p>
                <span className='text-sm text-gray-500'>
                  ID: {employee.empid}
                </span>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                className='px-4 py-1.5 text-sm font-semibold text-emerald-700 border border-emerald-500 rounded-lg hover:bg-green-100 transition duration-200'
                onClick={() => console.log('View details of', employee.empid)}
              >
                Details
              </button>
              <button
                className='px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition duration-200'
                onClick={() => navigate(`/edit-employee/${employee.empid}`)}
              >
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Employees;
