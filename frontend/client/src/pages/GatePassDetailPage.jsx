import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaIdCard,
  FaWarehouse,
  FaUser,
  FaTruck,
  FaBoxes,
  FaTools,
  FaUserTie,
  FaPrint,
  FaCheckCircle,
  FaClock,
  FaWhatsapp
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'Person':
      return <FaUser className="text-blue-600" />;
    case 'Vehicle':
      return <FaTruck className="text-green-600" />;
    case 'Material':
      return <FaBoxes className="text-purple-600" />;
    case 'Equipment':
      return <FaTools className="text-orange-600" />;
    case 'Visitor':
      return <FaUserTie className="text-indigo-600" />;
    default:
      return <FaIdCard className="text-gray-600" />;
  }
};

export default function GatePassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gatePass, setGatePass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispatching, setDispatching] = useState(false);

  const fetchGatePass = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:7000/api/gate-pass/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load gate pass');
      }
      const data = await response.json();
      setGatePass(data.data || data.gatePass || data);
      setError(null);
    } catch (err) {
      console.error('Error loading gate pass:', err);
      setError(err.message || 'Unable to load gate pass');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchGatePass();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirmDispatch = async () => {
    if (!gatePass) return;
    const notes = window.prompt('Enter dispatch notes (optional):', '');
    try {
      setDispatching(true);
      const response = await fetch(`http://localhost:7000/api/gate-pass/${gatePass._id}/confirm-dispatch`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ notes: notes || '' }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to confirm dispatch');
      }
      toast.success('Stock dispatched successfully');
      await fetchGatePass();
    } catch (err) {
      console.error('Dispatch error:', err);
      toast.error(err.message || 'Failed to confirm dispatch');
    } finally {
      setDispatching(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!gatePass) return;
    
    // Get the contact number
    const issuedToContact = gatePass.issuedTo?.contact || '';
    const phoneNumber = issuedToContact.replace(/[^\d+]/g, '').replace(/^0+/, '') || '';
    
    // Check if we have a contact number
    if (!phoneNumber) {
      toast.error('Contact number not found. Cannot open WhatsApp.');
      return;
    }
    
    // Ask for confirmation
    const confirmed = window.confirm(
      `Do you want to open WhatsApp and share the Gate Pass PDF with ${gatePass.issuedTo?.name || 'the customer'}?\n\n` +
      `Contact: ${issuedToContact}\n` +
      `WhatsApp will open with this number automatically.`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      // Generate PDF using jsPDF
      const doc = new jsPDF();
      
      // Company Header
      doc.setFontSize(20);
      doc.setTextColor(124, 58, 237); // Purple color
      doc.text('FLOUR MILL', 105, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.setTextColor(147, 51, 234);
      doc.text('GATE PASS', 105, 30, { align: 'center' });
      
      // Gate Pass Number and Date
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(`Gate Pass #: ${gatePass.gatePassNumber || 'N/A'}`, 20, 45);
      doc.setFont(undefined, 'normal');
      
      const gatePassDate = gatePass.validFrom 
        ? new Date(gatePass.validFrom).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Date: ${gatePassDate}`, 150, 45, { align: 'right' });
      
      // Issued To Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Issued To:', 20, 60);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const issuedToName = gatePass.issuedTo?.name || 'N/A';
      const issuedToCompany = gatePass.issuedTo?.company || '';
      
      doc.text(issuedToName, 20, 67);
      doc.text(`Contact: ${issuedToContact}`, 20, 74);
      if (issuedToCompany) {
        doc.text(`Company: ${issuedToCompany}`, 20, 81);
      }
      
      // Gate Pass Details
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Gate Pass Details:', 110, 60);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      doc.text(`Type: ${gatePass.type || 'N/A'}`, 110, 67);
      doc.text(`Purpose: ${gatePass.purpose || 'N/A'}`, 110, 74);
      
      const validUntil = gatePass.validUntil 
        ? new Date(gatePass.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';
      doc.text(`Valid Until: ${validUntil}`, 110, 81);
      
      const warehouseName = gatePass.warehouse?.name || 'N/A';
      const warehouseLocation = gatePass.warehouse?.location || 'N/A';
      doc.text(`Warehouse: ${warehouseName}`, 110, 88);
      if (warehouseLocation !== 'N/A') {
        doc.text(`Location: ${warehouseLocation}`, 110, 95);
      }
      
      // Items Table using autoTable
      let startY = 105;
      if (items && items.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Items to Dispatch:', 20, startY);
        startY += 8;
        
        // Prepare table data
        const tableData = items.map((item, index) => [
          (index + 1).toString(),
          (item.description || 'N/A').toString(),
          (item.quantity || 0).toLocaleString(),
          (item.unit || 'units').toString(),
          `Rs. ${(item.value || 0).toLocaleString()}`
        ]);
        
        // Use autoTable for better formatting
        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            startY: startY,
            head: [['#', 'Description', 'Quantity', 'Unit', 'Value']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' },
              1: { cellWidth: 80 },
              2: { cellWidth: 25, halign: 'right' },
              3: { cellWidth: 25, halign: 'center' },
              4: { cellWidth: 30, halign: 'right' }
            }
          });
          startY = doc.lastAutoTable.finalY + 10;
        } else {
          // Fallback if autoTable is not available
          doc.setFontSize(10);
          items.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.description || 'N/A'} - ${item.quantity || 0} ${item.unit || 'units'} - Rs. ${(item.value || 0).toLocaleString()}`, 20, startY);
            startY += 7;
            if (startY > 270) {
              doc.addPage();
              startY = 20;
            }
          });
        }
      } else {
        startY = 105;
      }
      
      // Footer
      const footerY = startY + 10;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('This gate pass is valid for stock dispatch only.', 105, footerY, { align: 'center' });
      doc.text('Please ensure all items are verified before dispatch.', 105, footerY + 6, { align: 'center' });
      
      // Generate PDF blob
      const pdfBlob = doc.output('blob');
      const fileName = `GatePass-${gatePass.gatePassNumber || 'AUTO'}-${Date.now()}.pdf`;
      
      // Download PDF automatically
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
      
      // Open WhatsApp with the customer number pre-filled
      // Format: wa.me/phoneNumber (without +, spaces, or special characters)
      // Remove leading zeros if present and ensure country code
      let whatsappNumber = phoneNumber.replace(/^\+/, ''); // Remove + if present
      if (whatsappNumber.startsWith('0')) {
        whatsappNumber = '92' + whatsappNumber.substring(1); // Add Pakistan country code if starts with 0
      } else if (!whatsappNumber.startsWith('92') && whatsappNumber.length === 10) {
        whatsappNumber = '92' + whatsappNumber; // Add Pakistan country code if 10 digits
      }
      
      const whatsappUrl = `https://wa.me/${whatsappNumber}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success('PDF downloaded. WhatsApp opened with customer number. Please attach the PDF file.', { autoClose: 5000 });
      
      // Mark as shared in the database
      try {
        const shareResponse = await fetch(`http://localhost:7000/api/gate-pass/${gatePass._id}/whatsapp-shared`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (shareResponse.ok) {
          await fetchGatePass();
        }
      } catch (shareErr) {
        console.error('Failed to update WhatsApp shared status:', shareErr);
      }
      
    } catch (err) {
      console.error('Error sharing via WhatsApp:', err);
      toast.error('Error generating PDF: ' + err.message);
    }
  };

  const items = useMemo(() => {
    if (!gatePass?.items) return [];
    return gatePass.items.map((item, index) => ({
      key: item._id || index,
      description: item.description || 'N/A',
      quantity: item.quantity || 0,
      unit: item.unit || 'units',
      value: item.value || 0,
    }));
  }, [gatePass]);

  const printGatePass = () => {
    if (!gatePass) return;
    const gatePassDate = formatDate(gatePass.validFrom || new Date());
    const validUntilDate = formatDate(gatePass.validUntil);
    const issuedToName = gatePass.issuedTo?.name || 'N/A';
    const issuedToContact = gatePass.issuedTo?.contact || 'N/A';
    const warehouseName = gatePass.warehouse?.name || 'N/A';
    const warehouseLocation = gatePass.warehouse?.location || 'N/A';
    const gatePassRows = items.map((item, index) => `
      <tr>
        <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${item.description}</td>
        <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #e5e7eb;">${item.quantity.toLocaleString()}</td>
        <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #e5e7eb;">${item.unit}</td>
        <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;">Rs. ${item.value.toLocaleString()}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Pass - ${gatePass.gatePassNumber || 'N/A'}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            * { margin:0; padding:0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:12px; color:#000; line-height:1.4; }
            .gatepass-container { max-width:100%; padding:20px; }
            .gatepass-header { border-bottom:3px solid #9333ea; padding-bottom:20px; margin-bottom:25px; }
            .header-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px; }
            .company-info h1 { font-size:28px; color:#7c3aed; margin-bottom:5px; font-weight:700; }
            .gatepass-info { text-align:right; }
            .gatepass-info h2 { font-size:24px; color:#9333ea; margin-bottom:5px; font-weight:700; }
            .details-section { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-bottom:25px; }
            .detail-box { background:#f9fafb; padding:15px; border-left:4px solid #9333ea; border-radius:3px; }
            .detail-box h3 { font-size:12px; color:#6b7280; text-transform:uppercase; margin-bottom:8px; font-weight:600; }
            .detail-box p { font-size:11px; color:#111827; margin:3px 0; }
            .items-section { margin-bottom:25px; }
            table { width:100%; border-collapse:collapse; margin-bottom:15px; }
            thead { background:#7c3aed; color:white; }
            thead th { padding:12px 8px; font-size:11px; text-transform:uppercase; }
            tbody tr:nth-child(even) { background:#f9fafb; }
            tbody td { padding:10px 8px; font-size:11px; color:#111827; }
            .signature-section { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:30px; padding-top:20px; border-top:2px solid #e5e7eb; }
            .signature-box { text-align:center; }
            .signature-line { border-top:2px solid #111827; width:200px; margin:0 auto 5px; }
            .gatepass-footer { margin-top:30px; padding-top:15px; border-top:2px solid #e5e7eb; text-align:center; }
            @media print {
              body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
              .gatepass-container { padding:0; }
            }
          </style>
        </head>
        <body>
          <div class="gatepass-container">
            <div class="gatepass-header">
              <div class="header-top">
                <div class="company-info">
                  <h1>FLOUR MILL</h1>
                  <div class="subtitle">Gate Pass</div>
                </div>
                <div class="gatepass-info">
                  <h2>GATE PASS</h2>
                  <div class="gatepass-number">Gate Pass #: ${gatePass.gatePassNumber || 'N/A'}</div>
                  <div class="gatepass-date">Date: ${gatePassDate}</div>
                </div>
              </div>
            </div>
            <div class="details-section">
              <div class="detail-box">
                <h3>Issued To</h3>
                <p class="name">${issuedToName}</p>
                <p>Contact: ${issuedToContact}</p>
              </div>
              <div class="detail-box">
                <h3>Gate Pass Details</h3>
                <p><strong>Type:</strong> ${gatePass.type || 'Material'}</p>
                <p><strong>Purpose:</strong> ${gatePass.purpose || 'Stock Dispatch'}</p>
                <p><strong>Status:</strong> ${gatePass.status || 'Active'}</p>
                ${gatePass.validUntil ? `<p><strong>Valid Until:</strong> ${validUntilDate}</p>` : ''}
              </div>
            </div>
            <div class="detail-box" style="margin-bottom:20px;">
              <h3>Warehouse Information</h3>
              <p class="name">${warehouseName}</p>
              <p>Location: ${warehouseLocation}</p>
            </div>
            <div class="items-section">
              <h3>Items to Dispatch</h3>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${gatePassRows}
                </tbody>
              </table>
            </div>
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Authorized By</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Received By</div>
              </div>
            </div>
            <div class="gatepass-footer">
              <p><strong>This gate pass is valid for stock dispatch only.</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.afterprint = () => printWindow.close();
      }, 300);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !gatePass) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-700 mb-4">{error || 'Gate pass not found.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaIdCard className="text-purple-600" />
                Gate Pass #{gatePass.gatePassNumber}
              </h1>
              <p className="text-sm text-gray-600">
                Created on {formatDateTime(gatePass.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={printGatePass}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
            {!gatePass.whatsappShared && (
              <button
                onClick={handleWhatsAppShare}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600"
              >
                <FaWhatsapp className="mr-2" />
                Share via WhatsApp
              </button>
            )}
            {gatePass.status === 'Active' && !gatePass.stockDispatch?.confirmed && (
              <button
                onClick={handleConfirmDispatch}
                disabled={dispatching}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-60"
              >
                <FaCheckCircle className="mr-2" />
                {dispatching ? 'Dispatching...' : 'Dispatch Stock'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
              {getTypeIcon(gatePass.type)}
              Gate Pass Information
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="text-gray-500">Type:</span> {gatePass.type}</p>
              <p><span className="text-gray-500">Purpose:</span> {gatePass.purpose}</p>
              <p><span className="text-gray-500">Status:</span> {gatePass.status}</p>
              <p><span className="text-gray-500">Valid From:</span> {formatDate(gatePass.validFrom)}</p>
              <p><span className="text-gray-500">Valid Until:</span> {formatDate(gatePass.validUntil)}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
              <FaWarehouse className="text-blue-600" />
              Warehouse & Recipient
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="text-gray-500">Warehouse:</span> {gatePass.warehouse?.name || 'N/A'}</p>
              <p><span className="text-gray-500">Location:</span> {gatePass.warehouse?.location || 'N/A'}</p>
              <p><span className="text-gray-500">Issued To:</span> {gatePass.issuedTo?.name || 'N/A'}</p>
              <p><span className="text-gray-500">Contact:</span> {gatePass.issuedTo?.contact || 'N/A'}</p>
              {gatePass.issuedTo?.company && (
                <p><span className="text-gray-500">Company:</span> {gatePass.issuedTo.company}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaBoxes className="text-green-600" />
              Items ({items.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No items associated with this gate pass
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.key}>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center">{item.unit}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">Rs. {item.value.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
              <FaClock className="text-orange-600" />
              Timeline
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>Issued: {formatDateTime(gatePass.createdAt)}</p>
              {gatePass.stockDispatch?.confirmed && (
                <p>
                  Dispatched: {formatDateTime(gatePass.stockDispatch.confirmedAt)}
                </p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
              <FaCheckCircle className="text-green-600" />
              Stock Dispatch
            </h2>
            {gatePass.stockDispatch?.confirmed ? (
              <div className="text-sm text-green-700 space-y-1">
                <p>Stock dispatched and confirmed.</p>
                {gatePass.stockDispatch.confirmedBy && (
                  <p className="text-gray-600">
                    Confirmed by: {`${gatePass.stockDispatch.confirmedBy.firstName || ''} ${gatePass.stockDispatch.confirmedBy.lastName || ''}`.trim() || 'N/A'}
                  </p>
                )}
                {gatePass.stockDispatch.notes && (
                  <p className="text-gray-500">Notes: {gatePass.stockDispatch.notes}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Stock has not been marked as dispatched yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

