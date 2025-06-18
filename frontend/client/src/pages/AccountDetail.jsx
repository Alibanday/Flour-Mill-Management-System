import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaArrowLeft, FaIdCard, FaUser, FaPhone, FaWhatsapp, FaCreditCard, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/accounts/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAccount(res.data);
      } catch (err) {
        console.error("Error fetching account:", err);
        toast.error("Failed to load account details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccount();
  }, [id]);

  const handleEdit = () => {
    navigate(`/account/edit/${id}`);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/api/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Account deleted successfully");
      navigate("/account");
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error("Failed to delete account");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 text-lg mb-4">Account not found</p>
          <button
            onClick={() => navigate("/AccountsPage")}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto"
          >
            <FaArrowLeft className="mr-2" />
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button and actions */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/AccountsPage")}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft className="mr-2" />
            Back to Accounts
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaEdit className="mr-2" />
              Edit
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <FaTrash className="mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Main content card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Card header */}
          <div className="bg-blue-600 text-white p-4 md:p-6">
            <div className="flex items-center">
              <FaUser className="text-2xl mr-3" />
              <h1 className="text-xl md:text-2xl font-bold">Account Details</h1>
            </div>
          </div>

          {/* Card body */}
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <DetailCard 
                icon={<FaIdCard className="text-blue-500" />}
                title="Account ID" 
                value={account.accountId} 
              />
              <DetailCard 
                icon={<FaUser className="text-blue-500" />}
                title="Account Type" 
                value={account.accountType} 
              />
              <DetailCard 
                icon={<FaUser className="text-blue-500" />}
                title="Account Name" 
                value={account.accountName} 
              />
              <DetailCard 
                icon={<FaPhone className="text-blue-500" />}
                title="Phone Number" 
                value={account.phoneNumber} 
              />
              <DetailCard 
                icon={<FaWhatsapp className="text-green-500" />}
                title="WhatsApp Number" 
                value={account.whatsappNumber} 
              />
              <DetailCard 
                icon={<FaCreditCard className="text-blue-500" />}
                title="Credit Limit" 
                value={`Rs. ${account.creditLimit}`} 
              />
              <DetailCard 
                icon={<FaMapMarkerAlt className="text-blue-500" />}
                title="Address" 
                value={account.address} 
                fullWidth
              />
              <DetailCard 
                icon={<FaCalendarAlt className="text-blue-500" />}
                title="Created At" 
                value={new Date(account.createdAt).toLocaleString()} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Confirm Deletion</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this account? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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

// Improved DetailCard component
const DetailCard = ({ icon, title, value, fullWidth = false }) => {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg border border-gray-200 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <div className="flex items-start space-x-3">
        <div className="mt-1">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className="text-gray-800 font-medium mt-1">
            {value || <span className="text-gray-400">Not provided</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountDetail;