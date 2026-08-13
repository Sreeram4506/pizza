import { Router } from 'express'
import { verifyAdmin } from '../middleware/auth.js'
import { createDelivery, getDeliveryStatus, cancelDelivery, updateDelivery } from '../utils/doordash.js'

const router = Router()

router.post('/deliveries', verifyAdmin, async (req, res) => {
  try {
    const delivery = await createDelivery(req.body)
    res.status(201).json(delivery)
  } catch (err) {
    console.error('[DOORDASH] Failed to create delivery:', err.message)
    res.status(err.status || 502).json({ error: 'Failed to create DoorDash delivery', details: err.data })
  }
})

router.get('/deliveries/:externalDeliveryId', verifyAdmin, async (req, res) => {
  try {
    const delivery = await getDeliveryStatus(req.params.externalDeliveryId)
    res.json(delivery)
  } catch (err) {
    console.error('[DOORDASH] Failed to fetch delivery status:', err.message)
    res.status(err.status || 502).json({ error: 'Failed to fetch DoorDash delivery status', details: err.data })
  }
})

router.patch('/deliveries/:externalDeliveryId', verifyAdmin, async (req, res) => {
  try {
    const delivery = await updateDelivery(req.params.externalDeliveryId, req.body)
    res.json(delivery)
  } catch (err) {
    console.error('[DOORDASH] Failed to update delivery:', err.message)
    res.status(err.status || 502).json({ error: 'Failed to update DoorDash delivery', details: err.data })
  }
})

router.put('/deliveries/:externalDeliveryId/cancel', verifyAdmin, async (req, res) => {
  try {
    const delivery = await cancelDelivery(req.params.externalDeliveryId)
    res.json(delivery)
  } catch (err) {
    console.error('[DOORDASH] Failed to cancel delivery:', err.message)
    res.status(err.status || 502).json({ error: 'Failed to cancel DoorDash delivery', details: err.data })
  }
})

export default router
