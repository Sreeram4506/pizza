import { motion, AnimatePresence } from 'framer-motion'
import { useChatbot } from '../context/ChatbotContext'
import { useSettings } from '../context/SettingsContext'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function GlobalModals() {
    const { 
        showOrderDetails, setShowOrderDetails, 
        showTimePicker, setShowTimePicker,
        orderType, setOrderType,
        deliveryAddress, setDeliveryAddress,
        orderTime, setOrderTime,
        savedAddresses, addSavedAddress
    } = useChatbot()
    const { settings } = useSettings()
    
    const [currentAddress, setCurrentAddress] = useState(null)
    const [selectedTime, setSelectedTime] = useState(orderTime || 'ASAP')
    const [customTime, setCustomTime] = useState('')
    const [isCustomTimeActive, setIsCustomTimeActive] = useState(false)
    const [timeSlots, setTimeSlots] = useState([])

    const restaurantName = settings?.restaurantName || 'Indraam'
    const restaurantAddress = settings?.address || '997 Boston Providence Hwy, Norwood, MA'

    useEffect(() => {
        if (orderTime) {
            setSelectedTime(orderTime)
            if (orderTime.includes(':')) {
                setIsCustomTimeActive(true)
                setCustomTime(orderTime)
            }
        }
    }, [orderTime])

    useEffect(() => {
        const generateSlots = () => {
            const slots = ['ASAP']
            const now = new Date()
            let current = new Date(now)
            const minutes = current.getMinutes()
            const roundedMinutes = Math.ceil(minutes / 30) * 30
            current.setMinutes(roundedMinutes)
            current.setSeconds(0)
            current.setMilliseconds(0)

            for (let i = 0; i < 12; i++) {
                const timeString = current.toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                })
                slots.push(timeString)
                current.setMinutes(current.getMinutes() + 30)
            }
            return slots
        }
        setTimeSlots(generateSlots())
    }, [showTimePicker])

    if (!showOrderDetails && !showTimePicker) return null

    const handleConfirmOrder = () => {
        if (orderType === 'delivery' && !deliveryAddress.trim()) {
            toast.error('Please enter a delivery address')
            return
        }
        
        if (isCustomTimeActive && customTime) {
            setOrderTime(customTime)
        } else {
            setOrderTime(selectedTime)
        }

        if (orderType === 'delivery') {
            addSavedAddress(deliveryAddress)
        }

        setShowOrderDetails(false)
        setShowTimePicker(false)
        toast.success(`Order set for ${orderType === 'delivery' ? 'delivery to ' + deliveryAddress.split(',')[0] : 'pickup'}`)
    }

    return (
        <>
            {/* Unified Modal Overlay */}
            <AnimatePresence>
                {(showOrderDetails || showTimePicker) && (
                    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 sm:p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowOrderDetails(false); setShowTimePicker(false); }}
                            className="absolute inset-0 bg-[#1A1410]/40 backdrop-blur-sm"
                        />

                        {/* Order Details Modal */}
                        {showOrderDetails && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-[460px] bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#E9E9E4] font-sans"
                            >
                                <button 
                                    onClick={() => setShowOrderDetails(false)}
                                    className="absolute top-8 right-8 w-10 h-10 bg-[#F5F5F0] rounded-full flex items-center justify-center hover:bg-[#E9E9E4] transition-colors"
                                >
                                    <svg className="w-5 h-5 text-[#1A1410]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>

                                <h2 className="text-[28px] font-serif font-black text-[#1A1410] mb-8 tracking-tight">Order details</h2>

                                <div className="bg-[#F5F5F0] p-1 rounded-2xl flex border border-[#E9E9E4] mb-8 shadow-inner">
                                    <button
                                        onClick={() => setOrderType('pickup')}
                                        className={`flex-1 py-3.5 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all ${orderType === 'pickup' ? 'bg-white text-[#1A1410] shadow-md' : 'text-[#1A1410]/40 hover:text-[#1A1410]'}`}
                                    >
                                        Pickup
                                    </button>
                                    <button
                                        onClick={() => setOrderType('delivery')}
                                        className={`flex-1 py-3.5 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all ${orderType === 'delivery' ? 'bg-white text-[#1A1410] shadow-md' : 'text-[#1A1410]/40 hover:text-[#1A1410]'}`}
                                    >
                                        Delivery
                                    </button>
                                </div>

                                {orderType === 'delivery' ? (
                                    <div className="space-y-6">
                                        <div className="relative group">
                                            <svg className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-[#1A1410]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            <input 
                                                type="text" 
                                                placeholder="Enter delivery address..." 
                                                className="w-full h-15 bg-[#F5F5F0] border border-[#E9E9E4] rounded-2xl pl-14 pr-32 text-[15px] font-bold focus:ring-1 focus:ring-[#1A1410] outline-none text-[#1A1410] placeholder:text-[#9B8D74] transition-all"
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                            />
                                            <button 
                                                onClick={() => {
                                                    if (navigator.geolocation) {
                                                        navigator.geolocation.getCurrentPosition(async (pos) => {
                                                            try {
                                                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`, {
                                                                    headers: {
                                                                        'User-Agent': 'IndraamPizzaApp/1.0'
                                                                    }
                                                                })
                                                                const data = await res.json()
                                                                if (data && data.display_name) {
                                                                    const addr = data.display_name
                                                                    setCurrentAddress(addr)
                                                                    setDeliveryAddress(addr)
                                                                } else {
                                                                    const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
                                                                    setCurrentAddress(coords)
                                                                    setDeliveryAddress(coords)
                                                                }
                                                            } catch (err) {
                                                                console.error('Reverse geocoding failed:', err)
                                                                const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
                                                                setCurrentAddress(coords)
                                                                setDeliveryAddress(coords)
                                                            }
                                                        }, (err) => {
                                                            console.error(err)
                                                            alert('Geolocation failed. Please check your browser permissions.')
                                                        })
                                                    }
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#1A1410] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#333] transition-all"
                                            >
                                                Locate
                                            </button>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-4 pl-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8A7A62]">Saved addresses</p>
                                                <button 
                                                    onClick={() => { setDeliveryAddress(''); setCurrentAddress(null); }}
                                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 hover:text-amber-700"
                                                >
                                                    + Add new
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {savedAddresses.map((item, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={() => setDeliveryAddress(item.address)}
                                                        className={`flex items-center justify-between p-5 bg-white rounded-2xl border transition-all cursor-pointer group hover:bg-[#F5F5F0] ${deliveryAddress === item.address ? 'border-[#1A1410] bg-[#F5F5F0]' : 'border-[#E9E9E4]'}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[15px] font-black text-[#1A1410] tracking-tight truncate">{item.address.split(',')[0]}</p>
                                                                <p className="text-[12px] text-[#8A7A62] font-bold truncate">{item.type || 'Recent'}</p>
                                                            </div>
                                                        </div>
                                                        {deliveryAddress === item.address ? (
                                                            <div className="w-5 h-5 bg-[#1A1410] rounded-full flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            </div>
                                                        ) : (
                                                            <svg className="w-4 h-4 text-[#1A1410]/10 group-hover:text-[#1A1410] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8A7A62] mb-4 pl-1">Delivering from</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[#1A1410] rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg">{restaurantName[0]}</div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[16px] font-black text-[#1A1410] tracking-tight">{restaurantName}</p>
                                                        <span className="text-[10px] font-black text-[#8A7A62] bg-[#F5F5F0] px-2 py-0.5 rounded-lg border border-[#E9E9E4]">1.7mi</span>
                                                    </div>
                                                    <p className="text-[12px] text-green-600 font-black mt-0.5 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Open now
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 space-y-4">
                                            <motion.button 
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleConfirmOrder}
                                                className="w-full h-16 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-3"
                                            >
                                                Deliver ASAP
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </motion.button>
                                            <motion.button 
                                                whileHover={{ scale: 1.02, backgroundColor: '#F5F5F0' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => { setShowOrderDetails(false); setShowTimePicker(true); }}
                                                className="w-full h-16 bg-white text-[#1A1410] border-2 border-[#1A1410] rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg"
                                            >
                                                Schedule delivery
                                                <svg className="w-5 h-5 text-[#1A1410]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </motion.button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="bg-[#F5F5F0] p-6 rounded-3xl border border-[#E9E9E4]">
                                            <div className="flex items-center gap-5 mb-6">
                                                <div className="w-14 h-14 bg-[#1A1410] rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg">{restaurantName[0]}</div>
                                                <div>
                                                    <p className="text-xl font-serif font-black text-[#1A1410] tracking-tight">{restaurantName}</p>
                                                    <p className="text-[13px] text-green-600 font-black mt-1 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Open now
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                                                <p className="text-[15px] text-[#7A6F64] leading-relaxed font-bold">
                                                    {restaurantAddress}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2 space-y-4">
                                            <motion.button 
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleConfirmOrder}
                                                className="w-full h-16 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-3"
                                            >
                                                Pickup ASAP
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </motion.button>
                                            <motion.button 
                                                whileHover={{ scale: 1.02, backgroundColor: '#F5F5F0' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => { setShowOrderDetails(false); setShowTimePicker(true); }}
                                                className="w-full h-16 bg-white text-[#1A1410] border-2 border-[#1A1410] rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg"
                                            >
                                                Schedule pickup
                                                <svg className="w-5 h-5 text-[#1A1410]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </motion.button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Time Picker Modal */}
                        {showTimePicker && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-[480px] bg-white rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#E9E9E4] font-sans"
                            >
                                <button 
                                    onClick={() => setShowTimePicker(false)}
                                    className="absolute top-10 right-10 w-10 h-10 bg-[#F5F5F0] rounded-full flex items-center justify-center hover:bg-[#E9E9E4]"
                                >
                                    <svg className="w-5 h-5 text-[#1A1410]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>

                                <h2 className="text-[28px] font-serif font-black text-[#1A1410] mb-8 tracking-tight">Order time</h2>

                                <div className="flex gap-4 mb-8">
                                    <button className="flex-1 p-5 rounded-3xl bg-white border-2 border-[#1A1410] flex flex-col items-center">
                                        <span className="text-[#1A1410] font-black text-lg mb-0.5">Today</span>
                                        <span className="text-[10px] text-[#A79A81] uppercase tracking-[0.2em] font-black">
                                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </button>
                                    <button className="flex-1 p-5 rounded-3xl bg-[#F5F5F0] border border-[#E9E9E4] flex flex-col items-center opacity-50 hover:opacity-100 transition-opacity">
                                        <span className="text-[#1A1410] font-black text-lg mb-0.5">Tomorrow</span>
                                        <span className="text-[10px] text-[#A79A81] uppercase tracking-[0.2em] font-black">
                                            {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar-light mb-8 no-scrollbar">
                                    {timeSlots.map((time) => (
                                        <div 
                                            key={time}
                                            onClick={() => { setSelectedTime(time); setIsCustomTimeActive(false); }}
                                            className={`flex items-center justify-between p-5 rounded-2xl bg-white border-2 transition-all cursor-pointer group ${selectedTime === time && !isCustomTimeActive ? 'border-[#1A1410] shadow-md' : 'border-[#E9E9E4] hover:border-[#1A1410]/30'}`}
                                        >
                                            <span className={`text-[15px] font-black ${selectedTime === time && !isCustomTimeActive ? 'text-[#1A1410]' : 'text-[#8A7A62]'}`}>{time}</span>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedTime === time && !isCustomTimeActive ? 'border-[#1A1410] bg-[#1A1410]' : 'border-[#EBEBE6]'}`}>
                                                {selectedTime === time && !isCustomTimeActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Custom Time Option */}
                                    <div 
                                        onClick={() => setIsCustomTimeActive(true)}
                                        className={`flex flex-col p-5 rounded-2xl bg-white border-2 transition-all cursor-pointer group ${isCustomTimeActive ? 'border-[#1A1410] shadow-md' : 'border-[#E9E9E4] hover:border-[#1A1410]/30'}`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-[15px] font-black ${isCustomTimeActive ? 'text-[#1A1410]' : 'text-[#8A7A62]'}`}>Custom time</span>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCustomTimeActive ? 'border-[#1A1410] bg-[#1A1410]' : 'border-[#EBEBE6]'}`}>
                                                {isCustomTimeActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                        {isCustomTimeActive && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                className="overflow-hidden"
                                            >
                                                <input 
                                                    type="time" 
                                                    className="w-full bg-[#F5F5F0] border border-[#E9E9E4] rounded-xl px-4 py-3 text-[#1A1410] font-bold focus:ring-1 focus:ring-[#1A1410] outline-none"
                                                    value={customTime}
                                                    onChange={(e) => setCustomTime(e.target.value)}
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConfirmOrder}
                                    className="w-full h-18 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-[1.5rem] font-black text-[17px] uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-3"
                                >
                                    Order {isCustomTimeActive ? `at ${customTime || 'selected time'}` : (selectedTime === 'ASAP' ? 'ASAP' : `at ${selectedTime}`)}
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar-light::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-light::-webkit-scrollbar-thumb { background: rgba(26, 20, 16, 0.1); border-radius: 20px; }
                .custom-scrollbar-light::-webkit-scrollbar-thumb:hover { background: rgba(26, 20, 16, 0.2); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </>
    )
}
