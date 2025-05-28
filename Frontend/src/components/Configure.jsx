import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setEntranceUrl,
  setExitUrl,
  saveConfiguration,
  fetchConfiguration,
} from '../features/configuration/configureSlice';
import PulseLoader from 'react-spinners/PulseLoader';

const API_URL = import.meta.env.VITE_API_URL;

function Configure() {
  const dispatch = useDispatch();
  const isSuperuser = useSelector((state) => state.auth.superuser);
  const { entranceUrl, exitUrl, loading, message, fetching } = useSelector(
    (state) => state.configure
  );

  const [showPreview, setShowPreview] = useState({
    entrance: false,
    exit: false,
  });
  useEffect(() => {
    dispatch(fetchConfiguration());
  }, []);
  const handleConfigure = (e) => {
    e.preventDefault();
    dispatch(saveConfiguration({ entranceUrl, exitUrl }));
  };

  const renderStream = (url, label) => (
    <div className='mt-4 bg-gray-100 p-4 rounded-lg shadow-md'>
      <h3 className='text-lg font-semibold text-gray-700 mb-2'>
        {label} Preview
      </h3>
      {url ? (
        <div className='w-full flex justify-center'>
          <img
            src={`${API_URL}/stream?url=${encodeURIComponent(url)}`}
            alt={`${label} Stream`}
            className='rounded-lg border border-gray-300 shadow-md w-full max-w-xl aspect-video object-cover'
          />
        </div>
      ) : (
        <p className='text-red-500 text-sm'>
          Enter a valid RTSP URL to preview the stream.
        </p>
      )}
    </div>
  );

  if (!isSuperuser) {
    return (
      <div className='p-8 text-center text-red-600'>
        <h1 className='text-3xl font-bold'>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto p-6 bg-white rounded-3xl shadow-2xl mt-12'>
      <h1 className='text-4xl font-bold text-green-800 mb-8 text-center'>
        Camera Configuration
      </h1>

      <form onSubmit={handleConfigure} className='space-y-12'>
        {[
          {
            label: 'Entrance Camera',
            key: 'entrance',
            value: entranceUrl,
            setValue: (val) => dispatch(setEntranceUrl(val)),
          },
          {
            label: 'Exit Camera',
            key: 'exit',
            value: exitUrl,
            setValue: (val) => dispatch(setExitUrl(val)),
          },
        ].map(({ label, key, value, setValue }) => (
          <div key={key} className='space-y-4'>
            <label className='block text-lg font-medium text-gray-700'>
              {label} RTSP URL
            </label>
            <div className='flex gap-3'>
              <input
                type='text'
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder='rtsp://...'
                className='flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-600'
                required
              />
              <button
                type='button'
                onClick={() =>
                  setShowPreview((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }))
                }
                className={`px-4 py-2 rounded-xl text-white font-medium transition ${
                  showPreview[key]
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {showPreview[key] ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
            {showPreview[key] && renderStream(value, label)}
          </div>
        ))}

        <div className='text-center flex flex-col items-center'>
          <button
            type='submit'
            disabled={loading}
            className={`${
              loading
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-700 hover:bg-green-800'
            } text-white px-6 py-3 rounded-xl text-lg font-semibold transition duration-200`}
          >
            {fetching
              ? 'Fetching'
              : loading
              ? 'Saving...'
              : 'Save Configuration'}
          </button>
          {loading && (
            <div className='mt-3'>
              <PulseLoader color='#22c55e' size={10} />
            </div>
          )}
          {message && (
            <p className='mt-4 text-md font-medium text-green-600'>{message}</p>
          )}
        </div>
      </form>
    </div>
  );
}

export default Configure;
