import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for alerts (in production, use a database)
let alerts = [];

// Load alerts from file on startup
const alertsFile = path.join(__dirname, 'alerts.json');
try {
  if (fs.existsSync(alertsFile)) {
    const data = fs.readFileSync(alertsFile, 'utf8');
    alerts = JSON.parse(data);
  }
} catch {
  console.log('No existing alerts file, starting fresh');
}

// Save alerts to file
function saveAlerts() {
  try {
    fs.writeFileSync(alertsFile, JSON.stringify(alerts, null, 2));
  } catch (error) {
    console.error('Error saving alerts:', error);
  }
}

// Alert intake endpoint (compatible with TradingView webhooks)
app.post('/api/alerts', (req, res) => {
  try {
    const alert = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...req.body
    };

    // Validate required fields
    const requiredFields = ['ticker', 'bias', 'confidence', 'risk', 'message'];
    const missingFields = requiredFields.filter(field => !alert[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Add to alerts array (keep only last 100 alerts)
    alerts.unshift(alert);
    if (alerts.length > 100) {
      alerts = alerts.slice(0, 100);
    }

    // Save to file
    saveAlerts();

    console.log(`📈 New alert received: ${alert.ticker} ${alert.bias} (${alert.confidence}%)`);

    res.json({
      success: true,
      alert: alert,
      message: 'Alert received and stored'
    });

  } catch (error) {
    console.error('Error processing alert:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get latest alerts endpoint
app.get('/api/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recentAlerts = alerts.slice(0, limit);

    res.json({
      alerts: recentAlerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get latest alert endpoint
app.get('/api/alerts/latest', (req, res) => {
  try {
    const latestAlert = alerts.length > 0 ? alerts[0] : null;

    res.json({
      alert: latestAlert
    });
  } catch (error) {
    console.error('Error fetching latest alert:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    alertsCount: alerts.length
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Alert server running on port ${PORT}`);
  console.log(`📡 Alert intake endpoint: POST http://localhost:${PORT}/api/alerts`);
  console.log(`📊 Latest alert endpoint: GET http://localhost:${PORT}/api/alerts/latest`);
  console.log(`💊 Health check: GET http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n✅ Server shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});