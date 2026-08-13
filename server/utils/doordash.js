import jwt from 'jsonwebtoken'
import fetch from 'node-fetch'

const DRIVE_API_BASE = 'https://openapi.doordash.com/drive/v2'

function getCredentials() {
  const developerId = process.env.DOORDASH_DEVELOPER_ID
  const keyId = process.env.DOORDASH_KEY_ID
  const signingSecret = process.env.DOORDASH_SIGNING_SECRET

  if (!developerId || !keyId || !signingSecret) {
    throw new Error('DoorDash Drive is not configured (missing DOORDASH_DEVELOPER_ID / DOORDASH_KEY_ID / DOORDASH_SIGNING_SECRET)')
  }

  return { developerId, keyId, signingSecret }
}

// Generates a short-lived JWT for authenticating Drive API requests.
// Never log the returned token - it's a bearer credential.
export function generateDriveJWT() {
  const { developerId, keyId, signingSecret } = getCredentials()

  const payload = {
    aud: 'doordash',
    iss: developerId,
    kid: keyId,
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000)
  }

  return jwt.sign(payload, Buffer.from(signingSecret, 'base64'), {
    algorithm: 'HS256',
    header: { 'dd-ver': 'DD-JWT-V1' }
  })
}

async function driveRequest(method, path, body) {
  const token = generateDriveJWT()

  const res = await fetch(`${DRIVE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message = data?.message || data?.field_errors || JSON.stringify(data)
    const err = new Error(`DoorDash Drive API ${method} ${path} failed (${res.status}): ${message}`)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

// deliveryParams follows the Drive API's create-delivery request shape:
// external_delivery_id, pickup_address, pickup_business_name, pickup_phone_number,
// dropoff_address, dropoff_business_name, dropoff_phone_number, order_value, etc.
export function createDelivery(deliveryParams) {
  return driveRequest('POST', '/deliveries', deliveryParams)
}

export function getDeliveryStatus(externalDeliveryId) {
  return driveRequest('GET', `/deliveries/${encodeURIComponent(externalDeliveryId)}`)
}

export function cancelDelivery(externalDeliveryId) {
  return driveRequest('PUT', `/deliveries/${encodeURIComponent(externalDeliveryId)}/cancel`)
}

export function updateDelivery(externalDeliveryId, updateParams) {
  return driveRequest('PATCH', `/deliveries/${encodeURIComponent(externalDeliveryId)}`, updateParams)
}
