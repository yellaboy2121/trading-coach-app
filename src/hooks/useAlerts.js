import { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export function useAlerts() {
  const [latestAlert, setLatestAlert] = useState(null)
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch latest alert from Railway backend
  const fetchLatestAlert = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/alerts/latest`)
      if (response.ok) {
        const data = await response.json()
        setLatestAlert(data.alert)
        setError(null)
      } else {
        setError(`Server error: ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching latest alert from Railway:', err)
      setError(`Connection error: ${err.message}`)
    }
  }

  // Fetch all recent alerts from Railway backend
  const fetchRecentAlerts = async (limit = 5) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/alerts?limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setRecentAlerts(data.alerts || [])
        setError(null)
      } else {
        setError(`Server error: ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching recent alerts from Railway:', err)
      setError(`Connection error: ${err.message}`)
    }
  }

  // Initial load and polling
  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true)
      await Promise.all([fetchLatestAlert(), fetchRecentAlerts()])
      setLoading(false)
    }

    loadAlerts()

    // Poll for new alerts every 5-10 seconds (staggered to avoid server hammering)
    const pollInterval = setInterval(() => {
      fetchLatestAlert()
      fetchRecentAlerts()
    }, 8000)

    return () => clearInterval(pollInterval)
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