import { motion } from 'framer-motion'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: 'Menu',
      links: ['Pizzas', 'Sides', 'Drinks', 'Desserts', 'Deals'],
    },
    {
      title: 'Company',
      links: ['About Us', 'Careers', 'Press', 'Franchise', 'Sustainability'],
    },
    {
      title: 'Support',
      links: ['Help Center', 'Order Status', 'Delivery Info', 'Allergens', 'Contact'],
    },
  ]

  const socialLinks = [
    { name: 'Instagram', icon: '📸' },
    { name: 'Facebook', icon: '👍' },
    { name: 'Twitter', icon: '🐦' },
    { name: 'TikTok', icon: '🎵' },
  ]

  return (
    <footer className="bg-wood-800 text-white relative overflow-hidden">
      {/* Decorative Top Border */}
      <div className="h-2 bg-gradient-to-r from-tomato-600 via-crust-500 to-basil-600" />

      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-10">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <motion.div
              className="flex items-center gap-3 mb-6"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-tomato-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">🍕</span>
              </div>
              <span className="font-display font-bold text-3xl text-white tracking-tight">
                Pizza<span className="text-tomato-400">Blast</span>
              </span>
            </motion.div>

            <p className="text-wood-300 text-sm leading-relaxed mb-6 max-w-sm">
              Authentic Italian pizza made with love. Hand-tossed, wood-fired,
              and delivered fresh to your door. Taste the tradition since 2015.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href="#"
                  className="w-10 h-10 rounded-full bg-wood-700 flex items-center justify-center text-lg hover:bg-tomato-600 transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h4 className="font-display font-bold text-lg text-white mb-4">
                {column.title}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-wood-400 text-sm hover:text-tomato-400 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Download Apps Section */}
        <div className="border-t border-wood-700 pt-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-display font-bold text-lg text-white mb-1">
                Download Our App
              </h4>
              <p className="text-wood-400 text-sm">
                Get exclusive deals and faster ordering
              </p>
            </div>
            <div className="flex gap-4">
              <motion.button
                className="px-6 py-3 bg-wood-700 rounded-xl flex items-center gap-3 hover:bg-wood-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <div className="text-[10px] text-wood-400 uppercase">Download on</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </motion.button>
              <motion.button
                className="px-6 py-3 bg-wood-700 rounded-xl flex items-center gap-3 hover:bg-wood-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">🤖</span>
                <div className="text-left">
                  <div className="text-[10px] text-wood-400 uppercase">Get it on</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Delivery Partners */}
        <div className="border-t border-wood-700 pt-8 mb-8">
          <p className="text-wood-400 text-sm mb-4 text-center">
            Also available on your favorite delivery apps
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {['Uber Eats', 'DoorDash', 'Grubhub', 'Postmates', 'Seamless'].map((partner) => (
              <span
                key={partner}
                className="text-wood-500 text-sm font-medium hover:text-tomato-400 transition-colors cursor-pointer"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-wood-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-wood-400 text-sm">
            © {currentYear} PizzaBlast — Crafted with ❤️ and 🍕
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#" className="text-wood-400 hover:text-tomato-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-wood-400 hover:text-tomato-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-wood-400 hover:text-tomato-400 transition-colors">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>

      {/* Decorative Pizza Slice */}
      <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none">
        <span className="text-[20rem]">🍕</span>
      </div>
    </footer>
  )
}
