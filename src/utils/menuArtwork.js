function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function toTitleCase(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getCategoryName(categoryId) {
  if (!categoryId) return ''
  if (typeof categoryId === 'string') return categoryId
  if (typeof categoryId === 'object' && categoryId.name) return categoryId.name
  return ''
}

export function slugifyMenuItemName(value) {
  return String(value || 'chef-special')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'chef-special'
}

function getTheme(item) {
  const name = `${item?.name || ''} ${getCategoryName(item?.categoryId)}`.toLowerCase()

  if (/(wrap|sub|sandwich|burger|melt|chicken ranch)/.test(name)) {
    return {
      kind: 'sandwich',
      bg: '#F6EDE1',
      panel: '#FFF9F1',
      accent: '#8B4A2B',
      accentSoft: '#D39A62',
      detail: '#E8C46A',
      herb: '#516F43',
      label: 'Handheld'
    }
  }

  if (/(pasta|alfredo|lasagna|ravioli|marinara|mac|parm)/.test(name)) {
    return {
      kind: 'pasta',
      bg: '#F2E6D6',
      panel: '#FBF5EC',
      accent: '#B35A36',
      accentSoft: '#E1A468',
      detail: '#F2D4A2',
      herb: '#4E724B',
      label: 'Kitchen Favorite'
    }
  }

  if (/(salad|garden|caesar)/.test(name)) {
    return {
      kind: 'salad',
      bg: '#EEF1E4',
      panel: '#FBFCF7',
      accent: '#5E7A42',
      accentSoft: '#A7C17A',
      detail: '#E5B85E',
      herb: '#4B6632',
      label: 'Fresh Pick'
    }
  }

  if (/(drink|soda|tea|water|cola|lemonade|espresso|coffee|chai)/.test(name)) {
    return {
      kind: 'drink',
      bg: '#E9F0F0',
      panel: '#F8FCFC',
      accent: '#3D6471',
      accentSoft: '#77A7B2',
      detail: '#F3C97A',
      herb: '#49715D',
      label: 'Pour Over'
    }
  }

  if (/(dessert|cake|sweet|cookie|gift)/.test(name)) {
    return {
      kind: 'dessert',
      bg: '#F5E6E8',
      panel: '#FEF7F8',
      accent: '#A84A63',
      accentSoft: '#E3A4B2',
      detail: '#F0C57A',
      herb: '#6D7E53',
      label: 'House Treat'
    }
  }

  return {
    kind: 'pizza',
    bg: '#F4E8D8',
    panel: '#FFF8EF',
    accent: '#B8502E',
    accentSoft: '#E18D5C',
    detail: '#E6BB58',
    herb: '#547446',
    label: 'Wood Fired'
  }
}

function hashValue(value) {
  return [...String(value || 'dish')].reduce((acc, char, index) => {
    return (acc + char.charCodeAt(0) * (index + 1)) % 100000
  }, 0)
}

function renderDish(theme, seed) {
  const shift = seed % 18

  if (theme.kind === 'sandwich') {
    return `
      <ellipse cx="600" cy="600" rx="240" ry="150" fill="#E1D2BE" opacity="0.4" />
      <rect x="390" y="430" width="420" height="72" rx="36" fill="#E4B87B" />
      <rect x="370" y="500" width="460" height="44" rx="22" fill="${theme.herb}" opacity="0.92" />
      <rect x="380" y="542" width="440" height="28" rx="14" fill="${theme.accent}" opacity="0.9" />
      <rect x="395" y="570" width="410" height="34" rx="17" fill="${theme.detail}" opacity="0.85" />
      <rect x="400" y="606" width="400" height="68" rx="34" fill="#D79B5B" />
      <circle cx="${470 + shift}" cy="520" r="14" fill="${theme.detail}" />
      <circle cx="${560 - shift}" cy="556" r="10" fill="#F0E6D4" />
      <circle cx="${650 + shift}" cy="520" r="12" fill="#C65332" />
      <circle cx="${730 - shift}" cy="548" r="11" fill="${theme.herb}" />
    `
  }

  if (theme.kind === 'pasta') {
    return `
      <ellipse cx="600" cy="620" rx="250" ry="165" fill="#E2D8CB" opacity="0.45" />
      <ellipse cx="600" cy="560" rx="230" ry="135" fill="#FFF8F1" />
      <ellipse cx="600" cy="560" rx="188" ry="102" fill="${theme.detail}" opacity="0.72" />
      <path d="M470 ${520 + shift}c55-42 120 52 175 8s102-12 122 26" fill="none" stroke="${theme.accent}" stroke-width="22" stroke-linecap="round" />
      <path d="M455 ${555 - shift}c70-48 118 35 172 5 52-29 115 2 137 42" fill="none" stroke="${theme.accentSoft}" stroke-width="20" stroke-linecap="round" />
      <path d="M480 ${590 + shift}c60-34 112 22 164 4 57-20 92-5 118 24" fill="none" stroke="${theme.herb}" stroke-width="12" stroke-linecap="round" opacity="0.7" />
      <circle cx="520" cy="518" r="10" fill="#F7EAD7" />
      <circle cx="680" cy="534" r="10" fill="#F7EAD7" />
      <circle cx="632" cy="595" r="9" fill="#F7EAD7" />
    `
  }

  if (theme.kind === 'salad') {
    return `
      <ellipse cx="600" cy="620" rx="240" ry="160" fill="#DEE6D5" opacity="0.45" />
      <path d="M390 520c0-66 95-112 210-112s210 46 210 112c0 93-94 170-210 170S390 613 390 520Z" fill="#FAFBF5" />
      <ellipse cx="600" cy="545" rx="182" ry="106" fill="#B5D08D" />
      <circle cx="515" cy="515" r="34" fill="${theme.herb}" />
      <circle cx="610" cy="496" r="30" fill="#D8934E" />
      <circle cx="684" cy="552" r="28" fill="#C75332" />
      <circle cx="560" cy="590" r="32" fill="#93BA67" />
      <circle cx="648" cy="600" r="24" fill="#F4E1B0" />
      <circle cx="470" cy="566" r="23" fill="#F5CE71" />
    `
  }

  if (theme.kind === 'drink') {
    return `
      <ellipse cx="600" cy="665" rx="170" ry="70" fill="#D7E2E4" opacity="0.5" />
      <path d="M500 360h200l-24 318c-3 40-36 72-76 72h0c-40 0-73-32-76-72L500 360Z" fill="#FFFFFF" opacity="0.92" />
      <path d="M528 396h144l-18 255c-2 24-22 43-46 43h-16c-24 0-44-19-46-43L528 396Z" fill="${theme.accentSoft}" opacity="0.9" />
      <path d="M620 300c22 0 40 18 40 40v48h-22v-41c0-10-8-18-18-18h-8c-10 0-18 8-18 18v11h-22v-18c0-22 18-40 40-40Z" fill="${theme.accent}" />
      <circle cx="560" cy="448" r="16" fill="#FDFEFF" opacity="0.55" />
      <circle cx="638" cy="512" r="12" fill="#FDFEFF" opacity="0.4" />
      <circle cx="588" cy="584" r="10" fill="#FDFEFF" opacity="0.35" />
    `
  }

  if (theme.kind === 'dessert') {
    return `
      <ellipse cx="600" cy="645" rx="230" ry="130" fill="#EAD8DD" opacity="0.45" />
      <rect x="430" y="560" width="340" height="60" rx="30" fill="#F1C4D0" />
      <rect x="455" y="500" width="290" height="70" rx="26" fill="#FFF5F4" />
      <rect x="470" y="450" width="260" height="62" rx="24" fill="${theme.accentSoft}" />
      <path d="M520 432c26-40 42-53 80-53 45 0 65 22 92 53" fill="none" stroke="${theme.accent}" stroke-width="18" stroke-linecap="round" />
      <circle cx="522" cy="470" r="16" fill="#FFF0E7" />
      <circle cx="602" cy="448" r="18" fill="${theme.detail}" />
      <circle cx="682" cy="472" r="16" fill="#FFF0E7" />
    `
  }

  return `
    <ellipse cx="600" cy="610" rx="250" ry="165" fill="#E3D6C5" opacity="0.48" />
    <circle cx="600" cy="550" r="220" fill="#FFF9F1" />
    <circle cx="600" cy="550" r="174" fill="#E0A15B" />
    <circle cx="600" cy="550" r="156" fill="${theme.accent}" opacity="0.86" />
    <circle cx="510" cy="${500 + shift}" r="22" fill="${theme.detail}" />
    <circle cx="695" cy="${520 - shift}" r="18" fill="#F4E5C1" />
    <circle cx="${620 + shift}" cy="640" r="20" fill="${theme.herb}" />
    <circle cx="525" cy="620" r="16" fill="#C74E31" />
    <circle cx="662" cy="602" r="18" fill="${theme.detail}" />
    <circle cx="575" cy="468" r="15" fill="${theme.herb}" />
  `
}

export function buildMenuArtworkSvg(item) {
  const theme = getTheme(item)
  const seed = hashValue(item?.name)
  const title = escapeXml(toTitleCase(item?.name || 'Chef Special'))
  const category = escapeXml(toTitleCase(getCategoryName(item?.categoryId) || theme.label))
  const subtitle = escapeXml(toTitleCase(item?.description || 'Prepared fresh in the kitchen'))
  const price = Number.isFinite(Number(item?.price)) ? `$${Number(item.price).toFixed(2)}` : 'Fresh Daily'
  const badge = escapeXml(theme.label)

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.bg}" />
          <stop offset="100%" stop-color="${theme.panel}" />
        </linearGradient>
        <linearGradient id="glow" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stop-color="${theme.accentSoft}" stop-opacity="0.8" />
          <stop offset="100%" stop-color="${theme.detail}" stop-opacity="0.35" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" rx="72" fill="url(#bg)" />
      <circle cx="222" cy="210" r="188" fill="url(#glow)" opacity="0.42" />
      <circle cx="1015" cy="1030" r="260" fill="${theme.accent}" opacity="0.08" />
      <path d="M0 910c140-76 253-114 410-90 95 14 168 42 281 38 134-6 227-40 509-146v488H0V910Z" fill="${theme.panel}" opacity="0.72" />
      <g opacity="0.2">
        <path d="M146 188c64 11 104 39 130 88" fill="none" stroke="${theme.accent}" stroke-width="8" stroke-linecap="round" />
        <path d="M999 189c-64 11-104 39-130 88" fill="none" stroke="${theme.herb}" stroke-width="8" stroke-linecap="round" />
      </g>
      <g>
        ${renderDish(theme, seed)}
      </g>
      <rect x="96" y="84" width="184" height="46" rx="23" fill="#FFFFFF" opacity="0.82" />
      <text x="188" y="114" text-anchor="middle" font-family="Outfit, sans-serif" font-size="22" letter-spacing="3" fill="${theme.accent}">${badge.toUpperCase()}</text>
      <text x="96" y="898" font-family="Outfit, sans-serif" font-size="72" font-weight="700" fill="#1A1410">${title}</text>
      <text x="96" y="950" font-family="Outfit, sans-serif" font-size="26" letter-spacing="4" fill="${theme.accent}">${category.toUpperCase()}</text>
      <text x="96" y="1012" font-family="Outfit, sans-serif" font-size="28" fill="#4B433B">${subtitle}</text>
      <text x="96" y="1098" font-family="Outfit, sans-serif" font-size="24" letter-spacing="5" fill="#7C6B59">HOUSE MADE IMAGE</text>
      <text x="1104" y="1096" text-anchor="end" font-family="Outfit, sans-serif" font-size="46" font-weight="700" fill="${theme.accent}">${escapeXml(price)}</text>
    </svg>
  `.trim()
}

export function buildMenuArtworkDataUri(item) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildMenuArtworkSvg(item))}`
}

export function resolveMenuItemImage(item) {
  const image = String(item?.image || '').trim()
  if (!image) {
    return buildMenuArtworkDataUri(item)
  }

  if (/^(https?:|data:)/i.test(image)) {
    return image
  }

  const baseUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : ''

  return `${baseUrl}${image}`
}
