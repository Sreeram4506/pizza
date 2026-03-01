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
          <div className="bg-wood-800 rounded-xl p-8 border border-wood-700 text-center">
            <p className="text-4xl mb-4">📱</p>
            <h3 className="text-xl font-bold text-white mb-2">Social Media Integration</h3>
            <p className="text-wood-400">Connect your social media accounts and track engagement.</p>
            <div className="mt-6">
              <button className="px-6 py-3 bg-tomato-600 text-white font-semibold rounded-lg hover:bg-tomato-700 transition-colors">
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-black text-white">Marketing</h2>
        <p className="text-wood-400 mt-1">Promote your restaurant and engage customers</p>
      </div>

      <div className="flex gap-4 border-b border-wood-700">
        {['email', 'promotions', 'social'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-tomato-400 border-b-2 border-tomato-400'
                : 'text-wood-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  )
}
