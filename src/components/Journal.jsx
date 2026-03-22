import { useState, useEffect } from 'react'
import '../styles/Journal.css'
import '../styles/Journal.css'

export function Journal() {
  const [entries, setEntries] = useState([])
  const [formData, setFormData] = useState({
    ticker: '',
    tradeIdea: '',
    whatIDid: 'Took trade',
    direction: 'Long',
    notes: '',
    outcome: 'Win'
  })
  const [draftData, setDraftData] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Load entries and draft data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      const savedEntries = localStorage.getItem('tradingJournal')
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries))
      }

      // Check for draft data from Analyzer
      const draftDataStr = localStorage.getItem('journalDraft')
      if (draftDataStr) {
        const draft = JSON.parse(draftDataStr)
        setDraftData(draft)
        setFormData(prev => ({
          ...prev,
          tradeIdea: draft.tradeIdea || '',
          direction: draft.bias === 'Long' ? 'Long' : draft.bias === 'Short' ? 'Short' : 'Long',
          notes: draft.explanation ? `${draft.explanation}\n\nConfidence: ${draft.confidence}%, Risk: ${draft.riskLevel}, Wick: ${draft.wickSignal}` : `Confidence: ${draft.confidence}%, Risk: ${draft.riskLevel}, Wick: ${draft.wickSignal}`
        }))
      }
    }

    loadData()
  }, [])

  // Save entries to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('tradingJournal', JSON.stringify(entries))
  }, [entries])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.ticker.trim()) return

    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...formData
    }

    setEntries(prev => [newEntry, ...prev])

    // Clear draft data after successful submission
    localStorage.removeItem('journalDraft')
    setDraftData(null)
    setShowConfirmation(true)

    // Reset form
    setFormData({
      ticker: '',
      tradeIdea: '',
      whatIDid: 'Took trade',
      direction: 'Long',
      notes: '',
      outcome: 'Win'
    })

    // Hide confirmation after 3 seconds
    setTimeout(() => setShowConfirmation(false), 3000)
  }

  const getStats = () => {
    const totalTrades = entries.filter(entry => entry.whatIDid === 'Took trade').length
    const wins = entries.filter(entry => entry.whatIDid === 'Took trade' && entry.outcome === 'Win').length
    const losses = entries.filter(entry => entry.whatIDid === 'Took trade' && entry.outcome === 'Loss').length
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0

    return { totalTrades, wins, losses, winRate }
  }

  const clearDraft = () => {
    localStorage.removeItem('journalDraft')
    setDraftData(null)
    setFormData({
      ticker: '',
      tradeIdea: '',
      whatIDid: 'Took trade',
      direction: 'Long',
      notes: '',
      outcome: 'Win'
    })
  }

  const getEntryColor = (entry) => {
    if (entry.whatIDid === 'Skipped trade') return 'skipped'
    if (entry.outcome === 'Win') return 'win'
    if (entry.outcome === 'Loss') return 'loss'
    return 'breakeven'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const stats = getStats()

  return (
    <div className="page-content journal-page">
      <h1>Trading Journal</h1>

      {/* Draft Section */}
      {draftData && (
        <div className="draft-section">
          <div className="draft-header">
            <h2>📝 Draft from Analyzer</h2>
            <div className="draft-actions">
              <button className="complete-entry-btn" onClick={() => document.querySelector('form').scrollIntoView({ behavior: 'smooth' })}>
                Complete Entry
              </button>
              <button className="clear-draft-btn" onClick={clearDraft}>
                ✕ Clear
              </button>
            </div>
          </div>
          <div className="draft-content">
            <div className="draft-item">
              <span className="draft-label">Trade Idea:</span>
              <span className="draft-value">{draftData.tradeIdea}</span>
            </div>
            <div className="draft-item">
              <span className="draft-label">Bias:</span>
              <span className={`draft-value bias-${draftData.bias.toLowerCase().replace(' ', '-')}`}>
                {draftData.bias}
              </span>
            </div>
            <div className="draft-item">
              <span className="draft-label">Confidence:</span>
              <span className="draft-value">{draftData.confidence}%</span>
            </div>
            <div className="draft-item">
              <span className="draft-label">Risk:</span>
              <span className={`draft-value risk-${draftData.riskLevel.toLowerCase()}`}>
                {draftData.riskLevel}
              </span>
            </div>
            <div className="draft-item">
              <span className="draft-label">Wick Signal:</span>
              <span className="draft-value">{draftData.wickSignal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Message */}
      {showConfirmation && (
        <div className="confirmation-message">
          ✅ Trade saved successfully!
        </div>
      )}

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Trades</span>
            <span className="stat-value">{stats.totalTrades}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Wins</span>
            <span className="stat-value">{stats.wins}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Losses</span>
            <span className="stat-value">{stats.losses}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{stats.winRate}%</span>
          </div>
        </div>
      </div>

      {/* Add Entry Form */}
      <form className="journal-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="ticker">Ticker</label>
            <input
              id="ticker"
              type="text"
              value={formData.ticker}
              onChange={(e) => handleInputChange('ticker', e.target.value)}
              placeholder="AAPL"
              required
            />
          </div>
          <div className="form-group half">
            <label htmlFor="tradeIdea">Trade Idea</label>
            <input
              id="tradeIdea"
              type="text"
              value={formData.tradeIdea}
              onChange={(e) => handleInputChange('tradeIdea', e.target.value)}
              placeholder="Buy idea: Support bounce"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="whatIDid">What I Did</label>
            <select
              id="whatIDid"
              value={formData.whatIDid}
              onChange={(e) => handleInputChange('whatIDid', e.target.value)}
            >
              <option>Took trade</option>
              <option>Skipped trade</option>
            </select>
          </div>
          <div className="form-group half">
            <label htmlFor="direction">Direction</label>
            <select
              id="direction"
              value={formData.direction}
              onChange={(e) => handleInputChange('direction', e.target.value)}
            >
              <option>Long</option>
              <option>Short</option>
            </select>
          </div>
        </div>

        {formData.whatIDid === 'Took trade' && (
          <div className="form-group">
            <label htmlFor="outcome">Outcome</label>
            <select
              id="outcome"
              value={formData.outcome}
              onChange={(e) => handleInputChange('outcome', e.target.value)}
            >
              <option>Win</option>
              <option>Loss</option>
              <option>Break even</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="What I learned, what went well, what to improve..."
            rows="3"
          />
        </div>

        <button type="submit" className="submit-btn">
          Add Entry
        </button>
      </form>

      {/* Journal Entries */}
      <div className="entries-section">
        <h2>Journal Entries</h2>
        {entries.length === 0 ? (
          <div className="empty-state">
            <p>No journal entries yet. Start tracking your trades!</p>
          </div>
        ) : (
          <div className="entries-list">
            {entries.map((entry) => (
              <div key={entry.id} className={`entry-card ${getEntryColor(entry)}`}>
                <div className="entry-header">
                  <div className="entry-meta">
                    <span className="entry-date">{formatDate(entry.date)}</span>
                    <span className="entry-ticker">{entry.ticker}</span>
                  </div>
                  <div className="entry-badges">
                    <span className="badge idea">{entry.tradeIdea || 'No idea'}</span>
                    <span className="badge action">{entry.whatIDid}</span>
                    {entry.whatIDid === 'Took trade' && (
                      <span className="badge outcome">{entry.outcome}</span>
                    )}
                  </div>
                </div>

                <div className="entry-details">
                  <div className="detail-row">
                    <span className="detail-label">Direction:</span>
                    <span className="detail-value">{entry.direction}</span>
                  </div>
                  {entry.notes && (
                    <div className="notes-section">
                      <span className="detail-label">Notes:</span>
                      <p className="notes-text">{entry.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
