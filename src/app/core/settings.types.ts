export type SiteSettings = {
    phone?: string;
  
    navbar?: {
      home?: string;
      services?: string;
      about?: string;
      team?: string;
      contact?: string;
      admin?: string;
    };
  
    home?: {
      headline?: string;
      subhead?: string;
      ctaPrimary?: string;   // “Schedule Your Free Quote”
      ctaSecondary?: string; // “Call Us Now: …”
    };
  
    services?: {
      ac?: { title?: string; desc?: string; cta?: string; };
      heat?: { title?: string; desc?: string; cta?: string; };
      maint?: { title?: string; desc?: string; cta?: string; };
      sectionCta?: string;   // big button under the cards
    };
  
    about?: {
      items?: Array<{ year?: string; title?: string; body?: string; color?: 'blue'|'red' }>;
    };
  
    team?: {
      heading?: string;
      subheading?: string;
      members?: Array<{ name?: string; role?: string; icon?: string }>;
    };
  
    contact?: {
      heading?: string;      // “Request Service”
      subheading?: string;   // “Tell us what you need…”
      cta?: string;          // “Request Service Now”
      phoneLead?: string;    // line above form “Prefer to talk? (xxx) …”
    };
  };