export const INVESTMENT_PLANS = [
  {
    id: 'starter',
    name: 'Plan Starter',
    icon: '🌱',
    featured: false,
    minInvestment: { CO: 50000, PE: 130 },
    dailyReturn: { CO: 8600, PE: 22 },
    duration: 30,
    totalReturn: { CO: 258000, PE: 660 },
    roi: { CO: 17.2, PE: 17.2 },
    description: 'Ideal para comenzar tu camino en las inversiones',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Soporte 24/7',
      'Sin comisiones ocultas'
    ],
    country: 'BOTH'
  },
  {
    id: 'basic',
    name: 'Plan Básico',
    icon: '💼',
    featured: false,
    minInvestment: { CO: 100000, PE: 260 },
    dailyReturn: { CO: 18000, PE: 47 },
    duration: 30,
    totalReturn: { CO: 540000, PE: 1410 },
    roi: { CO: 18.0, PE: 18.0 },
    description: 'Para inversores que buscan retornos constantes',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Soporte prioritario',
      'Reportes semanales'
    ],
    country: 'BOTH'
  },
  {
    id: 'silver',
    name: 'Plan Silver',
    icon: '🥈',
    featured: false,
    minInvestment: { CO: 250000, PE: 650 },
    dailyReturn: { CO: 47500, PE: 123 },
    duration: 45,
    totalReturn: { CO: 2137500, PE: 5535 },
    roi: { CO: 19.0, PE: 19.0 },
    description: 'Equilibrio perfecto entre riesgo y rentabilidad',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Asesor personal',
      'Dashboard avanzado'
    ],
    country: 'BOTH'
  },
  {
    id: 'gold',
    name: 'Plan Gold',
    icon: '🥇',
    featured: true,
    minInvestment: { CO: 500000, PE: 1300 },
    dailyReturn: { CO: 100000, PE: 260 },
    duration: 60,
    totalReturn: { CO: 6000000, PE: 15600 },
    roi: { CO: 20.0, PE: 20.0 },
    description: 'El plan más popular entre nuestros inversores',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Asesor VIP dedicado',
      'Análisis mensuales personalizados'
    ],
    country: 'BOTH'
  },
  {
    id: 'platinum',
    name: 'Plan Platinum',
    icon: '💎',
    featured: false,
    minInvestment: { CO: 1000000, PE: 2600 },
    dailyReturn: { CO: 210000, PE: 546 },
    duration: 90,
    totalReturn: { CO: 18900000, PE: 49140 },
    roi: { CO: 21.0, PE: 21.0 },
    description: 'Para inversores experimentados',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Equipo VIP exclusivo',
      'Webinars privados mensuales'
    ],
    country: 'BOTH'
  },
  {
    id: 'diamond',
    name: 'Plan Diamond',
    icon: '💍',
    featured: false,
    minInvestment: { CO: 2500000, PE: 6500 },
    dailyReturn: { CO: 550000, PE: 1430 },
    duration: 120,
    totalReturn: { CO: 66000000, PE: 171600 },
    roi: { CO: 22.0, PE: 22.0 },
    description: 'Exclusivo para grandes inversores',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Gerente de cuenta personal',
      'Acceso a oportunidades exclusivas'
    ],
    country: 'BOTH'
  },
  {
    id: 'elite',
    name: 'Plan Elite',
    icon: '👑',
    featured: false,
    minInvestment: { CO: 5000000, PE: 13000 },
    dailyReturn: { CO: 1150000, PE: 2990 },
    duration: 180,
    totalReturn: { CO: 207000000, PE: 538200 },
    roi: { CO: 23.0, PE: 23.0 },
    description: 'Rendimientos superiores a largo plazo',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Asesoría estratégica personalizada',
      'Networking con inversores élite'
    ],
    country: 'BOTH'
  },
  {
    id: 'vip',
    name: 'Plan VIP',
    icon: '🏆',
    featured: false,
    minInvestment: { CO: 10000000, PE: 26000 },
    dailyReturn: { CO: 2400000, PE: 6240 },
    duration: 365,
    totalReturn: { CO: 876000000, PE: 2277600 },
    roi: { CO: 24.0, PE: 24.0 },
    description: 'El nivel más alto de inversión',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Suite completa de servicios VIP',
      'Eventos exclusivos anuales'
    ],
    country: 'BOTH'
  },
  {
    id: 'express',
    name: 'Plan Express',
    icon: '⚡',
    featured: false,
    minInvestment: { CO: 75000, PE: 195 },
    dailyReturn: { CO: 12750, PE: 33 },
    duration: 15,
    totalReturn: { CO: 191250, PE: 495 },
    roi: { CO: 17.0, PE: 17.0 },
    description: 'Retornos rápidos en corto plazo',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable en 15 días',
      'Ideal para prueba inicial',
      'Proceso simplificado'
    ],
    country: 'BOTH'
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    icon: '🎯',
    featured: false,
    minInvestment: { CO: 750000, PE: 1950 },
    dailyReturn: { CO: 157500, PE: 409 },
    duration: 60,
    totalReturn: { CO: 9450000, PE: 24540 },
    roi: { CO: 21.0, PE: 21.0 },
    description: 'Para profesionales de la inversión',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Análisis técnico semanal',
      'Señales de inversión premium'
    ],
    country: 'BOTH'
  },
  {
    id: 'ultra',
    name: 'Plan Ultra',
    icon: '🚀',
    featured: false,
    minInvestment: { CO: 3000000, PE: 7800 },
    dailyReturn: { CO: 660000, PE: 1716 },
    duration: 90,
    totalReturn: { CO: 59400000, PE: 154440 },
    roi: { CO: 22.0, PE: 22.0 },
    description: 'Rendimientos ultra-competitivos',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Portafolio diversificado',
      'Estrategias avanzadas de inversión'
    ],
    country: 'BOTH'
  },
  {
    id: 'supreme',
    name: 'Plan Supreme',
    icon: '⭐',
    featured: false,
    minInvestment: { CO: 7500000, PE: 19500 },
    dailyReturn: { CO: 1725000, PE: 4485 },
    duration: 180,
    totalReturn: { CO: 310500000, PE: 807300 },
    roi: { CO: 23.0, PE: 23.0 },
    description: 'La cúspide de las oportunidades de inversión',
    features: [
      'Retornos diarios garantizados',
      'Capital recuperable al finalizar',
      'Consultoría estratégica integral',
      'Acceso a fondos institucionales'
    ],
    country: 'BOTH'
  }
]

// Utility functions
export const getPlanById = (planId) => {
  return INVESTMENT_PLANS.find(plan => plan.id === planId)
}

export const getPlansByCountry = (country) => {
  return INVESTMENT_PLANS.filter(plan => plan.country === 'BOTH' || plan.country === country)
}

export const getFeaturedPlans = () => {
  return INVESTMENT_PLANS.filter(plan => plan.featured)
}

export const getPlansOrderedByAmount = (country, ascending = true) => {
  const plans = [...INVESTMENT_PLANS]
  return plans.sort((a, b) => {
    const amountA = a.minInvestment[country]
    const amountB = b.minInvestment[country]
    return ascending ? amountA - amountB : amountB - amountA
  })
}

export const getPlansOrderedByDuration = (ascending = true) => {
  const plans = [...INVESTMENT_PLANS]
  return plans.sort((a, b) => ascending ? a.duration - b.duration : b.duration - a.duration)
}

export const getPlansOrderedByROI = (country, ascending = false) => {
  const plans = [...INVESTMENT_PLANS]
  return plans.sort((a, b) => {
    const roiA = a.roi[country]
    const roiB = b.roi[country]
    return ascending ? roiA - roiB : roiB - roiA
  })
}
