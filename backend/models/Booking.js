const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  phone: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  serviceType: { type: String, required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'In-Progress', 'Ready', 'Completed'], 
    default: 'Pending' 
  },
  notes: { type: String },

  // Advance Payment Details
  advanceAmount: { type: Number, default: 1500 },
  advanceStatus: { 
    type: String, 
    enum: ['Pending', 'Paid'], 
    default: 'Paid' 
  },
  advanceMethod: { type: String, default: 'Online Card' },
  advanceRef: { type: String, default: '' },

  // Final Billing & Online Payment Details
  laborCost: { type: Number, default: 0 },
  partsCost: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['Unpaid', 'Paid'], 
    default: 'Unpaid' 
  },
  paymentMethod: { type: String, default: 'Pending' },
  transactionId: { type: String, default: '' },
  paidAt: { type: Date },

  // Customer Ratings & Feedback Details
  rating: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  reviewedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);