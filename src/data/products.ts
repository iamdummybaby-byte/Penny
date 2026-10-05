export interface ProductGalleryView {
  id: 'front' | 'side' | 'back' | 'detail' | 'scale';
  label: string;
  image: string;
  caption: string;
  cropStyle?: string;
}

export interface ProductDimensions {
  height: string;
  width: string;
  depth: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  image: string;
  gallery: ProductGalleryView[];
  description: string;
  practicalPoints: string[];
  price: number;
  oldPrice?: number;
  availability: 'In Stock' | 'Low Stock' | 'Limited Run';
  dimensions: ProductDimensions;
  material: string;
  capacity: string;
  category: 'Grumpy' | 'Hungry' | 'Unbothered' | 'Chaotic';
  sizeClass: 'Compact' | 'Standard' | 'Chunky';
  tags: string[];
  personality: string;
  speechBubble: string;
  featured: boolean;
  isNew?: boolean;
  weirdnessScore: number;
  accentHex: string;
}

export const HERO_DESK_IMAGE = '/src/assets/images/desk_scene_penny_1791179869993.jpg';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'penny-voxel-01',
    name: 'THE GOBLIN',
    slug: 'the-goblin',
    image: '/src/assets/images/penny_voxel_goblin_1791183101906.jpg',
    gallery: [
      {
        id: 'front',
        label: 'FRONT',
        image: '/src/assets/images/penny_voxel_goblin_1791183101906.jpg',
        caption: 'Front encounter: 3D voxel goblin smirk, pointy ears, and zero respect for deadlines.',
        cropStyle: 'scale-100 object-center',
      },
      {
        id: 'side',
        label: 'SIDE',
        image: '/src/assets/images/penny_voxel_goblin_1791183101906.jpg',
        caption: 'Side profile: Stepped pixel-block ear geometry and top pen aperture.',
        cropStyle: 'scale-110 object-left',
      },
      {
        id: 'back',
        label: 'BACK',
        image: '/src/assets/images/penny_voxel_goblin_1791183101906.jpg',
        caption: 'Desk angle: Built for Good Vibes and Bad Ideas.',
        cropStyle: 'scale-110 object-right',
      },
      {
        id: 'detail',
        label: 'DETAIL',
        image: '/src/assets/images/penny_voxel_goblin_1791183101906.jpg',
        caption: 'Close-up: Tactile 3D voxel blocks, gap-toothed grin, and top pen holder slot.',
        cropStyle: 'scale-125 object-top',
      },
      {
        id: 'scale',
        label: 'SCALE',
        image: '/src/assets/images/penny_voxel_goblin_1791183101906.jpg',
        caption: 'Scale view: Sized for standard click pens, ballpoints, and fineliners.',
        cropStyle: 'scale-95 object-center',
      },
    ],
    description:
      'Sculpted in chunky 3D voxel blocks with a gap-toothed grin and maximum mischief. The Goblin sits beside your keyboard, flips off boring tasks, and holds your go-to pen right at the top of its head.',
    practicalPoints: [
      'Precision top-mounted cylindrical slot holds ballpoint pens and pencils upright',
      'Chunky 3D pixel-block sculpt that looks pulled straight out of a retro game',
      'Weighted flat base stays planted next to your keyboard',
      'Guaranteed to make visitors ask where you got it',
    ],
    price: 399,
    oldPrice: 499,
    availability: 'In Stock',
    dimensions: {
      height: '[ADD PRODUCT MEASUREMENTS]',
      width: '[ADD PRODUCT MEASUREMENTS]',
      depth: '[ADD PRODUCT MEASUREMENTS]',
    },
    material: '[ADD PRODUCT MATERIAL]',
    capacity: 'Holds pens & pencils',
    category: 'Chaotic',
    sizeClass: 'Chunky',
    tags: ['voxel-green', 'goblin', 'bestseller', 'mischievous'],
    personality: 'Good vibes. Bad ideas. Holds your pen anyway.',
    speechBubble: 'PUT SOMETHING IN MY HEAD.',
    featured: true,
    isNew: true,
    weirdnessScore: 99,
    accentHex: '#4A6B53',
  },
  {
    id: 'penny-voxel-02',
    name: 'THE REBEL',
    slug: 'the-rebel',
    image: '/src/assets/images/penny_voxel_rebel_1791183113605.jpg',
    gallery: [
      {
        id: 'front',
        label: 'FRONT',
        image: '/src/assets/images/penny_voxel_rebel_1791183113605.jpg',
        caption: 'Front view: Tongue out, red voxel sneakers on, pen loaded on top.',
        cropStyle: 'scale-100 object-center',
      },
      {
        id: 'side',
        label: 'SIDE',
        image: '/src/assets/images/penny_voxel_rebel_1791183113605.jpg',
        caption: 'Side stance: Wide sneaker base keeps top-heavy pens completely stable.',
        cropStyle: 'scale-110 object-left',
      },
      {
        id: 'back',
        label: 'BACK',
        image: '/src/assets/images/penny_voxel_rebel_1791183113605.jpg',
        caption: 'Rear view: Bold yellow voxel head with wide top pen opening.',
        cropStyle: 'scale-110 object-right',
      },
      {
        id: 'detail',
        label: 'DETAIL',
        image: '/src/assets/images/penny_voxel_rebel_1791183113605.jpg',
        caption: 'Close-up: Raised voxel eyebrow, pink pixel tongue, and cheeky attitude.',
        cropStyle: 'scale-125 object-center',
      },
      {
        id: 'scale',
        label: 'SCALE',
        image: '/src/assets/images/penny_voxel_rebel_1791183113605.jpg',
        caption: 'Scale view: Wide top cavity fits multiple pens, markers, or styluses.',
        cropStyle: 'scale-95 object-center',
      },
    ],
    description:
      'Dressed in red-and-white pixel sneakers with his tongue out and zero filter, The Rebel brings pure arcade-brat energy to your desk while keeping your favorite pens within reach.',
    practicalPoints: [
      'Extra-wide top head opening holds pens, markers, and highlighters',
      'Sturdy two-sneaker voxel stance engineered for desk stability',
      'High-contrast yellow, crimson, and navy pixel block aesthetic',
      'Suitable for home studios, gaming setups, and unboring office desks',
    ],
    price: 399,
    availability: 'In Stock',
    dimensions: {
      height: '[ADD PRODUCT MEASUREMENTS]',
      width: '[ADD PRODUCT MEASUREMENTS]',
      depth: '[ADD PRODUCT MEASUREMENTS]',
    },
    material: '[ADD PRODUCT MATERIAL]',
    capacity: 'Holds pens, pencils & markers',
    category: 'Chaotic',
    sizeClass: 'Standard',
    tags: ['yellow', 'sneakers', 'rebel', 'voxel'],
    personality: 'Zero chill. Great sneakers. Surprisingly helpful.',
    speechBubble: 'YES, I AM A PEN HOLDER.',
    featured: true,
    isNew: true,
    weirdnessScore: 97,
    accentHex: '#E6B84D',
  },
  {
    id: 'penny-voxel-03',
    name: 'THE DEVIL IMP',
    slug: 'the-devil-imp',
    image: '/src/assets/images/penny_voxel_devil_1791183126314.jpg',
    gallery: [
      {
        id: 'front',
        label: 'FRONT',
        image: '/src/assets/images/penny_voxel_devil_1791183126314.jpg',
        caption: 'Front view: Snaggletooth smirk, furrowed brows, and horn-mounted pen slot.',
        cropStyle: 'scale-100 object-center',
      },
      {
        id: 'side',
        label: 'SIDE',
        image: '/src/assets/images/penny_voxel_devil_1791183126314.jpg',
        caption: 'Side profile: Pointed voxel devil tail and clawed feet.',
        cropStyle: 'scale-110 object-left',
      },
      {
        id: 'back',
        label: 'BACK',
        image: '/src/assets/images/penny_voxel_devil_1791183126314.jpg',
        caption: 'Angle view: Angled horn holster makes grabbing your pen effortless.',
        cropStyle: 'scale-110 object-right',
      },
      {
        id: 'detail',
        label: 'DETAIL',
        image: '/src/assets/images/penny_voxel_devil_1791183126314.jpg',
        caption: 'Detail view: Crisp red voxel blocks, cream fangs, and black claws.',
        cropStyle: 'scale-125 object-top',
      },
      {
        id: 'scale',
        label: 'SCALE',
        image: '/src/assets/images/penny_voxel_devil_1791183126314.jpg',
        caption: 'Scale view: Compact footprint right beside your mechanical keyboard.',
        cropStyle: 'scale-95 object-center',
      },
    ],
    description:
      'A tiny crimson trouble-maker with a snaggletooth grin and a hollow horn designed specifically to holster your everyday pen. He plots chaos; you get your work done.',
    practicalPoints: [
      'Angled horn pen-holster for quick one-handed pen draws',
      'Balanced three-point stance with clawed voxel feet and tail counterweight',
      'Bold crimson-red finish pops against wood, white, or dark desk mats',
      'Collectible designer-toy presence on any shelf or workspace',
    ],
    price: 349,
    availability: 'In Stock',
    dimensions: {
      height: '[ADD PRODUCT MEASUREMENTS]',
      width: '[ADD PRODUCT MEASUREMENTS]',
      depth: '[ADD PRODUCT MEASUREMENTS]',
    },
    material: '[ADD PRODUCT MATERIAL]',
    capacity: 'Holds pens & fineliners',
    category: 'Grumpy',
    sizeClass: 'Standard',
    tags: ['red-devil', 'horned', 'imp', 'voxel'],
    personality: 'Your desk’s newest little problem.',
    speechBubble: 'PENS GO IN THE HORN.',
    featured: true,
    isNew: true,
    weirdnessScore: 96,
    accentHex: '#D95D39',
  },
  {
    id: 'penny-voxel-04',
    name: 'THE MONDAY GUY',
    slug: 'the-monday-guy',
    image: '/src/assets/images/penny_voxel_office_guy_1791183138509.jpg',
    gallery: [
      {
        id: 'front',
        label: 'FRONT',
        image: '/src/assets/images/penny_voxel_office_guy_1791183138509.jpg',
        caption: 'Front view: Red tie, clenched fists, and an "ARE YOU SERIOUS?" pixel sign.',
        cropStyle: 'scale-100 object-center',
      },
      {
        id: 'side',
        label: 'SIDE',
        image: '/src/assets/images/penny_voxel_office_guy_1791183138509.jpg',
        caption: 'Side view: Seated voxel posture that never tips over.',
        cropStyle: 'scale-110 object-left',
      },
      {
        id: 'back',
        label: 'BACK',
        image: '/src/assets/images/penny_voxel_office_guy_1791183138509.jpg',
        caption: 'Sign detail: Built-in pixel speech bubble says what you are thinking.',
        cropStyle: 'scale-110 object-right',
      },
      {
        id: 'detail',
        label: 'DETAIL',
        image: '/src/assets/images/penny_voxel_office_guy_1791183138509.jpg',
        caption: 'Close-up: Spiky voxel hair with deep central pen holder cavity.',
        cropStyle: 'scale-125 object-top',
      },
      {
        id: 'scale',
        label: 'SCALE',
        image: '/src/assets/images/penny_voxel_office_guy_1791183138509.jpg',
        caption: 'Scale view: Perfect companion next to your laptop and coffee mug.',
        cropStyle: 'scale-95 object-center',
      },
    ],
    description:
      'He just read a 14-paragraph email that could have been a two-word message. Featuring a red pixel tie, clenched fists, a top pen slot in his hair, and an "ARE YOU SERIOUS?" bubble, he is the ultimate work-desk soulmate.',
    practicalPoints: [
      'Deep top-of-head cavity holds pens, pencils, and styluses securely',
      'Includes attached pixel speech-bubble sign ("ARE YOU SERIOUS?")',
      'Seated low-center-of-gravity design sits flat on any desk surface',
      'The ultimate gift for coworkers, designers, developers, and night owls',
    ],
    price: 449,
    availability: 'Limited Run',
    dimensions: {
      height: '[ADD PRODUCT MEASUREMENTS]',
      width: '[ADD PRODUCT MEASUREMENTS]',
      depth: '[ADD PRODUCT MEASUREMENTS]',
    },
    material: '[ADD PRODUCT MATERIAL]',
    capacity: 'Holds pens & pencils',
    category: 'Grumpy',
    sizeClass: 'Chunky',
    tags: ['office-rage', 'are-you-serious', 'red-tie', 'bestseller'],
    personality: 'Surviving meetings on your behalf since 9 AM.',
    speechBubble: 'ARE YOU SERIOUS?',
    featured: true,
    isNew: true,
    weirdnessScore: 98,
    accentHex: '#D95D39',
  },
  {
    id: 'penny-01',
    name: 'THE GREMLIN',
    slug: 'the-gremlin',
    image: '/src/assets/images/creature_gremlin_1791179812560.jpg',
    gallery: [
      {
        id: 'front',
        label: 'FRONT',
        image: '/src/assets/images/creature_gremlin_1791179812560.jpg',
        caption: 'Front encounter: Wide eyes, mossy ears, zero patience for dull meetings.',
        cropStyle: 'scale-100 object-center',
      },
      {
        id: 'side',
        label: 'SIDE',
        image: '/src/assets/images/creature_gremlin_1791179812560.jpg',
        caption: 'Profile view: Balanced posture engineered to hold top-heavy fountain pens.',
        cropStyle: 'scale-110 object-left',
      },
      {
        id: 'back',
        label: 'BACK',
        image: '/src/assets/images/creature_gremlin_1791179812560.jpg',
        caption: 'Rear silhouette: Smooth matte finish that looks good from across the studio.',
        cropStyle: 'scale-110 object-right',
      },
      {
        id: 'detail',
        label: 'DETAIL',
        image: '/src/assets/images/creature_gremlin_1791179812560.jpg',
        caption: 'Close-up: Sculpted expression and deep top cavity for everyday stationery.',
        cropStyle: 'scale-125 object-top',
      },
      {
        id: 'scale',
        label: 'SCALE',
        image: '/src/assets/images/creature_gremlin_1791179812560.jpg',
        caption: 'Scale reference with standard wooden pencils and brass pen.',
        cropStyle: 'scale-95 object-center',
      },
    ],
    description:
      'This little mossy menace was designed for one noble purpose: keeping your desk slightly less boring while aggressively guarding your favorite pens.',
    practicalPoints: [
      'Holds pens, pencils, and fine-liners upright inside its hollow head',
      'Designed as a heavy, stable desktop display piece',
      'Compact footprint that fits right beside your mechanical keyboard',
      'Suitable for home, office, and late-night study desks',
    ],
    price: 299,
    availability: 'In Stock',
    dimensions: {
      height: '[ADD PRODUCT MEASUREMENTS]',
      width: '[ADD PRODUCT MEASUREMENTS]',
      depth: '[ADD PRODUCT MEASUREMENTS]',
    },
    material: '[ADD PRODUCT MATERIAL]',
    capacity: 'Holds pens & pencils',
    category: 'Chaotic',
    sizeClass: 'Compact',
    tags: ['moss-green', 'starter-weirdo'],
    personality: 'Small. Chaotic. Surprisingly useful.',
    speechBubble: 'I HAVE A JOB. KIND OF.',
    featured: false,
    isNew: false,
    weirdnessScore: 92,
    accentHex: '#4A6B53',
  },
  {
    id: 'penny-02',
    name: 'THE CHOMP',
    slug: 'the-chomp',
    image: '/src/assets/images/creature_chomp_1791179827720.jpg',
    gallery: [
      {
        id: 'front',
        label: 'FRONT',
        image: '/src/assets/images/creature_chomp_1791179827720.jpg',
        caption: 'Front view: Upward-facing maw ready to swallow markers and pens.',
        cropStyle: 'scale-100 object-center',
      },
      {
        id: 'side',
        label: 'SIDE',
        image: '/src/assets/images/creature_chomp_1791179827720.jpg',
        caption: 'Side angle: Squat low-center-of-gravity stance.',
        cropStyle: 'scale-110 object-left',
      },
      {
        id: 'back',
        label: 'BACK',
        image: '/src/assets/images/creature_chomp_1791179827720.jpg',
        caption: 'Back view: Clean sculpted spine and sturdy stubby feet.',
        cropStyle: 'scale-110 object-right',
      },
      {
        id: 'detail',
        label: 'DETAIL',
        image: '/src/assets/images/creature_chomp_1791179827720.jpg',
        caption: 'Texture detail: Warm terracotta-orange matte surface and toothy rim.',
        cropStyle: 'scale-125 object-center',
      },
      {
        id: 'scale',
        label: 'SCALE',
        image: '/src/assets/images/creature_chomp_1791179827720.jpg',
        caption: 'Desk scale: Built to swallow thicker markers and highlighters.',
        cropStyle: 'scale-95 object-center',
      },
    ],
    description:
      'Perpetually hungry for stationery. Instead of biting your fingers, The Chomp opens wide so you have somewhere obvious to drop your fineliners.',
    practicalPoints: [
      'Wide upward mouth opening for quick one-handed pen drops',
      'Designed as a desktop display piece that sparks immediate questions',
      'Sturdy base prevents tipping even with heavier markers',
      'Suitable for home, office, and studio desks',
    ],
    price: 349,
    availability: 'In Stock',
    dimensions: {
      height: '[ADD PRODUCT MEASUREMENTS]',
      width: '[ADD PRODUCT MEASUREMENTS]',
      depth: '[ADD PRODUCT MEASUREMENTS]',
    },
    material: '[ADD PRODUCT MATERIAL]',
    capacity: 'Holds pens, pencils & markers',
    category: 'Hungry',
    sizeClass: 'Standard',
    tags: ['terracotta', 'wide-mouth', 'fan-favorite'],
    personality: 'Looks hungry. Eats your pens.',
    speechBubble: 'FEED ME A FINELINER.',
    featured: false,
    isNew: false,
    weirdnessScore: 89,
    accentHex: '#D95D39',
  },
  {
    id: 'penny-03',
    name: 'THE BLOB',
    slug: 'the-blob',
    image: '/src/assets/images/creature_blob_1791179838554.jpg',
    gallery: [
      {
        id: 'front',
        label: 'FRONT',
        image: '/src/assets/images/creature_blob_1791179838554.jpg',
        caption: 'Front view: Two tiny eyes and not a single stressful thought.',
        cropStyle: 'scale-100 object-center',
      },
      {
        id: 'side',
        label: 'SIDE',
        image: '/src/assets/images/creature_blob_1791179838554.jpg',
        caption: 'Side puddle profile: Softly melted silhouette.',
        cropStyle: 'scale-110 object-left',
      },
      {
        id: 'back',
        label: 'BACK',
        image: '/src/assets/images/creature_blob_1791179838554.jpg',
        caption: 'Back view: Smooth butter-yellow curve.',
        cropStyle: 'scale-110 object-right',
      },
      {
        id: 'detail',
        label: 'DETAIL',
        image: '/src/assets/images/creature_blob_1791179838554.jpg',
        caption: 'Detail view: Minimalist bead eyes and clean top aperture.',
        cropStyle: 'scale-125 object-top',
      },
      {
        id: 'scale',
        label: 'SCALE',
        image: '/src/assets/images/creature_blob_1791179838554.jpg',
        caption: 'Scale view: Compact footprint that fits under monitor stands.',
        cropStyle: 'scale-95 object-center',
      },
    ],
    description:
      'The Blob has never read an email in its life. It just sits there in a state of peaceful pudding-like calm while pens stick straight out of its skull.',
    practicalPoints: [
      'Holds pens and pencils without judging your browser tabs',
      'Designed as a calming, minimalist-weird desktop sculpture',
      'Wide puddled base makes it nearly impossible to knock over',
      'Suitable for home, office, and study desks',
    ],
    price: 299,
    availability: 'In Stock',
    dimensions: {
      height: '[ADD PRODUCT MEASUREMENTS]',
      width: '[ADD PRODUCT MEASUREMENTS]',
      depth: '[ADD PRODUCT MEASUREMENTS]',
    },
    material: '[ADD PRODUCT MATERIAL]',
    capacity: 'Holds pens & pencils',
    category: 'Unbothered',
    sizeClass: 'Compact',
    tags: ['soft-yellow', 'minimalist-weird', 'calm'],
    personality: 'Zero thoughts. Maximum stationery.',
    speechBubble: 'TAKE ME HOME.',
    featured: false,
    isNew: false,
    weirdnessScore: 86,
    accentHex: '#E6B84D',
  },
  {
    id: 'penny-05',
    name: 'THE WEIRDO',
    slug: 'the-weirdo',
    image: '/src/assets/images/creature_weirdo_1791179859630.jpg',
    gallery: [
      {
        id: 'front',
        label: 'FRONT',
        image: '/src/assets/images/creature_weirdo_1791179859630.jpg',
        caption: 'Front view: Three eyes watching you open another browser tab.',
        cropStyle: 'scale-100 object-center',
      },
      {
        id: 'side',
        label: 'SIDE',
        image: '/src/assets/images/creature_weirdo_1791179859630.jpg',
        caption: 'Side view: Sculpted ears and stone-cream finish.',
        cropStyle: 'scale-110 object-left',
      },
      {
        id: 'back',
        label: 'BACK',
        image: '/src/assets/images/creature_weirdo_1791179859630.jpg',
        caption: 'Back view: Clean earthy ceramic-inspired form.',
        cropStyle: 'scale-110 object-right',
      },
      {
        id: 'detail',
        label: 'DETAIL',
        image: '/src/assets/images/creature_weirdo_1791179859630.jpg',
        caption: 'Detail view: Triple-eye gaze and crown pen opening.',
        cropStyle: 'scale-125 object-center',
      },
      {
        id: 'scale',
        label: 'SCALE',
        image: '/src/assets/images/creature_weirdo_1791179859630.jpg',
        caption: 'Scale view: Sized for fountain pens and drafting pencils.',
        cropStyle: 'scale-95 object-center',
      },
    ],
    description:
      'Nobody in the studio can agree on what species this is. What we do know: it has three eyes, a hollow head, and an uncanny ability to hold your best pens.',
    practicalPoints: [
      'Holds fountain pens, pencils, and stylus pens securely',
      'Designed as an unmistakable conversation-starting desk piece',
      'Earthy cream and brown palette blends with any desk setup',
      'Suitable for home, office, and creative studio desks',
    ],
    price: 449,
    availability: 'Low Stock',
    dimensions: {
      height: '[ADD PRODUCT MEASUREMENTS]',
      width: '[ADD PRODUCT MEASUREMENTS]',
      depth: '[ADD PRODUCT MEASUREMENTS]',
    },
    material: '[ADD PRODUCT MATERIAL]',
    capacity: 'Holds pens & pencils',
    category: 'Chaotic',
    sizeClass: 'Chunky',
    tags: ['three-eyed', 'collector-grade', 'stone-cream'],
    personality: 'Nobody knows what it is. It holds pencils though.',
    speechBubble: 'PENS GO HERE.',
    featured: false,
    isNew: false,
    weirdnessScore: 95,
    accentHex: '#57534E',
  },
];

export const FAQ_ITEMS = [
  {
    q: 'What is PENNY?',
    a: 'PENNY is an independent design brand that makes weird, collectible creature-shaped pen holders. We believe your desk deserves better than another boring plastic cup.',
  },
  {
    q: 'What are the creatures made from?',
    a: 'Each creature is crafted as a sturdy, tactile physical desk object with a crisp matte finish. Exact material specifications for each individual edition can be viewed or updated on its creature profile page.',
  },
  {
    q: 'What size are they?',
    a: 'They are compact desktop companions designed to sit comfortably next to your keyboard or notebook without hogging space. Check the MEASUREMENTS section on any creature page for exact Height, Width, and Depth slots.',
  },
  {
    q: 'How many pens can they hold?',
    a: 'Depending on the creature and the thickness of your stationery, each one comfortably holds your everyday click pens, ballpoints, pencils, or fineliners.',
  },
  {
    q: 'Do you ship across India?',
    a: 'Yes! We ship to all serviceable PIN codes across India. Orders above ₹799 qualify for free shipping.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Creatures are packed and dispatched within 24–48 hours. Standard delivery across metro cities takes 3–5 business days, and 5–7 business days for the rest of India.',
  },
  {
    q: 'Can I return my order?',
    a: 'If your creature arrives damaged in transit or you received the wrong weirdo, let us know within 7 days of delivery with an unboxing photo and we will replace or refund it immediately.',
  },
  {
    q: 'Are the creatures handmade?',
    a: 'Every PENNY creature starts as an original sculpt and is finished in small collectible batches, meaning subtle character variations make each desk companion uniquely yours.',
  },
];
