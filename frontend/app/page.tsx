import styles from './page.module.css'

export default function HomePage() {
  return (
    <div className={styles.wrapper}>
      {/* Hero */}
      <section className={styles.hero} aria-label="Hero section">
        <h1 className={styles.heroHeadline}>
          Care, Always Within Reach
        </h1>
        <p className={styles.heroSub}>
          Real-time AI monitoring that alerts caregivers the moment a patient needs attention.
        </p>
        <a href="/dashboard" className={styles.ctaBtn}>
          View Dashboard
        </a>
      </section>

      {/* Features */}
      <section className={styles.features} aria-label="Features">
        <div className={styles.featCard}>
          <div className={styles.featIcon}>👁️</div>
          <h3 className={styles.featTitle}>Live Monitoring</h3>
          <p className={styles.featDesc}>AI-powered camera feeds with real-time patient monitoring and instant alerts.</p>
        </div>
        <div className={styles.featCard}>
          <div className={styles.featIcon}>⚡</div>
          <h3 className={styles.featTitle}>Smart Alerts</h3>
          <p className={styles.featDesc}>Intelligent detection of medication violations with immediate caregiver notifications.</p>
        </div>
        <div className={styles.featCard}>
          <div className={styles.featIcon}>📊</div>
          <h3 className={styles.featTitle}>Activity Timeline</h3>
          <p className={styles.featDesc}>Complete event history with corrections and compliance tracking over time.</p>
        </div>
      </section>

<<<<<<< Updated upstream
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Settings Section */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Medication Settings</h2>
          <div className="flex items-center space-x-4">
            <label className="text-gray-700">Expected Medication Color:</label>
            <select 
              value={settings.expected_color}
              onChange={(e) => setSettings({ ...settings, expected_color: e.target.value })}
              className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="yellow">Yellow</option>
              <option value="orange">Orange</option>
              <option value="purple">Purple</option>
            </select>
            <button 
              onClick={saveSettings}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
          {message && (
            <div className={`mt-2 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}
        </section>

        {/* Status Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Events.</p>
                <p className="text-2xl font-bold text-gray-800">{totalEvents}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Violations</p>
                <p className="text-2xl font-bold text-red-600">{violations}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Corrections</p>
                <p className="text-2xl font-bold text-green-600">{corrections}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Event Timeline */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Event Timeline</h2>
            <button 
              onClick={loadEvents}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <p>Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p>No events recorded yet</p>
              </div>
            ) : (
              events.map((event) => {
                const isViolation = event.type === 'wrong_med_attempt';
                const isCorrected = event.corrected;
                
                const statusStyles = isCorrected
                  ? {
                      border: 'border-green-500',
                      bg: 'bg-green-100',
                      text: 'text-green-600',
                      label: 'Corrected',
                      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                    }
                  : {
                      border: 'border-red-500',
                      bg: 'bg-red-100',
                      text: 'text-red-600',
                      label: 'Violation',
                      icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                    };

                return (
                  <div key={event.event_id} className={`border-l-4 ${statusStyles.border} bg-gray-50 p-4 rounded-r-lg`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`${statusStyles.bg} p-2 rounded-full`}>
                            <svg className={`w-5 h-5 ${statusStyles.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={statusStyles.icon}></path>
                            </svg>
                          </div>
                          <span className={`font-semibold ${statusStyles.text}`}>{statusStyles.label}</span>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{event.severity}</span>
                        </div>
                        <div className="ml-11 space-y-1">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Expected:</span> 
                            <span className={`inline-block w-4 h-4 rounded-full ${getColorClass(event.expected)} ml-1 align-middle`}></span>
                            {event.expected}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Observed:</span> 
                            <span className={`inline-block w-4 h-4 rounded-full ${getColorClass(event.observed)} ml-1 align-middle`}></span>
                            {event.observed}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
=======
      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>CareSight</div>
        <div className={styles.footerCopy}>© 2026 CareSight. All rights reserved.</div>
      </footer>
>>>>>>> Stashed changes
    </div>
  )
}