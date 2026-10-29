const BRAZIL_COUNTRY_CODE = '55'

export function whatsappLink(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return null
  const withCountryCode = digits.startsWith(BRAZIL_COUNTRY_CODE) ? digits : `${BRAZIL_COUNTRY_CODE}${digits}`
  return `https://wa.me/${withCountryCode}`
}

export function mapsLink(address) {
  if (!address?.trim()) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function mailtoLink(email) {
  if (!email?.trim()) return null
  return `mailto:${email}`
}
