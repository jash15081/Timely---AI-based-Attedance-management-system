import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAdmins,
  addAdmin,
  deleteAdmin,
} from '../features/admin/adminSlice';
import { PulseLoader } from 'react-spinners';

function Admins() {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { admins, isLoading, isError, message } = useSelector(
    (state) => state.admins
  );

  useEffect(() => {
    dispatch(fetchAdmins());
  }, [dispatch]);

  const handleAddAdmin = () => {
    if (newUsername.trim() && newPassword.trim()) {
      dispatch(addAdmin({ username: newUsername, password: newPassword }));
      setNewUsername('');
      setNewPassword('');
      setIsModalOpen(false);
    }
  };

  const openDeleteConfirm = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      dispatch(deleteAdmin(deleteTargetId));
      setDeleteTargetId(null);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className='mx-auto p-6 bg-white shadow-2xl rounded-2xl'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-green-800'>Admins</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className='bg-emerald-800 text-white px-5 py-2 rounded-lg text-sm shadow hover:bg-green-700 transition duration-200'
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
          {message || 'Failed to load admins.'}
        </p>
      )}

      {!isLoading && admins.length === 0 && (
        <p className='text-center text-gray-500 text-sm'>No admins found.</p>
      )}

      <ul className='divide-y divide-gray-200'>
        {admins.map((admin) => (
          <li
            key={admin.id}
            className='flex justify-between items-center px-5 py-4 hover:bg-green-50 rounded-xl transition'
          >
            <div className='flex items-center space-x-4'>
              <p className='text-lg font-medium text-gray-800'>
                {admin.username}
              </p>
              <span className='text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md'>
                ID: {admin.id}
              </span>
            </div>
            <button
              onClick={() => openDeleteConfirm(admin.id)}
              className='px-4 py-1.5 text-sm font-semibold text-red-600 border border-red-500 rounded-lg hover:bg-red-100 transition duration-200'
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {/* Add Admin Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white w-full max-w-sm rounded-xl shadow-lg p-6'>
            <h2 className='text-xl font-semibold mb-4 text-emerald-700'>
              Add New Admin
            </h2>

            <input
              type='text'
              className='w-full px-4 py-2 mb-3 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:outline-none'
              placeholder='Username'
              required='true'
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <input
              type='password'
              className='w-full px-4 py-2 mb-4 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:outline-none'
              placeholder='Password'
              value={newPassword}
              required='true'
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className='flex justify-end gap-3'>
              <button
                className='text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition'
                onClick={() => {
                  setNewUsername('');
                  setNewPassword('');
                  setIsModalOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className='text-sm bg-emerald-800 hover:bg-green-700 text-white px-4 py-2 rounded-md transition'
                onClick={handleAddAdmin}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isConfirmOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white w-full max-w-sm rounded-xl shadow-lg p-6'>
            <h2 className='text-lg font-semibold text-emerald-700 mb-3'>
              Confirm Deletion
            </h2>
            <p className='text-sm text-gray-700 mb-6'>
              Are you sure you want to delete this admin?
            </p>
            <div className='flex justify-end gap-3'>
              <button
                className='text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition'
                onClick={() => setIsConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className='text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition'
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admins;
