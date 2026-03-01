import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function BannerDisplay({ position = 'middle' }) {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActiveBanners()
  }, [])

  const loadActiveBanners = async () => {
    try {
      console.log('BannerDisplay: Loading active banners...')
      const response = await fetch('/api/admin/public/promotional-banners')
      console.log('BannerDisplay: Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('BannerDisplay: Banners loaded:', data)
        setBanners(data)
      } else {
        console.error('BannerDisplay: Failed to load banners:', response.status)
      }
    } catch (err) {
      console.error('BannerDisplay: Failed to load banners:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBannerClick = async (banner) => {
    // Track click
    try {
      await fetch(`/api/admin/promotional-banners/${banner._id}/click`, {
        method: 'POST'
      })
    } catch (err) {
      console.error('Failed to track click:', err)
    }

    // Navigate to link
    if (banner.buttonLink) {
      window.location.href = banner.buttonLink
    }
  }

  const getBannerSize = (size) => {
    switch (size) {
      case 'small': return 'py-2 px-4'
      case 'medium': return 'py-4 px-6'
      case 'large': return 'py-6 px-8'
      case 'full': return 'py-8 px-12'
      default: return 'py-4 px-6'
    }
  }

  const renderBanner = (banner) => (
    <motion.div
      key={banner._id}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full ${getBannerSize(banner.size)}`}
    >
      <div
        className="rounded-lg p-6 text-center relative overflow-hidden"
        style={{ backgroundColor: banner.backgroundColor }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <h2
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: banner.textColor }}
          >
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p
              className="text-lg md:text-xl mb-3"
              style={{ color: banner.textColor }}
            >
              {banner.subtitle}
            </p>
          )}
          {banner.description && (
            <p
              className="text-sm md:text-base mb-4 opacity-90"
              style={{ color: banner.textColor }}
            >
              {banner.description}
            </p>
          )}
          {banner.buttonText && (
            <motion.button
              onClick={() => handleBannerClick(banner)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg font-semibold transition-all transform hover:shadow-lg"
              style={{ 
                backgroundColor: banner.textColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
                color: banner.backgroundColor 
              }}
            >
              {banner.buttonText}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )

  if (loading || banners.length === 0) {
    console.log('BannerDisplay: Loading:', loading, 'Banners length:', banners.length)
    
    // Show a test banner for debugging
    if (!loading && banners.length === 0) {
      return (
        <div className="w-full py-4 px-6">
          <div className="rounded-lg p-6 text-center bg-blue-500 text-white">
            <h2 className="text-2xl font-bold mb-2">Test Banner</h2>
            <p className="text-lg mb-3">This is a test banner to verify the display is working</p>
            <p className="text-sm opacity-75">Position: {position}</p>
            <p className="text-sm opacity-75">No active banners found in database</p>
          </div>
        </div>
      )
    }
    
    return null
  }

  // Filter banners by position
  const positionBanners = banners.filter(banner => banner.position === position)
  console.log('BannerDisplay: Position:', position, 'Filtered banners:', positionBanners)
  
  if (positionBanners.length === 0) {
    console.log('BannerDisplay: No banners for position:', position)
    return null
  }

  return (
    <div className="space-y-4">
      {positionBanners.map(banner => renderBanner(banner))}
    </div>
  )
}
