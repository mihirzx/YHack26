'use client'

import { useState, useEffect } from 'react'
import { fetchMedication, saveMedication, getPatientStats, getActiveAlerts, PatientStats, HexAnalysisResult } from '@/lib/api'
import { PatientProfile, MonitoringEvent, CARE_LEVEL_LABELS, EVENT_TYPE_OPTIONS } from '@/lib/types'

export default function ManagePage() {
  // View State
  const [currentView, setCurrentView] = useState<'profiles' | 'detail'>('profiles')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  // Patient Profiles State
  const [patients, setPatients] = useState<PatientProfile[]>([
    {
      id: '1',
      name: 'Margaret',
      age: 78,
      location: 'Room 1',
      careLevel: 'high',
      events: [
        {
          id: '1',
          eventType: 'medication',
          timeStart: '08:00',
          timeEnd: '09:00',
          description: 'Patient should take the red pill from the left compartment'
        }
      ]
    },
    {
      id: '2',
      name: 'Robert',
      age: 65,
      location: 'Room 2',
      careLevel: 'moderate',
      events: [
        {
          id: '2',
          eventType: 'appliance',
          timeStart: '18:00',
          timeEnd: '19:00',
          description: 'Patient must turn off the stove after cooking'
        }
      ]
    }
  ])

  // Form States
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  
  // Patient Form
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientLocation, setPatientLocation] = useState('')
  const [careLevel, setCareLevel] = useState<'low' | 'moderate' | 'high' | 'critical'>('moderate')

  // Event Form
  const [eventType, setEventType] = useState<'medication' | 'appliance' | 'mobility' | 'custom'>('medication')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [eventDescription, setEventDescription] = useState('')

  // Analytics State (unchanged)
  const [ruleInput,     setRuleInput]     = useState('Patient should only take red pills.')
  const [activeRule,    setActiveRule]     = useState('Patient should only take red pills.')
  const [lastTriggered, setLastTriggered] = useState('4 minutes ago')
  const [saving,        setSaving]        = useState(false)
  const [saveStatus,    setSaveStatus]    = useState<'idle' | 'saved' | 'failed'>('idle')
  const [patientStats,  setPatientStats]  = useState<PatientStats[]>([])
  const [activeAlerts,  setActiveAlerts]  = useState<any[]>([])
  const [loadingStats, setLoadingStats]  = useState(true)
  const [analyticsPatientId, setAnalyticsPatientId] = useState<string | null>(null)

  // Load current medication setting from backend on mount
  useEffect(() => {
    async function load() {
      const med = await fetchMedication()
      if (med?.expected_color) {
        const rule = `Patient should only take ${med.expected_color} pills.`
        setRuleInput(rule)
        setActiveRule(rule)
      }
    }
    load()
  }, [])

  // Load patient stats and alerts
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingStats(true)
        const [stats, alerts] = await Promise.all([
          getPatientStats(),
          getActiveAlerts()
        ])
        setPatientStats(stats)
        setActiveAlerts(alerts)
        if (stats.length > 0 && !analyticsPatientId) {
          setAnalyticsPatientId(stats[0].patientId)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoadingStats(false)
      }
    }
    loadData()
  }, [])

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [stats, alerts] = await Promise.all([
          getPatientStats(),
          getActiveAlerts()
        ])
        setPatientStats(stats)
        setActiveAlerts(alerts)
      } catch (error) {
        console.error('Error refreshing data:', error)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Patient Functions
  const handleAddPatient = () => {
    if (patientName && patientAge && patientLocation && careLevel) {
      if (editingPatient) {
        // Update existing patient
        setPatients(patients.map(patient => 
          patient.id === editingPatient 
            ? { ...patient, name: patientName, age: parseInt(patientAge), location: patientLocation, careLevel }
            : patient
        ))
        setEditingPatient(null)
      } else {
        // Add new patient
        const newPatient: PatientProfile = {
          id: Date.now().toString(),
          name: patientName,
          age: parseInt(patientAge),
          location: patientLocation,
          careLevel,
          events: []
        }
        setPatients([...patients, newPatient])
        // Switch to patient detail view for the new patient
        setSelectedPatientId(newPatient.id)
        setCurrentView('detail')
      }
      // Reset form
      setPatientName('')
      setPatientAge('')
      setPatientLocation('')
      setCareLevel('moderate')
      setShowPatientForm(false)
    }
  }

  const handleEditPatient = (patient: PatientProfile) => {
    setPatientName(patient.name)
    setPatientAge(patient.age.toString())
    setPatientLocation(patient.location)
    setCareLevel(patient.careLevel)
    setEditingPatient(patient.id)
    setShowPatientForm(true)
    // Stay in profiles view when editing
    setCurrentView('profiles')
  }

  const handleAddEvent = () => {
    if (selectedPatientId && eventType && timeStart && timeEnd && eventDescription) {
      if (editingEvent) {
        // Update existing event
        setPatients(patients.map(patient => 
          patient.id === selectedPatientId 
            ? { 
                ...patient, 
                events: patient.events.map(event => 
                  event.id === editingEvent 
                    ? { ...event, eventType, timeStart, timeEnd, description: eventDescription }
                    : event
                )
              }
            : patient
        ))
        setEditingEvent(null)
      } else {
        // Add new event
        const newEvent: MonitoringEvent = {
          id: Date.now().toString(),
          eventType,
          timeStart,
          timeEnd,
          description: eventDescription
        }
        
        setPatients(patients.map(patient => 
          patient.id === selectedPatientId 
            ? { ...patient, events: [...patient.events, newEvent] }
            : patient
        ))
      }
      
      // Reset form and close it
      setEventType('medication')
      setTimeStart('')
      setTimeEnd('')
      setEventDescription('')
      setShowEventForm(false)
    }
  }

  const handleEditEvent = (patientId: string, event: MonitoringEvent) => {
    setEventType(event.eventType)
    setTimeStart(event.timeStart)
    setTimeEnd(event.timeEnd)
    setEventDescription(event.description)
    setEditingEvent(event.id)
    setShowEventForm(true)
  }

  const handleRemoveEvent = (patientId: string, eventId: string) => {
    setPatients(patients.map(patient => 
      patient.id === patientId 
        ? { ...patient, events: patient.events.filter(event => event.id !== eventId) }
        : patient
    ))
  }

  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  // Analytics Functions
  async function saveRule() {
    const trimmed = ruleInput.trim()
    if (!trimmed) return

    setActiveRule(trimmed)
    setLastTriggered('just now')

    const color = trimmed.toLowerCase().includes('red') ? 'red' : 
                  trimmed.toLowerCase().includes('blue') ? 'blue' : 
                  trimmed.toLowerCase().includes('green') ? 'green' : 'red'
    
    if (color) {
      setSaving(true)
      setSaveStatus('idle')
      const ok = await saveMedication(color)
      setSaving(false)
      setSaveStatus(ok ? 'saved' : 'failed')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const selectedPatientData = patientStats.find(p => p.patientId === analyticsPatientId)

  const getCareLevelStyles = (level: string) => {
    const config = CARE_LEVEL_LABELS[level as keyof typeof CARE_LEVEL_LABELS]
    return {
      bg: `bg-${config.color}-100`,
      text: `text-${config.color}-800`,
      label: config.label
    }
  }

  return (
    <div className="p-8">
      <header className="mb-7 fade-up">
        <h1 className="text-3xl font-serif text-cs-primary-dk">
          Patient Profiles & Analytics
        </h1>
        <p className="text-sm mt-1 text-cs-muted">
          Manage patient profiles and view AI-powered health analytics.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Patient Profiles / Events */}
        <div className="max-w-2xl">
          {currentView === 'profiles' ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-cs-primary-dk">
                  Patient Profiles
                </h2>
                <button
                  onClick={() => setShowPatientForm(true)}
                  className="px-4 py-2 border-2 border-cs-primary text-cs-primary rounded-full hover:bg-cs-primary hover:text-white active:bg-cs-primary-dk active:border-cs-primary-dk active:text-white transition-colors font-medium"
                >
                  Add Patient
                </button>
              </div>

              {/* Add Patient Form */}
              {showPatientForm && (
                <div className="bg-cs-surface border border-cs-border rounded-xl p-6 mb-6 shadow-cs-shadow">
                  <h3 className="text-lg font-bold text-cs-primary-dk mb-4">
                    {editingPatient ? 'Edit Patient' : 'Add New Patient'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-cs-primary-dk mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Margaret"
                        className="w-full px-3 py-2 border border-cs-border rounded-lg text-cs-ink bg-cs-surface focus:outline-none focus:border-cs-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-cs-primary-dk mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="e.g. 78"
                        className="w-full px-3 py-2 border border-cs-border rounded-lg text-cs-ink bg-cs-surface focus:outline-none focus:border-cs-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-cs-primary-dk mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={patientLocation}
                        onChange={(e) => setPatientLocation(e.target.value)}
                        placeholder="e.g. Room 1"
                        className="w-full px-3 py-2 border border-cs-border rounded-lg text-cs-ink bg-cs-surface focus:outline-none focus:border-cs-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-cs-primary-dk mb-2">
                        Care Level
                      </label>
                      <div className="flex gap-2">
                        {Object.entries(CARE_LEVEL_LABELS).map(([key, config]) => {
                          const isSelected = careLevel === key
                          const getColors = (color: string) => {
                            switch (color) {
                              case 'green': return { bg: isSelected ? 'bg-green-500' : 'bg-green-100', text: isSelected ? 'text-white' : 'text-green-800', border: isSelected ? '' : 'border-green-300' }
                              case 'teal': return { bg: isSelected ? 'bg-teal-500' : 'bg-teal-100', text: isSelected ? 'text-white' : 'text-teal-800', border: isSelected ? '' : 'border-teal-300' }
                              case 'amber': return { bg: isSelected ? 'bg-amber-500' : 'bg-amber-100', text: isSelected ? 'text-white' : 'text-amber-800', border: isSelected ? '' : 'border-amber-300' }
                              case 'red': return { bg: isSelected ? 'bg-red-500' : 'bg-red-100', text: isSelected ? 'text-white' : 'text-red-800', border: isSelected ? '' : 'border-red-300' }
                              default: return { bg: 'bg-gray-500', text: 'text-white', border: '' }
                            }
                          }
                          const colors = getColors(config.color)
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setCareLevel(key as any)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${colors.bg} ${colors.text} ${colors.border}`}
                            >
                              {config.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3">
                    <button
                      onClick={handleAddPatient}
                      disabled={!patientName || !patientAge || !patientLocation}
                      className="flex-1 py-2 bg-cs-primary text-white rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {editingPatient ? 'Update Patient' : 'Save Patient'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPatientForm(false)
                        setEditingPatient(null)
                        setPatientName('')
                        setPatientAge('')
                        setPatientLocation('')
                        setCareLevel('moderate')
                      }}
                      className="flex-1 py-2 border border-cs-border text-cs-ink rounded-full font-bold hover:bg-cs-surface transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  </div>
                </div>
              )}

              {/* Patient List */}
              <div className="space-y-4">
                {patients.map((patient) => {
                  const careStyles = getCareLevelStyles(patient.careLevel)
                  return (
                    <div key={patient.id} className="bg-cs-surface border border-cs-border rounded-xl p-5 shadow-cs-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-cs-ink">
                            {patient.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${careStyles.bg} ${careStyles.text}`}>
                            {careStyles.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditPatient(patient)}
                            className="text-cs-primary hover:text-cs-primary-dk font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatientId(patient.id)
                              setCurrentView('detail')
                            }}
                            className="text-cs-primary hover:text-cs-primary-dk font-medium text-sm"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-cs-muted mb-2">
                        {patient.age} · {patient.location} · {patient.events.length} events
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              {/* Back Link */}
              <div className="mb-6">
                <button
                  onClick={() => setCurrentView('profiles')}
                  className="text-cs-primary hover:text-cs-primary-dk font-medium text-sm"
                >
                  ← All Patients
                </button>
              </div>

              {selectedPatient && (
                <>
                  {/* Patient Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-bold text-cs-ink">
                      {selectedPatient.name}
                    </h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCareLevelStyles(selectedPatient.careLevel).bg} ${getCareLevelStyles(selectedPatient.careLevel).text}`}>
                      {getCareLevelStyles(selectedPatient.careLevel).label}
                    </span>
                  </div>

                  {/* Monitoring Events Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-cs-primary-dk">
                        Monitoring Events
                      </h3>
                      <button
                        onClick={() => setShowEventForm(true)}
                        className="px-4 py-2 border-2 border-cs-primary text-cs-primary rounded-full hover:bg-cs-primary hover:text-white transition-colors font-medium"
                      >
                        Add Event
                      </button>
                    </div>

                    {/* Add Event Form */}
                    {showEventForm && (
                      <div className="bg-cs-surface border border-cs-border rounded-xl p-6 mb-6 shadow-cs-shadow">
                        <h4 className="text-md font-bold text-cs-primary-dk mb-4">
                          {editingEvent ? 'Edit Monitoring Event' : 'Add Monitoring Event'}
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-cs-primary-dk mb-2">
                              Event Type
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              {EVENT_TYPE_OPTIONS.map((type) => (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() => setEventType(type.id as any)}
                                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                    eventType === type.id 
                                      ? 'border-cs-primary bg-cs-accent text-cs-primary-dk' 
                                      : 'border-gray-300 bg-white text-cs-ink hover:border-cs-primary'
                                  }`}
                                >
                                  <span className="text-lg">{type.emoji}</span>
                                  {type.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-bold text-cs-primary-dk mb-2">
                                From
                              </label>
                              <input
                                type="text"
                                value={timeStart}
                                onChange={(e) => setTimeStart(e.target.value)}
                                placeholder="08:00"
                                className="w-full px-3 py-2 border border-cs-border rounded-lg text-cs-ink bg-cs-surface focus:outline-none focus:border-cs-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-cs-primary-dk mb-2">
                                To
                              </label>
                              <input
                                type="text"
                                value={timeEnd}
                                onChange={(e) => setTimeEnd(e.target.value)}
                                placeholder="09:00"
                                className="w-full px-3 py-2 border border-cs-border rounded-lg text-cs-ink bg-cs-surface focus:outline-none focus:border-cs-primary"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-cs-primary-dk mb-2">
                              Description
                            </label>
                            <textarea
                              value={eventDescription}
                              onChange={(e) => setEventDescription(e.target.value)}
                              placeholder="e.g. Patient should take the red pill from the left compartment"
                              rows={3}
                              className="w-full px-3 py-2 border border-cs-border rounded-lg text-cs-ink bg-cs-surface focus:outline-none focus:border-cs-primary resize-vertical"
                            />
                          </div>

                          <div className="flex gap-3">
                          <button
                            onClick={handleAddEvent}
                            disabled={!eventType || !timeStart || !timeEnd || !eventDescription}
                            className="flex-1 py-2 bg-cs-primary text-white rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {editingEvent ? 'Update Event' : 'Add Event'}
                          </button>
                          <button
                            onClick={() => {
                              setShowEventForm(false)
                              setEditingEvent(null)
                              setEventType('medication')
                              setTimeStart('')
                              setTimeEnd('')
                              setEventDescription('')
                            }}
                            className="flex-1 py-2 border border-cs-border text-cs-ink rounded-full font-bold hover:bg-cs-surface transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* Events List */}
                    <div className="space-y-3">
                      {selectedPatient.events.map((event) => {
                        const eventTypeConfig = EVENT_TYPE_OPTIONS.find(t => t.id === event.eventType)
                        return (
                          <div key={event.id} className="bg-cs-surface border border-cs-border rounded-lg p-4 shadow-cs-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-cs-accent text-cs-primary-dk`}>
                                  {eventTypeConfig?.emoji} {eventTypeConfig?.label}
                                </span>
                                <span className="text-sm text-cs-muted">
                                  {event.timeStart} - {event.timeEnd}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditEvent(selectedPatient.id, event)}
                                className="text-cs-primary hover:text-cs-primary-dk text-xs font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemoveEvent(selectedPatient.id, event.id)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                              >
                                Remove
                              </button>
                            </div>
                            </div>
                            <p className="text-sm text-cs-ink">
                              {event.description}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Right Column - Analytics Dashboard (unchanged) */}
        <div>
          {/* Patient Selector */}
          <div className="mb-6">
            <label className="block text-[13px] font-bold mb-2 text-cs-primary-dk">
              Patient Analytics
            </label>
            <select
              value={analyticsPatientId || ''}
              onChange={(e) => setAnalyticsPatientId(e.target.value)}
              className="w-full text-sm mb-4 border border-cs-border rounded-lg px-3 py-2 text-cs-ink bg-cs-surface focus:outline-none focus:border-cs-primary"
              style={{ color: 'var(--cs-ink)', backgroundColor: 'var(--cs-surface)' }}
            >
              {patientStats.map(patient => (
                <option key={patient.patientId} value={patient.patientId}>
                  {patient.patientName} - {patient.room}
                </option>
              ))}
            </select>
          </div>

          {loadingStats ? (
            <div className="text-center py-8 text-cs-muted">
              Loading analytics...
            </div>
          ) : selectedPatientData ? (
            <div className="space-y-4">
              {/* Patient Info Card */}
              <div className="p-5 bg-cs-surface border border-cs-border rounded-xl shadow-cs-shadow">
                <h3 className="text-[13px] font-bold mb-3 text-cs-primary-dk">
                  Patient Overview
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-cs-muted">Room:</span>
                    <span className="text-cs-ink">{selectedPatientData.room}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cs-muted">Last Update:</span>
                    <span className="text-cs-ink">{new Date(selectedPatientData.lastUpdate).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cs-muted">Alerts Today:</span>
                    <span className={selectedPatientData.alerts.count > 0 ? 'text-cs-alert' : 'text-cs-success'}>
                      {selectedPatientData.alerts.count}
                    </span>
                  </div>
                </div>

                {/* Vitals */}
                <div className="mt-4 pt-4 border-t border-cs-border">
                  <h4 className="text-[12px] font-bold mb-2 text-cs-primary-dk">Current Vitals</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPatientData.vitals.heartRate && (
                      <div className="text-center p-2 rounded bg-cs-accent">
                        <div className="text-lg font-bold text-cs-primary-dk">
                          {selectedPatientData.vitals.heartRate}
                        </div>
                        <div className="text-xs text-cs-muted">Heart Rate</div>
                      </div>
                    )}
                    {selectedPatientData.vitals.oxygenLevel && (
                      <div className="text-center p-2 rounded bg-cs-accent">
                        <div className="text-lg font-bold text-cs-primary-dk">
                          {selectedPatientData.vitals.oxygenLevel}%
                        </div>
                        <div className="text-xs text-cs-muted">O₂ Level</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hex AI Analysis */}
              {selectedPatientData.analysis && (
                <div className="p-5 bg-cs-surface border border-cs-border rounded-xl shadow-cs-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-cs-primary-dk">
                      AI Health Analysis
                    </h3>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ 
                        background: `${getRiskColor(selectedPatientData.analysis.riskLevel)}20`,
                        color: getRiskColor(selectedPatientData.analysis.riskLevel)
                      }}
                    >
                      {selectedPatientData.analysis.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>

                  {/* Insights */}
                  {selectedPatientData.analysis.insights.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[12px] font-bold mb-2 text-cs-primary-dk">Key Insights</h4>
                      <ul className="space-y-1">
                        {selectedPatientData.analysis.insights.map((insight, i) => (
                          <li key={i} className="text-xs flex items-start gap-2 text-cs-ink">
                            <span className="text-cs-primary">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Trends */}
                  {selectedPatientData.analysis.trends.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[12px] font-bold mb-2 text-cs-primary-dk">Trends</h4>
                      <div className="space-y-2">
                        {selectedPatientData.analysis.trends.map((trend, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-cs-muted">{trend.metric}</span>
                            <div className="flex items-center gap-2">
                              <span 
                                className="font-semibold"
                                style={{ 
                                  color: trend.direction === 'up' ? 'var(--cs-alert)' : 
                                         trend.direction === 'down' ? 'var(--cs-success)' : 'var(--cs-muted)'
                                }}
                              >
                                {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {Math.abs(trend.change)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedPatientData.analysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-[12px] font-bold mb-2 text-cs-primary-dk">Recommendations</h4>
                      <ul className="space-y-1">
                        {selectedPatientData.analysis.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs flex items-start gap-2 text-cs-ink">
                            <span className="text-cs-success">✓</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence */}
                  <div className="mt-4 pt-3 border-t border-cs-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cs-muted">Analysis Confidence</span>
                      <span className="font-semibold text-cs-primary-dk">
                        {Math.round(selectedPatientData.analysis.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Alerts */}
              {activeAlerts.length > 0 && (
                <div className="p-5 bg-cs-surface border border-cs-border rounded-xl shadow-cs-shadow">
                  <h3 className="text-[13px] font-bold mb-3 text-cs-primary-dk">
                    Active Alerts ({activeAlerts.length})
                  </h3>
                  <div className="space-y-2">
                    {activeAlerts.slice(0, 3).map((alert, i) => (
                      <div key={i} className="p-2 rounded text-xs bg-cs-alert-lt border-l-3 border-cs-alert">
                        <div className="font-semibold text-cs-alert">{alert.type}</div>
                        <div className="text-cs-muted">{new Date(alert.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-cs-muted">
              No patient data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'high': return '#E05C5C'
    case 'medium': return '#F0A030'
    case 'low': return '#4CAF8A'
    default: return '#7A9E9E'
  }
}
