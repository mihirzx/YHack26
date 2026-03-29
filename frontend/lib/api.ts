const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const HEX_API_KEY = process.env.HEX_API_KEY

// ── Types ───────────────────────────────────────────────

export interface BackendEvent {
  event_id: string
  timestamp: string
  type: string
  expected?: string
  observed?: string
  corrected: boolean
  severity: string
}

export interface MedicationSetting {
  expected_color: string
}

export interface SensorData {
  timestamp: string
  sensorType: string
  value: number
  unit: string
  location: string
}

export interface HexAnalysisResult {
  insights: string[]
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
  trends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
  }[];
  confidence: number;
}

export interface PatientStats {
  patientId: string
  patientName: string
  room: string
  lastUpdate: string
  vitals: {
    heartRate?: number
    bloodPressure?: { systolic: number; diastolic: number }
    temperature?: number
    oxygenLevel?: number
  }
  alerts: {
    count: number
    type: string[]
    severity: 'low' | 'medium' | 'high'
  }
  analysis?: HexAnalysisResult
}

// ── Existing API functions ───────────────────────────────

export async function fetchEvents(limit = 50): Promise<BackendEvent[]> {
  try {
    const response = await fetch(`${API_URL}/events?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`)
    }
    return await response.json()
  } catch (err) {
    console.warn('[api] fetchEvents failed:', err)
    return []
  }
}

export async function fetchMedication(): Promise<MedicationSetting | null> {
  try {
    const response = await fetch(`${API_URL}/settings/medication`)
    if (!response.ok) {
      throw new Error(`Failed to fetch medication: ${response.statusText}`)
    }
    return await response.json()
  } catch (err) {
    console.warn('[api] fetchMedication failed:', err)
    return null
  }
}

export async function saveMedication(color: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/settings/medication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expected_color: color })
    })
    return response.ok
  } catch (err) {
    console.warn('[api] saveMedication failed:', err)
    return false
  }
}

// ── New Hex API and MongoDB integration ──────────────────

// Fetch sensor data from backend (MongoDB)
export async function fetchSensorData(patientId?: string, timeRange?: string): Promise<SensorData[]> {
  try {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (timeRange) params.append('timeRange', timeRange);

    const response = await fetch(`${API_URL}/api/sensors/data?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sensor data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    throw error;
  }
}

// Send data to Hex API for analysis
export async function analyzeWithHex(data: SensorData[]): Promise<HexAnalysisResult> {
  try {
    const response = await fetch('https://api.hex.tech/v1/analyze', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: data,
        analysisType: 'health_monitoring',
        timeframe: '24h',
        metrics: ['vitals', 'trends', 'anomalies', 'risk_assessment']
      })
    });

    if (!response.ok) {
      throw new Error(`Hex API analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      insights: result.insights || [],
      riskLevel: result.riskLevel || 'low',
      recommendations: result.recommendations || [],
      trends: result.trends || [],
      confidence: result.confidence || 0.8
    };
  } catch (error) {
    console.error('Error analyzing with Hex API:', error);
    // Return fallback analysis
    return {
      insights: ['Unable to perform advanced analysis'],
      riskLevel: 'medium',
      recommendations: ['Check sensor connectivity'],
      trends: [],
      confidence: 0.1
    };
  }
}

// Get comprehensive patient stats with Hex analysis
export async function getPatientStats(): Promise<PatientStats[]> {
  try {
    const response = await fetch(`${API_URL}/api/patients/stats`);
    if (!response.ok) {
      // Return mock data if backend is not available
      return [
        {
          patientId: '1',
          patientName: 'Margaret',
          room: 'Room 1',
          lastUpdate: new Date().toISOString(),
          alerts: { count: 2, type: ['critical'], severity: 'medium' },
          vitals: { heartRate: 72, oxygenLevel: 98 },
          analysis: {
            riskLevel: 'medium',
            insights: ['Patient shows stable vitals', 'Medication adherence improved'],
            trends: [{ metric: 'Heart Rate', direction: 'stable', change: 0 }],
            recommendations: ['Continue current medication schedule'],
            confidence: 0.85
          }
        }
      ];
    }
    const patients: PatientStats[] = await response.json();

    // For each patient, get sensor data and analyze with Hex
    const patientsWithAnalysis = await Promise.all(
      patients.map(async (patient) => {
        try {
          // Get recent sensor data for this patient
          const sensorData = await fetchSensorData(patient.patientId, '24h');
          
          // Analyze with Hex API
          const analysis = await analyzeWithHex(sensorData);
          
          return {
            ...patient,
            analysis
          };
        } catch (error) {
          console.error(`Error analyzing data for patient ${patient.patientId}:`, error);
          return patient;
        }
      })
    );

    return patientsWithAnalysis;
  } catch (error) {
    console.error('Error getting patient stats:', error);
    throw error;
  }
}

// Get real-time alerts from backend
export async function getActiveAlerts(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/api/alerts/active`);
    if (!response.ok) {
      // Return mock data if backend is not available
      return [
        {
          id: '1',
          type: 'Medication Missed',
          severity: 'high',
          timestamp: new Date().toISOString(),
          patientId: '1',
          patientName: 'Margaret'
        },
        {
          id: '2', 
          type: 'Activity Detected',
          severity: 'medium',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          patientId: '1',
          patientName: 'Margaret'
        }
      ];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    return [];
  }
}
