import { useEffect, useState } from 'react';

export default function MarketStatePanel() {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchLatest() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/alerts/latest');
        const data = await res.json();
        if (mounted) {
          setAlert(data.alert || null);
        }
      } catch (e) {
        setError('Failed to load market state.');
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
    const interval = setInterval(fetchLatest, 10000); // refresh every 10s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div>Loading market state...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;
  if (!alert) return <div>Waiting for market state...</div>;

  // Map state to friendly label (should already be mapped by backend, but fallback)
  const stateLabels = {
    consolidating: 'CONSOLIDATING',
    at_break_point: 'AT BREAK POINT',
    breakout_up: 'BREAKOUT UP',
    breakout_down: 'BREAKOUT DOWN',
    failed_break: 'FAILED BREAK',
  };
  const label = stateLabels[alert.state] || alert.state || '';

  return (
    <div style={{border:'1px solid #ccc',borderRadius:8,padding:16,maxWidth:400,margin:'2em auto',background:'#fafbfc'}}>
      <div><b>Ticker:</b> {alert.ticker}</div>
      <div><b>State:</b> {label}</div>
      <div><b>Price:</b> {alert.price}</div>
      <div><b>Message:</b> {alert.message}</div>
      <div style={{fontSize:12,color:'#888'}}><b>Updated:</b> {new Date(alert.timestamp).toLocaleString()}</div>
    </div>
  );
}
