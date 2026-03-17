import { Router } from 'express'
import { Catering } from '../models/Catering.js'

const router = Router()

// Public Route: Submit Catering Inquiry
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, eventDate, eventTime, guestsCount, eventType, notes } = req.body
    const tenantId = req.tenantId

    if (!name || !email || !phone || !eventDate || !eventTime || !guestsCount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const cateringRequest = new Catering({
      tenantId,
      name,
      email,
      phone,
      eventDate,
      eventTime,
      guestsCount,
      eventType,
      notes
    })

    await cateringRequest.save()

    // Emit WebSocket event for admins
    const io = req.app.get('io')
    if (io) {
      io.to('admin:orders').emit('catering:new', cateringRequest)
    }

    res.status(201).json({ message: 'Catering inquiry submitted successfully', inquiry: cateringRequest })
  } catch (err) {
    console.error('Failed to submit catering inquiry:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
