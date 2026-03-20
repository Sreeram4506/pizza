import { useSettings } from '../context/SettingsContext'

const PAGE_CONTENT = {
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy Notice',
    intro: 'We only collect the details needed to prepare your order, coordinate pickup or delivery, and respond when you contact us.',
    sections: [
      {
        title: 'Information We Use',
        body: 'Order details, contact information, delivery addresses, and basic account preferences help the restaurant confirm purchases and support customers.'
      },
      {
        title: 'How It Is Used',
        body: 'Information is used for checkout, order tracking, customer support, loyalty features, and restaurant operations. We do not sell customer information.'
      },
      {
        title: 'Retention',
        body: 'Records are kept only as long as they are useful for service, bookkeeping, fraud prevention, or legal obligations.'
      }
    ]
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Service Terms',
    intro: 'Orders placed through this site are subject to item availability, restaurant confirmation, and the pickup or delivery information you provide at checkout.',
    sections: [
      {
        title: 'Orders',
        body: 'Submitted orders may be declined or adjusted if an item is unavailable, pricing is incorrect, or payment cannot be completed.'
      },
      {
        title: 'Pickup And Delivery',
        body: 'Estimated times are guidance only. Final timing depends on kitchen volume, driver availability, weather, and customer responsiveness.'
      },
      {
        title: 'Menu Content',
        body: 'Descriptions and images are presented in good faith, but ingredients and presentation may vary. Contact the restaurant directly about allergens or special requirements.'
      }
    ]
  }
}

export default function LegalPage({ variant = 'privacy' }) {
  const { settings } = useSettings()
  const content = PAGE_CONTENT[variant] || PAGE_CONTENT.privacy
  const restaurantName = settings?.restaurantName || 'Mustang Pizza'

  return (
    <section className="min-h-screen py-24 lg:py-32 relative overflow-hidden section-grain glass-shell">
      <div className="absolute inset-0 ember-glow-bg opacity-70" />

      <div className="max-w-[980px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="glass-panel glass-highlight-ring p-8 sm:p-10 lg:p-12">
          <span className="section-eyebrow block mb-4">{content.eyebrow}</span>
          <h1 className="section-title mb-6">{content.title}</h1>
          <p className="section-copy max-w-3xl mb-10">
            {restaurantName} {content.intro.toLowerCase()}
          </p>

          <div className="section-rule mb-10" />

          <div className="space-y-8">
            {content.sections.map((section) => (
              <div key={section.title} className="glass-card p-6 sm:p-8">
                <h2 className="font-serif-1947 text-2xl tracking-tight text-[#1A1410] mb-3">
                  {section.title}
                </h2>
                <p className="text-[#5C554E] text-[15px] sm:text-base leading-relaxed">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
