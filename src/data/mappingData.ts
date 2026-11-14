/**
 * Mock Housing and Dining Database and Schema Definitions
 *
 * Mirrors campus off-campus housing ratings (Gold/Green standards)
 * and consolidated dining hubs within a 15-mile radius of UNC Charlotte.
 *
 * Food data was fact-checked against UNC Charlotte dining pages, the UNC
 * Charlotte "Where Niners Like to Eat" guide, University City Partners, and
 * restaurant/mall listings. Lines marked UNVERIFIED could not be confirmed.
 * Coordinates marked APPROX are estimates from street addresses.
 */

export interface CampusCenter {
  name: string;
  lat: number;
  lng: number;
}

export interface BasePlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  address: string;
}

export interface HousingPlace extends BasePlace {
  category: 'housing';
  tier: 'Gold Standard' | 'Green Standard' | 'Standard';
  walkable: boolean;
  summary: string;
}

export interface FoodTenant {
  name: string;
  cuisine: string;
  price?: string;
}

export interface FoodHubPlace extends BasePlace {
  category: 'hub';
  description: string;
  tenants: FoodTenant[];
}

export interface StandaloneFoodPlace extends BasePlace {
  category: 'food';
  cuisine: string;
  price?: string;
}

export type MapPlace = HousingPlace | FoodHubPlace | StandaloneFoodPlace;

export const CAMPUS_CENTER: CampusCenter = {
  name: 'UNC Charlotte Main Campus',
  lat: 35.3071,
  lng: -80.7352,
};

export const mockHousing: HousingPlace[] = [
  // --- GOLD STANDARD ---
  {
    id: 'h-gold-1',
    name: 'University Crossings',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3117,
    lng: -80.7381,
    distanceMiles: 0.35,
    address: '9010 University City Blvd, Charlotte, NC 28213',
    walkable: true,
    summary: 'High-rise student complex directly across from campus with pedestrian footbridge access.',
  },
  {
    id: 'h-gold-2',
    name: 'University Walk',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3028,
    lng: -80.7342,
    distanceMiles: 0.31,
    address: '9005 University Walk Cir, Charlotte, NC 28213',
    walkable: true,
    summary: 'Walk-to-campus student apartment community off University City Blvd.',
  },
  {
    id: 'h-gold-3',
    name: 'Rush Student Living',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3015,
    lng: -80.7360,
    distanceMiles: 0.39,
    address: '9200 University City Blvd, Charlotte, NC 28213',
    walkable: true,
    summary: 'Modern off-campus student housing adjacent to southern campus entry.',
  },
  {
    id: 'h-gold-4',
    name: 'The Drake',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3061,
    lng: -80.7225,
    distanceMiles: 0.72,
    address: '9905 University City Blvd, Charlotte, NC 28213',
    walkable: true,
    summary: 'Off-campus student community formerly known as East Village.',
  },
  {
    id: 'h-gold-5',
    name: 'Boulevard 98',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3005,
    lng: -80.7495,
    distanceMiles: 0.92,
    address: '9825 University City Blvd, Charlotte, NC 28213',
    walkable: false,
    summary: 'Mid-rise student living situated near North Tryon intersection.',
  },
  {
    id: 'h-gold-6',
    name: 'University Village',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3168,
    lng: -80.7289,
    distanceMiles: 0.75,
    address: '9915 University Terrace Dr, Charlotte, NC 28262',
    walkable: true,
    summary: 'Apartment neighborhood adjacent to campus northern greenway trails.',
  },
  {
    id: 'h-gold-7',
    name: 'Millennium One',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3180,
    lng: -80.7250,
    distanceMiles: 0.96,
    address: '1721 Thomas Combs Dr, Charlotte, NC 28262',
    walkable: false,
    summary: 'Garden-style student community northeast of campus perimeter.',
  },
  {
    id: 'h-gold-8',
    name: 'University Townhomes at Charlotte',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3182,
    lng: -80.7214,
    distanceMiles: 1.09,
    address: '10008 University Terrace Dr, Charlotte, NC 28262',
    walkable: false,
    summary: 'Townhome living complex previously branded as 49 North.',
  },
  {
    id: 'h-gold-9',
    name: 'Arcadia Student Living',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3262,
    lng: -80.7108,
    distanceMiles: 1.91,
    address: '707 Sanctuary Pl, Charlotte, NC 28213',
    walkable: false,
    summary: 'Cottage and flat-style student neighborhood with direct shuttle transit.',
  },
  {
    id: 'h-gold-10',
    name: 'Junction 49',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3235,
    lng: -80.7168,
    distanceMiles: 1.54,
    address: '7521 Twitter Ln, Charlotte, NC 28213',
    walkable: false,
    summary: 'Student apartment homes located off NC-49 north of campus.',
  },
  {
    id: 'h-gold-11',
    name: 'Aspen Heights University City',
    tier: 'Gold Standard',
    category: 'housing',
    lat: 35.3288,
    lng: -80.7072,
    distanceMiles: 2.15,
    address: '310 Northbend Dr, Charlotte, NC 28262',
    walkable: false,
    summary: 'Craftsman-style student cottage village north of University City.',
  },

  // --- GREEN STANDARD ---
  {
    id: 'h-green-1',
    name: 'Walden Station',
    tier: 'Green Standard',
    category: 'housing',
    lat: 35.3045,
    lng: -80.7302,
    distanceMiles: 0.33,
    address: '342 Walden Station Dr, Charlotte, NC 28262',
    walkable: true,
    summary: 'Quiet residential complex on Mallard Creek Church road corridor.',
  },
  {
    id: 'h-green-2',
    name: 'Yugo Charlotte College Downs',
    tier: 'Green Standard',
    category: 'housing',
    lat: 35.3022,
    lng: -80.7265,
    distanceMiles: 0.60,
    address: '1505 Monument Hill Rd, Charlotte, NC 28213',
    walkable: true,
    summary: 'Budget-friendly student apartment units adjacent to east campus.',
  },
  {
    id: 'h-green-3',
    name: 'Belle Haven Apartments',
    tier: 'Green Standard',
    category: 'housing',
    lat: 35.3201,
    lng: -80.7512,
    distanceMiles: 1.28,
    address: '9005 Post Canyon Ln, Charlotte, NC 28213',
    walkable: false,
    summary: 'Contemporary multi-family community near Mallard Creek Greenway.',
  },

  // --- STANDARD HOUSING ---
  {
    id: 'h-other-1',
    name: 'University Terrace',
    tier: 'Standard',
    category: 'housing',
    lat: 35.3148,
    lng: -80.7369,
    distanceMiles: 0.54,
    address: '9509 University Terrace Dr, Charlotte, NC 28262',
    walkable: true,
    summary: 'Established student condominium community within walking distance.',
  },
  {
    id: 'h-other-2',
    name: 'The Edge (Campus Edge)',
    tier: 'Standard',
    category: 'housing',
    lat: 35.3135,
    lng: -80.7412,
    distanceMiles: 0.56,
    address: '9535 Graduate Ln, Charlotte, NC 28262',
    walkable: true,
    summary: 'Off-campus student apartments near JW Clay LYNX Light Rail Station.',
  },
  {
    id: 'h-other-3',
    name: 'Ashford Green',
    tier: 'Standard',
    category: 'housing',
    lat: 35.3206,
    lng: -80.7441,
    distanceMiles: 1.05,
    address: '315 Barton Creek Dr, Charlotte, NC 28262',
    walkable: false,
    summary: 'Residential apartment community neighboring the University Research Park.',
  },
];

export const mockFoodHubs: FoodHubPlace[] = [
  {
    // FIXED: tenants now match the Student Union's own dining page.
    // Removed Halal Shack, Panda Express, "Bistro 49" (not listed there).
    id: 'hub-campus-union',
    name: 'Popp Martin Student Union Hub',
    category: 'hub',
    lat: 35.3086,
    lng: -80.7338,
    distanceMiles: 0.13,
    address: '9201 University City Blvd, Charlotte, NC 28223',
    description: 'Central student union dining hall, food court and coffee shop hub right on campus.',
    tenants: [
      { name: 'Social 704 Dining Hall', cuisine: 'All-You-Care-To-Eat Action Stations' },
      { name: 'The Bistro', cuisine: 'Elevated Buffet-Style Dining' },
      { name: 'Starbucks Coffee', cuisine: 'Coffee & Pastries' },
      { name: 'Wendy’s', cuisine: 'Burgers & Fries' },
      { name: 'Bojangles', cuisine: 'Fried Chicken & Biscuits' },
      { name: 'Shake Smart', cuisine: 'Shakes, Bowls & Healthy Sandwiches' },
      { name: 'Half Moon Empanadas', cuisine: 'Savory & Sweet Empanadas' },
      { name: 'Erbert & Gerbert’s (Market on Craver)', cuisine: 'Made-to-Order Sandwiches' },
    ],
  },
  {
    // FIXED: Passage to India is on University City Blvd, not University Terrace Dr.
    // Which Wich, Salsarita’s and Chatime are UNVERIFIED at this location.
    // Five Guys is at The Pointe at University Place, across JW Clay Blvd from the LYNX deck.
    id: 'hub-jw-clay',
    name: 'JW Clay Station & The Pointe',
    category: 'hub',
    lat: 35.3131,
    lng: -80.7428,
    distanceMiles: 0.58,
    address: '9510 University City Blvd, Charlotte, NC 28213',
    description: 'Retail corridor adjacent to the light rail terminal and north university entrance.',
    tenants: [
      { name: 'Passage to India', cuisine: 'Authentic Indian Buffet & Entrees' },
      { name: 'Five Guys', cuisine: 'Burgers, Dogs & Fries' },
      { name: 'Which Wich', cuisine: 'Custom Crafted Sandwiches' }, // UNVERIFIED
      { name: 'Salsarita’s Fresh Cantina', cuisine: 'Mexican Tacos & Bowls' }, // UNVERIFIED
      { name: 'Chatime', cuisine: 'Taiwanese Bubble Tea & Smoothies' }, // UNVERIFIED
    ],
  },
  {
    // FIXED: address is 8929 JM Keynes Dr. Removed Chipotle (it is at 6925 University City Blvd).
    // Added City Barbeque and Blaze Pizza (both listed at the Shoppes by UNC Charlotte).
    id: 'hub-boardwalk',
    name: 'The Shoppes at University Place (The Boardwalk)',
    category: 'hub',
    lat: 35.3106,
    lng: -80.7497,
    distanceMiles: 0.85,
    address: '8929 JM Keynes Dr, Charlotte, NC 28262',
    description: 'Waterfront commercial plaza with lakefront patio dining and student staples.',
    tenants: [
      { name: 'Boardwalk Billy’s', cuisine: 'Smoked BBQ, Ribs & Seafood' },
      { name: 'CAVA', cuisine: 'Custom Mediterranean Grain Bowls' },
      { name: 'Famous Toastery', cuisine: 'Breakfast, Brunch & Specialty Coffee' },
      { name: 'Zapata’s Mexican Cantina', cuisine: 'Traditional Mexican Entrees' },
      { name: 'City Barbeque', cuisine: 'Slow-Smoked Barbecue & Sides' },
      { name: 'Blaze Pizza', cuisine: 'Fast-Fire’d Custom Pizza' },
    ],
  },
  {
    // FIXED: 9601 N Tryon St is the Terraces at University Place, not "University Pavilion".
    // Cook Out is at 9605 N Tryon in the same center. City Barbeque and Five Guys moved out
    // (they are at the Shoppes / The Pointe). Golden Bakery and Starbucks could not be verified here.
    id: 'hub-tryon-pavilion',
    name: 'The Terraces at University Place',
    category: 'hub',
    lat: 35.2954,
    lng: -80.7588,
    distanceMiles: 1.55,
    address: '9601 N Tryon St, Charlotte, NC 28262',
    description: 'High-traffic North Tryon retail center featuring late-night favorites and local eateries.',
    tenants: [
      { name: 'Cook Out', cuisine: 'Burgers, BBQ Plates & 40+ Thick Shakes' },
      { name: 'Angry Ale’s University', cuisine: 'American Pub Food & Late Night' },
      { name: 'Cuzzo’s Cuisine', cuisine: 'Soul Food & American Comfort Classics' },
    ],
  },
  {
    id: 'hub-noda',
    name: 'NoDa Arts & Dining District',
    category: 'hub',
    lat: 35.2476,
    lng: -80.8052,
    distanceMiles: 5.72,
    address: 'N Davidson St & E 36th St, Charlotte, NC 28205',
    description: 'Arts and café district easily reachable via the LYNX Blue Line 36th Street station.',
    tenants: [
      { name: 'Amélie’s French Bakery & Café', cuisine: 'French Pastries, Macarons & Espresso' },
      { name: 'Smelly Cat Coffeehouse', cuisine: 'Specialty Roasted Coffee & Quick Bites' },
      { name: 'Cabo Fish Taco', cuisine: 'Baja-Style Fish Tacos' },
      { name: 'Benny Pennello’s', cuisine: 'Virginia-Style Giant Pizza Slices' },
    ],
  },
  {
    id: 'hub-optimist-hall',
    name: 'Optimist Hall',
    category: 'hub',
    lat: 35.2341,
    lng: -80.8285,
    distanceMiles: 7.37,
    address: '1115 N Brevard St, Charlotte, NC 28206',
    description: 'Restored historic mill food hall featuring diverse artisan eateries and local vendors.',
    tenants: [
      { name: 'The Dumpling Lady', cuisine: 'Authentic Sichuan Dumplings & Noodles' },
      { name: 'Botiwalla', cuisine: 'Indian Street Food & Rolls' },
      { name: 'Suárez Bakery', cuisine: 'Scratch-Made Doughnuts & Desserts' },
      { name: 'Boxcar Betty’s', cuisine: 'Gourmet Fried Chicken Sandwiches' },
      { name: 'Undercurrent Coffee', cuisine: 'Pour-Over Coffee, Cold Brew & Lattes' },
    ],
  },
  {
    // FIXED: Cheesecake Factory here was only announced (slated to open winter 2026).
    // First Watch is on Christenbury Pkwy and Chuy’s could not be confirmed, so both removed.
    // Added Outback, BJ’s and Chipotle, which the mall lists as sit-down options.
    id: 'hub-concord-mills',
    name: 'Concord Mills & Speedway Dining Promenade',
    category: 'hub',
    lat: 35.3701,
    lng: -80.7225,
    distanceMiles: 4.41,
    address: '8111 Concord Mills Boulevard, Concord, NC 28027',
    description: 'High-density commercial entertainment and restaurant strip directly north on I-85.',
    tenants: [
      { name: 'Dave & Buster’s', cuisine: 'Burgers, Wings & Arcade' },
      { name: 'Bonefish Grill', cuisine: 'Seafood & Wood-Grilled Fish' },
      { name: 'Outback Steakhouse', cuisine: 'Steaks & Australian-Inspired American' },
      { name: 'BJ’s Restaurant & Brewhouse', cuisine: 'Deep Dish Pizza, Burgers & Craft Beer' },
      { name: 'Chipotle Mexican Grill', cuisine: 'Burritos & Bowls' },
    ],
  },
  {
    id: 'hub-camp-northend',
    name: 'Camp North End',
    category: 'hub',
    lat: 35.2471,
    lng: -80.8242,
    distanceMiles: 6.55,
    address: '300 Camp Rd, Charlotte, NC 28206',
    description: 'Sprawling historic warehouse district featuring outdoor gathering spaces and craft food stalls.',
    tenants: [
      { name: 'Leah & Louise', cuisine: 'Modern Southern Scratch Cooking' },
      { name: 'Hex Coffee & Kitchen', cuisine: 'Specialty Espresso & Brunch' },
      { name: 'Plant Joy', cuisine: 'Plant-Based Street Food' },
      { name: 'Babe & Butcher', cuisine: 'Charcuterie & Specialty Boards' },
    ],
  },
  {
    // UNVERIFIED hub: tenants not yet fact-checked.
    id: 'hub-plaza-midwood',
    name: 'Plaza Midwood Central Ave Corridor',
    category: 'hub',
    lat: 35.2215,
    lng: -80.8142,
    distanceMiles: 7.32,
    address: '1400 Central Ave, Charlotte, NC 28205',
    description: 'Bohemian cultural hub packed with historic neighborhood diners and celebrated barbecue.',
    tenants: [
      { name: 'Midwood Smokehouse', cuisine: 'Carolina Pit BBQ & Brisket' },
      { name: 'Calle Sol Latin Café', cuisine: 'Cuban & Peruvian Street Fare' },
      { name: 'Dish', cuisine: 'Classic Southern Comfort Dishes' },
      { name: 'Milkbread', cuisine: 'All-Day Cafe, Donuts & Crispy Chicken' },
    ],
  },
  {
    // UNVERIFIED hub: tenants not yet fact-checked.
    id: 'hub-uptown-7th',
    name: 'The Market at 7th Street (Uptown)',
    category: 'hub',
    lat: 35.2274,
    lng: -80.8385,
    distanceMiles: 8.05,
    address: '224 E 7th St, Charlotte, NC 28202',
    description: 'Urban non-profit food hall accessible directly off the 7th St Light Rail Station.',
    tenants: [
      { name: 'Jimmy Pearls', cuisine: 'Virginia Tidewater Seafood' },
      { name: 'Not Just Coffee', cuisine: 'Hand-Poured Coffee & Lattes' },
      { name: 'Zia Pia Pizzeria', cuisine: 'Roman Style Sheet Pizza' },
      { name: 'Momo Station', cuisine: 'Himalayan Dumplings' },
    ],
  },
  {
    // UNVERIFIED hub: tenants not yet fact-checked.
    id: 'hub-south-end',
    name: 'South End Rail Trail Hub',
    category: 'hub',
    lat: 35.2125,
    lng: -80.8585,
    distanceMiles: 9.75,
    address: 'Camden Rd & Tremont Ave, Charlotte, NC 28203',
    description: 'Premier student/alumni corridor along the Blue Line packed with outdoor patios and dining.',
    tenants: [
      { name: 'Superica', cuisine: 'Wood-Fired Tex-Mex & Fajitas' },
      { name: 'Futo Buta', cuisine: 'Artisan Ramen & Izakaya' },
      { name: 'Hawkers Asian Street Food', cuisine: 'Pan-Asian Small Plates & Bao' },
      { name: 'Jeni’s Splendid Ice Creams', cuisine: 'Artisan Scoops & Waffle Cones' },
    ],
  },
  {
    // UNVERIFIED hub: tenants not yet fact-checked.
    id: 'hub-birkdale',
    name: 'Birkdale Village',
    category: 'hub',
    lat: 35.4452,
    lng: -80.8805,
    distanceMiles: 12.45,
    address: '8712 Lindholm Dr, Huntersville, NC 28078',
    description: 'Expansive open-air suburban lifestyle center in Huntersville near Lake Norman.',
    tenants: [
      { name: 'Bad Daddy’s Burger Bar', cuisine: 'Gourmet Custom Burgers & Shakes' },
      { name: 'Midwood Smokehouse (Birkdale)', cuisine: 'Smoked Ribs, Pork & Cocktails' },
      { name: 'Foxcroft Wine Co', cuisine: 'Flatbreads, Truffle Fries & Small Plates' },
      { name: 'eeZ Fusion & Sushi', cuisine: 'Sushi, Rolls & Bento' },
    ],
  },
  {
    // UNVERIFIED hub: tenants not yet fact-checked.
    id: 'hub-historic-concord',
    name: 'Historic Downtown Concord Plaza',
    category: 'hub',
    lat: 35.4095,
    lng: -80.5795,
    distanceMiles: 11.2,
    address: 'Union St S & Cabarrus Ave, Concord, NC 28025',
    description: 'Walkable downtown historic district featuring independent bistros, bakeries, and Cuban dining.',
    tenants: [
      { name: 'Havana Carolina Restaurant & Bar', cuisine: 'Authentic Cuban & Caribbean' },
      { name: 'Gianni’s Trattoria', cuisine: 'Classic Italian & Handcrafted Pasta' },
      { name: '2 Gals Kitchen', cuisine: 'Artisan Sandwiches & Scratch Soups' },
      { name: 'Local Loaf Bakery', cuisine: 'Pastries, Breakfast & Sourdough' },
    ],
  },
  {
    // UNVERIFIED hub: tenants not yet fact-checked.
    id: 'hub-speedway-boulevard',
    name: 'Speedway & Bruton Smith Promenade',
    category: 'hub',
    lat: 35.3524,
    lng: -80.6835,
    distanceMiles: 4.82,
    address: 'Bruton Smith Blvd, Concord, NC 28027',
    description: 'Dining strip adjacent to Charlotte Motor Speedway and zMAX Dragway.',
    tenants: [
      { name: 'Twin Peaks', cuisine: 'American Comfort Fare & Wings' },
      { name: 'Texas Roadhouse', cuisine: 'Steaks, Ribs & Fresh Baked Rolls' },
      { name: 'Rocky River Lounge', cuisine: 'Casual Grill & Appetizers' },
    ],
  },
  {
    // UNVERIFIED hub: tenants not yet fact-checked.
    id: 'hub-harrisburg-center',
    name: 'Harrisburg Town Center',
    category: 'hub',
    lat: 35.3235,
    lng: -80.6552,
    distanceMiles: 4.62,
    address: 'Highway 49 & Town Center Dr, Harrisburg, NC 28075',
    description: 'Community retail village along NC-49 East featuring local neighborhood dining.',
    tenants: [
      { name: 'Hawthorne’s New York Pizza & Bar', cuisine: 'NY-Style Pizza & Wings' },
      { name: 'Vortex Bottle Shop', cuisine: 'Tapas, Flatbreads & Craft Beverages' },
      { name: 'La Unica Mexican Restaurant', cuisine: 'Traditional Mexican Cantina' },
    ],
  },
  {
    // UNVERIFIED hub: tenants not yet fact-checked.
    id: 'hub-perimeter-woods',
    name: 'Perimeter Woods & Northlake Strip',
    category: 'hub',
    lat: 35.3532,
    lng: -80.8524,
    distanceMiles: 7.35,
    address: 'Perimeter Woods Dr, Charlotte, NC 28216',
    description: 'Major dining hub along WT Harris Blvd and I-77 connecting University City to Lake Norman.',
    tenants: [
      { name: 'Firebirds Wood Fired Grill', cuisine: 'Aged Steaks & Seafood' },
      { name: 'Bad Daddy’s Burger Bar', cuisine: 'Artisan Burgers & Chopped Salads' },
      { name: 'Showmars', cuisine: 'Greek-American Pitas & Fresh Fish' },
    ],
  },
];

export const mockStandaloneFood: StandaloneFoodPlace[] = [
  {
    // UNVERIFIED: address/location not confirmed.
    id: 'food-starbucks-tryon',
    name: 'Starbucks (University City Drive-Thru)',
    category: 'food',
    lat: 35.3001,
    lng: -80.7511,
    distanceMiles: 1.02,
    address: '9101 N Tryon St, Charlotte, NC 28262',
    cuisine: 'Coffee, Tea & Breakfast Sandwiches',
    price: '$$',
  },
  // REMOVED: Portofino’s. No University City location exists; its locations are
  // Eastway Dr, Arboretum (8128 Providence Rd), Ayrsley, etc.
  {
    // VERIFIED: 4520 N Tryon St Ste 41.
    id: 'food-les-sandwiches',
    name: 'Le’s Sandwiches & Café',
    category: 'food',
    lat: 35.2604,
    lng: -80.7891,
    distanceMiles: 4.51,
    address: '4520 N Tryon St, Charlotte, NC 28213',
    cuisine: 'Traditional Vietnamese Bánh Mì',
    price: '$',
  },

  // --- FAMOUS CHARLOTTE RESTAURANTS (added) ---
  // Addresses verified. Lat/lng are APPROX (haversine distance from campus center).
  // Price’s Chicken Coop was NOT added: it has closed.
  {
    id: 'food-haberdish',
    name: 'Haberdish',
    category: 'food',
    lat: 35.2465,
    lng: -80.8061,
    distanceMiles: 5.79,
    address: '3106 N Davidson St, Charlotte, NC 28205',
    cuisine: 'Southern Fried Chicken & Craft Cocktails (NoDa)',
    price: '$$',
  },
  {
    id: 'food-merts',
    name: 'Mert’s Heart & Soul',
    category: 'food',
    lat: 35.2287, // APPROX
    lng: -80.8416, // APPROX
    distanceMiles: 8.09,
    address: '214 N College St, Charlotte, NC 28202',
    cuisine: 'Low Country & Soul Food (Uptown institution since 1998)',
    price: '$$',
  },
  {
    id: 'food-mama-ricottas',
    name: 'Mama Ricotta’s',
    category: 'food',
    lat: 35.2180, // APPROX
    lng: -80.8350, // APPROX
    distanceMiles: 8.34,
    address: '601 S Kings Dr Ste AA, Charlotte, NC 28204',
    cuisine: 'Classic Italian-American Pasta & Tiramisu',
    price: '$$',
  },
  {
    id: 'food-pinkys',
    name: 'Pinky’s Westside Grill',
    category: 'food',
    lat: 35.2200, // APPROX
    lng: -80.8590, // APPROX
    distanceMiles: 9.22,
    address: '1600 W Morehead St, Charlotte, NC 28208',
    cuisine: 'Burgers, Chili & Meatloaf (Charlotte diner institution)',
    price: '$',
  },
];

/**
 * Consolidated list containing all spots.
 */
export const allMockPlaces: MapPlace[] = [
  ...mockHousing,
  ...mockFoodHubs,
  ...mockStandaloneFood,
];

/**
 * Query helper to filter places strictly within the active slider radius.
 */
export function getPlacesWithinRadius(radiusMiles: number): MapPlace[] {
  return allMockPlaces.filter((place) => place.distanceMiles <= radiusMiles);
}

/**
 * Query helper to filter by category or tier.
 */
export function getPlacesByCategory(
  category: 'all' | 'housing' | 'gold' | 'green' | 'food',
  radiusMiles: number
): MapPlace[] {
  const bounded = getPlacesWithinRadius(radiusMiles);

  if (category === 'all') return bounded;
  if (category === 'food') return bounded.filter((p) => p.category === 'hub' || p.category === 'food');
  if (category === 'housing') return bounded.filter((p) => p.category === 'housing');
  if (category === 'gold') return bounded.filter((p) => p.category === 'housing' && p.tier === 'Gold Standard');
  if (category === 'green') return bounded.filter((p) => p.category === 'housing' && p.tier === 'Green Standard');

  return bounded;
}

/**
 * Helper to fetch a single place by ID for inspector selection.
 */
export function getPlaceById(id: string): MapPlace | undefined {
  return allMockPlaces.find((p) => p.id === id);
}