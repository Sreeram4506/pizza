import { useState } from 'react'
import { motion } from 'framer-motion'
import EmailCampaigns from './EmailCampaigns'
import PromotionalBanners from './PromotionalBanners'

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('email')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'email':
        return <EmailCampaigns />
      case 'promotions':
        return <PromotionalBanners />
      case 'social':
        return (
          <div className="bg-wood-800 rounded-3xl p-12 border border-wood-700 text-center">
            <div className="w-20 h-20 bg-tomato-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📱</span>
            </div>
            <h3 className="text-2xl font-display font-black text-white mb-2">Social Hub</h3>
            <p className="text-wood-400 max-w-sm mx-auto text-sm">Connect your Instagram and Facebook to sync posts and track growth.</p>
            <div className="mt-8">
              <button className="px-8 py-3 bg-wood-700 text-wood-500 font-black text-xs uppercase tracking-widest rounded-xl cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 lg:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-black text-white tracking-tight">Marketing</h2>
          <p className="text-wood-400 mt-1 text-sm">Growth tools to reach more pizza lovers</p>
        </div>

        <div className="flex p-1.5 bg-wood-800 rounded-2xl border border-wood-700 overflow-x-auto scrollbar-hide">
          {['email', 'promotions', 'social'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${activeTab === tab
                ? 'bg-tomato-600 text-white shadow-lg'
                : 'text-wood-400 hover:text-white'
                }`}
            >
              {tab === 'email' ? '📬 Email' : tab === 'promotions' ? '🏷️ Offers' : '📱 Social'}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  )
}
