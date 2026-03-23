/** 
 * Centralized Pricing Service for the entire project.
 * This makes it scalable when adding new taxes, discounts or fees.
 */
export const PricingService = {
  // Global defaults - ideally these will be fetched from the 'Settings' model per tenant
  TAX_RATE: 0.08, // Moving everything to 8% to match the backend
  DELIVERY_FEE: 3.99,
  
  /**
   * Calculate totals for an order consistently
   */
  calculateTotals: (items, options = {}) => {
    const { 
      type = 'pickup', 
      discount = 0, 
      tip = 0, 
      customTaxRate = null 
    } = options;

    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const modifiersTotal = Array.isArray(item.modifiers) 
        ? item.modifiers.reduce((mSum, m) => mSum + (Number(m.price) || 0), 0) 
        : 0;
      return sum + (price + modifiersTotal) * quantity;
    }, 0);

    const taxRate = customTaxRate !== null ? customTaxRate : PricingService.TAX_RATE;
    const tax = subtotal * taxRate;
    const deliveryFee = type === 'delivery' ? PricingService.DELIVERY_FEE : 0;
    const total = Math.max(0, subtotal - discount) + tax + deliveryFee + Number(tip);

    return {
      subtotal,
      tax,
      deliveryFee,
      total,
      discount
    };
  }
};
