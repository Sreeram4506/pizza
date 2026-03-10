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
          <div className="bg-white rounded-[3rem] p-24 border border-[rgba(26,20,16,0.06)] text-center shadow-sm">
            <div className="w-24 h-24 bg-[#FAFAF8] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <span className="text-4xl grayscale opacity-30">📱</span>
            </div>
            <h3 className="text-3xl font-sans font-bold text-[#1A1410] mb-4">Social Synergy</h3>
            <p className="text-[#9B8D74] max-w-sm mx-auto text-sm font-medium leading-relaxed">Connect your visual storytelling channels to sync posts and track audience expansion.</p>
            <div className="mt-10">
              <span className="inline-block px-8 py-3 bg-[#FAFAF8] text-[#9B8D74] font-bold text-[10px] uppercase tracking-[0.3em] rounded-2xl border border-[rgba(26,20,16,0.06)]">
                Future Engagement Module
              </span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-[1px] bg-ember-600" />
            <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-ember-600">Growth Orchestration</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-[#1A1410] leading-tight">
            Marketing Core
          </h2>
          <p className="text-[#9B8D74] mt-2 font-medium tracking-tight">Expand your reach across the digital Mediterranean landscape.</p>
        </div>

        <div className="flex p-1.5 bg-white rounded-[1.5rem] border border-[rgba(26,20,16,0.06)] overflow-x-auto scrollbar-hide shadow-sm backdrop-blur-xl bg-white/90">
          {['email', 'promotions', 'social'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${activeTab === tab
                ? 'bg-[#1A1410] text-white shadow-lg'
                : 'text-[#9B8D74] hover:bg-[#FAFAF8] hover:text-[#1A1410]'
                }`}
            >
              {tab === 'email' ? '📬 Dispatch' : tab === 'promotions' ? '🏷️ Offers' : '📱 Social'}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  )
}
