'use strict';
// Fixed legal identity of the invoicing entity. Env overrides let ops change a
// value without a code edit; the defaults are the registered facts.
// ponytail: config module, promote to admin-editable DB row only if GSTIN/address
// must change without a deploy.
const env = process.env;

const seller = {
  legalName: env.SELLER_LEGAL_NAME || 'Timewheel Internet Private Limited',
  gstin:     env.SELLER_GSTIN      || '21AAMCT8270C1ZF',
  pan:       env.SELLER_PAN        || 'AAMCT8270C',
  cin:       env.SELLER_CIN        || 'U62012OD2026PTC052654',
  stateCode: env.SELLER_STATE_CODE || '21',
  stateName: env.SELLER_STATE      || 'Odisha',
  address:   env.SELLER_ADDRESS    || 'Natapada, Vyasanagar, Jajpur, Odisha 755019, India',
  email:     env.SELLER_EMAIL      || 'team@timewheel.co.in',
  phone:     env.SELLER_PHONE      || '+91 8637758344',
  website:   env.SELLER_WEBSITE    || 'timewheel.co.in',
  brandName: 'Book A Sloth',
  brandSubline: 'by Timewheel Internet (P) Ltd',
  logoUrl:   'https://company-assets.bookasloth.in/images/email/footer-logo.png',
};

// SAC codes — confirm with CA before go-live; one-line editable here.
const SAC_SUBSCRIPTION = env.SAC_SUBSCRIPTION || '998315'; // SaaS / hosting
const SAC_BOOKING      = env.SAC_BOOKING      || '998599'; // online-platform facilitation

const SERIES = {
  subscription: { code: 'SUB', prefix: 'BAS-SUB' },
  booking:      { code: 'BKG', prefix: 'BAS-BKG' },
};

module.exports = { seller, SAC_SUBSCRIPTION, SAC_BOOKING, SERIES };
