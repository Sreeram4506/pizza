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
          <div className="bg-white rounded-2xl p-12 border border-stone-100 text-center shadow-sm">
            <div className="w-20 h-20 bg-tomato-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-tomato-600">📱</span>
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">Social Hub</h3>
            <p className="text-stone-500 max-w-md mx-auto">Connect your Instagram, Facebook, and Twitter accounts to sync posts and track engagement.</p>
            <div className="mt-8">
              <button className="px-8 py-3 bg-stone-100 text-stone-400 font-bold rounded-full cursor-not-allowed">
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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight">Marketing</h2>
          <p className="text-stone-500 mt-2 text-lg">Growth tools to reach more pizza lovers</p>
        </div>

        <div className="flex p-1 bg-stone-100 rounded-xl">
          {['email', 'promotions', 'social'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 text-sm font-bold capitalize transition-all duration-300 rounded-lg ${activeTab === tab
                  ? 'bg-white text-tomato-600 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  )
}
