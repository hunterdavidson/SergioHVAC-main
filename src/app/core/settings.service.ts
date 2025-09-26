import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export type TeamMember = {
  name?: string;
  role?: string;
  icon?: string;            // e.g. 'user' | 'wrench' | 'snowflake' | 'fire' | 'star'
  hidden?: boolean;
  photoPath?: string;       // storage key in bucket
  photoUrl?: string;        // public URL to display
};

export type AboutItem = {
  year?: string;
  title?: string;
  body?: string;
  color?: 'blue' | 'red';
  hidden?: boolean;
  icon?: string;
};

export type GalleryItem = { path?: string; url?: string; alt?: string };

export type SiteSettings = {
  home: {
    headline: string;
    subhead: string;
    ctaText: string;
    heroPath?: string;
    heroUrl?: string;
  };
  education?: {
    heading?: string;
    subheading?: string;
    videos: Array<{ url: string; title?: string; description?: string }>;
  };
  blog?: {
    posts: Array<{
      slug: string;
      title: string;
      date?: string;
      summary?: string;
      contentHtml?: string;
      heroPath?: string;
      heroUrl?: string;
      author?: string;
      readMins?: number;
      tags?: string[];
      published?: boolean;
      inlineImages?: string[];
    }>;
  };
  plans?: {
    heading?: string;
    subheading?: string;
    tiers: Array<{
      name: string;
      price: number;
      interval?: string; // e.g., 'per visit', 'per year'
      features: string[];
      cta?: string;
      mostPopular?: boolean;
    }>;
  };
  services: {
    sectionHeading?: string;
    sectionSubheading?: string;
    ac: { title: string; body: string; cta: string; hidden?: boolean };
    heat: { title: string; body: string; cta: string; hidden?: boolean };
    maintenance: { title: string; body: string; cta: string; hidden?: boolean };
  };
  servicePages?: {
    ac: {
      heading?: string;
      subheading?: string;
      body?: string;
      heroPath?: string;
      heroUrl?: string;
      features: string[];
      gallery: GalleryItem[];
      faqs?: Array<{ q: string; a: string }>;
      sections?: Array<{ heading: string; body: string }>;
    };
    heat: {
      heading?: string;
      subheading?: string;
      body?: string;
      heroPath?: string;
      heroUrl?: string;
      features: string[];
      gallery: GalleryItem[];
      faqs?: Array<{ q: string; a: string }>;
      sections?: Array<{ heading: string; body: string }>;
    };
    maintenance: {
      heading?: string;
      subheading?: string;
      body?: string;
      heroPath?: string;
      heroUrl?: string;
      features: string[];
      gallery: GalleryItem[];
      faqs?: Array<{ q: string; a: string }>;
      sections?: Array<{ heading: string; body: string }>;
    };
  };
  about: {
    heading?: string;
    subheading?: string;
    items: AboutItem[];
  };
  team: {
    heading?: string;
    subheading?: string;
    members: TeamMember[];
  };
  contact: {
    heading?: string;
    subheading?: string;
    cta?: string;
    phoneLead?: string;
  };
  footer?: {
    companyName?: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    links: Array<{ label: string; url: string }>;
    social: Array<{ label: string; url: string; icon?: string }>;
    legalNotice?: string;
  };
  legal?: {
    privacy: { title: string; updatedOn?: string; contentHtml: string };
    terms: { title: string; updatedOn?: string; contentHtml: string };
  };
  navbar?: {
    phone?: string; // "(555) 555-5555"
  };
  estimate?: {
    targetMargin?: number; // 0.40 = 40%
    taxRate?: number; // 0.0825
    laborTaxResidential?: boolean;
    laborTaxCommercial?: boolean;
    overheadPct?: number; // 0.12
    seasonalMultipliers?: { normal: number; summer: number };
    accessMultipliers?: { easy: number; standard: number; difficult: number };
    afterHoursMultiplier?: number; // 1.25
    permitFlat?: number; // 175
    addOnPrices?: {
      lineSet?: number;
      condenserPad?: number;
      whipDisconnect?: number;
      electricalUpgrade?: number;
      smartThermostat?: { label: string; price: number };
      basicThermostat?: { label: string; price: number };
      craneFee?: number;
      disposalFee?: number;
      refrigerant?: { R410A?: number; R22?: number };
    };
    perJob?: {
      perWorkerPerJob?: number;
      perWorkerPerJobLow?: number; // legacy; used if single value missing
      perWorkerPerJobHigh?: number; // legacy; used if single value missing
      defaultCrewSize: number;
      altCrewSize?: number;
    };
    perHour?: { hourlyRatePerTech: number; defaultCrewSize: number };
    baselineHours?: {
      acSplitChangeout: { min: number; max: number };
      furnaceReplace: { min: number; max: number };
      heatPumpReplace: { min: number; max: number };
      miniSplitSingle: { min: number; max: number };
      miniSplitExtraHead: { min: number; max: number };
      electricalUpgrade: number;
      lineSetReplace: number;
    };
    equipmentBasePrices?: any;
    ductworkAddersHours?: { none: number; minor: number; moderate: number; major: number };
    goodBetterBest?: boolean;
    showFinancing?: boolean;
    zipPrefixes?: { [prefix: string]: number }; // e.g., { '760':1.00, '761':1.02, '750':1.03 }
  };
  reviews?: {
    rating?: number;
    count?: number;
    googlePlaceId?: string;
    googleReviewUrl?: string;
    testimonials?: Array<{ author?: string; text?: string; rating?: number }>;
  };
};

const DEFAULT_SETTINGS: SiteSettings = {
  home: {
    headline: 'Need HVAC Service Today? We’re Just a Click Away',
    subhead: 'Reliable, Fast, and Local — Book Your Appointment in Minutes',
    ctaText: 'Schedule Your Free Quote',
    heroPath: undefined,
    heroUrl: undefined,
  },
  services: {
    sectionHeading: 'Our Services',
    sectionSubheading: 'Cooling, heating, and maintenance—done right',
    ac: {
      title: 'Fast & Efficient AC Installations',
      body: 'Keep cool with pro installs sized for your home and budget.',
      cta: 'Get Free AC Quote',
      hidden: false,
    },
    heat: {
      title: 'Stay Warm: Trusted Heating Services',
      body: 'Repairs and installs to keep your family comfortable all winter.',
      cta: 'Book Heating Service',
      hidden: false,
    },
    maintenance: {
      title: 'Book Your Seasonal Maintenance',
      body: 'Prevent breakdowns and lower bills with a quick tune-up.',
      cta: 'Schedule Maintenance',
      hidden: false,
    },
  },
  servicePages: {
    ac: {
      heading: 'Air Conditioning Installation & Repair',
      subheading: 'High‑efficiency cooling, sized and installed right',
      body: 'From fast repairs to new high‑efficiency installs, we keep your home cool and your bills low. We size systems properly and stand behind our work. Our licensed technicians diagnose issues quickly and recommend the best options for your home and budget.',
      heroUrl: 'https://images.unsplash.com/photo-1581093588401-16fcb3c9f4a0?q=80&w=1600&auto=format&fit=crop',
      features: [
        'Same‑day diagnostics',
        'Licensed, insured technicians',
        'Honest pricing, no surprises',
        'Manufacturer‑backed warranties'
      ],
      gallery: [
        { url: 'https://images.unsplash.com/photo-1581093588360-15d8b89e9c6c?q=80&w=1200&auto=format&fit=crop', alt: 'Technician working on AC condenser' },
        { url: 'https://images.unsplash.com/photo-1597764699514-9f3ef0c79855?q=80&w=1200&auto=format&fit=crop', alt: 'New AC unit install' },
        { url: 'https://images.unsplash.com/photo-1581091014210-5cbf39e7f06c?q=80&w=1200&auto=format&fit=crop', alt: 'Indoor air handler' }
      ],
      faqs: [
        { q: 'How long does an AC install take?', a: 'Most full system installs are completed in one day. Complex jobs or special order equipment may require additional time, but we will always communicate a clear timeline.' },
        { q: 'Should I repair or replace my AC?', a: 'If your system is over 10–12 years old, requires frequent repairs, or uses R‑22 refrigerant, replacement is often the most cost‑effective long‑term option. We will provide a transparent side‑by‑side comparison.' },
        { q: 'Do you offer financing?', a: 'Yes—flexible financing options are available for qualifying customers. Ask our team during your free estimate.' },
        { q: 'What brands do you install?', a: 'We service and install all major brands. We’ll recommend quality equipment that fits your home, efficiency goals, and budget.' },
        { q: 'Do you provide warranties?', a: 'Yes. New systems include manufacturer warranties and our workmanship guarantee. We explain coverage details before installation.' }
      ],
      sections: [
        { heading: 'Signs You May Need AC Repair', body: 'Warm air, weak airflow, unusual noises, frequent cycling, water near the indoor unit, or unexpected energy bill spikes are common indicators. Early diagnosis prevents larger issues.' },
        { heading: 'Our AC Installation Process', body: 'We begin with a proper load calculation and duct inspection, recommend right‑sized equipment, protect your home during install, and test every system function before we leave. We walk you through operation and maintenance.' },
        { heading: 'Why Choose Us for Cooling', body: 'Transparent quotes, friendly techs, fast service windows, and quality parts. We treat your home with respect and stand behind every job in the Dallas–Fort Worth area.' }
      ],
    },
    heat: {
      heading: 'Heating Services & Furnace Replacement',
      subheading: 'Safe, reliable heat when you need it most',
      body: 'We repair and replace furnaces and heat pumps with careful attention to safety and efficiency so you stay comfortable all season. From emergency repairs to high‑efficiency replacements, our team delivers long‑lasting comfort.',
      heroUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop',
      features: [
        'Emergency repairs',
        'Clean workmanship',
        'Energy‑saving options',
        'Transparent recommendations'
      ],
      gallery: [
        { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop', alt: 'Furnace maintenance' },
        { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', alt: 'Cozy home heating' },
        { url: 'https://images.unsplash.com/photo-1517244683847-7456b63c5dde?q=80&w=1200&auto=format&fit=crop', alt: 'Heat pump outdoor unit' }
      ],
      faqs: [
        { q: 'Can you replace my furnace in one day?', a: 'Yes. Most replacements are finished the same day, including haul‑away of the old unit and a thorough startup and safety check.' },
        { q: 'Do you repair heat pumps?', a: 'Absolutely. We service and install heat pumps and dual‑fuel systems from all major manufacturers.' },
        { q: 'What are common furnace repair signs?', a: 'Cold spots, short cycling, loud banging or squealing, and higher utility bills. If you notice gas smells or repeated safety shutoffs, turn the system off and call us immediately.' },
        { q: 'Do you offer maintenance plans?', a: 'Yes. Seasonal tune‑ups keep your system efficient and help avoid surprise breakdowns during peak weather.' },
        { q: 'Do you offer financing for replacements?', a: 'Yes—flexible financing options are available for qualifying customers.' },
        { q: 'What maintenance do furnaces need?', a: 'An annual tune‑up that checks burners, heat exchanger, safeties, and airflow helps ensure safe, efficient operation.' }
      ],
      sections: [
        { heading: 'Heating Repair Done Right', body: 'We diagnose the root cause—not just the symptom—so the fix lasts. Our trucks are stocked for common parts to get heat restored quickly.' },
        { heading: 'Furnace Replacement Benefits', body: 'Modern systems deliver quieter operation, better comfort, and lower monthly bills. We offer options and clear pricing, no pressure.' },
        { heading: 'Safety First', body: 'Every visit includes a safety inspection to ensure proper venting, combustion air, and carbon monoxide protection.' }
      ],
    },
    maintenance: {
      heading: 'Seasonal Maintenance & Tune‑Ups',
      subheading: 'Prevent breakdowns and lower your bills',
      body: 'A quick seasonal tune‑up can extend system life, improve comfort, improve air quality, and help prevent inconvenient breakdowns during peak weather. We check refrigerant levels, electrical components, airflow, and thermostat function.',
      heroUrl: 'https://images.unsplash.com/photo-1511381939415-c1c66e0d8794?q=80&w=1600&auto=format&fit=crop',
      features: [
        'Multi‑point inspection',
        'Filter replacement',
        'Refrigerant and electrical checks',
        'Friendly tips to keep air clean'
      ],
      gallery: [
        { url: 'https://images.unsplash.com/photo-1511381939415-c1c66e0d8794?q=80&w=1200&auto=format&fit=crop', alt: 'Technician checking filters' },
        { url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop', alt: 'Clean air vent' },
        { url: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1200&auto=format&fit=crop', alt: 'Maintenance checklist' }
      ],
      faqs: [
        { q: 'How often should I schedule maintenance?', a: 'We recommend a tune‑up twice a year—AC in spring and heating in fall. This catches small issues before they become costly.' },
        { q: 'Does maintenance keep my warranty valid?', a: 'Yes. Most manufacturers require documented routine maintenance for warranty coverage.' },
        { q: 'What does a tune‑up include?', a: 'We inspect coils, blower, electrical components, drain lines, refrigerant charge, safety switches, and more. We’ll share a simple report with any findings.' },
        { q: 'How long does a tune‑up take?', a: 'Typically 45–90 minutes per system depending on access and condition.' },
        { q: 'Will you remind me when it’s time?', a: 'Yes. We can set email/text reminders or enroll you in a plan with scheduled visits.' }
      ],
      sections: [
        { heading: 'What We Check', body: 'Our multi‑point inspection covers airflow, electrical, refrigerant, safety controls, and thermostat operation. We clean and calibrate to restore efficiency.' },
        { heading: 'Benefits of Regular Maintenance', body: 'Fewer breakdowns, better comfort, longer equipment life, lower energy bills, and cleaner indoor air.' },
        { heading: 'Filter & IAQ Tips', body: 'We’ll recommend the right filter for your system and habits. Ask about air cleaners and simple upgrades that make a difference.' }
      ],
    },
  },
  about: {
    heading: 'About Us',
    subheading: 'Family-owned and serving neighbors across DFW since 2018.',
    items: [
      { year: '2018', title: 'Opened our family-run garage shop', body: 'Sergio and Maria launched SV HVAC from the family garage with one truck, focused on neighbors-first service and honest pricing.', color: 'blue', icon: 'wrench' },
      { year: '2020', title: 'Neighbors spread the word', body: 'Church friends, realtors, and school parents started sharing our name, letting us hire our first techs and add a second van.', color: 'red', icon: 'user' },
      { year: '2023', title: 'Still family, now full-service', body: 'We now handle installs, tune-ups, and indoor air upgrades across DFW while keeping the same small-business care on every visit.', color: 'blue', icon: 'star' },
    ],
  },
  team: {
    heading: 'Meet the Team',
    subheading: 'Our experienced professionals are here for you.',
    members: [{}, {}, {}],
  },
  contact: {
    heading: 'Request Service',
    subheading: 'Tell us what you need and we\'ll get right back to you.',
    cta: 'Request Service Now',
    phoneLead: 'Prefer to talk?',
  },
  footer: {
    companyName: 'SV HVAC Services',
    tagline: 'Family-owned comfort pros serving Dallas-Fort Worth.',
    address: '123 Main St, Grapevine, TX 76051',
    phone: '(817) 724-5507',
    email: 'hello@svhvac.com',
    links: [
      { label: 'Home', url: '/' },
      { label: 'Services', url: '/services' },
      { label: 'Maintenance Plans', url: '/maintenance-plan' },
      { label: 'Privacy Policy', url: '/privacy-policy' },
      { label: 'Terms & Conditions', url: '/terms-of-service' }
    ],
    social: [
      { label: 'Facebook', url: 'https://www.facebook.com/svhvac', icon: 'facebook' },
      { label: 'Instagram', url: 'https://www.instagram.com/svhvac', icon: 'instagram' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/company/svhvac', icon: 'linkedin' }
    ],
    legalNotice: 'Serving the Dallas-Fort Worth Metroplex',
  },
  legal: {
    privacy: {
      title: 'Privacy Policy',
      updatedOn: 'September 20, 2025',
      contentHtml: [
        '<p>SV HVAC Services LLC ("SV HVAC", "we", "our") respects your privacy. This policy explains how we collect, use, and protect information when you visit our site or request service.</p>',
        '<h2>Information We Collect</h2>',
        '<ul>',
        '  <li>Contact details you share when requesting service (name, phone, email, address, preferred times).</li>',
        '  <li>Project notes that help us prepare a quote or perform work (equipment type, photos, comfort concerns).</li>',
        '  <li>Communications like call logs or emails related to your service request.</li>',
        '  <li>Website analytics gathered through cookies so we understand site performance and marketing.</li>',
        '</ul>',
        '<h2>How We Use Information</h2>',
        '<p>We use your details to respond to requests, schedule work, provide estimates, process payments, and send helpful updates or maintenance reminders. You can opt out of marketing messages at any time.</p>',
        '<h2>Sharing & Service Providers</h2>',
        '<p>We do not sell personal information. We may share it with trusted partners who support our business, such as scheduling software or financing providers. Those partners must safeguard the data and use it only for the intended purpose.</p>',
        '<h2>Cookies & Analytics</h2>',
        '<p>We may use cookies or similar tools to measure website performance. You can adjust browser settings to limit cookies, though some features may be affected.</p>',
        '<h2>Retention & Security</h2>',
        '<p>Service records are kept only as long as needed to support our work, meet legal obligations, or resolve disputes. We implement reasonable safeguards, but no system is completely secure.</p>',
        '<h2>Your Choices</h2>',
        '<p>You can request updates or deletion of your information by emailing <a href="mailto:hello@svhvac.com">hello@svhvac.com</a>.</p>',
      ].join('\n'),
    },
    terms: {
      title: 'Terms & Conditions',
      updatedOn: 'September 20, 2025',
      contentHtml: [
        '<p>These Terms & Conditions govern your use of the SV HVAC Services website and any proposals, estimates, or service agreements we provide.</p>',
        '<h2>Scope of Services</h2>',
        '<p>We provide residential and light commercial HVAC inspection, repair, maintenance, and replacement services according to the scope approved on your estimate or work order.</p>',
        '<h2>Estimates & Approvals</h2>',
        '<p>Pricing is based on conditions known at the time of the estimate. Unforeseen issues or code requirements may require a revised quote. Work begins after written or electronic approval.</p>',
        '<h2>Access & Site Conditions</h2>',
        '<p>Customers must provide safe, unobstructed access to equipment and work areas. Unsafe conditions may require rescheduling or added charges.</p>',
        '<h2>Scheduling & Cancellations</h2>',
        '<p>If you need to reschedule or cancel, please give at least 24 hours notice. Missed appointments may be subject to a trip charge.</p>',
        '<h2>Payments & Financing</h2>',
        '<p>Payment terms are listed on your estimate or invoice. Deposits may be required for equipment orders. Balances are due upon substantial completion unless other arrangements are made in writing.</p>',
        '<h2>Warranties</h2>',
        '<p>Manufacturer warranties apply to equipment and materials. SV HVAC Services provides a workmanship warranty as described on your invoice. Damage caused by misuse, lack of maintenance, or acts of nature is not covered.</p>',
        '<h2>Limitation of Liability</h2>',
        '<p>To the fullest extent allowed by law, our liability is limited to the amount paid for the specific service. We are not liable for incidental or consequential damages.</p>',
        '<h2>Permits & Code Compliance</h2>',
        '<p>We obtain required HVAC permits and follow applicable codes. Property owners are responsible for any HOA or landlord approvals.</p>',
        '<h2>Contact</h2>',
        '<p>Questions about these terms? Email <a href="mailto:hello@svhvac.com">hello@svhvac.com</a> or call (817) 724-5507.</p>',
      ].join('\n'),
    },
  },
  navbar: {
    phone: '(817) 724-5507',
  },
  reviews: {
    rating: 5.0,
    count: 0,
    googlePlaceId: '',
    googleReviewUrl: '',
    testimonials: []
  },
  education: {
    heading: 'HVAC Education & Tips',
    subheading: 'Simple how‑tos to help your system run better',
    videos: [
      { url: 'https://www.youtube.com/watch?v=0GZ8tXJ7z0I', title: 'How to Change Your AC Filter', description: 'A quick walkthrough on replacing filters and why it matters.' },
      { url: 'https://www.youtube.com/watch?v=Qz2oY4V1JcA', title: 'Thermostat Basics', description: 'Helpful settings to improve comfort and efficiency.' },
      { url: 'https://www.youtube.com/watch?v=pLah3qB9iJw', title: 'Clearing a Condensate Drain Line', description: 'Stop the pan from overflowing with a simple clean-out.' },
      { url: 'https://www.youtube.com/watch?v=Fh7XnHzg8iA', title: 'Heat Pump 101', description: 'How heat pumps heat and cool your home efficiently.' },
      { url: 'https://www.youtube.com/watch?v=RrVXx7dQFbw', title: 'Improving Indoor Air Quality', description: 'Filters, MERV, and simple ways to reduce dust.' },
      { url: 'https://www.youtube.com/watch?v=8Q_7Hh2mA_k', title: 'Thermostat Scheduling Tips', description: 'Set and forget comfort with energy savings.' }
    ]
  },
  blog: {
    posts: [
      {
        slug: 'ac-installation-cost-dfw',
        title: 'AC Installation Costs in Dallas–Fort Worth: What to Expect',
        date: new Date().toISOString().slice(0,10),
        summary: 'A transparent look at equipment options, labor, and what impacts project pricing in the DFW area.',
        heroUrl: 'https://images.unsplash.com/photo-1581093588360-15d8b89e9c6c?q=80&w=1600&auto=format&fit=crop',
        contentHtml: '<h2>Typical Price Ranges in DFW</h2><p>Most full AC changeouts in the Dallas–Fort Worth area land between <strong>$7,500–$14,000</strong> for standard split systems. Projects involving new ductwork, high‑efficiency heat pumps, or electrical upgrades can run higher. Multi‑stage or variable‑speed equipment improves comfort and efficiency but increases upfront cost.</p><h3>Key Cost Factors</h3><ul><li><strong>System size & SEER2</strong>: Larger homes need higher tonnage; higher SEER2 reduces energy use but costs more upfront.</li><li><strong>Ductwork condition</strong>: Leaky or undersized ducts limit performance; sealing or replacement adds labor and materials.</li><li><strong>Electrical & code items</strong>: New disconnects, pads, breakers, or line sets may be required to meet code and manufacturer specs.</li><li><strong>Access</strong>: Attic heights, roof access, and long line sets add time and equipment (e.g., a crane).</li></ul><h3>What’s Included with a Quality Install</h3><ul><li>Right‑sized equipment with load calculation</li><li>New pad, disconnect, and properly charged refrigerant lines</li><li>Startup and performance verification (static pressure, subcool/superheat)</li><li>Clean workmanship, permits, haul‑away, and a walkthrough</li></ul><h3>Financing & Rebates</h3><p>We offer flexible financing for qualified customers and help you find any available utility rebates. <strong>Goal</strong>: the best long‑term comfort per dollar.</p><p><em>Call us for a free, no‑pressure estimate. We’ll price good/better/best options and explain trade‑offs clearly.</em></p>',
        author: 'SV HVAC',
        readMins: 6,
        tags: ['ac','pricing','dfw'],
        published: true
      },
      {
        slug: 'ac-maintenance-checklist',
        title: 'Spring AC Maintenance Checklist for DFW Homes',
        date: new Date().toISOString().slice(0,10),
        summary: 'Simple steps to get your system ready for Texas heat.',
        heroUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1600&auto=format&fit=crop',
        contentHtml: '<p>A spring tune‑up prevents surprise breakdowns during the first 90° week. Use this checklist to keep comfort steady and energy use down.</p><h3>Homeowner To‑Dos</h3><ul><li><strong>Filters</strong>: Replace every 1–3 months. If you can’t see light through it, swap it.</li><li><strong>Outdoor clearance</strong>: Keep 18–24\" of space around the condenser. Trim shrubs and remove leaves.</li><li><strong>Vents & returns</strong>: Open and unblocked. Closed vents raise static pressure and can shorten equipment life.</li><li><strong>Thermostat</strong>: Replace batteries (if applicable) and set an efficient schedule.</li></ul><h3>What We Check</h3><ul><li>Refrigerant charge (subcool/superheat)</li><li>Electrical components and amp draws</li><li>Capacitors, contactors, safety controls</li><li>Drain lines and pan (clear to prevent water damage)</li><li>Static pressure & airflow</li></ul><h3>When to Call</h3><p>Warm air, weak airflow, short cycling, ice on the lines, or a tripped float switch are early warnings. We’ll diagnose root causes and give simple, transparent options.</p>',
        author: 'SV HVAC', readMins: 5,
        tags: ['maintenance','checklist','ac'], published: true
      },
      {
        slug: 'seer2-explained',
        title: 'SEER2 Explained: What Efficiency Ratings Mean',
        date: new Date().toISOString().slice(0,10),
        summary: 'Understand the updated efficiency standard and how it affects your next system.',
        contentHtml: '<p>SEER2 is the updated standard replacing SEER to better reflect real‑world performance. Higher numbers generally mean lower energy bills, but balance cost, comfort, and payback.</p>',
        author: 'SV HVAC', readMins: 3,
        tags: ['seer2','efficiency','ac'], published: false
      },
      {
        slug: 'heat-pump-vs-gas-furnace-dfw',
        title: 'Heat Pump vs Gas Furnace in DFW — Which Is Right for You?',
        date: new Date().toISOString().slice(0,10),
        summary: 'Compare comfort, cost, and performance for North Texas climate.',
        heroUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=1600&auto=format&fit=crop',
        contentHtml: '<h2>Quick Take</h2><p><strong>Heat pumps</strong> are efficient and great for DFW’s mild winters; <strong>gas furnaces</strong> deliver strong heat during cold snaps. Both can be reliable choices depending on your home and goals.</p><h3>When a Heat Pump Shines</h3><ul><li>Moderate winters reduce auxiliary heat use</li><li>One system provides both heating and cooling</li><li>Lower carbon footprint and often lower monthly bills</li></ul><h3>When a Furnace Makes Sense</h3><ul><li>Very cold homes or drafty envelopes</li><li>Existing gas infrastructure</li><li>Preference for hotter supply air</li></ul><h3>Total Cost of Ownership</h3><p>While the upfront cost can be similar, operating costs depend on energy prices and insulation. We’ll compare options for your home using local rates and your usage patterns.</p><h3>The Hybrid Option</h3><p>A dual‑fuel (hybrid) system uses a heat pump for mild days and a furnace for the coldest weather, optimizing comfort and cost.</p><p><em>Ask us for a free, no‑pressure consultation. We’ll run the numbers for your home.</em></p>',
        author: 'SV HVAC', readMins: 7,
        tags: ['heating','heat-pump','furnace'], published: true
      },
      {
        slug: 'indoor-air-quality-basics',
        title: 'Indoor Air Quality Basics: Filters, MERV, and Upgrades',
        date: new Date().toISOString().slice(0,10),
        summary: 'Cleaner air starts with the right filter and habits.',
        contentHtml: '<p>We demystify MERV ratings, discuss when to upgrade, and share simple tips to reduce dust and allergens.</p>',
        author: 'SV HVAC', readMins: 4,
        tags: ['iaq','filters','merv'], published: false
      }
    ]
  },
  plans: {
    heading: 'Maintenance Plans',
    subheading: 'Prevent breakdowns and keep comfort steady all year',
    tiers: [
      { name: 'Basic', price: 129, interval: 'per visit', features: ['21‑point inspection', 'Filter check & replace (customer‑provided)', 'Safety checks'], cta: 'Book Basic', mostPopular: false },
      { name: 'Preferred', price: 199, interval: 'per visit', features: ['Everything in Basic', 'Priority scheduling', '10% off repairs'], cta: 'Book Preferred', mostPopular: true },
      { name: 'Premium', price: 349, interval: 'per year', features: ['2 visits / year', 'Priority scheduling', '15% off repairs', 'No after‑hours fee'], cta: 'Join Premium', mostPopular: false },
    ],
  },
  estimate: {
    targetMargin: 0.40,
    taxRate: 0.0825,
    laborTaxResidential: false,
    laborTaxCommercial: true,
    overheadPct: 0.12,
    seasonalMultipliers: { normal: 1.0, summer: 1.10 },
    accessMultipliers: { easy: 0.95, standard: 1.00, difficult: 1.15 },
    afterHoursMultiplier: 1.25,
    permitFlat: 175,
    addOnPrices: {
      lineSet: 380,
      condenserPad: 120,
      whipDisconnect: 95,
      electricalUpgrade: 350,
      smartThermostat: { label: 'Smart (Ecobee3 Lite)', price: 250 },
      basicThermostat: { label: 'Basic (Honeywell T4)', price: 85 },
      craneFee: 550,
      disposalFee: 95,
      refrigerant: { R410A: 65, R22: 120 },
    },
    perJob: {
      perWorkerPerJob: 350,
      defaultCrewSize: 3,
      
    },
    perHour: { hourlyRatePerTech: 95, defaultCrewSize: 3 },
    baselineHours: {
      acSplitChangeout: { min: 4, max: 8 },
      furnaceReplace: { min: 4, max: 8 },
      heatPumpReplace: { min: 6, max: 9 },
      miniSplitSingle: { min: 4, max: 6 },
      miniSplitExtraHead: { min: 4, max: 6 },
      electricalUpgrade: 2,
      lineSetReplace: 2,
    },
    equipmentBasePrices: undefined,
    ductworkAddersHours: { none: 0, minor: 6, moderate: 12, major: 20 },
    goodBetterBest: true,
    showFinancing: false,
    zipPrefixes: { '760': 1.00, '761': 1.02, '750': 1.03 },
  },
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  /** Preload readiness */
  private _loaded = false;
  private _loadedPromise: Promise<void>;
  private _resolveLoaded: (() => void) | null = null;

  constructor() {
    this._loadedPromise = new Promise<void>((resolve) => {
      this._resolveLoaded = resolve;
    });
  }

  /** Current settings snapshot used by app components */
  private _current: SiteSettings = structuredClone(DEFAULT_SETTINGS);

  /** Load settings with cache-first semantics for instant paint.
   *  - If cached settings exist, use them immediately and resolve.
   *  - Refresh from DB in the background and persist when available.
   *  - On first visit (no cache), fetch from DB (or fall back to defaults) then resolve.
   */
  async load(): Promise<void> {
    // 1) Try local cache first for instant paint
    const cached = this._loadLocal();
    if (cached && !this._loaded) {
      this._current = this._mergeWithDefaults(cached);
      this._markLoaded();
      // Fire-and-forget background refresh; do not block bootstrap
      this._refreshFromRemote();
      return;
    }

    // 2) No cache yet — fetch from DB, then resolve
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('data')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data?.data) {
        this._current = this._mergeWithDefaults(data.data as SiteSettings);
        this._saveLocal(this._current);
        this._markLoaded();
        return;
      }

      // No row yet — seed with defaults
      const seeded = this._mergeWithDefaults(DEFAULT_SETTINGS);
      const { error: upsertErr } = await supabase.from('site_settings').insert({ data: seeded });
      if (upsertErr) console.warn('[settings] seed insert failed:', upsertErr.message);
      this._current = seeded;
      this._saveLocal(seeded);
      this._markLoaded();
    } catch (e: any) {
      console.warn('[settings] load failed, using defaults:', e?.message || e);
      this._current = this._mergeWithDefaults(cached ?? DEFAULT_SETTINGS);
      this._saveLocal(this._current);
      this._markLoaded();
    }
  }

  /** Background refresh from Supabase; updates cache when successful. */
  private async _refreshFromRemote(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('data')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data?.data) {
        this._current = this._mergeWithDefaults(data.data as SiteSettings);
        this._saveLocal(this._current);
        // Note: components relying on this service read synchronously each CD run.
        // We intentionally do not toggle loaded again to avoid churn.
      }
    } catch (e: any) {
      // Soft-fail: keep using cached/defaults
      console.warn('[settings] background refresh failed:', e?.message || e);
    }
  }

  /** Save to DB and mirror to localStorage */
  async save(next: SiteSettings): Promise<void> {
    const payload = this._mergeWithDefaults(next);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ data: payload }, { onConflict: 'id' }); // assumes a unique row
    if (error) throw new Error(error.message || 'Failed to save settings');
    this._current = payload;
    this._saveLocal(payload);
  }

  /** Read-only snapshot for components */
  get value(): SiteSettings {
    return this._current;
  }

  /** True once settings have finished loading (or defaulted). */
  get loaded(): boolean {
    return this._loaded;
  }

  /** Promise that resolves when settings are ready. Useful for APP_INITIALIZER. */
  ready(): Promise<void> {
    return this._loadedPromise;
  }

  private _markLoaded(): void {
    if (!this._loaded) {
      this._loaded = true;
      this._resolveLoaded?.();
      this._resolveLoaded = null;
    }
  }

  // -------- helpers --------

  private _mergeWithDefaults(input: Partial<SiteSettings> | undefined): SiteSettings {
    const base = structuredClone(DEFAULT_SETTINGS);

    // Helper: merge FAQs by unique question text, preserving input order then base
    const mergeFaqs = (baseFaqs?: Array<{ q: string; a: string }>, inputFaqs?: Array<{ q: string; a: string }>) => {
      const inList = Array.isArray(inputFaqs) ? inputFaqs.filter(x => x && x.q) : [];
      const baseList = Array.isArray(baseFaqs) ? baseFaqs.filter(x => x && x.q) : [];
      if (!inList.length) return baseList;
      const seen = new Set(inList.map(x => (x.q || '').toLowerCase().trim()));
      const extras = baseList.filter(x => !seen.has((x.q || '').toLowerCase().trim()));
      return [...inList, ...extras];
    };

    const out: SiteSettings = {
      ...base,
      ...input,
      home: { ...base.home, ...(input?.home ?? {}) },
      services: {
        ...base.services,
        ...(input?.services ?? {}),
        sectionHeading: input?.services?.sectionHeading ?? base.services.sectionHeading,
        sectionSubheading: input?.services?.sectionSubheading ?? base.services.sectionSubheading,
        ac: { ...base.services.ac, ...(input?.services?.ac ?? {}) },
        heat: { ...base.services.heat, ...(input?.services?.heat ?? {}) },
        maintenance: { ...base.services.maintenance, ...(input?.services?.maintenance ?? {}) },
      },
      servicePages: {
        ac: {
          ...(base.servicePages?.ac ?? {}),
          ...(input?.servicePages?.ac ?? {}),
          features: input?.servicePages?.ac?.features?.length ? input.servicePages!.ac!.features : (base.servicePages?.ac?.features ?? []),
          gallery: input?.servicePages?.ac?.gallery?.length ? input.servicePages!.ac!.gallery : (base.servicePages?.ac?.gallery ?? []),
          faqs: mergeFaqs(base.servicePages?.ac?.faqs, input?.servicePages?.ac?.faqs),
        },
        heat: {
          ...(base.servicePages?.heat ?? {}),
          ...(input?.servicePages?.heat ?? {}),
          features: input?.servicePages?.heat?.features?.length ? input.servicePages!.heat!.features : (base.servicePages?.heat?.features ?? []),
          gallery: input?.servicePages?.heat?.gallery?.length ? input.servicePages!.heat!.gallery : (base.servicePages?.heat?.gallery ?? []),
          faqs: mergeFaqs(base.servicePages?.heat?.faqs, input?.servicePages?.heat?.faqs),
        },
        maintenance: {
          ...(base.servicePages?.maintenance ?? {}),
          ...(input?.servicePages?.maintenance ?? {}),
          features: input?.servicePages?.maintenance?.features?.length ? input.servicePages!.maintenance!.features : (base.servicePages?.maintenance?.features ?? []),
          gallery: input?.servicePages?.maintenance?.gallery?.length ? input.servicePages!.maintenance!.gallery : (base.servicePages?.maintenance?.gallery ?? []),
          faqs: mergeFaqs(base.servicePages?.maintenance?.faqs, input?.servicePages?.maintenance?.faqs),
        },
      },
      about: {
        ...base.about,
        heading: input?.about?.heading ?? base.about.heading,
        subheading: input?.about?.subheading ?? base.about.subheading,
        items: input?.about?.items?.length ? input.about.items : base.about.items,
      },
      team: {
        ...base.team,
        heading: input?.team?.heading ?? base.team.heading,
        subheading: input?.team?.subheading ?? base.team.subheading,
        members: input?.team?.members?.length ? input.team.members : base.team.members,
      },
      contact: { ...base.contact, ...(input?.contact ?? {}) },
      footer: {
        ...base.footer,
        ...(input?.footer ?? {}),
        links: Array.isArray(input?.footer?.links)
          ? input.footer.links.map(link => ({ ...link }))
          : (base.footer?.links ?? []).map(link => ({ ...link })),
        social: Array.isArray(input?.footer?.social)
          ? input.footer.social.map(item => ({ ...item }))
          : (base.footer?.social ?? []).map(item => ({ ...item })),
      },
      legal: {
        privacy: {
          title: input?.legal?.privacy?.title ?? base.legal!.privacy.title ?? 'Privacy Policy',
          updatedOn: input?.legal?.privacy?.updatedOn ?? base.legal!.privacy.updatedOn,
          contentHtml: input?.legal?.privacy?.contentHtml ?? base.legal!.privacy.contentHtml,
        },
        terms: {
          title: input?.legal?.terms?.title ?? base.legal!.terms.title ?? 'Terms & Conditions',
          updatedOn: input?.legal?.terms?.updatedOn ?? base.legal!.terms.updatedOn,
          contentHtml: input?.legal?.terms?.contentHtml ?? base.legal!.terms.contentHtml,
        },
      },
      navbar: { ...base.navbar, ...(input?.navbar ?? {}) },
      estimate: {
        ...base.estimate,
        ...(input?.estimate ?? {}),
        addOnPrices: {
          ...(base.estimate?.addOnPrices ?? {}),
          ...(input?.estimate?.addOnPrices ?? {}),
          refrigerant: {
            ...(base.estimate?.addOnPrices?.refrigerant ?? {}),
            ...(input?.estimate?.addOnPrices?.refrigerant ?? {}),
          },
          smartThermostat: {
            ...(base.estimate?.addOnPrices?.smartThermostat ?? {}),
            ...(input?.estimate?.addOnPrices?.smartThermostat ?? {}),
          },
          basicThermostat: {
            ...(base.estimate?.addOnPrices?.basicThermostat ?? {}),
            ...(input?.estimate?.addOnPrices?.basicThermostat ?? {}),
          },
        } as any,
        seasonalMultipliers: {
          ...(base.estimate?.seasonalMultipliers ?? { normal: 1, summer: 1.1 }),
          ...(input?.estimate?.seasonalMultipliers ?? {}),
        },
        accessMultipliers: {
          ...(base.estimate?.accessMultipliers ?? { easy: 0.95, standard: 1, difficult: 1.15 }),
          ...(input?.estimate?.accessMultipliers ?? {}),
        },
        perJob: {
          ...(base.estimate?.perJob ?? { perWorkerPerJob:350, defaultCrewSize:3, altCrewSize:4 }),
          ...(input?.estimate?.perJob ?? {}),
        },
        perHour: {
          ...(base.estimate?.perHour ?? { hourlyRatePerTech: 95, defaultCrewSize: 3 }),
          ...(input?.estimate?.perHour ?? {}),
        },
        baselineHours: {
          ...(base.estimate?.baselineHours ?? {}),
          ...(input?.estimate?.baselineHours ?? {}),
        } as any,
        equipmentBasePrices: (input?.estimate?.equipmentBasePrices ?? base.estimate?.equipmentBasePrices),
        ductworkAddersHours: {
          ...(base.estimate?.ductworkAddersHours ?? { none:0, minor:6, moderate:12, major:20 }),
          ...(input?.estimate?.ductworkAddersHours ?? {}),
        },
        zipPrefixes: {
          ...(base.estimate?.zipPrefixes ?? {}),
          ...(input?.estimate?.zipPrefixes ?? {}),
        },
      },
    };

    // Ensure structures exist
    out.about.items ??= [];
    out.team.members ??= [];
    out.navbar ??= { phone: '(817) 724-5507' };
    out.services.sectionHeading ??= base.services.sectionHeading;
    out.services.sectionSubheading ??= base.services.sectionSubheading;
    out.services.ac.hidden ??= false;
    out.services.heat.hidden ??= false;
    out.services.maintenance.hidden ??= false;
    out.estimate ??= structuredClone(base.estimate!);

    // Ensure servicePages arrays exist with 3 gallery slots
    out.servicePages ??= structuredClone(base.servicePages!);
    for (const key of ['ac','heat','maintenance'] as const) {
      const page: any = (out.servicePages as any)[key] || {};
      page.features ||= [];
      page.gallery ||= [];
      page.faqs ||= [];
      page.sections ||= [];
      while (page.gallery.length < 3) page.gallery.push({});
      (out.servicePages as any)[key] = page;
    }

    out.footer ??= structuredClone(base.footer!);
    out.footer.links ??= [];
    out.footer.social ??= [];
        out.legal ??= structuredClone(base.legal!);
    out.legal.privacy ??= structuredClone(base.legal!.privacy);
    out.legal.terms ??= structuredClone(base.legal!.terms);

    out.reviews ??= structuredClone(base.reviews!);
    out.education ??= structuredClone(base.education!);
    out.blog ??= structuredClone(base.blog!);

    return out;
  }

  private _loadLocal(): SiteSettings | null {
    try {
      const raw = localStorage.getItem('site_settings');
      return raw ? (JSON.parse(raw) as SiteSettings) : null;
    } catch {
      return null;
    }
  }

  private _saveLocal(s: SiteSettings): void {
    try {
      localStorage.setItem('site_settings', JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }
}





