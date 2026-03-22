import { useState } from 'react'
import '../styles/Calculator.css'

export function Calculator() {
  const [entryPrice, setEntryPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [accountSize, setAccountSize] = useState('')
  const [riskPercent, setRiskPercent] = useState('1')

  const calculateRisk = () => {
    if (!entryPrice || !stopLoss || !accountSize) return null

    const entry = parseFloat(entryPrice)
    const stop = parseFloat(stopLoss)
    const account = parseFloat(accountSize)
    const riskPct = parseFloat(riskPercent)

    if (isNaN(entry) || isNaN(stop) || isNaN(account) || entry === stop) return null

    const riskPerShare = Math.abs(entry - stop)
    const riskAmount = (account * riskPct) / 100
    const positionSize = Math.floor(riskAmount / riskPerShare)
    const totalRisk = positionSize * riskPerShare
    const actualRiskPercent = (totalRisk / account) * 100

    let reward = null
    let rrRatio = null
    if (takeProfit) {
      const tp = parseFloat(takeProfit)
      if (!isNaN(tp) && tp !== entry) {
        reward = Math.abs(tp - entry) * positionSize
        rrRatio = (reward / totalRisk).toFixed(2)
      }
    }

    return {
      riskPerShare: riskPerShare.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      positionSize,
      totalRisk: totalRisk.toFixed(2),
      actualRiskPercent: actualRiskPercent.toFixed(2),
      reward: reward ? reward.toFixed(2) : null,
      rrRatio,
      isHighRisk: actualRiskPercent > 2
    }
  }

  const results = calculateRisk()

  return (
    <div className="page-content calculator-page">
      <h1>Risk Calculator</h1>

      <form className="calculator-form">
        <div className="form-group">
          <label htmlFor="entryPrice">Entry Price</label>
          <input
            id="entryPrice"
            type="number"
            step="0.01"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label htmlFor="stopLoss">Stop Loss</label>
          <input
            id="stopLoss"
            type="number"
            step="0.01"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label htmlFor="takeProfit">Take Profit (optional)</label>
          <input
            id="takeProfit"
            type="number"
            step="0.01"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label htmlFor="accountSize">Account Size ($)</label>
          <input
            id="accountSize"
            type="number"
            step="0.01"
            value={accountSize}
            onChange={(e) => setAccountSize(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label htmlFor="riskPercent">
            Risk % of Account: <strong>{riskPercent}%</strong>
          </label>
          <input
            id="riskPercent"
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
          />
        </div>
      </form>

      {results && (
        <div className={`results-card ${results.isHighRisk ? 'high-risk' : ''}`}>
          <div className="results-row">
            <span className="result-label">Risk per Share</span>
            <span className="result-value">${results.riskPerShare}</span>
          </div>

          <div className="results-row">
            <span className="result-label">Total Risk</span>
            <span className="result-value">${results.totalRisk}</span>
          </div>

          <div className="results-row">
            <span className="result-label">Position Size</span>
            <span className="result-value">{results.positionSize} shares</span>
          </div>

          {results.rrRatio && (
            <div className="results-row">
              <span className="result-label">Risk/Reward Ratio</span>
              <span className="result-value">1:{results.rrRatio}</span>
            </div>
          )}

          {results.isHighRisk && (
            <div className="risk-warning">
              ⚠️ Risk is {results.actualRiskPercent}% of account (exceeds 2%)
            </div>
          )}
        </div>
      )}
    </div>
  )
}

