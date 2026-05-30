/**
 * LocationContext
 *
 * Tracks which restaurant location is currently active.
 * - Owners can switch between any of their locations.
 * - Staff/managers are locked to their assigned location (from JWT).
 *
 * All API calls that need a location pass the X-Restaurant-Id header
 * via the axios interceptor registered here.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const [locations, setLocations] = useState([])           // all locations for owner
  const [activeLocation, setActiveLocationState] = useState(() => {
    try {
      const stored = localStorage.getItem('active_location')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loadingLocations, setLoadingLocations] = useState(false)

  // Determine if current session is an owner or staff
  const isOwnerSession = useCallback(() => {
    const owner = localStorage.getItem('owner')
    const staff = localStorage.getItem('staff')
    return !!owner && !staff
  }, [])

  // Fetch all locations for owner and pick the active one
  const loadLocations = useCallback(async () => {
    if (!isOwnerSession()) return
    setLoadingLocations(true)
    try {
      const res = await api.get('/locations/')
      setLocations(res.data)

      // If stored active location still valid, keep it; otherwise pick first
      const stored = activeLocation
      const stillValid = stored && res.data.find(l => l.id === stored.id)
      if (!stillValid && res.data.length > 0) {
        setActiveLocation(res.data[0])
      } else if (stillValid) {
        // refresh name/address in case it changed
        const refreshed = res.data.find(l => l.id === stored.id)
        if (refreshed) setActiveLocation(refreshed)
      }
    } catch {
      // ignore — user may not be logged in yet
    } finally {
      setLoadingLocations(false)
    }
  }, [isOwnerSession])  // eslint-disable-line

  const setActiveLocation = useCallback((location) => {
    setActiveLocationState(location)
    if (location) {
      localStorage.setItem('active_location', JSON.stringify(location))
    } else {
      localStorage.removeItem('active_location')
    }
  }, [])

  // Load locations when owner logs in
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && isOwnerSession()) {
      loadLocations()
    }
  }, [])  // eslint-disable-line

  // Attach X-Restaurant-Id header to every request when a location is selected
  useEffect(() => {
    const interceptorId = api.interceptors.request.use((config) => {
      if (activeLocation?.id) {
        config.headers['X-Restaurant-Id'] = activeLocation.id
      } else {
        delete config.headers['X-Restaurant-Id']
      }
      return config
    })
    return () => api.interceptors.request.eject(interceptorId)
  }, [activeLocation])

  return (
    <LocationContext.Provider value={{
      locations,
      activeLocation,
      setActiveLocation,
      loadLocations,
      loadingLocations,
      isOwnerSession: isOwnerSession(),
    }}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => useContext(LocationContext)
