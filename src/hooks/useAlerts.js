import { useState, useEffect } from 'react'

export function useAlerts() {
  const [latestAlert, setLatestAlert] = useState(null)
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch latest alert
  const fetchLatestAlert = async () => {
    try {
      const response = await fetch('/api/alerts/latest')
      if (response.ok) {
        const data = await response.json()
        setLatestAlert(data.alert)
      }
    } catch (err) {
      console.error('Error fetching latest alert:', err)
      setError(err.message)
    }
  }

  // Fetch recent alerts
  const fetchRecentAlerts = async (limit = 5) => {
    try {
      const response = await fetch(`/api/alerts?limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setRecentAlerts(data.alerts || [])
      }
    } catch (err) {
      console.error('Error fetching recent alerts:', err)
      setError(err.message)
    }
  }

  // Initial load
  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true)
      await Promise.all([fetchLatestAlert(), fetchRecentAlerts()])
      setLoading(false)
    }

    loadAlerts()

    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchLatestAlert, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    latestAlert,
    recentAlerts,
    loading,
    error,
    refetch: () => {
      fetchLatestAlert()
      fetchRecentAlerts()
    }
  }
}