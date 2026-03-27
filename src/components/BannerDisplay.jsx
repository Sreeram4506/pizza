import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import wsService from '../services/websocket.js'

export default function BannerDisplay({ position = 'middle' }) {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadActiveBanners = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/public/promotional-banners')
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
      }
    } catch (err) {
      console.error('BannerDisplay: Failed to load banners:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActiveBanners()
    wsService.connect()

    const refreshBanners = () => {
      loadActiveBanners()
    }

    wsService.on('promotional_banner_created', refreshBanners)
    wsService.on('promotional_banner_updated', refreshBanners)
    wsService.on('promotional_banner_deleted', refreshBanners)
    wsService.on('promotional_banners_updated', refreshBanners)

    return () => {
      wsService.off('promotional_banner_created', refreshBanners)
      wsService.off('promotional_banner_updated', refreshBanners)
      wsService.off('promotional_banner_deleted', refreshBanners)
      wsService.off('promotional_banners_updated', refreshBanners)
    }
  }, [loadActiveBanners])

  const handleBannerClick = async (banner) => {
    try {
      await fetch(`/api/admin/promotional-banners/${banner._id}/click`, { method: 'POST' })
    } catch (err) {
      console.error('Failed to track click:', err)
    }

    if (banner.buttonLink) {
      if (banner.buttonLink.startsWith('/') || banner.buttonLink.startsWith('#')) {
        navigate(banner.buttonLink)
      } else {
        window.location.href = banner.buttonLink
      }
    }
  }

  if (loading || banners.length === 0) return null

  const positionBanners = banners.filter(banner => banner.position === position)
  if (positionBanners.length === 0) return null

  return (
    <div className="w-full">
      {positionBanners.map((banner, index) => {
        if (position === 'top') {
          return (
            <motion.div
              key={banner._id}
              className="w-full relative z-[60] py-2.5 px-4 shadow-sm"
              style={{ backgroundColor: banner.backgroundColor || '#C1440E' }}
            >
              <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
                <span className="font-body text-sm font-semibold tracking-[0.02em]" style={{ color: banner.textColor || '#FFFFFF' }}>
                  {banner.title}
                </span>
                {banner.subtitle && (
                  <span className="font-body text-xs opacity-90 hidden md:inline" style={{ color: banner.textColor || '#FFFFFF' }}>
                    - {banner.subtitle}
                  </span>
                )}
                {banner.buttonText && (
                  <button
                    onClick={() => handleBannerClick(banner)}
                    className="mt-1 sm:mt-0 px-3 py-1 bg-white/20 hover:bg-white/30 transition-colors rounded-full text-[11px] font-bold tracking-[0.08em] uppercase ml-0 sm:ml-4"
                    style={{ color: banner.textColor || '#FFFFFF', border: `1px solid ${banner.textColor || '#FFFFFF'}40` }}
                  >
                    {banner.buttonText}
                  </button>
                )}
              </div>
            </motion.div>
          )
        }

        if (position === 'hero') {
          return (
            <motion.div
              key={banner._id}
              className="absolute left-1/2 -translate-x-1/2 bottom-8 z-30 w-[90%] max-w-lg"
            >
              <div
                className="rounded-2xl shadow-2xl p-6 backdrop-blur-md border border-white/10"
                style={{ backgroundColor: `${banner.backgroundColor || '#1A1410'}e6` }}
              >
                <div className="text-center">
                  <h3 className="font-display italic text-2xl mb-1" style={{ color: banner.textColor || '#F2EBD9' }}>{banner.title}</h3>
                  {banner.subtitle && <p className="font-body text-sm font-semibold opacity-90 mb-2" style={{ color: banner.textColor || '#F2EBD9' }}>{banner.subtitle}</p>}
                  {banner.description && <p className="font-body text-xs opacity-75 mb-4 line-clamp-2" style={{ color: banner.textColor || '#F2EBD9' }}>{banner.description}</p>}
                  {banner.buttonText && (
                    <button
                      onClick={() => handleBannerClick(banner)}
                      className="w-full py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: banner.textColor || '#F2EBD9', color: banner.backgroundColor || '#1A1410' }}
                    >
                      {banner.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        }

        return (
          <motion.div
            key={banner._id}
            className={`w-full ${index > 0 ? 'mt-4' : ''}`}
          >
            <div
              className={`relative overflow-hidden ${position === 'bottom' ? 'mt-12 shadow-xl' : 'border-y border-[rgba(212,146,42,0.12)]'}`}
              style={{ backgroundColor: banner.backgroundColor || '#1A1410' }}
            >
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
              }} />

              <div className={`max-w-[1400px] mx-auto px-6 lg:px-12 ${position === 'bottom' ? 'py-12 lg:py-16' : 'py-8'} relative z-10 text-center`}>
                <h2
                  className={`font-display italic ${position === 'bottom' ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'} mb-2`}
                  style={{ color: banner.textColor || '#F2EBD9' }}
                >
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p
                    className={`font-body ${position === 'bottom' ? 'text-lg md:text-xl' : 'text-base md:text-lg'} mb-3 opacity-90`}
                    style={{ color: banner.textColor || '#F2EBD9' }}
                  >
                    {banner.subtitle}
                  </p>
                )}
                {banner.description && (
                  <p
                    className="font-body text-sm max-w-2xl mx-auto mb-6 opacity-75 leading-relaxed"
                    style={{ color: banner.textColor || '#F2EBD9' }}
                  >
                    {banner.description}
                  </p>
                )}
                {banner.buttonText && (
                  <motion.button
                    onClick={() => handleBannerClick(banner)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-8 ${position === 'bottom' ? 'py-4 text-base' : 'py-3 text-sm'} bg-white text-[#1A1410] font-body font-bold tracking-[0.15em] uppercase transition-all shadow-lg rounded-xl mt-2`}
                    style={{ backgroundColor: banner.textColor || '#F2EBD9', color: banner.backgroundColor || '#1A1410' }}
                  >
                    {banner.buttonText}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
