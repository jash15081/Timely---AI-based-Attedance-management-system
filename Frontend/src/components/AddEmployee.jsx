import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createEmployee,
  clearManageEmployeeState,
} from '../features/employee/ManageEmployeeSlice';
import { useNavigate } from 'react-router-dom';

function AddEmployee() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { creating, error, employee } = useSelector((state) => state.manageEmployee);

  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formError, setFormError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeId || !name || !email || !photo) {
      setFormError('All fields including one face photo are required.');
      return;
    }

    setFormError('');
    dispatch(createEmployee({ name, email, employeeId, photo }))
      .unwrap()
      .then((response) => {
        setShowPasswordModal(true);
      })
      .catch((err) => {
        console.error('Create failed:', err);
      });
  };

  const handleModalClose = () => {
    setShowPasswordModal(false);
    dispatch(clearManageEmployeeState());
    navigate('/employees');
  };

  return (
    <div className='max-w-2xl mx-auto p-6 mt-10 bg-white rounded-xl shadow-lg'>
      <h2 className='text-2xl font-bold text-emerald-700 mb-4'>Add Employee</h2>
      {(formError || error) && (
        <p className='text-red-600 mb-4'>{formError || error}</p>
      )}
      <form onSubmit={handleSubmit} className='space-y-5'>
        <input
          type='text'
          placeholder='Employee ID'
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className='w-full px-4 py-2 border rounded-md'
        />
        <input
          type='text'
          placeholder='Name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className='w-full px-4 py-2 border rounded-md'
        />
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full px-4 py-2 border rounded-md'
        />

        <div>
          <label className='block mb-1 font-medium'>
            Face Photo (Required)
          </label>
          {previewUrl && (
            <img
              src={previewUrl}
              alt='Preview'
              className='w-24 h-24 object-cover rounded-md border mb-2'
            />
          )}
          <input
            type='file'
            accept='image/*'
            onChange={handlePhotoChange}
            className='block w-full'
          />
        </div>

        <button
          type='submit'
          disabled={creating}
          className='bg-emerald-800 text-white px-6 py-2 rounded-md hover:bg-emerald-700'
        >
          {creating ? 'Saving...' : 'Create Employee'}
        </button>
      </form>

      {/* Password Modal */}
      {showPasswordModal && employee?.password && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-emerald-700 mb-4">Employee Created Successfully!</h3>
            <div className="mb-4">
              <p className="mb-2">Please note the auto-generated password for this employee:</p>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="font-mono text-lg text-center">{employee.password}</p>
              </div>
              <p className="mt-2 text-sm text-red-600">
                This password cannot be retrieved later. Please make sure to note it down.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleModalClose}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
              >
                I've Noted the Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddEmployee;