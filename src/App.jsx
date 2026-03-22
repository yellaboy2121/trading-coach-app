import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Analyzer } from './components/Analyzer'
import { Calculator } from './components/Calculator'
import { Journal } from './components/Journal'
import { BottomNav } from './components/BottomNav'
import './styles/App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />
      case 'analyzer':
        return <Analyzer setActiveTab={setActiveTab} />
      case 'calculator':
        return <Calculator />
      case 'journal':
        return <Journal />
      default:
        return <Dashboard setActiveTab={setActiveTab} />
    }
  }

  return (
    <div className="app-container">
      <main className="app-main">
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
