import { Router } from 'express'
import { Reservation } from '../models/Reservation.js'

const router = Router()

// Public Route: Book a Table
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, date, time, guestsCount, notes } = req.body
    const tenantId = req.tenantId

    if (!name || !email || !phone || !date || !time || !guestsCount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const reservation = new Reservation({
      tenantId,
      name,
      email,
      phone,
      date,
      time,
      guestsCount,
      notes
    })

    await reservation.save()

    // Emit WebSocket event for admins
    const io = req.app.get('io')
    if (io) {
      io.to('admin:orders').emit('reservation:new', reservation)
    }

    res.status(201).json({ message: 'Reservation requested successfully', reservation })
  } catch (err) {
    console.error('Failed to create reservation:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
