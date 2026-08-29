const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIRECTORY = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIRECTORY, 'park-pulse.json');
const HOURLY_RATES = { Car: 50, Bike: 25, Scooter: 30, EV: 60 };

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function defaultData() {
  return {
    users: [],
    bookings: [],
    slots: Array.from({ length: 16 }, (_, index) => ({
      id: `P-${String(index + 1).padStart(2, '0')}`,
      status: 'available'
    }))
  };
}

function readData() {
  if (!fs.existsSync(DATA_FILE)) return defaultData();
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      users: Array.isArray(data.users) ? data.users : [],
      bookings: Array.isArray(data.bookings) ? data.bookings : [],
      slots: Array.isArray(data.slots) && data.slots.length ? data.slots : defaultData().slots
    };
  } catch {
    return defaultData();
  }
}

function writeData(data) {
  fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function activeBookingForUser(data, customerId) {
  return data.bookings.find((booking) => booking.customerId === customerId && booking.status === 'active');
}

app.post('/api/register', (req, res) => {
  const { name, email, phone, vehicleType, vehicleNumber } = req.body;
  if (![name, email, phone, vehicleType, vehicleNumber].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Please complete every registration field.' });
  }
  if (!Object.hasOwn(HOURLY_RATES, vehicleType)) {
    return res.status(400).json({ error: 'Choose a valid vehicle type.' });
  }

  const data = readData();
  const normalizedEmail = email.trim().toLowerCase();
  let user = data.users.find((item) => item.email === normalizedEmail);
  if (user) {
    user = Object.assign(user, { name: name.trim(), phone: phone.trim(), vehicleType, vehicleNumber: vehicleNumber.trim() });
  } else {
    user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      vehicleType,
      vehicleNumber: vehicleNumber.trim(),
      createdAt: new Date().toISOString()
    };
    data.users.push(user);
  }
  writeData(data);
  return res.status(201).json({ customer: user, message: `Welcome, ${user.name}. Your parking profile is ready.` });
});

app.get('/api/slots', (_req, res) => {
  const data = readData();
  res.json({ slots: data.slots, hourlyRates: HOURLY_RATES });
});

app.post('/api/book', (req, res) => {
  const { customerId, slotId, hours } = req.body;
  const duration = Number(hours);
  if (!customerId || !slotId || !Number.isInteger(duration) || duration < 1 || duration > 24) {
    return res.status(400).json({ error: 'Select a slot and a booking duration between 1 and 24 hours.' });
  }

  const data = readData();
  const customer = data.users.find((user) => user.id === customerId);
  const slot = data.slots.find((item) => item.id === slotId);
  if (!customer) return res.status(404).json({ error: 'Parking profile not found. Please register first.' });
  if (!slot) return res.status(404).json({ error: 'Parking slot not found.' });
  if (slot.status !== 'available') return res.status(409).json({ error: 'That slot was just booked. Please choose another.' });
  if (activeBookingForUser(data, customerId)) return res.status(409).json({ error: 'You already have an active booking.' });

  const rate = HOURLY_RATES[customer.vehicleType];
  const booking = {
    id: crypto.randomUUID(),
    customerId,
    slotId,
    vehicleType: customer.vehicleType,
    vehicleNumber: customer.vehicleNumber,
    hours: duration,
    rate,
    total: rate * duration,
    status: 'active',
    bookedAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
  };
  slot.status = 'occupied';
  data.bookings.push(booking);
  writeData(data);
  return res.status(201).json({ booking, message: `${slotId} is reserved for ${duration} hour${duration === 1 ? '' : 's'}.` });
});

app.get('/api/bookings/:customerId', (req, res) => {
  const data = readData();
  const bookings = data.bookings.filter((booking) => booking.customerId === req.params.customerId && booking.status === 'active');
  res.json({ bookings });
});

app.delete('/api/book/:bookingId', (req, res) => {
  const data = readData();
  const booking = data.bookings.find((item) => item.id === req.params.bookingId);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.status !== 'active') return res.status(409).json({ error: 'This booking is already closed.' });

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  const slot = data.slots.find((item) => item.id === booking.slotId);
  if (slot) slot.status = 'available';
  writeData(data);
  return res.json({ booking, message: `${booking.slotId} is now available again.` });
});

app.get('/api/history/:customerId', (req, res) => {
  const data = readData();
  const history = data.bookings
    .filter((booking) => booking.customerId === req.params.customerId)
    .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
  res.json({ history });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Park Pulse is running at http://localhost:${PORT}`));
