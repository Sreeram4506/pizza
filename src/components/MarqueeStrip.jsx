import { motion } from 'framer-motion'

export default function MarqueeStrip() {
    const items = [
        'Wood-Fired', '·', 'San Marzano Tomatoes', '·', '48h Fermented Dough', '·',
        'Imported Mozzarella', '·', 'Artisan Crafted', '·', 'Stone Oven', '·',
        'Wood-Fired', '·', 'San Marzano Tomatoes', '·', '48h Fermented Dough', '·',
        'Imported Mozzarella', '·', 'Artisan Crafted', '·', 'Stone Oven', '·',
    ]

    return (
        <div className="marquee-strip bg-[#F5F3EF] border-y border-[rgba(26,20,16,0.06)] py-4 overflow-hidden">
            <div className="marquee-content">
                {items.map((item, i) => (
                    <span
                        key={i}
                        className={`mx-4 font-marquee text-lg tracking-[0.15em] uppercase ${item === '·' ? 'text-ember-500' : 'text-[#1A1410]/30'
                            }`}
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    )
}
