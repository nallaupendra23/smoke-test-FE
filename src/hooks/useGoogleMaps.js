/**
 * Address search utilities using OpenStreetMap Nominatim.
 * Free, no API key required, no sign-up needed.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org'

/**
 * Haversine distance in km between two lat/lng pairs.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Geocode a plain-text address to { lat, lng } using Nominatim.
 * Returns null on failure.
 */
export async function geocodeAddress(address) {
  try {
    const res = await fetch(
      `${NOMINATIM}/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    )
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch {}
  return null
}

/**
 * Autocomplete address suggestions from Nominatim.
 * Returns array of { display_name, lat, lon } objects.
 */
export async function searchAddresses(query) {
  try {
    const res = await fetch(
      `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
    )
    return await res.json()
  } catch {
    return []
  }
}
