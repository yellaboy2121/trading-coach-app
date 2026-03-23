import { useEffect, useState } from 'react';

function NotificationControls() {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    // Ask on load
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  const enableAlerts = () => {
    Notification.requestPermission().then(setPermission);
  };

  const sendTestAlert = () => {
    if (permission === 'granted') {
      new Notification('Trading Coach Alert', {
        body: 'This is a test notification!',
        icon: '/icons/icon-192.png'
      });
    } else {
      alert('Please enable notifications first.');
    }
  };

  return (
    <div style={{ margin: '1em 0' }}>
      <button onClick={enableAlerts}>Enable Alerts</button>
      <button onClick={sendTestAlert} style={{ marginLeft: 8 }}>Send Test Alert</button>
      <div style={{ fontSize: 12, marginTop: 4 }}>
        Notification permission: <b>{permission}</b>
      </div>
    </div>
  );
}

export default NotificationControls;
