import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useSettings } from '../context/SettingsContext'

export default function Contact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const { settings, loading } = useSettings()

  const contactInfo = [
    { 
      icon: '🕐', 
      title: 'Hours', 
      info: 'Mon-Sun: 10 AM - 11 PM',
      subtext: 'Kitchen closes at 10:30 PM',
      color: 'bg-crust-100 text-crust-700'
    },
    { 
      icon: '📍', 
      title: 'Address', 
      info: loading ? 'Loading...' : settings.address,
      subtext: '',
      color: 'bg-tomato-100 text-tomato-700'
    },
    { 
      icon: '📞', 
      title: 'Phone', 
      info: loading ? 'Loading...' : settings.phone,
      subtext: 'Order online for faster service',
      color: 'bg-basil-100 text-basil-700'
    },
  ]

  return (
    <section id="contact" ref={ref} className="py-24 relative bg-white overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-72 h-72 bg-tomato-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-basil-50 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 bg-tomato-100 rounded-full mb-6"
          >
            <span className="text-2xl">📞</span>
            <span className="text-tomato-700 text-sm font-semibold tracking-wide">Get in Touch</span>
          </motion.div>
          
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-wood-800 mb-6 tracking-tight">
            Contact <span className="text-tomato-600">Us</span>
          </h2>
          <p className="text-wood-500 text-lg max-w-2xl mx-auto">
            Have a question or special request? We'd love to hear from you! 
            Reach out to us anytime.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16"
        >
          {contactInfo.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-3xl p-8 border border-crust-100 shadow-sm hover:shadow-pizza transition-all text-center group"
            >
              <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <h3 className="font-display font-bold text-xl text-wood-800 mb-3">{item.title}</h3>
              <p className="text-wood-700 font-semibold mb-1">{item.info}</p>
              <p className="text-wood-400 text-sm">{item.subtext}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <motion.a
            href={`tel:${settings.phone.replace(/\D/g, '')}`}
            className="px-8 py-4 bg-tomato-600 text-white font-bold rounded-full shadow-pizza hover:bg-tomato-700 transition-all inline-flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Now
          </motion.a>
          <motion.a
            href={`mailto:${settings.email}`}
            className="px-8 py-4 bg-white text-wood-700 font-bold rounded-full border-2 border-crust-200 hover:border-tomato-400 hover:text-tomato-600 transition-all inline-flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Us
          </motion.a>
          <motion.button
            className="px-8 py-4 bg-basil-600 text-white font-bold rounded-full shadow-lg hover:bg-basil-700 transition-all inline-flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => alert('Location map would open here!')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Get Directions
          </motion.button>
        </motion.div>

        {/* Delivery Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-wood-400 text-sm mb-6 uppercase tracking-wider">Also available on</p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Uber Eats', 'DoorDash', 'Grubhub', 'Postmates'].map((partner) => (
              <div
                key={partner}
                className="px-6 py-3 bg-white rounded-full border border-crust-200 text-wood-600 font-medium hover:border-tomato-300 hover:text-tomato-600 transition-all cursor-pointer"
              >
                {partner}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
