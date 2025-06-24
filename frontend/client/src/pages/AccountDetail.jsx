import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaArrowLeft, FaIdCard, FaUser, FaPhone, FaWhatsapp, FaCreditCard, FaMapMarkerAlt, FaCalendarAlt, FaFileInvoice, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

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

    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/invoice/account/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(res.data.invoices || []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        // Don't show error toast as invoices might not exist yet
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchAccount();
    fetchInvoices();
  }, [id]);

  // Calculate credit information
  const calculateCreditInfo = () => {
    if (!account || !invoices) return { outstanding: 0, available: 0, used: 0 };
    
    const outstanding = invoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
    
    const used = account.creditLimit - outstanding;
    const available = Math.max(account.creditLimit - outstanding, 0);
    
    return { outstanding, available, used };
  };

  const creditInfo = calculateCreditInfo();
  const isOverLimit = creditInfo.outstanding > account?.creditLimit;

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

        {/* Credit Information Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 md:p-6">
            <div className="flex items-center">
              <FaCreditCard className="text-2xl mr-3" />
              <h2 className="text-xl md:text-2xl font-bold">Credit Information</h2>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CreditCard 
                title="Credit Limit"
                value={`Rs. ${account.creditLimit?.toLocaleString()}`}
                color="text-blue-600"
                icon={<FaCreditCard />}
              />
              <CreditCard 
                title="Outstanding Amount"
                value={`Rs. ${creditInfo.outstanding.toLocaleString()}`}
                color={isOverLimit ? "text-red-600" : "text-orange-600"}
                icon={isOverLimit ? <FaExclamationTriangle /> : <FaCreditCard />}
              />
              <CreditCard 
                title="Available Credit"
                value={`Rs. ${creditInfo.available.toLocaleString()}`}
                color={creditInfo.available > 0 ? "text-green-600" : "text-red-600"}
                icon={creditInfo.available > 0 ? <FaCheckCircle /> : <FaExclamationTriangle />}
              />
            </div>
            {isOverLimit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-800">
                  <FaExclamationTriangle className="mr-2" />
                  <span className="font-medium">Credit limit exceeded by Rs. {(creditInfo.outstanding - account.creditLimit).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
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

        {/* Invoice History Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaFileInvoice className="text-2xl mr-3" />
                <h2 className="text-xl md:text-2xl font-bold">Invoice History</h2>
              </div>
              <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="p-4 md:p-6">
            {invoicesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber || invoice._id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {invoice.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          Rs. {invoice.totalAmount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          Rs. {(invoice.totalAmount - (invoice.remainingAmount || 0))?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          Rs. {(invoice.remainingAmount || 0)?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaFileInvoice className="mx-auto text-4xl mb-4 text-gray-300" />
                <p className="text-lg font-medium">No invoices found</p>
                <p className="text-sm">This account hasn't had any invoices generated yet.</p>
              </div>
            )}
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

// Credit Card component for credit information
const CreditCard = ({ title, value, color, icon }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`text-2xl ${color}`}>
          {icon}
        </div>
      </div>
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