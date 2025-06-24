import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const PrCenterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prCenter, setPrCenter] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrCenter = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/prcenter/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPrCenter(res.data);
      } catch (err) {
        console.error("Error fetching PR Center:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrCenter();
  }, [id]);

  const handleEdit = () => {
    navigate(`/prcenter/edit/${id}`);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/api/prcenter/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/government-purchases");
    } catch (err) {
      console.error("Error deleting PR Center:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!prCenter) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">PR Center not found</p>
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">PR Center Detail</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 !bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="px-4 py-2 !bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 flex items-center"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <DetailCard title="PR Center Name" value={prCenter.name} />
                <DetailCard title="Location" value={prCenter.location} />
                <DetailCard title="Contact" value={prCenter.contact} />
                <DetailCard title="Created At" value={new Date(prCenter.createdAt).toLocaleString()} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Confirm Deletion</h3>
              <p className="text-gray-600 text-center mb-6">Are you sure you want to delete this PR Center? This action cannot be undone.</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 !bg-white hover:bg-gray-100 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 !bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
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

// Reusable DetailCard
const DetailCard = ({ title, value }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
      <div className="flex items-center space-x-3 mb-2">
        <div className="h-6 w-6 bg-gray-200 rounded-full" />
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      </div>
      <p className="text-gray-600 pl-9">{value}</p>
    </div>
  );
};

export default PrCenterDetail;
