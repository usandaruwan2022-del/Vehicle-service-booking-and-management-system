const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Booking = require('./models/Booking');
const User = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vehicle_service_db';
const JWT_SECRET = process.env.JWT_SECRET || 'autocare_secret_key_2026';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error: ', err.message));

// ================= AUTHENTICATION APIs ================= //

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer',
      phone: phone || ''
    });

    const savedUser = await newUser.save();
    const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role, phone: savedUser.phone }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist with this email!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials/password!' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= FULL CRUD BOOKING, BILLING & FEEDBACK APIs ================= //

// 1. READ: Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. CREATE: Add a new booking with conflict validation
app.post('/api/bookings', async (req, res) => {
  try {
    const { 
      customerName, customerEmail, phone, vehicleNumber, vehicleModel, 
      serviceType, date, timeSlot, notes,
      advanceAmount, advanceMethod, advanceRef, advanceStatus
    } = req.body;

    const existingBooking = await Booking.findOne({ date, timeSlot });
    if (existingBooking) {
      return res.status(400).json({ 
        message: `The slot (${timeSlot}) on ${date} is already booked for vehicle ${existingBooking.vehicleNumber}. Please choose another slot!` 
      });
    }

    const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedAdvRef = advanceRef || `ADV-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking = new Booking({
      bookingId,
      customerName,
      customerEmail: customerEmail || '',
      phone,
      vehicleNumber,
      vehicleModel,
      serviceType,
      date,
      timeSlot,
      notes,
      status: 'Pending',
      advanceAmount: advanceAmount || 1500,
      advanceMethod: advanceMethod || 'Online Card',
      advanceRef: generatedAdvRef,
      advanceStatus: advanceStatus || 'Paid'
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3. UPDATE (Full Record Edit): Edit customer, vehicle, service, date, or timeSlot details
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { customerName, phone, vehicleNumber, vehicleModel, serviceType, date, timeSlot, notes } = req.body;

    // Check slot conflict if date or timeSlot changed
    if (date && timeSlot) {
      const conflict = await Booking.findOne({
        date,
        timeSlot,
        _id: { $ne: req.params.id }
      });
      if (conflict) {
        return res.status(400).json({
          message: `Slot (${timeSlot}) on ${date} is already occupied by ${conflict.vehicleNumber}!`
        });
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        customerName,
        phone,
        vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase() : undefined,
        vehicleModel,
        serviceType,
        date,
        timeSlot,
        notes
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking record not found!' });
    }

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 4. UPDATE (Status): Update vehicle calibration status
app.patch('/api/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 5. UPDATE (Invoice/Billing): Admin set labor & parts cost
app.patch('/api/bookings/:id/invoice', async (req, res) => {
  try {
    const { laborCost, partsCost, paymentStatus } = req.body;
    const labor = parseFloat(laborCost) || 0;
    const parts = parseFloat(partsCost) || 0;
    const totalAmount = labor + parts;

    const updateFields = { 
      laborCost: labor, 
      partsCost: parts, 
      totalAmount,
      paymentStatus: paymentStatus || 'Unpaid'
    };

    if (paymentStatus === 'Paid') {
      updateFields.paymentMethod = 'Cash / Counter';
      updateFields.transactionId = `CSH-${Math.floor(100000 + Math.random() * 900000)}`;
      updateFields.paidAt = new Date();
      updateFields.advanceStatus = 'Paid';
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 6. UPDATE (Online Payment): Settle final balance online
app.patch('/api/bookings/:id/pay', async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const transactionId = `TXN-${Date.now().toString().slice(-5)}${Math.floor(100 + Math.random() * 900)}`;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: 'Paid',
        advanceStatus: 'Paid',
        paymentMethod: paymentMethod || 'Online Card',
        transactionId,
        paidAt: new Date()
      },
      { new: true }
    );
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 7. UPDATE (Rating & Feedback): Submit 5-star customer review
app.patch('/api/bookings/:id/feedback', async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Please select a valid star rating between 1 and 5.' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        rating: numericRating,
        feedback: feedback ? feedback.trim() : '',
        reviewedAt: new Date()
      },
      { new: true }
    );

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 8. DELETE: Safely remove a booking record from MongoDB
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res.status(404).json({ message: 'Booking record not found!' });
    }
    res.json({
      message: `Booking ${deletedBooking.bookingId} (${deletedBooking.vehicleNumber}) deleted successfully!`,
      id: req.params.id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});