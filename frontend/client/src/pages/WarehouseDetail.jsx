// pages/WarehouseDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/warehouse/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setWarehouse(res.data);
      } catch (err) {
        console.error("Error fetching warehouse:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarehouse();
  }, [id]);

  const handleEdit = () => {
    navigate(`/warehouse/edit/${id}`);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/api/warehouse/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      navigate("/warehouse");
    } catch (err) {
      console.error("Error deleting warehouse:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Warehouse not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
      <div className="min-h-full p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden h-full">
          <div className="p-6 md:p-8 h-full">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Warehouse Details</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <DetailCard title="Name" value={warehouse.name} icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                } />
                
                <DetailCard title="Location" value={warehouse.location} icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                } />
                
                <DetailCard title="Capacity" value={warehouse.capacity} icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                } />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Confirm Deletion</h3>
              <p className="text-gray-600 text-center mb-6">Are you sure you want to delete this warehouse? This action cannot be undone.</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable DetailCard component
const DetailCard = ({ title, value, icon }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
      <div className="flex items-center space-x-3 mb-2">
        {icon}
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      </div>
      <p className="text-gray-600 pl-9">{value}</p>
    </div>
  );
};

export default WarehouseDetail;