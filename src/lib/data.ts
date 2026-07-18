export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  image: string;
  flavors: string[];
  sizes: string[];
  badge?: 'bestseller' | 'new' | 'sale' | 'trending';
  deliveryTime: string;
  stock: number;
  description: string;
  tags: string[];
}

export const products: Product[] = [
  {
    id: 'p1', name: 'Gold Standard 100% Whey', brand: 'Optimum Nutrition', category: 'protein',
    price: 3299, originalPrice: 4500, discount: 27, rating: 4.8, reviews: 12430,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80',
    flavors: ['Double Rich Chocolate', 'Vanilla', 'Strawberry', 'Cookies & Cream'],
    sizes: ['1kg', '2kg', '5lb'], badge: 'bestseller', deliveryTime: '15 min', stock: 120,
    description: 'The world\'s best-selling whey protein. 24g of protein per serving with only 1g sugar.',
    tags: ['whey', 'protein', 'muscle gain', 'post-workout'],
  },
  {
    id: 'p2', name: 'Creatine Monohydrate', brand: 'MuscleBlaze', category: 'creatine',
    price: 799, originalPrice: 1199, discount: 33, rating: 4.7, reviews: 8920,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    flavors: ['Unflavored'], sizes: ['250g', '500g', '1kg'], badge: 'bestseller',
    deliveryTime: '12 min', stock: 240,
    description: 'Micronized creatine monohydrate for enhanced strength, power, and performance.',
    tags: ['creatine', 'strength', 'powerlifting'],
  },
  {
    id: 'p3', name: 'C4 Original Pre-Workout', brand: 'Cellucor', category: 'pre-workout',
    price: 2199, originalPrice: 2999, discount: 27, rating: 4.6, reviews: 6540,
    image: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=400&q=80',
    flavors: ['Watermelon', 'Pink Lemonade', 'Orange Blast', 'Fruit Punch'],
    sizes: ['30 Scoops', '60 Scoops'], badge: 'trending', deliveryTime: '18 min', stock: 88,
    description: 'Explosive energy, focus and pumps. America\'s #1 pre-workout brand.',
    tags: ['pre-workout', 'energy', 'focus', 'pump'],
  },
  {
    id: 'p4', name: 'Serious Mass Gainer', brand: 'Optimum Nutrition', category: 'mass-gainer',
    price: 4299, originalPrice: 5999, discount: 28, rating: 4.5, reviews: 9870,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
    flavors: ['Chocolate', 'Vanilla', 'Banana'], sizes: ['3kg', '6kg', '12lb'],
    badge: 'sale', deliveryTime: '20 min', stock: 64,
    description: '1250 calories per serving. Ultimate weight gainer with 50g protein.',
    tags: ['mass gainer', 'weight gain', 'bulking', 'calories'],
  },
  {
    id: 'p5', name: 'BCAA Pro 8500', brand: 'MuscleBlaze', category: 'bcaa',
    price: 1299, originalPrice: 1799, discount: 28, rating: 4.4, reviews: 4230,
    image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&q=80',
    flavors: ['Watermelon', 'Green Apple', 'Orange'], sizes: ['250g', '450g'],
    badge: 'new', deliveryTime: '10 min', stock: 195,
    description: '8500mg BCAAs in 2:1:1 ratio. Faster recovery and muscle preservation.',
    tags: ['bcaa', 'recovery', 'amino acids'],
  },
  {
    id: 'p6', name: 'Thermo Cuts Fat Burner', brand: 'BPI Sports', category: 'fat-burner',
    price: 1899, originalPrice: 2499, discount: 24, rating: 4.3, reviews: 3120,
    image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&q=80',
    flavors: ['Unflavored'], sizes: ['60 Caps', '120 Caps'], badge: 'trending',
    deliveryTime: '25 min', stock: 77,
    description: 'Advanced thermogenic formula for maximum fat burning and energy.',
    tags: ['fat burner', 'weight loss', 'thermogenic'],
  },
  {
    id: 'p7', name: 'Omega-3 Fish Oil', brand: 'MuscleTech', category: 'vitamins',
    price: 699, originalPrice: 999, discount: 30, rating: 4.7, reviews: 5670,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
    flavors: ['Lemon'], sizes: ['90 Caps', '180 Caps'], deliveryTime: '15 min', stock: 310,
    description: '3g Omega-3 per serving for heart health, joints, and cognitive function.',
    tags: ['omega-3', 'fish oil', 'health', 'vitamins'],
  },
  {
    id: 'p8', name: 'Blender Bottle Pro45', brand: 'BlenderBottle', category: 'accessories',
    price: 799, originalPrice: 1099, discount: 27, rating: 4.9, reviews: 15420,
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80',
    flavors: ['Black', 'Blue', 'Red', 'Clear'], sizes: ['45oz'],
    badge: 'bestseller', deliveryTime: '8 min', stock: 450,
    description: 'Leak-proof shaker with patented BlenderBall wire whisk.',
    tags: ['shaker', 'accessories', 'gym'],
  },
];

export const categories = [
  { id: 'protein', label: 'Protein', icon: '💪', count: 48, color: '#FF6B00' },
  { id: 'creatine', label: 'Creatine', icon: '⚡', count: 24, color: '#FF8C3A' },
  { id: 'pre-workout', label: 'Pre-Workout', icon: '🔥', count: 36, color: '#E55A00' },
  { id: 'mass-gainer', label: 'Mass Gainer', icon: '🏋️', count: 18, color: '#FF6B00' },
  { id: 'bcaa', label: 'BCAA / EAA', icon: '🧬', count: 22, color: '#FF8C3A' },
  { id: 'fat-burner', label: 'Fat Burner', icon: '🌡️', count: 15, color: '#E55A00' },
  { id: 'vitamins', label: 'Vitamins', icon: '💊', count: 30, color: '#FF6B00' },
  { id: 'accessories', label: 'Accessories', icon: '🥤', count: 40, color: '#FF8C3A' },
];

export const brands = ['Optimum Nutrition', 'MuscleBlaze', 'Cellucor', 'MuscleTech', 'BPI Sports', 'MyProtein', 'GNC', 'Dymatize'];
