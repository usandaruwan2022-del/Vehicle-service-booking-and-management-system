import React, { useState, useEffect } from 'react';
import { 
  Wrench, Car, Calendar, Clock, CheckCircle2, Clock3, LayoutDashboard, 
  Receipt, Printer, X, FileText, User, LogOut, ShieldAlert, Search, 
  Filter, RotateCcw, CreditCard, Lock, DollarSign, ClipboardList,
  Landmark, Smartphone, QrCode, Zap, ShieldCheck, Activity, Sparkles, 
  MapPin, History, Award, ArrowRight, RefreshCw, Star, MessageSquare, 
  Trash2, Edit3, AlertTriangle, ArrowUpDown
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/bookings';
const AUTH_BASE = 'http://localhost:5000/api/auth';
const ADVANCE_FEE = 1500;

export default function App() {
  const [activeTab, setActiveTab] = useState('customer');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const showNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [selectedAtelierBrand, setSelectedAtelierBrand] = useState('Toyota Gazoo / Hybrid Works');
  const [selectedPlatform, setSelectedPlatform] = useState('Executive Sedan / Hybrid');

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('autocare_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authFormData, setAuthFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'customer'
  });

  const [customerLookup, setCustomerLookup] = useState('');
  const [showAllInHistory, setShowAllInHistory] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const [formData, setFormData] = useState({
    customerName: user ? user.name : '',
    customerEmail: user ? user.email : '',
    phone: user ? user.phone : '',
    vehicleNumber: '',
    vehicleModel: '',
    serviceType: 'Full Service',
    date: '',
    timeSlot: '',
    notes: ''
  });

  const [advMethod, setAdvMethod] = useState('Online Card');
  const [advCard, setAdvCard] = useState({ number: '', expiry: '', cvv: '' });
  const [advRefInput, setAdvRefInput] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const [editingBooking, setEditingBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '', customerEmail: '', phone: '', vehicleNumber: '',
    vehicleModel: '', serviceType: 'Full Service', date: '', timeSlot: '', notes: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedBookingForBill, setSelectedBookingForBill] = useState(null);
  const [billingInput, setBillingInput] = useState({ laborCost: '', partsCost: '', paymentStatus: 'Unpaid' });
  const [viewInvoiceBooking, setViewInvoiceBooking] = useState(null);

  const [paymentBooking, setPaymentBooking] = useState(null);
  const [paymentMethodType, setPaymentMethodType] = useState('card');
  const [cardForm, setCardForm] = useState({ holderName: '', cardNumber: '', expiry: '', cvv: '' });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const availableSlots = [
    "08:30 AM - 10:00 AM",
    "10:00 AM - 11:30 AM",
    "11:30 AM - 01:00 PM",
    "02:00 PM - 03:30 PM",
    "03:30 PM - 05:00 PM"
  ];

  const fetchBookings = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? `${AUTH_BASE}/login` : `${AUTH_BASE}/register`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authFormData)
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.message || "Authentication failed", "error");
        return;
      }
      localStorage.setItem('autocare_token', data.token);
      localStorage.setItem('autocare_user', JSON.stringify(data.user));
      setUser(data.user);
      setShowAuthModal(false);
      setAuthFormData({ name: '', email: '', password: '', phone: '', role: 'customer' });
      showNotification(`Welcome ${data.user.name}! Logged in as ${data.user.role}.`);
    } catch (err) {
      showNotification("Auth Error: " + err.message, "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('autocare_token');
    localStorage.removeItem('autocare_user');
    setUser(null);
    setCustomerLookup('');
    setActiveTab('customer');
    showNotification("Logged out successfully.");
  };

  const handleAdvCardNumber = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setAdvCard({ ...advCard, number: formatted });
  };

  const handleAdvExpiry = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    setAdvCard({ ...advCard, expiry: raw });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!formData.timeSlot) {
      showNotification("Please select an available time slot!", "error");
      return;
    }
    if (advMethod === 'Online Card' && advCard.number.replace(/\s/g, '').length < 16) {
      showNotification("Please enter a valid 16-digit card number for Advance Payment.", "error");
      return;
    }
    if ((advMethod === 'Bank Transfer' || advMethod === 'eZ Cash / Mobile') && !advRefInput.trim()) {
      showNotification(`Please enter the ${advMethod} Reference Number.`, "error");
      return;
    }

    const customRef = advMethod === 'Online Card'
      ? `CRD-${advCard.number.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`
      : advMethod === 'LankaQR'
      ? `LQR-${Math.floor(100000 + Math.random() * 900000)}`
      : advRefInput.trim().toUpperCase();

    setIsSubmittingBooking(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          advanceAmount: ADVANCE_FEE,
          advanceMethod: advMethod,
          advanceRef: customRef,
          advanceStatus: 'Paid'
        })
      });
      const result = await res.json();
      if (!res.ok) {
        showNotification(result.message, "error");
        setIsSubmittingBooking(false);
        return;
      }
      setBookings([result, ...bookings]);
      setBookingSuccess(result);
      showNotification(`Booking Confirmed! Ref: ${result.bookingId}`);
      setFormData(prev => ({
        ...prev, vehicleNumber: '', vehicleModel: '', serviceType: 'Full Service', date: '', timeSlot: '', notes: ''
      }));
      setAdvCard({ number: '', expiry: '', cvv: '' });
      setAdvRefInput('');
    } catch (err) {
      showNotification("Error submitting booking: " + err.message, "error");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleOpenEditModal = (booking) => {
    setEditingBooking(booking);
    setEditFormData({
      customerName: booking.customerName || '',
      customerEmail: booking.customerEmail || '',
      phone: booking.phone || '',
      vehicleNumber: booking.vehicleNumber || '',
      vehicleModel: booking.vehicleModel || '',
      serviceType: booking.serviceType || 'Full Service',
      date: booking.date || '',
      timeSlot: booking.timeSlot || '',
      notes: booking.notes || ''
    });
  };

  const handleSaveEditBooking = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE}/${editingBooking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const updated = await res.json();
        setBookings(bookings.map(b => b._id === updated._id ? updated : b));
        setEditingBooking(null);
        showNotification(`Booking ${updated.bookingId} updated successfully!`);
      } else if (!res.ok && contentType.includes('application/json')) {
        const errData = await res.json();
        showNotification(errData.message || "Update failed", "error");
      } else {
        const fallback = { ...editingBooking, ...editFormData, vehicleNumber: editFormData.vehicleNumber.toUpperCase() };
        setBookings(bookings.map(b => b._id === editingBooking._id ? fallback : b));
        setEditingBooking(null);
        showNotification(`Booking ${editingBooking.bookingId} updated!`);
      }
    } catch (err) {
      showNotification("Error updating booking: " + err.message, "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`${API_BASE}/${bookingToDelete._id}`, { method: 'DELETE' });
      setBookings(bookings.filter(b => b._id !== bookingToDelete._id));
      showNotification(`Booking ${bookingToDelete.bookingId} (${bookingToDelete.vehicleNumber}) deleted safely!`);
      setBookingToDelete(null);
    } catch (err) {
      showNotification("Error deleting booking: " + err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (mongoId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/${mongoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setBookings(bookings.map(b => b._id === mongoId ? updated : b));
      showNotification(`Vehicle status updated to ${newStatus}`);
    } catch (err) {
      showNotification("Error updating status: " + err.message, "error");
    }
  };

  const handleOpenBilling = (booking) => {
    setSelectedBookingForBill(booking);
    setBillingInput({
      laborCost: booking.laborCost || '',
      partsCost: booking.partsCost || '',
      paymentStatus: booking.paymentStatus || 'Unpaid'
    });
  };

  const handleSaveBilling = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/${selectedBookingForBill._id}/invoice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingInput)
      });
      const updated = await res.json();
      setBookings(bookings.map(b => b._id === updated._id ? updated : b));
      setSelectedBookingForBill(null);
      showNotification("Invoice details updated successfully!");
    } catch (err) {
      showNotification("Error updating bill: " + err.message, "error");
    }
  };

  const getBalanceDue = (booking) => {
    const total = booking.totalAmount || 0;
    const adv = booking.advanceAmount || 0;
    if (booking.paymentStatus === 'Paid') return 0;
    return Math.max(0, total - adv);
  };

  const handleOpenPaymentGateway = (booking) => {
    setPaymentBooking(booking);
    setPaymentMethodType('card');
    setCardForm({ holderName: booking.customerName || '', cardNumber: '', expiry: '', cvv: '' });
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setCardForm({ ...cardForm, cardNumber: formatted });
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    setCardForm({ ...cardForm, expiry: raw });
  };

  const handleProcessOnlinePayment = async (e) => {
    e.preventDefault();
    if (paymentMethodType === 'card' && cardForm.cardNumber.replace(/\s/g, '').length < 16) {
      showNotification("Please enter a valid 16-digit card number.", "error");
      return;
    }
    setIsProcessingPayment(true);
    const last4 = cardForm.cardNumber.replace(/\s/g, '').slice(-4);
    const methodLabel = paymentMethodType === 'card' ? `Visa/Mastercard (**** ${last4})` : 'LankaQR / Instant Transfer';

    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/${paymentBooking._id}/pay`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethod: methodLabel })
        });
        const updated = await res.json();
        setBookings(bookings.map(b => b._id === updated._id ? updated : b));
        setIsProcessingPayment(false);
        setPaymentBooking(null);
        setViewInvoiceBooking(updated);
        showNotification("Payment completed successfully!");
      } catch (err) {
        setIsProcessingPayment(false);
        showNotification("Payment failed: " + err.message, "error");
      }
    }, 1000);
  };

  const handleOpenFeedbackModal = (booking) => {
    setFeedbackBooking(booking);
    setRatingInput(booking.rating > 0 ? booking.rating : 5);
    setHoverRating(0);
    setFeedbackText(booking.feedback || '');
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackBooking) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`${API_BASE}/${feedbackBooking._id}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingInput, feedback: feedbackText })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const updated = await res.json();
        setBookings(bookings.map(b => b._id === updated._id ? updated : b));
      } else {
        const fallbackUpdated = { ...feedbackBooking, rating: Number(ratingInput), feedback: feedbackText.trim(), reviewedAt: new Date().toISOString() };
        setBookings(bookings.map(b => b._id === feedbackBooking._id ? fallbackUpdated : b));
      }
      setFeedbackBooking(null);
      showNotification(`Thank you! Your ${ratingInput}-Star review has been published.`);
    } catch (err) {
      const fallbackUpdated = { ...feedbackBooking, rating: Number(ratingInput), feedback: feedbackText.trim(), reviewedAt: new Date().toISOString() };
      setBookings(bookings.map(b => b._id === feedbackBooking._id ? fallbackUpdated : b));
      setFeedbackBooking(null);
      showNotification(`Thank you! Your ${ratingInput}-Star review has been published.`);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleBookAgain = (vehicleNumber, vehicleModel) => {
    setFormData(prev => ({ ...prev, vehicleNumber, vehicleModel }));
    setActiveTab('customer');
    showNotification(`Selected ${vehicleNumber} (${vehicleModel}) for new booking!`);
    setTimeout(() => {
      const el = document.getElementById('booking-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const getNextServiceDate = (dateStr) => {
    if (!dateStr) return 'In 3 Months';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'In 3 Months';
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  };

  const bookedSlotsOnDate = bookings.filter(b => b.date === formData.date).map(b => b.timeSlot);

  const sortBookingsList = (list) => {
    const copy = [...list];
    if (sortBy === 'oldest') return copy.reverse();
    if (sortBy === 'date') return copy.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (sortBy === 'amount') return copy.sort((a, b) => (b.totalAmount || b.advanceAmount || 0) - (a.totalAmount || a.advanceAmount || 0));
    return copy;
  };

  const filteredBookings = sortBookingsList(
    bookings.filter(b => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        b.vehicleNumber.toLowerCase().includes(query) ||
        b.customerName.toLowerCase().includes(query) ||
        b.bookingId.toLowerCase().includes(query) ||
        b.phone.includes(query);
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const customerHistoryBookings = sortBookingsList(
    bookings.filter(b => {
      if (showAllInHistory && !customerLookup.trim()) return true;
      const q = customerLookup.toLowerCase().trim();
      if (!q) {
        if (user) {
          return (
            (user.email && b.customerEmail && b.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
            (user.phone && b.phone && b.phone.includes(user.phone)) ||
            (user.name && b.customerName && b.customerName.toLowerCase().includes(user.name.toLowerCase()))
          );
        }
        return true;
      }
      return (
        b.vehicleNumber.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.bookingId.toLowerCase().includes(q) ||
        (b.customerEmail && b.customerEmail.toLowerCase().includes(q))
      );
    })
  );

  const myGarageVehicles = [];
  const seenPlates = new Set();
  customerHistoryBookings.forEach(b => {
    const plate = b.vehicleNumber.toUpperCase().trim();
    if (!seenPlates.has(plate)) {
      seenPlates.add(plate);
      const vehicleBookings = customerHistoryBookings.filter(item => item.vehicleNumber.toUpperCase().trim() === plate);
      myGarageVehicles.push({
        vehicleNumber: plate,
        vehicleModel: b.vehicleModel,
        lastServiceDate: b.date,
        lastServiceType: b.serviceType,
        lastStatus: b.status,
        visitCount: vehicleBookings.length
      });
    }
  });

  const customerTotalSpent = customerHistoryBookings.reduce((sum, b) => {
    if (b.paymentStatus === 'Paid') return sum + (b.totalAmount || b.advanceAmount || 1500);
    return sum + (b.advanceAmount || 1500);
  }, 0);

  const customerPendingBalance = customerHistoryBookings
    .filter(b => b.paymentStatus !== 'Paid' && b.totalAmount > 0)
    .reduce((sum, b) => sum + getBalanceDue(b), 0);

  const reviewedBookings = bookings.filter(b => b.rating && b.rating > 0);
  const averageRating = reviewedBookings.length > 0
    ? (reviewedBookings.reduce((sum, b) => sum + b.rating, 0) / reviewedBookings.length).toFixed(1)
    : '4.9';

  const totalRevenue = bookings.reduce((sum, b) => {
    if (b.paymentStatus === 'Paid') return sum + (b.totalAmount || b.advanceAmount || 0);
    return sum + (b.advanceStatus === 'Paid' ? (b.advanceAmount || 0) : 0);
  }, 0);

  const pendingRevenue = bookings
    .filter(b => b.paymentStatus !== 'Paid' && b.totalAmount > 0)
    .reduce((sum, b) => sum + getBalanceDue(b), 0);

  const pendingVehiclesCount = bookings.filter(
    b => b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In-Progress'
  ).length;

  const renderStars = (count, size = 13) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(num => (
        <Star key={num} size={size} fill={num <= count ? '#f5b921' : 'transparent'} color={num <= count ? '#f5b921' : '#475569'} />
      ))}
    </span>
  );

  return (
    <div className="luxury-root">
      <style>{`
        :root {
          --bg-obsidian: #07090e;
          --bg-panel: #11151f;
          --bg-panel-alt: #161b28;
          --bg-input-dark: #0b0e16;
          --gold: #f5b921;
          --gold-hover: #eab308;
          --gold-dim: rgba(245, 185, 33, 0.14);
          --cyan-glow: #10b981;
          --text-white: #f8fafc;
          --text-silver: #94a3b8;
          --border-dark: #1f2738;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background-color: var(--bg-obsidian) !important;
          color: var(--text-white) !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .luxury-container { max-width: 1280px; margin: 0 auto; padding: 0 20px; }
        .lux-card {
          background: var(--bg-panel);
          border: 1px solid var(--border-dark);
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.45);
        }
        .lux-input, .lux-select, .lux-textarea {
          width: 100%; padding: 10px 13px; margin-top: 6px;
          background: var(--bg-input-dark) !important;
          border: 1px solid var(--border-dark) !important;
          color: var(--text-white) !important;
          border-radius: 8px; font-size: 13px; outline: none;
        }
        .lux-input:focus, .lux-select:focus, .lux-textarea:focus { border-color: var(--gold) !important; }
        .btn-gold {
          background: var(--gold); color: #07090e; font-weight: 800; border: none;
          padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 13px;
          letter-spacing: 0.5px; text-transform: uppercase; transition: all 0.2s ease;
        }
        .btn-gold:hover { background: var(--gold-hover); transform: translateY(-1px); }
        .hero-grid { display: grid; grid-template-columns: 340px 1fr; gap: 20px; margin-top: 20px; }
        .feature-3-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
        .main-booking-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 22px; margin-top: 24px; }
        @media (max-width: 980px) {
          .hero-grid, .feature-3-grid, .main-booking-grid { grid-template-columns: 1fr; }
        }
        table.lux-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.lux-table th {
          text-align: left; padding: 12px; color: var(--text-silver); font-size: 11px;
          text-transform: uppercase; border-bottom: 1px solid var(--border-dark);
        }
        table.lux-table td { padding: 14px 12px; border-bottom: 1px solid var(--border-dark); color: var(--text-white); }
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'error' ? '#7f1d1d' : '#11151f',
          border: `1px solid ${toast.type === 'error' ? '#ef4444' : '#f5b921'}`,
          color: '#f8fafc', padding: '14px 20px', borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '13px', fontWeight: '600'
        }}>
          <CheckCircle2 size={18} color={toast.type === 'error' ? '#f87171' : '#f5b921'} />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header style={{ background: '#0a0d14', borderBottom: '1px solid var(--border-dark)', padding: '14px 0' }}>
        <div className="luxury-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111726', border: '1px solid #1e293b', padding: '5px 12px', borderRadius: '20px', fontSize: '11px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <span style={{ color: '#94a3b8', fontWeight: '600' }}>STATUS:</span>
              <span style={{ color: '#10b981', fontWeight: '800' }}>ONLINE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--gold-dim)', border: '1px solid var(--gold)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: 'var(--gold)', fontWeight: '800' }}>
              <Star size={12} fill="#f5b921" color="#f5b921" /> {averageRating} / 5.0 ({reviewedBookings.length || 12} Reviews)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('customer')}>
            <div style={{ background: 'var(--gold)', color: '#07090e', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <Wrench size={20} />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '1.2px', color: 'var(--gold)' }}>AUTOCARE SERVICE HUB</div>
              <div style={{ fontSize: '9px', letterSpacing: '2.5px', color: 'var(--text-silver)' }}>GRAND TOURING & SMART ATELIER</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: '#11151f', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-dark)', display: 'flex', gap: '4px' }}>
              <button onClick={() => setActiveTab('customer')} style={{ padding: '7px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', background: activeTab === 'customer' ? 'var(--gold)' : 'transparent', color: activeTab === 'customer' ? '#07090e' : 'var(--text-silver)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={14} /> Book & Track
              </button>
              <button onClick={() => setActiveTab('history')} style={{ padding: '7px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', background: activeTab === 'history' ? 'var(--gold)' : 'transparent', color: activeTab === 'history' ? '#07090e' : 'var(--text-silver)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={14} /> My Garage & History
              </button>
              <button onClick={() => setActiveTab('admin')} style={{ padding: '7px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', background: activeTab === 'admin' ? 'var(--gold)' : 'transparent', color: activeTab === 'admin' ? '#07090e' : 'var(--text-silver)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LayoutDashboard size={14} /> Admin Portal
              </button>
            </div>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#11151f', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-dark)' }}>
                <User size={15} color="#f5b921" />
                <div style={{ fontSize: '11px', lineHeight: 1.2 }}>
                  <strong style={{ color: '#fff' }}>{user.name}</strong>
                  <div style={{ color: user.role === 'admin' ? '#f5b921' : '#94a3b8', textTransform: 'uppercase', fontSize: '9px', fontWeight: '800' }}>{user.role}</div>
                </div>
                <button onClick={handleLogout} title="Logout" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="btn-gold" style={{ padding: '8px 14px', fontSize: '11px' }}>
                SIGN IN
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SUB-BAR */}
      <div style={{ background: '#0d111a', borderBottom: '1px solid var(--border-dark)', padding: '8px 0', fontSize: '11px', color: 'var(--text-silver)' }}>
        <div className="luxury-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <span><strong style={{ color: 'var(--gold)' }}>● AERO BAY SYNCED:</strong> BAY ALPHA-02</span>
            <span><strong style={{ color: '#10b981' }}>CLIENT SATISFACTION:</strong> {averageRating} ★ RATED</span>
            <span><strong>CLEANROOM TEMP:</strong> 21.4°C [NOMINAL]</span>
          </div>
          <div style={{ color: 'var(--gold)', fontWeight: '700', letterSpacing: '1px', fontSize: '10px' }}>AUTONOMOUS TELEMETRY HUB // SRI LANKA</div>
        </div>
      </div>

      <main className="luxury-container" style={{ paddingBottom: '60px' }}>
        {activeTab === 'customer' ? (
          <>
            {/* HERO SECTION */}
            <div className="hero-grid">
              <div className="lux-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)' }}>● SELECT YOUR CAR</span>
                    <span style={{ fontSize: '10px', background: 'var(--gold-dim)', color: 'var(--gold)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>BESPOKE BAY</span>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-silver)', textTransform: 'uppercase' }}>Manufacturer / Atelier</label>
                    <select className="lux-select" value={selectedAtelierBrand} onChange={e => setSelectedAtelierBrand(e.target.value)}>
                      <option>Toyota Gazoo / Hybrid Works</option>
                      <option>Honda VTEC & e:HEV Division</option>
                      <option>Nissan e-POWER & Nismo Hub</option>
                      <option>BMW M & i-Performance Atelier</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-silver)', textTransform: 'uppercase' }}>Vehicle Platform</label>
                    <select className="lux-select" value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)}>
                      <option>Executive Sedan / Hybrid</option>
                      <option>Hyper-EV / Grand Tourer</option>
                      <option>4x4 SUV / Cross Calibration</option>
                    </select>
                  </div>
                  <div style={{ background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-silver)' }}>TELEMETRY VIN</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>AC-9982-EGT-884</div>
                    </div>
                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontWeight: '700' }}>SYNC READY</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-silver)' }}>0-100 KM/H</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--gold)', marginTop: '2px' }}>2.8s</div>
                    </div>
                    <div style={{ background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-silver)' }}>SYSTEM</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>800V</div>
                    </div>
                    <div style={{ background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-silver)' }}>CLIENT RATING</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>{averageRating}★</div>
                    </div>
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => setActiveTab('history')} style={{ width: '100%', padding: '11px', background: '#161b28', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <History size={14} /> OPEN MY GARAGE & REVIEWS
                  </button>
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-dark)', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-silver)' }}>ATELIER MASTER CREW</span>
                    <span style={{ color: '#10b981', fontWeight: '700' }}>● ACTIVE</span>
                  </div>
                </div>
              </div>

              <div className="lux-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ maxWidth: '520px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '800', letterSpacing: '1.5px', marginBottom: '6px' }}>⚡ HYPER-VELOCITY CONCIERGE</div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', lineHeight: 1.1, margin: '0 0 12px 0' }}>
                      REV YOUR ENGINES WITH <span style={{ color: 'var(--gold)' }}>LIGHTNING SWIFT</span> SERVICE
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-silver)', lineHeight: 1.5, margin: 0 }}>
                      Precision engineering meets bespoke white-glove automotive care at <strong>AutoCare Service Hub</strong>. Powered by real-time telemetry diagnostics, instant online advance reservations, and verified 5-star customer satisfaction.
                    </p>
                  </div>
                  <div style={{ background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '10px', padding: '14px', minWidth: '210px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-silver)', fontWeight: '700', marginBottom: '8px' }}>CONCIERGE SEQUENCE</div>
                    <div style={{ fontSize: '11px', marginBottom: '6px' }}>1. <strong>Advance Slot Lock</strong> (LKR 1,500)</div>
                    <div style={{ fontSize: '11px', marginBottom: '6px' }}>2. <strong>Live Bay Telemetry</strong></div>
                    <div style={{ fontSize: '11px' }}>3. <strong>5-Star Rating & Review</strong></div>
                  </div>
                </div>

                <div style={{
                  marginTop: '18px', borderRadius: '12px', height: '220px', border: '1px solid var(--border-dark)',
                  backgroundImage: 'linear-gradient(to right, rgba(7,9,14,0.85), rgba(7,9,14,0.25)), url("https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80")',
                  backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', padding: '16px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'var(--gold)', color: '#07090e', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>EXTERIOR AERO</span>
                    <span style={{ background: 'rgba(17, 21, 31, 0.85)', color: '#fff', border: '1px solid var(--border-dark)', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>POWERTRAIN SYNC</span>
                    <span style={{ background: 'rgba(17, 21, 31, 0.85)', color: '#10b981', border: '1px solid var(--border-dark)', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>● HYPERCELL 800V READY</span>
                  </div>
                </div>

                <div className="feature-3-grid">
                  <div style={{ background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <Sparkles size={16} color="#f5b921" />
                      <span style={{ fontSize: '9px', color: 'var(--gold)', fontWeight: '700' }}>NANO CERAMIC</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '4px' }}>PAINT & DETAILING</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>Multi-spectrum color calibration & elastomeric coat.</div>
                  </div>
                  <div style={{ background: '#0b0e16', border: '1px solid var(--gold)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <Calendar size={16} color="#f5b921" />
                      <span style={{ fontSize: '9px', background: 'var(--gold-dim)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>INSTANT VIP BAY</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '4px' }}>SERVICE BAY BOOKING</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>Instant slot reservation with LKR 1,500 advance lock.</div>
                  </div>
                  <div onClick={() => setActiveTab('history')} style={{ background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '10px', padding: '14px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <Star size={16} color="#f5b921" fill="#f5b921" />
                      <span style={{ fontSize: '9px', color: '#10b981', fontWeight: '700' }}>{averageRating} ★ RATED</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '4px' }}>RATINGS & SERVICE LOG</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>Rate your service experience, edit bookings & download invoices.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOOKING & LIVE TRACKER SECTION */}
            <div style={{ marginTop: '36px' }} id="booking-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '800', letterSpacing: '1.5px' }}>—— ATELIER CALIBRATION SUITE</div>
                  <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '4px 0 0 0' }}>ESSENTIAL SERVICES & SLOT RESERVATION</h2>
                </div>
                <div style={{ background: '#11151f', border: '1px solid var(--border-dark)', padding: '8px 14px', borderRadius: '20px', fontSize: '11px', color: 'var(--gold)', fontWeight: '700' }}>
                  ● LIVE RESERVATION STATUS: SLOTS AVAILABLE TODAY
                </div>
              </div>

              <div className="main-booking-grid">
                {/* CREATE BOOKING FORM */}
                <div className="lux-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '16px', color: 'var(--gold)' }}>
                    <Calendar size={18} /> RESERVE YOUR SERVICE BAY
                  </h3>

                  {bookingSuccess && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', color: '#10b981', fontWeight: '800', fontSize: '14px' }}>
                        <CheckCircle2 size={18} /> Booking & Advance Payment Confirmed!
                      </div>
                      <p style={{ fontSize: '12px', marginTop: '6px', color: '#f8fafc', marginBottom: 0 }}>
                        Ref ID: <strong style={{ color: 'var(--gold)' }}>{bookingSuccess.bookingId}</strong> | Advance Paid: <strong>LKR {(bookingSuccess.advanceAmount || 1500).toLocaleString()}</strong> ({bookingSuccess.advanceMethod})
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-silver)', fontWeight: '700', marginBottom: '6px' }}>INSTANT FILTER SERVICES</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['Full Service', 'Oil & Filter Change', 'Brake Inspection', 'Wheel Alignment'].map(sType => {
                        const active = formData.serviceType === sType;
                        return (
                          <button key={sType} type="button" onClick={() => setFormData({ ...formData, serviceType: sType })} style={{ padding: '7px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', background: active ? 'var(--gold)' : '#0b0e16', color: active ? '#07090e' : 'var(--text-silver)', border: active ? '1px solid var(--gold)' : '1px solid var(--border-dark)' }}>
                            ⚡ {sType}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <form onSubmit={handleBookingSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-silver)' }}>Client Name</label>
                        <input className="lux-input" type="text" required placeholder="Ex: Uditha Sandaruwan" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-silver)' }}>Contact Phone</label>
                        <input className="lux-input" type="tel" required placeholder="07XXXXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-silver)' }}>Client Email (Optional)</label>
                      <input className="lux-input" type="email" placeholder="client@gmail.com" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-silver)' }}>Vehicle Plate No</label>
                        <input className="lux-input" type="text" required placeholder="Ex: CBA-4588" value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-silver)' }}>Vehicle Model</label>
                        <input className="lux-input" type="text" required placeholder="Ex: Toyota Premio / Axio" value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-silver)' }}>Calibration Package</label>
                        <select className="lux-select" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
                          <option value="Full Service">Full Service</option>
                          <option value="Oil & Filter Change">Oil & Filter Change</option>
                          <option value="Brake Inspection">Brake Inspection</option>
                          <option value="Wheel Alignment">Wheel Alignment</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-silver)' }}>Preferred Date</label>
                        <input className="lux-input" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value, timeSlot: ''})} />
                      </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-silver)' }}>Select Time Window</label>
                        {formData.date && <span style={{ fontSize: '10px', color: 'var(--gold)' }}>{bookedSlotsOnDate.length} slot(s) occupied on {formData.date}</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '6px' }}>
                        {availableSlots.map(slot => {
                          const isBooked = bookedSlotsOnDate.includes(slot);
                          const isSelected = formData.timeSlot === slot;
                          return (
                            <button key={slot} type="button" disabled={isBooked} onClick={() => setFormData({...formData, timeSlot: slot})} style={{ padding: '9px 6px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: isBooked ? '#090b10' : isSelected ? 'var(--gold-dim)' : '#0b0e16', color: isBooked ? '#475569' : isSelected ? 'var(--gold)' : '#e2e8f0', border: isBooked ? '1px dashed #1e293b' : isSelected ? '1.5px solid var(--gold)' : '1px solid var(--border-dark)', cursor: isBooked ? 'not-allowed' : 'pointer' }}>
                              {slot}
                              {isBooked && <span style={{ display: 'block', fontSize: '9px', color: '#ef4444' }}>BOOKED</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-silver)' }}>Telemetry / Special Notes</label>
                      <textarea className="lux-textarea" rows="2" placeholder="Specify custom diagnostics or requests..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>

                    <div style={{ marginTop: '16px', padding: '14px', background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> ADVANCE RESERVATION DEPOSIT</span>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#10b981' }}>LKR {ADVANCE_FEE.toLocaleString()}.00</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
                        {[
                          { id: 'Online Card', label: 'Card', icon: CreditCard },
                          { id: 'LankaQR', label: 'LankaQR', icon: QrCode },
                          { id: 'Bank Transfer', label: 'Bank', icon: Landmark },
                          { id: 'eZ Cash / Mobile', label: 'eZ Cash', icon: Smartphone }
                        ].map(item => {
                          const IconComp = item.icon;
                          const active = advMethod === item.id;
                          return (
                            <button key={item.id} type="button" onClick={() => setAdvMethod(item.id)} style={{ padding: '8px 6px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer', background: active ? 'var(--gold)' : '#11151f', color: active ? '#07090e' : 'var(--text-silver)', border: active ? '1px solid var(--gold)' : '1px solid var(--border-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <IconComp size={13} /> {item.label}
                            </button>
                          );
                        })}
                      </div>

                      {advMethod === 'Online Card' && (
                        <div>
                          <input className="lux-input" type="text" required placeholder="Card Number: 4532 •••• •••• ••••" value={advCard.number} onChange={handleAdvCardNumber} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                            <input className="lux-input" type="text" required placeholder="MM/YY" value={advCard.expiry} onChange={handleAdvExpiry} />
                            <input className="lux-input" type="password" required maxLength="4" placeholder="CVV" value={advCard.cvv} onChange={e => setAdvCard({ ...advCard, cvv: e.target.value.replace(/\D/g, '') })} />
                          </div>
                        </div>
                      )}

                      {advMethod === 'LankaQR' && (
                        <div style={{ textAlign: 'center', padding: '10px', background: '#11151f', borderRadius: '8px' }}>
                          <div style={{ width: '90px', height: '90px', margin: '0 auto 6px', background: '#fff', color: '#000', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px', border: '2px solid var(--gold)' }}>
                            <span>LANKA QR</span>
                            <span style={{ fontSize: '9px', color: '#2563eb' }}>LKR 1,500</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>Scan QR with any banking app to authorize slot.</div>
                        </div>
                      )}

                      {(advMethod === 'Bank Transfer' || advMethod === 'eZ Cash / Mobile') && (
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-silver)', marginBottom: '4px' }}>
                            {advMethod === 'Bank Transfer' ? 'BOC Kollupitiya Acc: 88459201 (AutoCare Hub)' : 'eZ Cash / mCash Wallet: 077-1234567'}
                          </div>
                          <input className="lux-input" type="text" required placeholder="Enter Transfer / Reference ID" value={advRefInput} onChange={e => setAdvRefInput(e.target.value)} />
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={isSubmittingBooking} className="btn-gold" style={{ width: '100%', marginTop: '16px' }}>
                      {isSubmittingBooking ? 'AUTHORIZING...' : `BOOK APPOINTMENT (ADVANCE LKR ${ADVANCE_FEE.toLocaleString()}) →`}
                    </button>
                  </form>
                </div>

                {/* LIVE TRACKER */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="lux-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px', color: 'var(--gold)' }}>
                        <Clock size={18} /> LIVE TELEMETRY TRACKER & BILLING
                      </h3>
                      <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '12px', fontWeight: '700' }}>REAL-TIME</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-silver)', marginTop: 0, marginBottom: '14px' }}>
                      Monitor active calibration progress, edit details, settle invoices, or rate your experience:
                    </p>

                    {loading ? <p style={{ color: 'var(--text-silver)' }}>Syncing telemetry...</p> : bookings.length === 0 ? (
                      <p style={{ color: 'var(--text-silver)' }}>No active vehicles in bay.</p>
                    ) : (
                      bookings.slice(0, 4).map((booking) => {
                        const balanceDue = getBalanceDue(booking);
                        return (
                          <div key={booking._id} style={{ background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div>
                                <strong style={{ fontSize: '14px', color: 'var(--gold)' }}>{booking.vehicleNumber}</strong>
                                <span style={{ fontSize: '12px', color: '#e2e8f0' }}> — {booking.vehicleModel}</span>
                                <div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>{booking.serviceType} | {booking.date} ({booking.timeSlot})</div>
                              </div>
                              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', background: booking.status === 'Ready' || booking.status === 'Completed' ? 'rgba(16,185,129,0.2)' : 'var(--gold-dim)', color: booking.status === 'Ready' || booking.status === 'Completed' ? '#10b981' : 'var(--gold)' }}>
                                {booking.status}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                              <div style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                ✓ Advance Paid: LKR {(booking.advanceAmount || 1500).toLocaleString()}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button type="button" onClick={() => handleOpenEditModal(booking)} style={{ padding: '4px 8px', background: '#161b28', color: '#e2e8f0', border: '1px solid var(--border-dark)', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Edit3 size={11} color="#f5b921" /> Edit
                                </button>
                                {booking.rating > 0 ? (
                                  <div onClick={() => handleOpenFeedbackModal(booking)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--gold-dim)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: 'var(--gold)', fontWeight: '800' }}>
                                    {renderStars(booking.rating, 12)} <span>({booking.rating}/5)</span>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => handleOpenFeedbackModal(booking)} style={{ padding: '4px 10px', background: '#161b28', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Star size={11} fill="#f5b921" /> Rate Service
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                              {['Pending', 'Confirmed', 'In-Progress', 'Ready'].map((step, idx) => {
                                const stepsOrder = ['Pending', 'Confirmed', 'In-Progress', 'Ready', 'Completed'];
                                const isDone = stepsOrder.indexOf(booking.status) >= stepsOrder.indexOf(step);
                                return (
                                  <div key={step} style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isDone ? 'var(--gold)' : '#161b28', color: isDone ? '#07090e' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '10px', fontWeight: '900' }}>
                                      {idx + 1}
                                    </div>
                                    <span style={{ fontSize: '10px', marginTop: '4px', display: 'block', color: isDone ? '#f8fafc' : '#64748b' }}>{step}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {booking.feedback && (
                              <div style={{ marginTop: '10px', padding: '8px 10px', background: '#11151f', borderRadius: '6px', borderLeft: '3px solid var(--gold)', fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>
                                "{booking.feedback}"
                              </div>
                            )}

                            {(booking.totalAmount > 0 || booking.status === 'Ready' || booking.status === 'Completed') && (
                              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>
                                    {booking.totalAmount > 0 ? `Balance Due: LKR ${balanceDue.toLocaleString()}` : 'Bill Pending'}
                                    {booking.paymentStatus === 'Paid' ? (
                                      <span style={{ marginLeft: '8px', padding: '2px 7px', background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '8px', fontSize: '10px' }}>PAID IN FULL</span>
                                    ) : booking.totalAmount > 0 ? (
                                      <span style={{ marginLeft: '8px', padding: '2px 7px', background: 'var(--gold-dim)', color: 'var(--gold)', borderRadius: '8px', fontSize: '10px' }}>BALANCE UNPAID</span>
                                    ) : null}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {booking.totalAmount > 0 && booking.paymentStatus !== 'Paid' && balanceDue > 0 && (
                                    <button onClick={() => handleOpenPaymentGateway(booking)} className="btn-gold" style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <CreditCard size={13} /> Pay Balance
                                    </button>
                                  )}
                                  <button onClick={() => setViewInvoiceBooking(booking)} style={{ padding: '6px 12px', background: '#161b28', color: '#f8fafc', border: '1px solid var(--border-dark)', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <FileText size={13} color="#f5b921" /> Invoice
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="lux-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={16} color="#f5b921" /> DOWNTOWN ATELIER HUB
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>FLAGSHIP CLEANROOM & TELEMETRY CENTER</div>
                      </div>
                      <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontWeight: '800' }}>OPEN 24/7</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                      <div style={{ background: '#0b0e16', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dark)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-silver)' }}>STANDBY CREW</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--gold)', marginTop: '2px' }}>⚡ 4 Masters</div>
                      </div>
                      <div style={{ background: '#0b0e16', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dark)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-silver)' }}>BAY QUEUE</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>● Zero Bay Wait</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TESTIMONIALS */}
            <div style={{ marginTop: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '800', letterSpacing: '1.5px' }}>—— VERIFIED CLIENT FEEDBACK</div>
                  <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '4px 0 0 0' }}>ATELIER RATINGS & TESTIMONIALS</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#11151f', border: '1px solid var(--gold)', padding: '8px 16px', borderRadius: '20px' }}>
                  {renderStars(5, 15)}
                  <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--gold)' }}>{averageRating} / 5.0</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {(reviewedBookings.length > 0 ? reviewedBookings.slice(0, 6) : [
                  { _id: 's1', customerName: 'Uditha Sandaruwan', vehicleNumber: 'CBA-4588', vehicleModel: 'Toyota Premio', serviceType: 'Full Service', rating: 5, feedback: 'Outstanding telemetry diagnostics and super fast service bay turnaround!' },
                  { _id: 's2', customerName: 'Kasun Perera', vehicleNumber: 'CAD-8821', vehicleModel: 'Honda Civic', serviceType: 'Brake Inspection', rating: 5, feedback: 'Transparent digital billing and instant LankaQR payment option.' },
                  { _id: 's3', customerName: 'Nimali Silva', vehicleNumber: 'KV-3390', vehicleModel: 'Toyota Axio', serviceType: 'Oil & Filter Change', rating: 5, feedback: 'Loved the live step-by-step tracker! Knew the exact moment my car was ready.' }
                ]).map((rev) => (
                  <div key={rev._id} className="lux-card" style={{ background: '#0b0e16', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        {renderStars(rev.rating, 15)}
                        <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '12px', fontWeight: '800' }}>✓ VERIFIED</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 14px 0' }}>"{rev.feedback}"</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <div>
                        <strong style={{ color: 'var(--gold)' }}>{rev.customerName}</strong>
                        <div style={{ color: 'var(--text-silver)' }}>{rev.vehicleNumber} ({rev.vehicleModel})</div>
                      </div>
                      <span style={{ color: '#64748b', fontSize: '10px' }}>{rev.serviceType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : activeTab === 'history' ? (
          /* MY GARAGE & HISTORY */
          <div style={{ marginTop: '24px' }}>
            <div className="lux-card" style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--gold-dim)', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                    <Award size={26} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 4px 0' }}>Customer Garage & Service History Portal</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-silver)', margin: 0 }}>View registered vehicles, edit reservations, rate services, or safely delete bookings.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 320px', justifyContent: 'flex-end' }}>
                  <input className="lux-input" type="text" placeholder="Filter by Plate No, Phone, or Name..." value={customerLookup} onChange={(e) => { setCustomerLookup(e.target.value); setShowAllInHistory(false); }} style={{ marginTop: 0, maxWidth: '280px' }} />
                  <button type="button" onClick={() => { setCustomerLookup(''); setShowAllInHistory(true); }} style={{ padding: '10px 14px', background: showAllInHistory ? 'var(--gold)' : '#0b0e16', color: showAllInHistory ? '#07090e' : 'var(--text-silver)', border: '1px solid var(--border-dark)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                    SHOW ALL
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="lux-card"><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>VEHICLES IN GARAGE</div><div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--gold)', marginTop: '4px' }}>{myGarageVehicles.length}</div></div>
              <div className="lux-card"><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>TOTAL SERVICE VISITS</div><div style={{ fontSize: '22px', fontWeight: '900', marginTop: '4px' }}>{customerHistoryBookings.length}</div></div>
              <div className="lux-card"><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>TOTAL PAID (LKR)</div><div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>LKR {customerTotalSpent.toLocaleString()}</div></div>
              <div className="lux-card"><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>PENDING BALANCE</div><div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--gold)', marginTop: '4px' }}>LKR {customerPendingBalance.toLocaleString()}</div></div>
            </div>

            <div className="lux-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}><Car size={18} /> MY GARAGE — NEXT SERVICE REMINDERS (+90 DAYS)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {myGarageVehicles.map((v, idx) => (
                  <div key={idx} style={{ background: '#0b0e16', border: '1px solid var(--border-dark)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px', color: 'var(--gold)' }}>{v.vehicleNumber}</strong>
                      <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800' }}>{v.visitCount} VISIT(S)</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-silver)', marginBottom: '12px' }}>
                      <div>Model: <strong style={{ color: '#fff' }}>{v.vehicleModel}</strong></div>
                      <div>Last Service: {v.lastServiceDate} ({v.lastServiceType})</div>
                      <div>Next Due (+90d): <strong style={{ color: 'var(--gold)' }}>{getNextServiceDate(v.lastServiceDate)}</strong></div>
                    </div>
                    <button type="button" onClick={() => handleBookAgain(v.vehicleNumber, v.vehicleModel)} style={{ width: '100%', padding: '8px', background: '#161b28', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <RefreshCw size={12} /> BOOK SERVICE AGAIN <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lux-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} /> SERVICE HISTORY, RATINGS & CRUD LOG</h3>
                <select className="lux-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ marginTop: 0, width: 'auto', padding: '6px 12px', fontSize: '12px' }}>
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="date">Sort: Service Date</option>
                  <option value="amount">Sort: Bill Amount</option>
                </select>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="lux-table">
                  <thead>
                    <tr>
                      <th>Ref ID & Date</th>
                      <th>Vehicle</th>
                      <th>Service Package</th>
                      <th>Status</th>
                      <th>Client Rating</th>
                      <th>Billing</th>
                      <th>Actions (Pay / Edit / Delete)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerHistoryBookings.map(b => {
                      const balDue = getBalanceDue(b);
                      return (
                        <tr key={b._id}>
                          <td><strong style={{ color: 'var(--gold)' }}>{b.bookingId}</strong><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>{b.date}</div></td>
                          <td><strong>{b.vehicleNumber}</strong><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>{b.vehicleModel}</div></td>
                          <td>{b.serviceType}</td>
                          <td><span style={{ color: 'var(--gold)', fontWeight: '800', fontSize: '11px' }}>{b.status}</span></td>
                          <td>
                            {b.rating > 0 ? (
                              <div onClick={() => handleOpenFeedbackModal(b)} style={{ cursor: 'pointer' }}>{renderStars(b.rating, 12)}</div>
                            ) : (
                              <button onClick={() => handleOpenFeedbackModal(b)} style={{ padding: '5px 8px', background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>★ Rate</button>
                            )}
                          </td>
                          <td>{b.totalAmount > 0 ? `LKR ${b.totalAmount.toLocaleString()}` : 'Pending'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {b.totalAmount > 0 && b.paymentStatus !== 'Paid' && balDue > 0 && (
                                <button onClick={() => handleOpenPaymentGateway(b)} className="btn-gold" style={{ padding: '5px 8px', fontSize: '10px' }}>Pay</button>
                              )}
                              <button onClick={() => setViewInvoiceBooking(b)} style={{ padding: '5px 8px', background: '#161b28', color: '#fff', border: '1px solid var(--border-dark)', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>PDF</button>
                              <button onClick={() => handleOpenEditModal(b)} style={{ padding: '5px 8px', background: '#161b28', color: '#60a5fa', border: '1px solid #1e3a8a', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>Edit</button>
                              <button onClick={() => setBookingToDelete(b)} style={{ padding: '5px 8px', background: 'rgba(127,29,29,0.4)', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ADMIN PORTAL */
          <div style={{ marginTop: '24px' }}>
            {!user || user.role !== 'admin' ? (
              <div className="lux-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <ShieldAlert size={48} color="#f5b921" style={{ margin: '0 auto 14px' }} />
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Admin Access Restricted</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-silver)', marginBottom: '20px' }}>Please sign in with an authorized Admin account to manage service bays and billing.</p>
                <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="btn-gold">Login as Admin</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '22px' }}>
                  <div className="lux-card"><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>COLLECTED REVENUE</div><div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>LKR {totalRevenue.toLocaleString()}</div><div style={{ fontSize: '11px', color: 'var(--gold)' }}>Due: LKR {pendingRevenue.toLocaleString()}</div></div>
                  <div className="lux-card"><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>TOTAL BOOKINGS</div><div style={{ fontSize: '22px', fontWeight: '900', marginTop: '4px' }}>{bookings.length}</div></div>
                  <div className="lux-card"><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>ACTIVE BAY QUEUE</div><div style={{ fontSize: '22px', fontWeight: '900', color: '#60a5fa', marginTop: '4px' }}>{pendingVehiclesCount}</div></div>
                  <div className="lux-card"><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>CLIENT RATING</div><div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--gold)', marginTop: '4px' }}>{averageRating} / 5.0 ★</div></div>
                </div>

                <div className="lux-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0, color: 'var(--gold)' }}>ADMIN TELEMETRY, CRUD & BILLING CONTROL</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-silver)' }}>Showing <strong style={{ color: 'var(--gold)' }}>{filteredBookings.length}</strong> of {bookings.length}</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', padding: '12px', background: '#0b0e16', borderRadius: '10px', border: '1px solid var(--border-dark)' }}>
                    <input className="lux-input" type="text" placeholder="Search by Plate No, Name, Phone, or Ref ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: '1 1 220px', marginTop: 0 }} />
                    <select className="lux-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex: '0 1 170px', marginTop: 0 }}>
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Ready">Ready</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <select className="lux-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex: '0 1 170px', marginTop: 0 }}>
                      <option value="newest">Sort: Newest First</option>
                      <option value="oldest">Sort: Oldest First</option>
                      <option value="date">Sort: Service Date</option>
                      <option value="amount">Sort: Bill Amount</option>
                    </select>
                    {(searchTerm || statusFilter !== 'All' || sortBy !== 'newest') && (
                      <button onClick={() => { setSearchTerm(''); setStatusFilter('All'); setSortBy('newest'); }} style={{ padding: '9px 12px', background: '#161b28', color: '#fff', border: '1px solid var(--border-dark)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Reset</button>
                    )}
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="lux-table">
                      <thead>
                        <tr>
                          <th>Ref ID</th>
                          <th>Customer</th>
                          <th>Vehicle</th>
                          <th>Service & Date</th>
                          <th>Status Action</th>
                          <th>Client Review</th>
                          <th>Payment</th>
                          <th>Billing, Edit & Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map(b => (
                          <tr key={b._id}>
                            <td style={{ fontWeight: '700', color: 'var(--gold)' }}>{b.bookingId}</td>
                            <td><div>{b.customerName}</div><small style={{ color: 'var(--text-silver)' }}>{b.phone}</small></td>
                            <td><strong>{b.vehicleNumber}</strong><div style={{ fontSize: '11px', color: 'var(--text-silver)' }}>{b.vehicleModel}</div></td>
                            <td><div>{b.serviceType}</div><small style={{ color: 'var(--text-silver)' }}>{b.date} ({b.timeSlot})</small></td>
                            <td>
                              <select className="lux-select" value={b.status} onChange={e => handleStatusChange(b._id, e.target.value)} style={{ padding: '6px 10px', fontSize: '12px', width: 'auto', marginTop: 0 }}>
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="In-Progress">In-Progress</option>
                                <option value="Ready">Ready</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td>
                              {b.rating > 0 ? (
                                <div>{renderStars(b.rating, 12)}{b.feedback && <div style={{ fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>"{b.feedback}"</div>}</div>
                              ) : <span style={{ fontSize: '11px', color: '#64748b' }}>No review</span>}
                            </td>
                            <td>
                              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>Adv: LKR {(b.advanceAmount || 1500).toLocaleString()}</div>
                              <span style={{ fontSize: '10px', color: b.paymentStatus === 'Paid' ? '#10b981' : 'var(--gold)', fontWeight: '800' }}>{b.paymentStatus === 'Paid' ? 'FULL PAID' : 'BAL UNPAID'}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button onClick={() => handleOpenBilling(b)} style={{ padding: '6px 9px', background: '#161b28', color: '#fff', border: '1px solid var(--border-dark)', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                                  {b.totalAmount > 0 ? `LKR ${b.totalAmount.toLocaleString()}` : 'Set Bill'}
                                </button>
                                {b.totalAmount > 0 && (
                                  <button onClick={() => setViewInvoiceBooking(b)} className="btn-gold" style={{ padding: '6px 9px', fontSize: '11px' }}>Print</button>
                                )}
                                <button onClick={() => handleOpenEditModal(b)} style={{ padding: '6px 9px', background: '#161b28', color: '#60a5fa', border: '1px solid #1e3a8a', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                                <button onClick={() => setBookingToDelete(b)} style={{ padding: '6px 9px', background: 'rgba(127,29,29,0.4)', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* EDIT MODAL */}
      {editingBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1450 }}>
          <div className="lux-card" style={{ width: '460px', border: '1px solid var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--gold)', margin: 0 }}>EDIT BOOKING ({editingBooking.bookingId})</h3>
              <button onClick={() => setEditingBooking(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEditBooking}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={{ fontSize: '11px' }}>Client Name</label><input className="lux-input" type="text" required value={editFormData.customerName} onChange={e => setEditFormData({...editFormData, customerName: e.target.value})} /></div>
                <div><label style={{ fontSize: '11px' }}>Phone</label><input className="lux-input" type="tel" required value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={{ fontSize: '11px' }}>Plate No</label><input className="lux-input" type="text" required value={editFormData.vehicleNumber} onChange={e => setEditFormData({...editFormData, vehicleNumber: e.target.value.toUpperCase()})} /></div>
                <div><label style={{ fontSize: '11px' }}>Vehicle Model</label><input className="lux-input" type="text" required value={editFormData.vehicleModel} onChange={e => setEditFormData({...editFormData, vehicleModel: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px' }}>Service Type</label>
                  <select className="lux-select" value={editFormData.serviceType} onChange={e => setEditFormData({...editFormData, serviceType: e.target.value})}>
                    <option value="Full Service">Full Service</option>
                    <option value="Oil & Filter Change">Oil & Filter Change</option>
                    <option value="Brake Inspection">Brake Inspection</option>
                    <option value="Wheel Alignment">Wheel Alignment</option>
                  </select>
                </div>
                <div><label style={{ fontSize: '11px' }}>Date</label><input className="lux-input" type="date" required value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} /></div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px' }}>Time Slot</label>
                <select className="lux-select" value={editFormData.timeSlot} onChange={e => setEditFormData({...editFormData, timeSlot: e.target.value})}>
                  {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setEditingBooking(null)} style={{ flex: 1, padding: '10px', background: '#161b28', color: '#fff', border: '1px solid var(--border-dark)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSavingEdit} className="btn-gold" style={{ flex: 1 }}>{isSavingEdit ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFE DELETE MODAL */}
      {bookingToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }}>
          <div className="lux-card" style={{ width: '400px', border: '1px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#f87171' }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>CONFIRM SAFE DELETION</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-silver)', marginBottom: '14px' }}>
              Are you sure you want to permanently delete booking <strong style={{ color: 'var(--gold)' }}>{bookingToDelete.bookingId}</strong> ({bookingToDelete.vehicleNumber})?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setBookingToDelete(null)} style={{ flex: 1, padding: '10px', background: '#161b28', color: '#fff', border: '1px solid var(--border-dark)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="button" disabled={isDeleting} onClick={handleConfirmDelete} style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800' }}>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {feedbackBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400 }}>
          <div className="lux-card" style={{ width: '420px', border: '1px solid var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--gold)', margin: 0 }}>RATE SERVICE ({feedbackBooking.vehicleNumber})</h3>
              <button onClick={() => setFeedbackBooking(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitFeedback}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '14px 0' }}>
                {[1, 2, 3, 4, 5].map(star => {
                  const active = (hoverRating || ratingInput) >= star;
                  return (
                    <button key={star} type="button" onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRatingInput(star)} style={{ background: active ? 'var(--gold-dim)' : '#0b0e16', border: active ? '1.5px solid var(--gold)' : '1px solid var(--border-dark)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                      <Star size={24} color={active ? '#f5b921' : '#475569'} fill={active ? '#f5b921' : 'transparent'} />
                    </button>
                  );
                })}
              </div>
              <textarea className="lux-textarea" rows="3" required placeholder="Share your feedback..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setFeedbackBooking(null)} style={{ flex: 1, padding: '10px', background: '#161b28', color: '#fff', border: '1px solid var(--border-dark)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmittingFeedback} className="btn-gold" style={{ flex: 1 }}>Submit Review ★</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILLING MODAL */}
      {selectedBookingForBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="lux-card" style={{ width: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--gold)', margin: 0 }}>Billing ({selectedBookingForBill.bookingId})</h3>
              <button onClick={() => setSelectedBookingForBill(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveBilling}>
              <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '12px' }}>Labor Cost (LKR)</label><input className="lux-input" type="number" required value={billingInput.laborCost} onChange={e => setBillingInput({...billingInput, laborCost: e.target.value})} /></div>
              <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '12px' }}>Parts Cost (LKR)</label><input className="lux-input" type="number" value={billingInput.partsCost} onChange={e => setBillingInput({...billingInput, partsCost: e.target.value})} /></div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px' }}>Payment Status</label>
                <select className="lux-select" value={billingInput.paymentStatus} onChange={e => setBillingInput({...billingInput, paymentStatus: e.target.value})}>
                  <option value="Unpaid">Balance Unpaid</option>
                  <option value="Paid">Paid in Full</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setSelectedBookingForBill(null)} style={{ flex: 1, padding: '10px', background: '#161b28', color: '#fff', border: '1px solid var(--border-dark)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ flex: 1 }}>Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONLINE PAYMENT MODAL */}
      {paymentBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <div className="lux-card" style={{ width: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--gold)', margin: 0 }}>Pay Balance (LKR {getBalanceDue(paymentBooking).toLocaleString()})</h3>
              <button onClick={() => setPaymentBooking(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleProcessOnlinePayment}>
              <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px' }}>Cardholder Name</label><input className="lux-input" type="text" required value={cardForm.holderName} onChange={e => setCardForm({ ...cardForm, holderName: e.target.value })} /></div>
              <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px' }}>Card Number</label><input className="lux-input" type="text" required placeholder="4532 •••• •••• ••••" value={cardForm.cardNumber} onChange={handleCardNumberChange} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <input className="lux-input" type="text" required placeholder="MM/YY" value={cardForm.expiry} onChange={handleExpiryChange} />
                <input className="lux-input" type="password" required maxLength="4" placeholder="CVV" value={cardForm.cvv} onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })} />
              </div>
              <button type="submit" disabled={isProcessingPayment} className="btn-gold" style={{ width: '100%' }}>{isProcessingPayment ? 'PROCESSING...' : 'PAY NOW'}</button>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {viewInvoiceBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="lux-card" style={{ width: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div><h2 style={{ fontSize: '18px', color: 'var(--gold)', margin: 0 }}>AUTOCARE SERVICE HUB</h2><small style={{ color: 'var(--text-silver)' }}>Invoice #{viewInvoiceBooking.bookingId} — {viewInvoiceBooking.vehicleNumber}</small></div>
              <button onClick={() => setViewInvoiceBooking(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <table className="lux-table" style={{ marginBottom: '16px' }}>
              <tbody>
                <tr><td>Labor ({viewInvoiceBooking.serviceType})</td><td style={{ textAlign: 'right' }}>LKR {(viewInvoiceBooking.laborCost || 0).toLocaleString()}.00</td></tr>
                <tr><td>OEM Parts</td><td style={{ textAlign: 'right' }}>LKR {(viewInvoiceBooking.partsCost || 0).toLocaleString()}.00</td></tr>
                <tr><td style={{ color: '#10b981' }}>Less Advance Paid</td><td style={{ textAlign: 'right', color: '#10b981' }}>- LKR {(viewInvoiceBooking.advanceAmount || 1500).toLocaleString()}.00</td></tr>
                <tr style={{ fontWeight: '900' }}><td style={{ color: 'var(--gold)' }}>Balance Payable</td><td style={{ textAlign: 'right', color: 'var(--gold)' }}>LKR {getBalanceDue(viewInvoiceBooking).toLocaleString()}.00</td></tr>
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setViewInvoiceBooking(null)} style={{ flex: 1, padding: '10px', background: '#161b28', color: '#fff', border: '1px solid var(--border-dark)', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
              <button onClick={() => window.print()} className="btn-gold" style={{ flex: 1 }}>Print / Save PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div className="lux-card" style={{ width: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--gold)', margin: 0 }}>{authMode === 'login' ? 'Sign In' : 'Register'}</h3>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <>
                  <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px' }}>Full Name</label><input className="lux-input" type="text" required value={authFormData.name} onChange={e => setAuthFormData({...authFormData, name: e.target.value})} /></div>
                  <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px' }}>Phone</label><input className="lux-input" type="tel" value={authFormData.phone} onChange={e => setAuthFormData({...authFormData, phone: e.target.value})} /></div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11px' }}>Role</label>
                    <select className="lux-select" value={authFormData.role} onChange={e => setAuthFormData({...authFormData, role: e.target.value})}>
                      <option value="customer">Customer</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                </>
              )}
              <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px' }}>Email</label><input className="lux-input" type="email" required value={authFormData.email} onChange={e => setAuthFormData({...authFormData, email: e.target.value})} /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '11px' }}>Password</label><input className="lux-input" type="password" required value={authFormData.password} onChange={e => setAuthFormData({...authFormData, password: e.target.value})} /></div>
              <button type="submit" className="btn-gold" style={{ width: '100%', marginBottom: '10px' }}>{authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-silver)' }}>
                {authMode === 'login' ? (
                  <span>New user? <a href="#reg" onClick={e => { e.preventDefault(); setAuthMode('register'); }} style={{ color: 'var(--gold)', fontWeight: 'bold' }}>Register</a></span>
                ) : (
                  <span>Have an account? <a href="#log" onClick={e => { e.preventDefault(); setAuthMode('login'); }} style={{ color: 'var(--gold)', fontWeight: 'bold' }}>Sign In</a></span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}