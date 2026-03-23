
import { useState, useEffect } from 'react'
import '../styles/Dashboard.css'
import { useAlerts } from '../hooks/useAlerts'
import NotificationControls from './NotificationControls'

export function Dashboard({ setActiveTab }) {
  const [latestAnalysis, setLatestAnalysis] = useState(null)
  const [journalStats, setJournalStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0
  })
  const [recentTrades, setRecentTrades] = useState([])
  const [alertPulse, setAlertPulse] = useState(false)
  const { latestAlert, recentAlerts, loading: alertsLoading } = useAlerts()

  // Trigger pulse animation when new alert arrives
  useEffect(() => {
    if (latestAlert) {
      setAlertPulse(true)
      const timer = setTimeout(() => setAlertPulse(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [latestAlert?.id])

  useEffect(() => {
    const loadData = () => {
      // Load latest analyzer result
      const analysisData = localStorage.getItem('journalDraft')
      if (analysisData) {
        const analysis = JSON.parse(analysisData)
        setLatestAnalysis(analysis)
      }

      // Load journal data and calculate stats
      const journalData = localStorage.getItem('tradingJournal')
      if (journalData) {
        const entries = JSON.parse(journalData)

        // Calculate stats
        const totalTrades = entries.filter(entry => entry.whatIDid === 'Took trade').length
        const wins = entries.filter(entry => entry.whatIDid === 'Took trade' && entry.outcome === 'Win').length
        const losses = entries.filter(entry => entry.whatIDid === 'Took trade' && entry.outcome === 'Loss').length
        const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0

        setJournalStats(prev => ({ ...prev, totalTrades, wins, losses, winRate }))

        // Get recent trades (last 3)
        const recentEntries = entries.slice(0, 3)
        setRecentTrades(recentEntries)
      }
    }

    loadData()
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const seconds = Math.floor((now - alertTime) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 80) return 'STRONG'
    if (confidence < 60) return 'WEAK'
    return null
  }

  const getOutcomeColor = (outcome) => {
    if (outcome === 'Win') return 'win'
    if (outcome === 'Loss') return 'loss'
    return 'breakeven'
  }

  const getBiasColor = (bias) => {
    if (bias === 'Long') return 'long'
    if (bias === 'Short') return 'short'
    return 'neutral'
  }

  return (
    <div className="page-content dashboard-page">
      <NotificationControls />
      <h1>Dashboard</h1>

      {/* Live Alerts Section */}
      <div className="dashboard-section">
        <h2>🔴 Live Alerts</h2>
        {alertsLoading ? (
          <div className="loading-alert">
            <p>🔗 Connecting to Railway backend...</p>
          </div>
        ) : alertsLoading === false && !recentAlerts.length && !alertsLoading ? (
          <div className="no-alert">
            <p>⏳ Waiting for live alerts from TradingView...</p>
            <p className="alert-instructions">
              Backend URL: <code>trading-coach-app-production.up.railway.app</code>
            </p>
          </div>
        ) : recentAlerts && recentAlerts.length > 0 ? (
          <div className="alerts-list">
            {recentAlerts.slice(0, 3).map((alert, idx) => (
              <div
                key={alert.id}
                className={`alert-card ${alert.bias.toLowerCase()} ${alertPulse && idx === 0 ? 'pulse' : ''}`}
              >
                <div className="alert-top">
                  <div className="alert-ticker-section">
                    <span className="alert-ticker">{alert.ticker}</span>
                    {getConfidenceBadge(alert.confidence) && (
                      <span className={`confidence-badge ${getConfidenceBadge(alert.confidence).toLowerCase()}`}>
                        {getConfidenceBadge(alert.confidence)}
                      </span>
                    )}
                  </div>
                  <span className="alert-time">{getTimeAgo(alert.timestamp)}</span>
                </div>

                <div className="alert-row">
                  <div className="alert-info">
                    <span className="alert-label">Bias</span>
                    <span className={`alert-value ${alert.bias.toLowerCase()}`}>{alert.bias}</span>
                  </div>
                  <div className="alert-info">
                    <span className="alert-label">Confidence</span>
                    <span className="alert-value">{alert.confidence}%</span>
                  </div>
                  <div className="alert-info">
                    <span className="alert-label">Risk</span>
                    <span className="alert-value">{alert.risk}</span>
                  </div>
                </div>

                <div className="alert-message">{alert.message}</div>

                <div className="alert-actions">
                  <button
                    className="analyze-btn"
                    onClick={() => {
                      localStorage.setItem('alertDraft', JSON.stringify(alert))
                      setActiveTab('analyzer')
                    }}
                  >
                    Analyze
                  </button>
                  <button
                    className="log-btn"
                    onClick={() => {
                      const journalDraft = {
                        ticker: alert.ticker,
                        tradeIdea: alert.message,
                        bias: alert.bias,
                        confidence: alert.confidence,
                        riskLevel: alert.risk,
                        explanation: `Live alert: ${alert.message}`,
                        timestamp: alert.timestamp
                      }
                      localStorage.setItem('journalDraft', JSON.stringify(journalDraft))
                      setActiveTab('journal')
                    }}
                  >
                    Log
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-alert">
            <p>No live alerts received yet.</p>
            <p className="alert-instructions">
              Send alerts to: <code>POST /api/alerts</code>
            </p>
          </div>
        )}
      </div>

      {/* Latest Analyzer Result */}
      <div className="dashboard-section">
        <h2>Latest Analyzer Result</h2>
        {latestAnalysis ? (
          <div className="analysis-card">
            <div className="analysis-header">
              <span className={`bias-badge ${getBiasColor(latestAnalysis.bias)}`}>
                {latestAnalysis.bias}
              </span>
              <span className="confidence">{latestAnalysis.confidence}% confidence</span>
            </div>
            <div className="analysis-details">
              <div className="detail-item">
                <span className="label">Risk:</span>
                <span className={`value risk-${latestAnalysis.riskLevel.toLowerCase()}`}>
                  {latestAnalysis.riskLevel}
                </span>
              </div>
            </div>
            <div className="trade-idea">
              <p>{latestAnalysis.tradeIdea}</p>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>No recent analysis. Try the Analyzer!</p>
          </div>
        )}
      </div>

      {/* Journal Stats */}
      <div className="dashboard-section">
        <h2>Trading Performance</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Trades</span>
            <span className="stat-value">{journalStats.totalTrades}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Wins</span>
            <span className="stat-value">{journalStats.wins}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Losses</span>
            <span className="stat-value">{journalStats.losses}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{journalStats.winRate}%</span>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="dashboard-section">
        <h2>Recent Trades</h2>
        {recentTrades.length > 0 ? (
          <div className="recent-trades">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="trade-card">
                <div className="trade-header">
                  <span className="ticker">{trade.ticker}</span>
                  <span className={`outcome-badge ${getOutcomeColor(trade.outcome)}`}>
                    {trade.outcome}
                  </span>
                </div>
                <div className="trade-details">
                  <p className="trade-idea">{trade.tradeIdea || 'No idea recorded'}</p>
                  <span className="trade-date">{formatDate(trade.date)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No trades yet. Start journaling!</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button
            className="action-btn analyzer-btn"
            onClick={() => setActiveTab('analyzer')}
          >
            Go to Analyzer
          </button>
          <button
            className="action-btn journal-btn"
            onClick={() => setActiveTab('journal')}
          >
            Go to Journal
          </button>
        </div>
      </div>
    </div>
  )
}
