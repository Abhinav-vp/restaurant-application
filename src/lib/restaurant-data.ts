export interface MenuItem {
  id: string;
  name: string;
  category: 'biriyani' | 'mains' | 'breads' | 'beverages';
  price: number;
  originalPrice?: number;
  description: string;
  image?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  applicableProducts: string[]; // product IDs, empty = all products
  active: boolean;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  customerName: string;
  customerPhone: string;
  items: string;
  totalQuantity: number;
  totalPrice: number;
  createdAt: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "abr-1",
    name: "Malabar Chicken Biriyani",
    category: "biriyani",
    price: 6.99,
    description: "Authentic Thalassery-style aromatic Basmati rice slow-cooked with tender chicken and specialized spices.",
    image: "/malabar_biriyani.png"
  },
  {
    id: "abr-2",
    name: "Chicken Mandi (Kuzhimanthi)",
    category: "biriyani",
    price: 8.99,
    description: "Fluffy smoked rice cooked over glowing charcoal with spiced chicken halves, served with spicy tomato salsa.",
    image: "/malabar_biriyani.png"
  },
  {
    id: "abr-3",
    name: "Tandoori Grilled Chicken",
    category: "mains",
    price: 7.49,
    description: "Juicy, flame-grilled chicken leg quarters marinated in thick spiced yogurt and charred to perfection.",
    image: "/tandoori_chicken.png"
  },
  {
    id: "abr-4",
    name: "Kerala Beef Fry (Ularthiyathu)",
    category: "mains",
    price: 5.99,
    description: "Tender beef slices slow-roasted with crushed black pepper, robust spices, and toasted coconut flakes.",
    image: "/tandoori_chicken.png"
  },
  {
    id: "abr-5",
    name: "Classic Malabar Porotta",
    category: "breads",
    price: 0.99,
    description: "Flaky, multi-layered golden flatbread made from wheat dough, hand-flipped and grilled with ghee.",
  },
  {
    id: "abr-6",
    name: "Rich Vegetable Kuruma",
    category: "breads",
    price: 3.99,
    description: "Fresh garden vegetables simmered in a creamy, mildly spiced coconut gravy with ground cashews.",
  },
  {
    id: "abr-7",
    name: "Schezwan Chicken Noodles",
    category: "mains",
    price: 6.49,
    description: "Wok-tossed noodles with Shredded chicken breast, fresh cabbage, carrots, and sweet-spicy pepper sauce.",
  },
  {
    id: "abr-8",
    name: "Fresh Mint Lime Juice",
    category: "beverages",
    price: 1.99,
    description: "Invigorating muddled fresh mint leaves, squeezed lime, and chilled club soda.",
  },
  {
    id: "abr-9",
    name: "Sulaimani Cardamom Tea",
    category: "beverages",
    price: 0.99,
    description: "Traditional sweet black tea brewed with cloves, crushed green cardamoms, and a dash of lime juice.",
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    author: "Nihal K.",
    rating: 5,
    comment: "Best Chicken Biriyani and Mandi in the Peringathur area. The portions are huge and the spice blend is authentic and rich.",
    date: "2 days ago"
  },
  {
    id: "rev-2",
    author: "Shabin T.",
    rating: 4,
    comment: "Very affordable pricing and fresh preparation. Their Beef Fry and Porotta is a killer combination!",
    date: "1 week ago"
  },
  {
    id: "rev-3",
    author: "Anjali P.",
    rating: 4,
    comment: "Clear seating area. Tandoori chicken is also well-cooked, juicy and fresh. Excellent place to have lunch with family.",
    date: "2 weeks ago"
  },
  {
    id: "rev-4",
    author: "Rithun M.",
    rating: 5,
    comment: "Amazing food! The fresh juices are great to wrap up a spicy meal. Friendly staff and fast service.",
    date: "3 weeks ago"
  }
];

export interface BusinessProfile {
  name: string;
  address: string;
  locality: string;
  postalCode?: string;
  phone?: string;
  plusCode?: string;
  rating?: number;
  hours?: {
    summary: string;
    daily: { day: string; open: string; close: string }[];
  };
  photos?: string[];
  mapsEmbedUrl?: string;
  googleMapsUrl?: string;
}

export const BUSINESS_PROFILE: BusinessProfile = {
  name: "ABR ASMA RESTAURANT",
  address: "Gurujimukku, Peringathur",
  locality: "Peringathur, Kerala, India",
  postalCode: "670675",
  phone: "+91 74477 63003",
  plusCode: "PH7J+MR Peringathur, Kerala",
  rating: 3.7,
  hours: {
    summary: "Open · Closes 11 pm",
    daily: [
      { day: "Mon", open: "09:00", close: "23:00" },
      { day: "Tue", open: "09:00", close: "23:00" },
      { day: "Wed", open: "09:00", close: "23:00" },
      { day: "Thu", open: "09:00", close: "23:00" },
      { day: "Fri", open: "09:00", close: "23:00" },
      { day: "Sat", open: "09:00", close: "23:00" },
      { day: "Sun", open: "09:00", close: "23:00" }
    ]
  },
  photos: [
    "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWm0h_2FNAlmeTWdnz2tcqEo1LQMo2uE9UnL5nofN5M7vY2OtSfiVQeHrV4jKFPIjA88yqjgrl3FO1bw7zEEJ3ijxQo56u_z4jexydI34vuhhcqGAylDRO9JqWbGD_c6i1xvXfBHBw=w408-h544-k-no"
  ],
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3905.3533215286596!2d75.579893!3d11.714206399999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba429f23edab745%3A0x855a37d028d53ecf!2sABR%20ASMA%20RESTAURANT!5e0!3m2!1sen!2sin!4v1714488349281!5m2!1sen!2sin",
  googleMapsUrl:
    "https://www.google.com/maps/place/ABR+ASMA+RESTAURANT/@11.7142064,75.5820788,17z"
};

// Helper: load admin-managed menu items from localStorage, fallback to defaults
export function getMenuItems(): MenuItem[] {
  if (typeof window === 'undefined') return MENU_ITEMS;
  try {
    const stored = localStorage.getItem('orderflow_menu_items');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return MENU_ITEMS;
}

// Helper: load active offers from localStorage
export function getActiveOffers(): Offer[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('orderflow_offers');
    if (stored) {
      const parsed: Offer[] = JSON.parse(stored);
      return parsed.filter(o => o.active);
    }
  } catch {}
  return [];
}

// Helper: compute effective price for a menu item after applying best offer
export function getEffectivePrice(item: MenuItem, offers: Offer[]): { price: number; originalPrice?: number; offerTitle?: string } {
  let bestDiscount = 0;
  let bestOfferTitle = '';

  for (const offer of offers) {
    const applicable = offer.applicableProducts.length === 0 || offer.applicableProducts.includes(item.id);
    if (!applicable) continue;

    let discount = 0;
    if (offer.discountType === 'percentage') {
      discount = (item.price * offer.discountValue) / 100;
    } else {
      discount = offer.discountValue;
    }

    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestOfferTitle = offer.title;
    }
  }

  if (bestDiscount > 0) {
    const discounted = Math.max(0, item.price - bestDiscount);
    return { price: parseFloat(discounted.toFixed(2)), originalPrice: item.price, offerTitle: bestOfferTitle };
  }

  return { price: item.price };
}

// Helper: save an enquiry to localStorage
export function saveEnquiry(enquiry: Enquiry): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = JSON.parse(localStorage.getItem('orderflow_enquiries') || '[]');
    localStorage.setItem('orderflow_enquiries', JSON.stringify([enquiry, ...existing]));
  } catch {}
}
