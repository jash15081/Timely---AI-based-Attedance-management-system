import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployeeById,
  updateEmployee,
} from '../features/employee/ManageEmployeeSlice';
import { PulseLoader } from 'react-spinners';
import {
  fetchEmployeePhotos,
  addEmployeePhoto,
  deleteEmployeePhoto,
} from '../features/employee/employeePhotosSlice';
import { useNavigate, useParams } from 'react-router-dom';

function EditEmployee() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employee, fetching, updating, error, message } = useSelector(
    (state) => state.manageEmployee
  );

  const {
    photos,
    loading: isPhotosLoading,
    error: photoError,
  } = useSelector((state) => state.employeePhotos);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    dispatch(fetchEmployeeById(id));
    dispatch(fetchEmployeePhotos(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setEmail(employee.email || '');
      setEmployeeId(employee.empid || '');
      navigate(`/edit-employee/${employee.empid}`, { replace: true });
    }
  }, [employee]);

  const handleUpdate = () => {
    dispatch(updateEmployee({ id, name, email, employeeId }));
  };

  const handleAddPhoto = () => {
    if (photoFile) {
      dispatch(addEmployeePhoto({ id, file: photoFile }));
      setPhotoFile(null);
    }
  };

  const handleDeletePhoto = (url) => {
    const fileName = url.split('/').pop(); // get the file name from the URL
    dispatch(deleteEmployeePhoto({ id, fileName }));
  };

  return (
    <div className=' mx-auto  p-6 bg-white rounded-3xl shadow-lg w-full'>
      <h1 className='text-3xl font-bold text-emerald-700 mb-8'>
        Edit Employee
      </h1>

      {fetching ? (
        <div className='flex justify-center my-6'>
          <PulseLoader color='#16A34A' size={10} />
        </div>
      ) : (
        <div className='flex '>
          {/* Employee Details */}
          <div className='p-2 ml-2 mr-4 w-1/3'>
            <h2 className='text-xl font-semibold text-emerald-800 mb-4'>
              Employee Details
            </h2>

            <label className=' text-start ml-2 block text-lg font-medium text-gray-700 mb-1'>
              Name
            </label>
            <input
              type='text'
              className='w-full mb-4 px-4 py-2 border rounded-lg'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className='block text-lg text-start ml-2 font-medium text-gray-700 mb-1'>
              Email
            </label>
            <input
              type='email'
              className='w-full mb-4 px-4 py-2 border rounded-lg'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className='block text-lg text-start ml-2 font-medium text-gray-700 mb-1'>
              Employee ID
            </label>
            <input
              type='text'
              className='w-full mb-6 px-4 py-2 border rounded-lg'
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />

            <button
              onClick={handleUpdate}
              disabled={updating}
              className={`px-5 py-2 rounded-lg transition text-white 
    ${
      updating
        ? 'bg-green-400 cursor-not-allowed'
        : 'bg-green-600 hover:bg-green-700'
    }`}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
            {error ? <p className='text-red-600 mt-2'>{error}</p> : null}
            {message ? (
              <p className='text-emerald-600 mt-2'>{message}</p>
            ) : null}
          </div>

          {/* Employee Photos */}
          <div className='w-3/4'>
            <h2 className='text-xl font-semibold text-green-800 mb-4'>
              Employee Photos
            </h2>

            <div className='bg-gray-50 p-4 rounded-lg shadow-inner border '>
              {isPhotosLoading ? (
                <div className='flex justify-center items-center h-32'>
                  <PulseLoader color='#16A34A' size={10} />
                </div>
              ) : (
                <div className='grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-72 overflow-y-auto pr-2 mb-4 '>
                  {photos?.map((url) => (
                    <div key={url} className='relative group'>
                      <img
                        src={url}
                        alt='Employee'
                        className='w-full h-28 object-cover rounded-lg border shadow-sm'
                      />
                      <button
                        onClick={() => handleDeletePhoto(url)}
                        className='absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition'
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className='flex items-center gap-2'>
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className='flex-1 px-4 py-2 border rounded-lg bg-white'
                />
                <button
                  onClick={handleAddPhoto}
                  className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition'
                >
                  Upload
                </button>
              </div>
              {photoError ? (
                <p className='text-red-600 mt-2'>{photoError}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditEmployee;
