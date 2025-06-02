// ModelManager.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  startModel,
  stopModel,
  generateEmbeddings,
  clearLogs,
  checkModelStatus,
} from "../features/model/modelSlice";

const ModelManager = () => {
  const dispatch = useDispatch();
  const { status, logs, isLoading } = useSelector((state) => state.modelManager);

  useEffect(() => {
    return () => {
      dispatch(clearLogs());
      dispatch(checkModelStatus());
    };
  }, [dispatch]);

  return (
    <div className=" mx-auto mt-10 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-emerald-900">Model Manager</h2>
        <div className="text-lg mr-8 mt-4 font-medium text-emerald-800">
          Status:{" "}
          <span
            className={`font-bold ${
              status === "running" ? "text-green-600" : "text-red-600"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
          onClick={() => dispatch(startModel())}
          disabled={isLoading}
        >
          Start Model
        </button>
        <button
          className="px-4 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-100 rounded-md"
          onClick={() => dispatch(stopModel())}
          disabled={isLoading}
        >
          Stop Model
        </button>
        <button
          className="px-4 py-2 bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-100 rounded-md"
          onClick={() => dispatch(generateEmbeddings())}
          disabled={isLoading}
        >
          Generate Embeddings
        </button>
      </div>

      <div className="bg-white border text-start border-emerald-200 p-4 rounded-lg h-40 overflow-y-auto text-sm text-gray-800">
        {logs.length > 0 ? (
          logs.map((log, index) => <div key={index}>{log}</div>)
        ) : (
          <span className="text-gray-500">No logs yet.</span>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center mt-4">
          <div className="h-5 w-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-emerald-800">Processing...</span>
        </div>
      )}
    </div>
  );
};

export default ModelManager;
