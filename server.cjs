const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Webhook security token
const WEBHOOK_SECRET = 'trading-coach-secret-2026';

// CORS configuration for production
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

app.use(cors(corsOptions));
app.use(express.json());

let alerts = [];

// Load existing alerts
try {
  const data = fs.readFileSync(path.join(__dirname, 'alerts.json'), 'utf8');
  alerts = JSON.parse(data);
  console.log(`✅ Loaded ${alerts.length} existing alerts`);
} catch {
  console.log('✅ Starting with empty alerts');
}

// Save alerts
function saveAlerts() {
  try {
    fs.writeFileSync(path.join(__dirname, 'alerts.json'), JSON.stringify(alerts, null, 2));
  } catch (e) {
    console.error('❌ Save error:', e.message);
  }
}

// POST /api/alerts - receive alert
app.post('/api/alerts', (req, res) => {
  // Check authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization header'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (token !== WEBHOOK_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid token'
    });
  }

  const { ticker, bias, confidence, risk, message, timestamp } = req.body;

  // Simple validation - only require essential fields
  if (!ticker || !bias || !message) {
    return res.status(400).json({
      error: 'Missing required fields: ticker, bias, and message are required'
    });
  }

  // Use provided timestamp or generate one
  const alertTimestamp = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

  // Normalize bias values for consistency
  let normalizedBias = bias;
  if (bias) {
    const biasLower = bias.toLowerCase();
    if (biasLower === 'buy' || biasLower === 'long') {
      normalizedBias = 'Long';
    } else if (biasLower === 'sell' || biasLower === 'short') {
      normalizedBias = 'Short';
    }
  }

  const alert = {
    id: Date.now().toString(),
    timestamp: alertTimestamp,
    ticker: ticker.toUpperCase(), // Normalize ticker to uppercase
    bias: normalizedBias,
    confidence: confidence || 50, // Default confidence if not provided
    risk: risk || 'Medium', // Default risk if not provided
    message
  };

  alerts.unshift(alert);
  if (alerts.length > 100) alerts.pop();
  saveAlerts();

  console.log(`📈 Alert: ${alert.ticker} ${alert.bias} ${alert.confidence}%`);
  res.json({ success: true, alert });
});

// GET /api/alerts/latest - get most recent alert
app.get('/api/alerts/latest', (req, res) => {
  res.json({ alert: alerts[0] || null });
});

// GET /api/alerts - get all alerts
app.get('/api/alerts', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ alerts: alerts.slice(0, limit), total: alerts.length });
});

// GET /api/health - health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, alertsCount: alerts.length });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('✅ Ready to receive TradingView alerts');
  console.log(`📍 Webhook URL: http://localhost:${PORT}/api/alerts`);
});