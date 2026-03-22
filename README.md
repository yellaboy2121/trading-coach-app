# Trading Coach App

A mobile-first React application for real-time trading analysis and journaling, designed to receive live alerts from external sources like TradingView.

## Features

### 📊 **Real-Time Alert System**
- Receive live trading alerts via REST API
- Compatible with TradingView webhooks
- Automatic polling for new alerts (30-second intervals)
- Visual alert display with confidence indicators

### 📈 **Candlestick Analyzer**
- Real-time pattern analysis with educational output
- Confidence scoring and risk assessment
- Visual signal badges (STRONG BUY/SHORT, WEAK BUY/SHORT, NO TRADE)
- Confidence progress bars with color coding

### 📝 **Trading Journal**
- Complete trade logging with draft functionality
- Local storage persistence
- Performance statistics and win rate tracking
- Confirmation messages for successful entries

### 📱 **Mobile-First Design**
- Responsive layout optimized for mobile devices
- Bottom navigation for easy tab switching
- Touch-friendly interface elements

## Quick Start

### Development Mode (Frontend Only)
```bash
npm install
npm run dev
```

### Backend Server Only
```bash
node server.cjs
```

The server will run on port 3001 (or use `PORT=5000 node server.cjs` for a different port).

### Full Development Mode (Frontend + Backend)
```bash
npm install
npm run dev:full
```

This starts both the React app (port 5173) and the alert server (port 3001).

## API Endpoints

### Alert Intake
**POST** `/api/alerts`

Accepts JSON payload with the following fields:
```json
{
  "ticker": "AAPL",
  "bias": "Long",
  "confidence": 85,
  "risk": "Low",
  "message": "Strong bullish engulfing pattern on support",
  "timestamp": "2024-01-15T10:30:00Z"  // Optional, ISO format
}
```

**Required fields:** `ticker`, `bias`, `message`  
**Optional fields:** `confidence`, `risk`, `timestamp`

**Response:**
```json
{
  "success": true,
  "alert": { ... }
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields: ticker, bias, and message are required"
}
```

### Get Latest Alert
**GET** `/api/alerts/latest`

Returns the most recent alert.

### Get Recent Alerts
**GET** `/api/alerts?limit=10`

Returns the most recent alerts (default limit: 10).

### Health Check
**GET** `/api/health`

Returns server status and alert count.

## TradingView Webhook Integration

### Setup Instructions

1. **Create a webhook in TradingView:**
   - Go to TradingView chart
   - Create an alert with your conditions
   - Set webhook URL to: `http://your-server:3001/api/alerts`
   - Add this header: `Authorization: Bearer trading-coach-secret-2026`

2. **Webhook Message Format:**
   Use this TradingView-compatible JSON payload in your alert message:
   ```json
   {
     "ticker": "{{ticker}}",
     "bias": "{{strategy.order.action}}",
     "confidence": 85,
     "risk": "Low",
     "message": "{{strategy.order.comment}}"
   }
   ```

3. **Alert Variables:**
   - `{{ticker}}` - The symbol (e.g., "AAPL")
   - `{{strategy.order.action}}` - "buy" or "sell" (maps to "Long" or "Short")
   - `{{strategy.order.comment}}` - Your alert message
   - Custom confidence and risk values

4. **Example TradingView Alert Message:**
   ```
   {"ticker":"{{ticker}}","bias":"{{strategy.order.action}}","confidence":85,"risk":"Low","message":"{{strategy.order.comment}}"}
   ```

### Validation Rules
- **Required:** ticker, bias, message
- **Optional:** confidence (defaults to 50), risk (defaults to "Medium"), timestamp
- Ticker is automatically converted to uppercase
- If timestamp is missing, server generates current timestamp
- Alerts are stored in alerts.json with 100 alert limit (oldest removed)

### Security
- **Authorization Required:** POST requests must include `Authorization: Bearer trading-coach-secret-2026` header
- **401 Unauthorized:** Returned for missing or invalid tokens
- **No Authentication:** GET endpoints remain open for dashboard access

## Architecture

### Frontend (React + Vite)
- **Components:** Dashboard, Analyzer, Calculator, Journal
- **State Management:** React hooks with localStorage
- **Styling:** CSS custom properties with mobile-first design
- **API Integration:** Fetch API with automatic polling

### Backend (Express)
- **Alert Storage:** JSON file persistence (easily replaceable with database)
- **CORS Enabled:** Accepts requests from any origin with proper headers
- **Validation:** Required field checking and data normalization
- **Dynamic Port:** Uses `process.env.PORT` for deployment flexibility
- **Bias Normalization:** Converts buy/sell to Long/Short automatically
- **Production Ready:** No external dependencies required, runs with `node server.cjs`

## Deployment

### Deploy to Railway, Render, or Heroku

1. **Set environment variable:**
   ```bash
   PORT=3001
   ```

2. **Start the server:**
   ```bash
   node server.cjs
   ```

3. **Your webhook URL will be:**
   ```
   https://your-deployment-url.com/api/alerts
   ```

4. **Include authorization header in TradingView:**
   ```
   Authorization: Bearer trading-coach-secret-2026
   ```

### Configuration

- **PORT:** Set via `process.env.PORT` (defaults to 3001)
- **WEBHOOK_SECRET:** Update `WEBHOOK_SECRET` constant in server.cjs
- **CORS:** Configured for all origins with specific allowed methods and headers
- **ALERTS_FILE:** Stores alerts in `alerts.json` (ensure write permissions)

### Data Flow
1. External alerts → Express server → JSON storage
2. React app polls API → Displays latest alert
3. User can analyze alert → Create journal entry

## Development

### Project Structure
```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── styles/        # Component-specific CSS
├── App.jsx        # Main app component
└── main.jsx       # App entry point

server.js          # Express backend server
test-alerts.js     # Alert testing script
```

### Available Scripts
- `npm run dev` - Start frontend development server
- `npm run server` - Start backend server only
- `npm run dev:full` - Start both frontend and backend
- `npm run test:alerts` - Send test alerts to server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and multi-user support
- Real-time WebSocket connections
- Advanced alert filtering and notifications
- Integration with multiple broker APIs
- Performance analytics and backtesting

## License

MIT License - feel free to use for your trading applications.
