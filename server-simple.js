import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let alerts = [];
const alertsFile = path.join(__dirname, 'alerts.json');

try {
  if (fs.existsSync(alertsFile)) {
    const data = fs.readFileSync(alertsFile, 'utf8');
    alerts = JSON.parse(data);
    console.log(`Loaded ${alerts.length} existing alerts`);
  }
} catch {
  console.log('Starting with empty alerts');
}

function saveAlerts() {
  try {
    fs.writeFileSync(alertsFile, JSON.stringify(alerts, null, 2));
  } catch (error) {
    console.error('Error saving:', error.message);
  }
}

app.post('/api/alerts', (req, res) => {
  try {
    const alert = { id: Date.now().toString(), timestamp: new Date().toISOString(), ...req.body };
    const required = ['ticker', 'bias', 'confidence', 'risk', 'message'];
    const missing = required.filter(f => !alert[f]);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
    }

    alerts.unshift(alert);
    if (alerts.length > 100) alerts = alerts.slice(0, 100);
    saveAlerts();
    
    console.log(`📈 Alert: ${alert.ticker} ${alert.bias} (${alert.confidence}%)`);
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alerts/latest', (req, res) => {
  res.json({ alert: alerts.length > 0 ? alerts[0] : null });
});

app.get('/api/alerts', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ alerts: alerts.slice(0, limit), total: alerts.length });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), alertsCount: alerts.length });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Alert server running on port ${PORT}`);
  console.log(`📡 POST http://localhost:${PORT}/api/alerts`);
  console.log(`📊 GET http://localhost:${PORT}/api/alerts/latest`);
  console.log(`💊 GET http://localhost:${PORT}/api/health`);
});