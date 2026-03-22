import { useState } from 'react'
import '../styles/Analyzer.css'

export function Analyzer({ setActiveTab }) {
  const [open, setOpen] = useState('')
  const [high, setHigh] = useState('')
  const [low, setLow] = useState('')
  const [close, setClose] = useState('')
  const [volume, setVolume] = useState('')
  const [avgVolume, setAvgVolume] = useState('')
  const [levelContext, setLevelContext] = useState('None')
  const [trend, setTrend] = useState('Sideways')

  const analyzeCandle = () => {
    if (!open || !high || !low || !close || !volume || !avgVolume) return null

    const o = parseFloat(open)
    const h = parseFloat(high)
    const l = parseFloat(low)
    const c = parseFloat(close)
    const vol = parseFloat(volume)
    const avgVol = parseFloat(avgVolume)

    if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c) || isNaN(vol) || isNaN(avgVol)) return null
    if (h < l || h < o || h < c || l > o || l > c) return null

    // Calculate candle metrics
    const body = Math.abs(c - o)
    const totalRange = h - l
    const bodyPercent = totalRange > 0 ? (body / totalRange) * 100 : 0
    const lowerWick = Math.min(o, c) - l
    const upperWick = h - Math.max(o, c)
    const lowerWickPercent = totalRange > 0 ? (lowerWick / totalRange) * 100 : 0
    const upperWickPercent = totalRange > 0 ? (upperWick / totalRange) * 100 : 0
    const isGreen = c > o
    const volumeRatio = avgVol > 0 ? vol / avgVol : 0

    // Analyze wicks
    let wickSignal = 'Balanced'
    let wickStrength = 0
    let wickType = null

    if (lowerWickPercent > 20 && upperWickPercent < 15) {
      wickSignal = 'Lower Wick (Rejection from Below)'
      wickStrength = Math.min(lowerWickPercent / 30, 1)
      wickType = 'lower'
    } else if (upperWickPercent > 20 && lowerWickPercent < 15) {
      wickSignal = 'Upper Wick (Rejection from Above)'
      wickStrength = Math.min(upperWickPercent / 30, 1)
      wickType = 'upper'
    } else if (lowerWickPercent > 15 && upperWickPercent > 15) {
      wickSignal = 'Double Wick (Indecision)'
      wickStrength = -0.3
      wickType = 'double'
    }

    // Base bias from candle direction
    let directionBias = isGreen ? 0.3 : -0.3

    // Level context influence
    let levelBias = 0
    let levelAgrees = false
    if (levelContext === 'Support' && wickType === 'lower') {
      levelBias = 0.4
      levelAgrees = true
    } else if (levelContext === 'Resistance' && wickType === 'upper') {
      levelBias = -0.4
      levelAgrees = true
    } else if (levelContext === 'VWAP') {
      if (wickType === 'lower') {
        levelBias = 0.25
        levelAgrees = true
      } else if (wickType === 'upper') {
        levelBias = -0.25
        levelAgrees = true
      }
    } else if (levelContext !== 'None') {
      levelAgrees = false
    }

    // Trend influence
    let trendBias = 0
    let trendAgrees = false
    if (trend === 'Up' && isGreen) {
      trendBias = 0.2
      trendAgrees = true
    } else if (trend === 'Down' && !isGreen) {
      trendBias = 0.2
      trendAgrees = true
    } else if (trend === 'Up' && !isGreen) {
      trendBias = -0.15
    } else if (trend === 'Down' && isGreen) {
      trendBias = -0.15
    } else if (trend === 'Sideways') {
      trendAgrees = true
    }

    // Volume influence
    let volumeConfidence = 0
    if (volumeRatio > 1.5) volumeConfidence = 0.2
    else if (volumeRatio > 1.2) volumeConfidence = 0.1
    else if (volumeRatio < 0.7) volumeConfidence = -0.15

    // Strong body confidence
    let bodyConfidence = 0
    if (bodyPercent > 60) bodyConfidence = 0.15
    else if (bodyPercent < 20) bodyConfidence = -0.1

    // Check for signal conflicts
    let hasConflict = false
    if (levelContext !== 'None' && !levelAgrees && wickType !== 'balanced') {
      hasConflict = true
    }
    if (trend !== 'Sideways' && !trendAgrees && Math.abs(trendBias) > 0.05) {
      hasConflict = true
    }

    // Calculate final bias
    let totalBias = directionBias + levelBias + trendBias + wickStrength
    totalBias = Math.max(-1, Math.min(1, totalBias))

    // Determine trade bias and confidence
    let bias = 'No Trade'
    let confidence = 0
    let baseConfidence = 0

    if (totalBias > 0.2) {
      bias = 'Long'
      baseConfidence = (totalBias * 0.4 + volumeConfidence * 0.3 + bodyConfidence * 0.3 + 0.1) * 100
    } else if (totalBias < -0.2) {
      bias = 'Short'
      baseConfidence = (Math.abs(totalBias) * 0.4 + volumeConfidence * 0.3 + bodyConfidence * 0.3 + 0.1) * 100
    } else {
      baseConfidence = 0
    }

    // Apply conflict penalty
    if (hasConflict && bias !== 'No Trade') {
      baseConfidence *= 0.65
    }

    confidence = Math.max(0, Math.min(100, baseConfidence))

    // Recalculate bias if confidence dropped below threshold due to conflicts
    if (hasConflict && confidence < 55) {
      bias = 'No Trade'
    }

    // Determine risk level
    let riskLevel = 'Low'
    if (wickType === 'double' || hasConflict) {
      riskLevel = 'High'
    } else if (bodyPercent < 15 || volumeRatio < 0.8) {
      riskLevel = 'High'
    } else if (bodyPercent < 30 || volumeRatio < 1) {
      riskLevel = 'Medium'
    }

    // Determine idea strength and tone
    let ideaStrength = 'none' // 'strong', 'weak', 'none'
    let toneModifier = ''

    if (bias !== 'No Trade') {
      if (confidence >= 70 && (riskLevel === 'Low' || riskLevel === 'Medium')) {
        ideaStrength = 'strong'
      } else if (confidence >= 55 && confidence < 70) {
        ideaStrength = 'weak'
        toneModifier = 'needs confirmation'
      } else if (riskLevel === 'High') {
        ideaStrength = 'weak'
        toneModifier = 'but risky'
      } else if (confidence < 55) {
        bias = 'No Trade'
        ideaStrength = 'none'
      }
    }

    // Generate trade idea and explanation with coaching tone
    let tradeIdea = ''
    let explanation = ''

    if (bias === 'Long') {
      if (ideaStrength === 'strong') {
        if (levelContext === 'Support' && wickType === 'lower') {
          tradeIdea = 'Strong buy idea: Price found support and buyers pushed it back up with a solid lower wick. This is a classic support bounce setup with good conviction.'
          explanation = 'When price bounces off support with a lower wick and good volume, it usually means buyers are confident at this level. A strong candle body here adds to the story.'
        } else if (levelContext === 'VWAP' && wickType === 'lower') {
          tradeIdea = 'Strong buy idea: Price pulled back to the average level (VWAP) but recovered well. This shows the longer-term trend is still intact and buyers are defending it.'
          explanation = 'VWAP bounces with lower wicks often signal that the overall trend is still healthy. Buyers are stepping in at reasonable prices.'
        } else if (trend === 'Up' && isGreen && bodyPercent > 40) {
          tradeIdea = 'Strong buy idea: We\'re in an uptrend and this candle is green with a strong body. Momentum looks solid.'
          explanation = 'When the trend is up and you see strong green candles, it shows buyers are still in control. Just remember to always use a stop loss.'
        } else {
          tradeIdea = 'Strong buy idea: Multiple signals are pointing upward with good confidence. The setup looks reliable.'
          explanation = 'Consider where to place your stop loss (usually below recent support) and make sure your risk-to-reward makes sense.'
        }
      } else if (ideaStrength === 'weak') {
        if (toneModifier === 'needs confirmation') {
          if (levelContext === 'Support' && wickType === 'lower') {
            tradeIdea = 'Weak buy idea: This looks like a possible support bounce, but confidence is still building. It needs confirmation.'
            explanation = 'The bounce is there, but the signals aren\'t screaming. Wait for the next candle to confirm before jumping in.'
          } else {
            tradeIdea = 'Weak buy idea: The setup has some bullish elements, but we need more confirmation before committing.'
            explanation = 'This could work, but it\'s not a slam dunk. Waiting for clearer signals or better entry spots might be smarter.'
          }
        } else if (toneModifier === 'but risky') {
          tradeIdea = 'Weak buy idea: There are some bullish signs, but the setup has high risk. Proceed with caution.'
          explanation = 'The wicks or body suggest this is a bit messy. If you do trade it, keep your position smaller and tight on stops.'
        } else {
          tradeIdea = 'Weak buy idea: This has some bullish qualities, but conviction is moderate. Consider waiting for a clearer setup.'
          explanation = 'Risk-to-reward might not be ideal here. A stronger candle or pattern later could be a better trade.'
        }
      }
    } else if (bias === 'Short') {
      if (ideaStrength === 'strong') {
        if (levelContext === 'Resistance' && wickType === 'upper') {
          tradeIdea = 'Strong short idea: Price pushed into resistance but got rejected with a solid upper wick. Sellers are stepping in with conviction.'
          explanation = 'Upper wicks at resistance usually mean sellers are strong at that level. This is a textbook rejection pattern with good confidence.'
        } else if (levelContext === 'VWAP' && wickType === 'upper') {
          tradeIdea = 'Strong short idea: Price bounced above the average level (VWAP) but pulled back with an upper wick. Sellers are defending this level.'
          explanation = 'When VWAP rejects price upward with a strong upper wick, it can signal that the longer-term trend is weakening.'
        } else if (trend === 'Down' && !isGreen && bodyPercent > 40) {
          tradeIdea = 'Strong short idea: We\'re in a downtrend and this candle is red with a strong body. Momentum is still down.'
          explanation = 'Strong red candles in a downtrend show sellers are in control. Remember to place your stop loss above recent resistance.'
        } else {
          tradeIdea = 'Strong short idea: Multiple signals are pointing downward with good confidence. The setup looks solid.'
          explanation = 'Be sure you know where you\'ll exit if price moves against you. Always use a stop loss on shorts.'
        }
      } else if (ideaStrength === 'weak') {
        if (toneModifier === 'needs confirmation') {
          if (levelContext === 'Resistance' && wickType === 'upper') {
            tradeIdea = 'Weak short idea: This looks like a possible resistance rejection, but confidence is still weak. Wait for confirmation.'
            explanation = 'The upper wick is there, but the body or volume isn\'t shouting bearish yet. See if the next candle confirms the rejection.'
          } else {
            tradeIdea = 'Weak short idea: There are some bearish signs, but we\'d like to see more confirmation before acting.'
            explanation = 'This could be the start of something, but it\'s not clear yet. Waiting might give you a clearer entry.'
          }
        } else if (toneModifier === 'but risky') {
          tradeIdea = 'Weak short idea: There are bearish signs, but the setup has higher risk. Be extra careful.'
          explanation = 'Double wicks or low volume can make shorts trickier. If you take it, use a wider stop and smaller position.'
        } else {
          tradeIdea = 'Weak short idea: This has some bearish qualities, but conviction is moderate. A clearer setup might come soon.'
          explanation = 'The signals aren\'t strong enough yet. Waiting for better risk-to-reward could be the safer play.'
        }
      }
    } else {
      if (wickType === 'double') {
        tradeIdea = 'No trade: This candle shows indecision with wicks on both sides. Direction is unclear and risk is higher.'
        explanation = 'When a candle has long wicks on both ends, traders were confused—buyers pushed up but then sellers pushed down. Wait for clarity.'
      } else if (hasConflict) {
        tradeIdea = 'No trade: This setup is mixed. The trend, level, and wick signals don\'t all agree. It\'s safer to wait.'
        explanation = 'When signals conflict, the risk goes up and conviction goes down. A clearer pattern will likely come along soon.'
      } else {
        tradeIdea = 'No trade: The signals are mixed and don\'t give a clear direction. Waiting is the smart move.'
        explanation = 'Trading with low conviction is risky. You\'ll see better setups—patience is part of smart trading.'
      }
    }

    return {
      bias,
      confidence: Math.round(confidence),
      riskLevel,
      wickSignal,
      tradeIdea,
      explanation,
      metrics: {
        body: bodyPercent.toFixed(1),
        lowerWick: lowerWickPercent.toFixed(1),
        upperWick: upperWickPercent.toFixed(1),
        volumeRatio: volumeRatio.toFixed(2)
      }
    }
  }

  const results = analyzeCandle()

  // Determine signal badge text and style
  const getSignalBadge = (results) => {
    if (!results) return null

    const { bias, confidence, riskLevel } = results

    if (bias === 'No Trade') {
      return { text: 'NO TRADE', className: 'no-trade' }
    }

    if (bias === 'Long') {
      if (confidence >= 70 && (riskLevel === 'Low' || riskLevel === 'Medium')) {
        return { text: 'STRONG BUY', className: 'strong-buy' }
      } else if (confidence >= 55) {
        return { text: 'WEAK BUY', className: 'weak-buy' }
      } else {
        return { text: 'NO TRADE', className: 'no-trade' }
      }
    }

    if (bias === 'Short') {
      if (confidence >= 70 && (riskLevel === 'Low' || riskLevel === 'Medium')) {
        return { text: 'STRONG SHORT', className: 'strong-short' }
      } else if (confidence >= 55) {
        return { text: 'WEAK SHORT', className: 'weak-short' }
      } else {
        return { text: 'NO TRADE', className: 'no-trade' }
      }
    }

    return { text: 'NO TRADE', className: 'no-trade' }
  }

  const signalBadge = getSignalBadge(results)

  return (
    <div className="page-content analyzer-page">
      <h1>Candlestick Analyzer</h1>

      <form className="analyzer-form">
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="open">Open</label>
            <input
              id="open"
              type="number"
              step="0.01"
              value={open}
              onChange={(e) => setOpen(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="form-group half">
            <label htmlFor="close">Close</label>
            <input
              id="close"
              type="number"
              step="0.01"
              value={close}
              onChange={(e) => setClose(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="high">High</label>
            <input
              id="high"
              type="number"
              step="0.01"
              value={high}
              onChange={(e) => setHigh(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="form-group half">
            <label htmlFor="low">Low</label>
            <input
              id="low"
              type="number"
              step="0.01"
              value={low}
              onChange={(e) => setLow(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="volume">Volume</label>
            <input
              id="volume"
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group half">
            <label htmlFor="avgVolume">Avg Volume</label>
            <input
              id="avgVolume"
              type="number"
              value={avgVolume}
              onChange={(e) => setAvgVolume(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="levelContext">Level Context</label>
            <select
              id="levelContext"
              value={levelContext}
              onChange={(e) => setLevelContext(e.target.value)}
            >
              <option>None</option>
              <option>Support</option>
              <option>Resistance</option>
              <option>VWAP</option>
            </select>
          </div>
          <div className="form-group half">
            <label htmlFor="trend">Trend</label>
            <select
              id="trend"
              value={trend}
              onChange={(e) => setTrend(e.target.value)}
            >
              <option>Up</option>
              <option>Down</option>
              <option>Sideways</option>
            </select>
          </div>
        </div>
      </form>

      {results && (
        <div className="analysis-results">
          {/* Signal Badge - First thing user sees */}
          {signalBadge && (
            <div className={`signal-badge ${signalBadge.className}`}>
              {signalBadge.text}
            </div>
          )}

          <div className="results-header">
            <div className={`bias-badge ${results.bias.toLowerCase().replace(' ', '-')} strength-none`}>
              {results.bias}
            </div>
            <div className="confidence-display">
              <span className="label">Confidence</span>
              <span className="value">{results.confidence}%</span>
              <div className="confidence-bar">
                <div
                  className={`confidence-fill confidence-${results.confidence >= 70 ? 'high' : results.confidence >= 55 ? 'medium' : 'low'}`}
                  style={{ width: `${results.confidence}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="results-grid">
            <div className="result-card risk-card">
              <span className="card-label">Risk Level</span>
              <span className={`risk-badge ${results.riskLevel.toLowerCase()}`}>
                {results.riskLevel}
              </span>
            </div>

            <div className="result-card wick-card">
              <span className="card-label">Wick Signal</span>
              <span className="wick-value">{results.wickSignal}</span>
            </div>
          </div>

          <div className={`trade-idea-box strength-none`}>
            <div className="trade-idea-header">
              <h3>Trade Idea</h3>
              <div className="action-buttons">
                <button
                  className="log-setup-btn"
                  onClick={() => {
                    const draftEntry = {
                      tradeIdea: results.tradeIdea,
                      bias: results.bias,
                      confidence: results.confidence,
                      riskLevel: results.riskLevel,
                      wickSignal: results.wickSignal,
                      explanation: results.explanation,
                      timestamp: new Date().toISOString()
                    }
                    localStorage.setItem('journalDraft', JSON.stringify(draftEntry))
                    alert('Saved to Journal Draft')
                  }}
                >
                  Log Trade Idea
                </button>
                <button
                  className="open-calculator-btn"
                  onClick={() => setActiveTab('calculator')}
                >
                  Open Calculator
                </button>
              </div>
            </div>
            <p className="trade-idea-text">{results.tradeIdea}</p>
          </div>

          <div className="explanation-box">
            <h3>Why This Matters</h3>
            <p className="explanation-text">{results.explanation}</p>
          </div>

          <div className="metrics-section">
            <h3>Candle Metrics</h3>
            <div className="metrics-grid">
              <div className="metric">
                <span className="metric-label">Body</span>
                <span className="metric-value">{results.metrics.body}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Lower Wick</span>
                <span className="metric-value">{results.metrics.lowerWick}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Upper Wick</span>
                <span className="metric-value">{results.metrics.upperWick}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Vol Ratio</span>
                <span className="metric-value">{results.metrics.volumeRatio}x</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
