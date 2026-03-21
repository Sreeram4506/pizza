import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Chatbot.jsx');
let c = fs.readFileSync(file, 'utf8');

// 1. Add createPortal import if not present
if (!c.includes('import { createPortal }')) {
  c = c.replace("import { useState, useEffect, useRef } from 'react'", "import { useState, useEffect, useRef } from 'react'\nimport { createPortal } from 'react-dom'");
}

// 2. Wrap the AnimatePresence block with createPortal
const animateBlockRegex = /\{\/\* Chat Window \*\/\}[\s\S]*?<AnimatePresence>[\s\S]*?\{isOpen && \([\s\S]*?<motion\.div[\s\S]*?<\/motion\.div>[\s\S]*?\)[\s\S]*?\}[\s\S]*?<\/AnimatePresence>/;

const newBlock = `{createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[9999] chatbot-overlay flex flex-col w-screen h-screen overflow-hidden"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              {/* Header */}
              <div className="chatbot-header flex items-center justify-between p-4 sm:p-8 shrink-0 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 font-serif-1947 text-xl sm:text-2xl" style={{ background: "linear-gradient(135deg, #C1440E, #8B2F0A)" }}>
                    {settings?.restaurantName?.[0] || 'M'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif-1947 text-sm sm:text-xl text-white italic truncate">{restaurantName}</h3>
                    <p className="text-[7px] sm:text-[9px] text-[#C1440E] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C1440E] animate-pulse"></span>
                      {t("chatbot.systemActive")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setView('chat')} 
                    className={\`p-2 transition-all \${view === 'chat' ? 'text-white' : 'text-white/40'}\`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all ml-2"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* TABS */}
              <div className="flex px-4 sm:px-8 py-2 gap-2 shrink-0 border-b border-white/5">
                {[
                  { id: 'chat', label: 'Assistant', icon: '💬' },
                  { id: 'menu', label: 'Menu', icon: '🍕' },
                  { id: 'cart', label: 'Cart', icon: '🛒' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setView(tab.id)}
                    className={\`flex-1 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all \${view === tab.id ? 'chatbot-tab-active' : 'chatbot-tab-inactive'}\`}
                  >
                    <span className="text-xs sm:text-sm">\${tab.icon}</span>
                    <span className="hidden xs:inline">\${tab.label}</span>
                  </button>
                ))}
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
`;

// Note: I'll only replace the top part of the AnimatePresence and the bottom part.
// But wait, regex for the whole block is better.

// Actually, I'll use a simpler search/replace for the opening and closing.
c = c.replace(/\{\/\* Chat Window \*\/\}[\s\S]*?<AnimatePresence>([\s\S]*?)<\/AnimatePresence>/, `{createPortal(<AnimatePresence>$1</AnimatePresence>, document.body)}`);

// Then fix the motion.div props
c = c.replace(/initial\=\{\{ opacity: 0, y: 20, scale: 0.98 \}\}\s+animate\=\{\{ opacity: 1, y: 0, scale: 1 \}\}\s+exit\=\{\{ opacity: 0, y: 20, scale: 0.98 \}\}/, 
'initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}');

c = c.replace('className="fixed inset-0 z-[80] chatbot-overlay flex flex-col"', 'className="fixed inset-0 z-[9999] chatbot-overlay flex flex-col w-screen h-screen overflow-hidden" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}');

fs.writeFileSync(file, c, 'utf8');
console.log('Portal and fixed position logic applied');
