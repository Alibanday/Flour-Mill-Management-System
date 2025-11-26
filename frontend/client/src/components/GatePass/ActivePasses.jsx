import React, { useState } from 'react';
import { 
  FaCheckCircle, FaTimes, FaUser, FaTruck, FaBoxes, FaTools, FaUserTie,
  FaPrint, FaWhatsapp, FaExclamationTriangle, FaClock
} from 'react-icons/fa';

export default function ActivePasses({ gatePasses, onConfirmDispatch, onWhatsAppShare, user }) {
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchNotes, setDispatchNotes] = useState('');

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Person': return <FaUser className="h-4 w-4" />;
      case 'Vehicle': return <FaTruck className="h-4 w-4" />;
      case 'Material': return <FaBoxes className="h-4 w-4" />;
      case 'Equipment': return <FaTools className="h-4 w-4" />;
      case 'Visitor': return <FaUserTie className="h-4 w-4" />;
      default: return <FaUser className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Person': return 'bg-blue-100 text-blue-800';
      case 'Vehicle': return 'bg-green-100 text-green-800';
      case 'Material': return 'bg-purple-100 text-purple-800';
      case 'Equipment': return 'bg-orange-100 text-orange-800';
      case 'Visitor': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  const getRemainingTime = (validUntil) => {
    const now = new Date();
    const validDate = new Date(validUntil);
    const diff = validDate - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Less than 1h remaining';
  };

  const handleConfirmDispatch = (gatePass) => {
    setSelectedGatePass(gatePass);
    setShowDispatchModal(true);
  };

  const submitDispatch = () => {
    if (selectedGatePass && dispatchNotes.trim()) {
      onConfirmDispatch(selectedGatePass._id, dispatchNotes);
      setShowDispatchModal(false);
      setSelectedGatePass(null);
      setDispatchNotes('');
    }
  };

  const handlePrint = (gatePass) => {
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Gate Pass - ${gatePass.gatePassNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .row { display: flex; margin-bottom: 10px; }
            .label { font-weight: bold; width: 150px; }
            .value { flex: 1; }
            .items { border: 1px solid #ccc; padding: 10px; margin-top: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GATE PASS</h1>
            <h2>FlourMill Pro System</h2>
          </div>
          
          <div class="section">
            <div class="row">
              <span class="label">Gate Pass No:</span>
              <span class="value">${gatePass.gatePassNumber}</span>
            </div>
            <div class="row">
              <span class="label">Type:</span>
              <span class="value">${gatePass.type}</span>
            </div>
            <div class="row">
              <span class="label">Purpose:</span>
              <span class="value">${gatePass.purpose}</span>
            </div>
            <div class="row">
              <span class="label">Issued To:</span>
              <span class="value">${gatePass.issuedTo?.name}</span>
            </div>
            <div class="row">
              <span class="label">Contact:</span>
              <span class="value">${gatePass.issuedTo?.contact}</span>
            </div>
            <div class="row">
              <span class="label">Valid From:</span>
              <span class="value">${new Date(gatePass.validFrom).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span class="label">Valid Until:</span>
              <span class="value">${new Date(gatePass.validUntil).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span class="label">Warehouse:</span>
              <span class="value">${gatePass.warehouse?.name}</span>
            </div>
          </div>
          
          ${gatePass.items && gatePass.items.length > 0 ? `
          <div class="section">
            <h3>Items:</h3>
            <div class="items">
              ${gatePass.items.map(item => `
                <div class="item">
                  <span>${item.description} - ${item.quantity} ${item.unit}</span>
                  <span>Rs. ${item.value}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="row">
              <span class="label">Issued By:</span>
              <span class="value">${gatePass.issuedBy?.name}</span>
            </div>
            <div class="row">
              <span class="label">Date:</span>
              <span class="value">${new Date(gatePass.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Active Gate Passes</h2>
        <p className="text-gray-600">Manage active gate passes and confirm stock dispatch</p>
      </div>

      {gatePasses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaCheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No active gate passes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gatePasses.map((gatePass) => (
            <div
              key={gatePass._id}
              className={`bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow ${
                isExpired(gatePass.validUntil) ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${getTypeColor(gatePass.type)}`}>
                  {getTypeIcon(gatePass.type)}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{gatePass.gatePassNumber}</div>
                  <div className="text-xs text-gray-500">{gatePass.type}</div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  <FaCheckCircle className="mr-1" />
                  Active
                </span>
                {isExpired(gatePass.validUntil) && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    <FaExclamationTriangle className="mr-1" />
                    Expired
                  </span>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Purpose:</span>
                  <p className="text-sm text-gray-900">{gatePass.purpose}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Issued To:</span>
                  <p className="text-sm text-gray-900">{gatePass.issuedTo?.name}</p>
                  <p className="text-xs text-gray-500">{gatePass.issuedTo?.contact}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Warehouse:</span>
                  <p className="text-sm text-gray-900">{gatePass.warehouse?.name}</p>
                </div>
              </div>

              {/* Validity */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valid Until:</span>
                  <span className={`font-medium ${isExpired(gatePass.validUntil) ? 'text-red-600' : 'text-green-600'}`}>
                    {new Date(gatePass.validUntil).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getRemainingTime(gatePass.validUntil)}
                </div>
              </div>

              {/* Items Summary */}
              {gatePass.items && gatePass.items.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-1">
                    {gatePass.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        {item.description} - {item.quantity} {item.unit}
                      </div>
                    ))}
                    {gatePass.items.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{gatePass.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stock Dispatch Status */}
              <div className="mb-4">
                {gatePass.stockDispatch?.confirmed ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <FaCheckCircle className="mr-2" />
                    Stock dispatch confirmed
                    <span className="ml-2 text-xs text-gray-500">
                      by {gatePass.stockDispatch.confirmedBy ? 
                        `${gatePass.stockDispatch.confirmedBy.firstName || ''} ${gatePass.stockDispatch.confirmedBy.lastName || ''}`.trim() || 'N/A'
                        : 'N/A'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600 text-sm">
                    <FaClock className="mr-2" />
                    Pending stock dispatch
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {!gatePass.stockDispatch?.confirmed && (
                  <button
                    onClick={() => handleConfirmDispatch(gatePass)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <FaCheckCircle className="mr-1" />
                    Confirm Dispatch
                  </button>
                )}
                
                <button
                  onClick={() => handlePrint(gatePass)}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  title="Print"
                >
                  <FaPrint />
                </button>
                
                {!gatePass.whatsappShared && (
                  <button
                    onClick={() => onWhatsAppShare(gatePass._id)}
                    className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                    title="Share via WhatsApp"
                  >
                    <FaWhatsapp />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Confirmation Modal */}
      {showDispatchModal && selectedGatePass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Confirm Stock Dispatch</h3>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Confirm that stock has been dispatched for Gate Pass: <strong>{selectedGatePass.gatePassNumber}</strong>
              </p>
              <div className="text-sm text-gray-700">
                <p><strong>Items:</strong></p>
                {selectedGatePass.items?.map((item, index) => (
                  <p key={index} className="ml-2">
                    • {item.description} - {item.quantity} {item.unit}
                  </p>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Notes:</label>
              <textarea
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any notes about the dispatch..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDispatch}
                disabled={!dispatchNotes.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
