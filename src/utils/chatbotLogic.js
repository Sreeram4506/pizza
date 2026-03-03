// AI Chatbot intent recognition and response logic

const INTENTS = {
  MENU: 'menu',
  ORDER: 'order',
  TRACK: 'track',
  GIFT_CARDS: 'giftcards',
  HOURS: 'hours',
  LOCATION: 'location',
  CONTACT: 'contact',
  DELIVERY: 'delivery',
  OFFERS: 'offers',
  GREETING: 'greeting',
  CART: 'cart',
  CONFIRM: 'confirm',
  CUSTOMIZE: 'customize',
  RECOMMENDATION: 'recommendation',
  UNKNOWN: 'unknown',
}

const MENU_KEYWORDS = ['menu', 'pizzas', 'food', 'items', 'what do you have', 'varieties', 'options', 'eat', 'order food'];
const ORDER_KEYWORDS = ['order', 'buy', 'place order', 'get', 'want to order', 'add to cart', 'checkout'];
const TRACK_KEYWORDS = ['track', 'status', 'where is my', 'order id', 'delivery', 'when will'];
const GIFT_KEYWORDS = ['gift card', 'giftcard', 'voucher', 'gift'];
const HOURS_KEYWORDS = ['hours', 'open', 'close', 'timing', 'time'];
const LOCATION_KEYWORDS = ['location', 'address', 'where', 'find you'];
const CONTACT_KEYWORDS = ['contact', 'phone', 'email', 'call', 'reach'];
const DELIVERY_KEYWORDS = ['delivery', 'deliver', 'shipping', 'min order', 'fee'];
const OFFERS_KEYWORDS = ['offer', 'promo', 'discount', 'deal', 'combo'];
const GREETING_KEYWORDS = ['hi', 'hello', 'hey', 'good morning', 'good evening'];
const CART_KEYWORDS = ['cart', 'bag', 'my order', 'what i ordered'];
const CONFIRM_KEYWORDS = ['checkout', 'buy now', 'place order', 'confirm order', 'pay'];
const CUSTOMIZE_KEYWORDS = ['customize', 'extra cheese', 'no pickles', 'add', 'without', 'modify'];
const RECOMMENDATION_KEYWORDS = ['recommend', 'best', 'popular', 'suggest', 'favorite'];

function detectIntent(message, context = {}) {
  const lower = message.toLowerCase().trim();

  if (GREETING_KEYWORDS.some(k => lower.includes(k)) && lower.length < 20) return INTENTS.GREETING;
  if (MENU_KEYWORDS.some(k => lower.includes(k))) return INTENTS.MENU;
  if (ORDER_KEYWORDS.some(k => lower.includes(k))) return INTENTS.ORDER;
  if (TRACK_KEYWORDS.some(k => lower.includes(k))) return INTENTS.TRACK;
  if (GIFT_KEYWORDS.some(k => lower.includes(k))) return INTENTS.GIFT_CARDS;
  if (HOURS_KEYWORDS.some(k => lower.includes(k))) return INTENTS.HOURS;
  if (LOCATION_KEYWORDS.some(k => lower.includes(k))) return INTENTS.LOCATION;
  if (CONTACT_KEYWORDS.some(k => lower.includes(k))) return INTENTS.CONTACT;
  if (DELIVERY_KEYWORDS.some(k => lower.includes(k))) return INTENTS.DELIVERY;
  if (OFFERS_KEYWORDS.some(k => lower.includes(k))) return INTENTS.OFFERS;
  if (CART_KEYWORDS.some(k => lower.includes(k))) return INTENTS.CART;
  if (CONFIRM_KEYWORDS.some(k => lower.includes(k))) return INTENTS.CONFIRM;
  if (CUSTOMIZE_KEYWORDS.some(k => lower.includes(k))) return INTENTS.CUSTOMIZE;
  if (RECOMMENDATION_KEYWORDS.some(k => lower.includes(k))) return INTENTS.RECOMMENDATION;

  return INTENTS.UNKNOWN;
}

export async function getChatbotResponse(message, menuData, orderContext = {}) {
  const intent = detectIntent(message, orderContext);

  let response = { text: '', quickReplies: [], cards: [] };

  switch (intent) {
    case INTENTS.GREETING:
      response.text = "Hey! 👋 Welcome to Pizza Blast! I'm here to help you with the menu, orders, tracking, and more. What can I do for you?";
      response.quickReplies = ['View Menu', 'Order Now', 'Track Order', 'Gift Cards'];
      break;

    case INTENTS.MENU:
      response.text = "Here's our menu! All our pizzas are made fresh with premium ingredients. 🍕";
      response.cards = menuData?.pizzas?.map(b => ({
        title: b.name,
        price: `$${b.price}`,
        desc: b.description,
        veg: b.veg,
        popular: b.popular,
      })) || [];
      response.quickReplies = ['Popular items?', 'Combos', 'Sides & Drinks', 'Order Now'];
      break;

    case INTENTS.ORDER:
      const popularPizzas = menuData?.pizzas?.filter(b => b.popular) || [];
      if (popularPizzas.length > 0) {
        response.text = `Great! I can help you order. Our popular items:\n${popularPizzas.map(b => `• ${b.name} - $${b.price}`).join('\n')}\n\nWhat would you like to add? You can also ask for delivery or pickup!`;
        response.quickReplies = [...popularPizzas.slice(0, 3).map(b => b.name), 'View Full Menu', 'Combos'];
      } else {
        response.text = "Great choice! Our popular items: Margherita Royale ($14.99), Sizzling Pepperoni ($16.99), Spicy Diavola ($18.99). What would you like?";
        response.quickReplies = ['Margherita Royale', 'Sizzling Pepperoni', 'Spicy Diavola', 'View Full Menu'];
      }
      break;

    case INTENTS.TRACK:
      response.text = "To track your order, I'll need your order ID or phone number. You can find your order ID in the confirmation email or SMS. What's your order ID or phone number?";
      response.quickReplies = ['Enter Order ID', 'Enter Phone', 'Cancel'];
      break;

    case INTENTS.GIFT_CARDS:
      response.text = "We offer gift cards in $25, $50, $100, and $200 amounts. They make perfect gifts! Would you like to purchase one?";
      response.quickReplies = ['$25', '$50', '$100', '$200', 'How to use?'];
      break;

    case INTENTS.HOURS:
      response.text = "We're open Mon-Sun: 10:00 AM - 11:00 PM. Come grab a pizza anytime! 🕐";
      response.quickReplies = ['Order Now', 'Location', 'Contact'];
      break;

    case INTENTS.LOCATION:
      response.text = "We're located at 123 Pizza Plaza, Crust Corner, NY 10001. Can't wait to see you! 📍";
      response.quickReplies = ['Get Directions', 'Order Delivery', 'Contact'];
      break;

    case INTENTS.CONTACT:
      response.text = "Reach us at:\n📞 +1 (555) 123-4567\n📧 hello@pizzablast.com\nWe're here to help!";
      response.quickReplies = ['Hours', 'Location', 'Menu'];
      break;

    case INTENTS.DELIVERY:
      response.text = "Yes! We deliver. Delivery fee is $2.99 with a minimum order of $15. Order through me and we'll bring the goodness to your door! 🚚";
      response.quickReplies = ['Order Now', 'Menu', 'Track Order'];
      break;

    case INTENTS.OFFERS:
      response.text = "Our combo deals save you big:\n• Classic Combo: $12.99 (save $2.49)\n• Double Deal: $16.99 (save $4.99)\n• Spicy Bundle: $15.49 (save $3.49)\nWhich combo interests you?";
      response.quickReplies = ['Classic Combo', 'Double Deal', 'Spicy Bundle', 'Order Now'];
      break;

    case INTENTS.CART:
      response.text = orderContext.items?.length
        ? `You have ${orderContext.items.length} item(s) in your cart. Ready to checkout?`
        : "Your cart is empty. Would you like to browse our menu?";
      response.quickReplies = orderContext.items?.length ? ['Place Order', 'Add More', 'View Cart'] : ['View Menu', 'Popular Items'];
      break;

    case INTENTS.CONFIRM:
      if (!orderContext.items?.length) {
        response.text = "Your cart is empty! Add some delicious pizza before checking out.";
        response.quickReplies = ['View Menu', 'Popular Items'];
      } else {
        response.text = "Excellent choice! 🍕 I'm preparing your order. I just need a few more seconds to confirm it with our kitchen...";
        response.action = 'PLACE_ORDER';
      }
      break;

    case INTENTS.RECOMMENDATION:
      response.text = "Our most popular picks:\n🔥 Margherita Royale - $14.99\n🔥 Sizzling Pepperoni - $16.99\n🔥 Spicy Diavola - $18.99\n🔥 BBQ Smokehouse - $17.99\nTry any of these - you won't regret it!";
      response.quickReplies = ['Margherita Royale', 'Sizzling Pepperoni', 'Spicy Diavola', 'Order Now'];
      break;

    case INTENTS.CUSTOMIZE:
      response.text = "We offer customizations: Extra cheese, extra sauce, thin crust, gluten-free base, add bacon, add jalapeños. Just tell me your pizza and how you'd like it!";
      response.quickReplies = ['Extra cheese', 'Thin crust', 'Gluten-free base', 'Order Now'];
      break;

    default:
      response.text = "I'm not sure I understood that. I can help with:\n• Viewing our menu\n• Placing orders\n• Tracking your order\n• Gift cards\n• Hours, location & contact\nWhat would you like to know?";
      response.quickReplies = ['View Menu', 'Order Now', 'Track Order', 'Contact'];
  }

  return response;
}

export { INTENTS };
