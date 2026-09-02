#!/usr/bin/env node
/* Generates real, crawlable static pages (service pages, county pages, city+service pages,
   referral-partner pages, vendor & insurance pages) for peakbioclean.com, plus sitemap.xml.
   Run: node scripts/generate-pages.js
   Source of truth for services/counties is scripts/site-data.json (re-extract from index.html
   with scripts/extract-data.js if the service list changes). */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOMAIN = 'https://www.peakbioclean.com';
const PHONE_DISPLAY = '(407) 758-0682';
const PHONE_TEL = '+14077580682';

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'site-data.json'), 'utf8'));
const SERVICES = data.SERVICES; // [ [name, slug], ... ]
const SVC = data.SVC;           // slug -> {title, sub, intros[], incl[]}
const COUNTIES = data.COUNTIES; // [ name, ... ]

function countySlug(c) { return c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

const CITIES = [
  { name: 'Fort Lauderdale', slug: 'fort-lauderdale', county: 'Broward' },
  { name: 'Hollywood', slug: 'hollywood', county: 'Broward' },
  { name: 'Pembroke Pines', slug: 'pembroke-pines', county: 'Broward' },
  { name: 'Miramar', slug: 'miramar', county: 'Broward' },
  { name: 'Coral Springs', slug: 'coral-springs', county: 'Broward' },
  { name: 'Davie', slug: 'davie', county: 'Broward' },
  { name: 'Plantation', slug: 'plantation', county: 'Broward' },
  { name: 'Miami', slug: 'miami', county: 'Miami-Dade' },
  { name: 'Hialeah', slug: 'hialeah', county: 'Miami-Dade' },
  { name: 'Doral', slug: 'doral', county: 'Miami-Dade' },
  { name: 'Miami Beach', slug: 'miami-beach', county: 'Miami-Dade' },
  { name: 'Homestead', slug: 'homestead', county: 'Miami-Dade' },
  { name: 'West Palm Beach', slug: 'west-palm-beach', county: 'Palm Beach' },
  { name: 'Boca Raton', slug: 'boca-raton', county: 'Palm Beach' },
  { name: 'Delray Beach', slug: 'delray-beach', county: 'Palm Beach' }
];

// The 7 highest-intent services get city pages (crossed with all 15 cities = 105 pages).
const CITY_SERVICE_SLUGS = [
  'crime-scene-cleanup', 'unattended-death-cleanup', 'biohazard-waste-disposal',
  'suicide-cleanup', 'decomposition-cleanup', 'blood-cleanup', 'hoarding-cleanup'
];

const CORE_MENU = [
  ['Crime Scene Cleanup', 'crime-scene-cleanup'], ['Homicide Cleanup', 'homicide-cleanup'],
  ['Suicide Cleanup', 'suicide-cleanup'], ['Unattended Death Cleanup', 'unattended-death-cleanup'],
  ['Trauma Cleanup', 'trauma-cleanup'], ['Blood Cleanup', 'blood-cleanup'],
  ['Decomposition Cleanup', 'decomposition-cleanup'], ['Biohazard Waste Disposal', 'biohazard-waste-disposal'],
  ['Hoarding Cleanup', 'hoarding-cleanup'], ['Infectious Disease Cleanup', 'infectious-disease-cleanup'],
  ['Tear Gas Cleanup', 'tear-gas-cleanup'], ['Rodent Waste Removal', 'rodent-waste-removal']
];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- Pull the live <style> block straight out of index.html so subpages never drift from the homepage look ----
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const styleMatch = indexHtml.match(/<style>([\s\S]*?)<\/style>/);
const SITE_CSS = styleMatch ? styleMatch[1] : '';

const EXTRA_CSS = `
/* Subpage-only layout (service/county/city/partner pages) */
.subhero { background: linear-gradient(135deg, var(--blue-dark), var(--blue)); color: #fff; padding: 7.5rem 0 4rem; }
.subhero .eyebrow { color: #cfe0f7; }
.subhero h1 { color: #fff; font-size: clamp(1.9rem, 4vw, 2.8rem); margin: 0.4rem 0 1rem; }
.subhero p.lead { color: #e7eefa; max-width: 640px; }
.subhero .hero-cta { margin-top: 1.5rem; }
.breadcrumbs { font-size: 0.82rem; color: #cfe0f7; margin-bottom: 0.75rem; }
.breadcrumbs a { color: #cfe0f7; text-decoration: underline; }
.sub-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 3rem; align-items: start; }
@media (max-width: 900px) { .sub-grid { grid-template-columns: 1fr; } }
.sub-list { margin: 1rem 0 1.5rem; }
.sub-list li { position: relative; padding-left: 1.6rem; margin-bottom: 0.6rem; color: var(--text); }
.sub-list li::before { content: ''; position: absolute; left: 0; top: 0.5rem; width: 8px; height: 8px; border-radius: 50%; background: var(--red); }
.side-card { background: var(--gray-light); border-radius: var(--radius); padding: 1.75rem; margin-bottom: 1.5rem; }
.side-card h3 { font-size: 1.05rem; margin-bottom: 0.75rem; }
.side-card .btn { width: 100%; margin-top: 0.5rem; }
.pill-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
.svc-pill { background: var(--blue-light); color: var(--blue); font-weight: 600; font-size: 0.82rem; padding: 0.4rem 0.85rem; border-radius: 50px; }
.svc-pill:hover { background: var(--blue); color: #fff; }
.icp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin-top: 2.5rem; }
.icp-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 1.75rem; box-shadow: var(--shadow); }
.icp-card h3 { color: var(--blue-dark); margin-bottom: 0.6rem; font-size: 1.1rem; }
.icp-card a.btn { margin-top: 1rem; }
`;

function pageShell({ title, description, canonical, ogImage, bodyHtml, jsonLd, breadcrumbHtml }) {
  ogImage = ogImage || DOMAIN + '/og-image.png';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<meta name="author" content="Peak Bio-Clean" />
<meta name="theme-color" content="#1965B1" />
<link rel="canonical" href="${canonical}" />
<link rel="icon" type="image/png" sizes="32x32" href="/assets/logo/favicon-32.png" />
<link rel="icon" type="image/png" sizes="64x64" href="/assets/logo/favicon-64.png" />
<link rel="apple-touch-icon" href="/assets/logo/favicon-180.png" />
<meta name="geo.region" content="US-FL" />
<meta name="geo.placename" content="Florida" />
<meta property="og:site_name" content="Peak Bio-Clean" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="en_US" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${ogImage}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${ogImage}" />
${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>${SITE_CSS}${EXTRA_CSS}</style>
</head>
<body id="top">
<div class="topbar">
  <div class="topbar-inner">
    <div class="topbar-info">
      <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>
      <a href="mailto:info@peakbioclean.com">✉ info@peakbioclean.com</a>
      <span>Your Local Biohazard Cleanup Team — 24/7</span>
    </div>
    <div class="topbar-social">
      <a href="https://www.facebook.com/Peakbioclean" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>
      <a href="https://www.instagram.com/peakbioclean" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.9.07s-3.63 0-4.9-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2zm0 3.6a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zm0 10.2a4 4 0 110-8 4 4 0 010 8zm6.4-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg></a>
    </div>
  </div>
</div>
<header class="site-header scrolled">
  <nav class="nav">
    <a href="/" class="brand" aria-label="Peak Bio-Clean — Home">
      <img class="brand-logo brand-logo--color" src="/assets/logo/logo-color-2.png" alt="Peak Bio-Clean" />
    </a>
    <ul class="nav-links" id="navLinks">
      <li><a href="/#about">About</a></li>
      <li class="has-dropdown"><a href="/services/">Services <span class="caret">▼</span></a><div class="mega-menu" id="megaMenu"></div></li>
      <li class="has-dropdown areas-dd"><a href="/#areas">Service Areas <span class="caret">▼</span></a><div class="mega-menu counties" id="countiesMenu"></div></li>
      <li><a href="/#contact">Contact</a></li>
      <li class="nav-right"><a href="/#why">Why Us</a></li>
    </ul>
    <a href="tel:${PHONE_TEL}" class="nav-phone">${PHONE_DISPLAY}</a>
    <button class="hamburger" id="hamburger" aria-label="Toggle menu"><span></span><span></span><span></span></button>
  </nav>
</header>

${bodyHtml}

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" class="footer-logo" aria-label="Peak Bio-Clean — Home">
          <img src="/assets/logo/logo-white-2.png" alt="Peak Bio-Clean" />
        </a>
        <p>Compassionate, professional, and trusted biohazard, crime scene, and trauma cleanup. Fully licensed, insured &amp; bondable. Available 24/7 across Florida.</p>
        <a href="tel:${PHONE_TEL}" class="footer-phone">${PHONE_DISPLAY}</a>
        <div class="footer-social">
          <a href="https://www.facebook.com/Peakbioclean" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>
          <a href="https://www.instagram.com/peakbioclean" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.9.07s-3.63 0-4.9-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2zm0 3.6a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zm0 10.2a4 4 0 110-8 4 4 0 010 8zm6.4-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg></a>
        </div>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          <li><a href="/crime-scene-cleanup/">Crime Scene Cleanup</a></li>
          <li><a href="/trauma-cleanup/">Trauma Cleanup</a></li>
          <li><a href="/unattended-death-cleanup/">Unattended Death</a></li>
          <li><a href="/hoarding-cleanup/">Hoarding Cleanup</a></li>
          <li><a href="/biohazard-waste-disposal/">Biohazard Disposal</a></li>
          <li><a href="/services/">All Services →</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="/#about">About Us</a></li>
          <li><a href="/#why">Why Choose Us</a></li>
          <li><a href="/#areas">Service Areas</a></li>
          <li><a href="/#contact">Contact</a></li>
          <li><a href="/vendor-partners/">Referral Partners</a></li>
          <li><a href="/insurance-and-cost/">Insurance &amp; Cost</a></li>
        </ul>
      </div>
      <div>
        <h4>Service Areas</h4>
        <ul>
          <li><a href="/miami-dade-county/">Miami-Dade County</a></li>
          <li><a href="/broward-county/">Broward County</a></li>
          <li><a href="/palm-beach-county/">Palm Beach County</a></li>
          <li><a href="/hillsborough-county/">Hillsborough County</a></li>
          <li><a href="/#areas">All of Florida</a></li>
        </ul>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© <span id="year"></span> Peak Bio-Clean. All Rights Reserved. | Licensed, Insured &amp; Bondable in Florida | Available 24/7</p>
  </div>
</footer>

<a href="tel:${PHONE_TEL}" class="mobile-cta">Call 24/7 — ${PHONE_DISPLAY}</a>
<script src="/assets/js/nav.js" defer></script>
</body>
</html>
`;
}

function writePage(relPath, html) {
  const dir = path.join(ROOT, relPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

const sitemapUrls = [{ loc: DOMAIN + '/', priority: '1.0', changefreq: 'weekly' }];

function addSitemap(urlPath, priority) {
  sitemapUrls.push({ loc: DOMAIN + urlPath, priority: priority || '0.7', changefreq: 'monthly' });
}

// ============================= SERVICE PAGES =============================
SERVICES.forEach(([name, slug]) => {
  const d = SVC[slug];
  if (!d) return;
  const title = `${d.title} in Florida | 24/7 Peak Bio-Clean`;
  const description = `${d.sub} Available 24/7 across all of Florida. Licensed, insured, and discreet. Call ${PHONE_DISPLAY} for immediate help.`;
  const canonical = `${DOMAIN}/${slug}/`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: d.title,
    name: d.title,
    description: d.sub,
    provider: { '@type': 'LocalBusiness', name: 'Peak Bio-Clean', telephone: PHONE_TEL, url: DOMAIN },
    areaServed: { '@type': 'State', name: 'Florida' }
  });
  const otherServices = SERVICES.filter(s => s[1] !== slug).slice(0, 10)
    .map(s => `<a class="svc-pill" href="/${s[1]}/">${esc(s[0])}</a>`).join('');
  const bodyHtml = `
<section class="subhero">
  <div class="container">
    <p class="breadcrumbs"><a href="/">Home</a> / <a href="/services/">Services</a> / ${esc(d.title)}</p>
    <p class="eyebrow">24/7 Emergency Response</p>
    <h1>${esc(d.title)} in Florida</h1>
    <p class="lead">${esc(d.sub)}</p>
    <div class="hero-cta">
      <a href="tel:${PHONE_TEL}" class="btn btn-red">Call Now — ${PHONE_DISPLAY}</a>
      <a href="/#contact" class="btn btn-outline" style="color:#fff;border-color:#fff;">Request Cleanup Assistance</a>
    </div>
  </div>
</section>
<section class="section">
  <div class="container sub-grid">
    <div>
      ${d.intros.map(p => `<p>${esc(p)}</p>`).join('')}
      <h2 style="margin-top:2rem;">What's Included</h2>
      <ul class="sub-list">${d.incl.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2>Insurance &amp; Cost</h2>
      <p>Most ${esc(d.title).toLowerCase()} services are covered by homeowners, renters, or auto insurance — often with little to no out-of-pocket cost. We document everything and work directly with your provider.</p>
      <h2>We Also Help With</h2>
      <div class="pill-row">${otherServices}</div>
    </div>
    <div>
      <div class="side-card">
        <h3>Need Help Now?</h3>
        <p class="muted">Available 24/7, including holidays. A real person answers every call.</p>
        <a href="tel:${PHONE_TEL}" class="btn btn-red">Call ${PHONE_DISPLAY}</a>
        <a href="/#contact" class="btn btn-outline">Request Assessment</a>
      </div>
      <div class="side-card">
        <h3>Serving All of Florida</h3>
        <p class="muted">Miami-Dade, Broward, Palm Beach, Hillsborough, and every county statewide.</p>
        <a href="/#areas" class="btn btn-outline">View Service Areas</a>
      </div>
    </div>
  </div>
</section>
`;
  writePage(`/${slug}`, pageShell({ title, description, canonical, bodyHtml, jsonLd }));
  addSitemap(`/${slug}/`, '0.8');
});

// ============================= ALL SERVICES INDEX =============================
{
  const title = 'All Services | Biohazard, Crime Scene & Trauma Cleanup Florida | Peak Bio-Clean';
  const description = 'Every biohazard, crime scene, trauma, and cleanup service Peak Bio-Clean provides across Florida — available 24/7, licensed and insured.';
  const canonical = `${DOMAIN}/services/`;
  const cards = SERVICES.map(([name, slug]) => {
    const d = SVC[slug];
    return `<a class="icp-card" href="/${slug}/"><h3>${esc(name)}</h3><p class="muted">${esc(d ? d.sub : '')}</p></a>`;
  }).join('');
  const bodyHtml = `
<section class="subhero">
  <div class="container">
    <p class="breadcrumbs"><a href="/">Home</a> / Services</p>
    <p class="eyebrow">Complete Service List</p>
    <h1>All Biohazard &amp; Cleanup Services</h1>
    <p class="lead">Available 24/7 across all of Florida. Licensed, insured, and discreet.</p>
    <div class="hero-cta"><a href="tel:${PHONE_TEL}" class="btn btn-red">Call Now — ${PHONE_DISPLAY}</a></div>
  </div>
</section>
<section class="section"><div class="container"><div class="icp-grid">${cards}</div></div></section>
`;
  writePage('/services', pageShell({ title, description, canonical, bodyHtml }));
  addSitemap('/services/', '0.9');
}

const REGIONS = [
  ['South Florida', ['Miami-Dade', 'Broward', 'Palm Beach', 'Monroe']],
  ['Southwest Florida', ['Lee', 'Collier', 'Charlotte', 'Sarasota', 'Hendry', 'Glades', 'DeSoto']],
  ['Tampa Bay', ['Hillsborough', 'Pinellas', 'Pasco', 'Hernando', 'Manatee', 'Citrus', 'Polk']],
  ['Central Florida', ['Orange', 'Seminole', 'Osceola', 'Lake', 'Volusia', 'Brevard', 'Sumter', 'Marion', 'Indian River', 'St. Lucie', 'Martin', 'Okeechobee', 'Highlands', 'Hardee']],
  ['North Florida', ['Duval', 'St. Johns', 'Clay', 'Nassau', 'Baker', 'Putnam', 'Flagler', 'Alachua', 'Bradford', 'Union', 'Columbia', 'Suwannee', 'Hamilton', 'Lafayette', 'Dixie', 'Gilchrist', 'Levy', 'Madison', 'Taylor']],
  ['Panhandle', ['Leon', 'Wakulla', 'Jefferson', 'Gadsden', 'Liberty', 'Franklin', 'Calhoun', 'Gulf', 'Bay', 'Washington', 'Holmes', 'Jackson', 'Walton', 'Okaloosa', 'Santa Rosa', 'Escambia']]
];

// ============================= SERVICE AREAS PAGE =============================
{
  const regionBlocks = REGIONS.map(([region, list]) => `
    <div>
      <h3 style="margin:1.75rem 0 0.75rem;color:var(--blue-dark);">${esc(region)}</h3>
      <div class="pill-row">${list.map(c => `<a class="svc-pill" href="/${countySlug(c)}-county/">${esc(c)} County</a>`).join('')}</div>
    </div>`).join('');
  const bodyHtml = `
<section class="subhero">
  <div class="container">
    <p class="breadcrumbs"><a href="/">Home</a> / Service Areas</p>
    <p class="eyebrow">Statewide Coverage</p>
    <h1>Serving All 67 Counties in Florida</h1>
    <p class="lead">Crime scene, trauma, and biohazard cleanup — available 24/7, from the Panhandle to the Keys.</p>
    <div class="hero-cta"><a href="tel:${PHONE_TEL}" class="btn btn-red">Call Now — ${PHONE_DISPLAY}</a></div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="fl-coverage">
      <h3>No Part of Florida Is Out of Reach</h3>
      <p>From Pensacola to Key West, Peak Bio-Clean responds statewide, 24/7. Find your county below for local response details, or call any time.</p>
    </div>
    ${regionBlocks}
  </div>
</section>
`;
  writePage('/service-areas', pageShell({
    title: 'Service Areas | All 67 Florida Counties | Peak Bio-Clean',
    description: 'Peak Bio-Clean serves all 67 counties across Florida with 24/7 crime scene, trauma, and biohazard cleanup. Find your county.',
    canonical: `${DOMAIN}/service-areas/`,
    bodyHtml
  }));
  addSitemap('/service-areas/', '0.8');
}

// ============================= COUNTY PAGES =============================
COUNTIES.forEach(name => {
  const slug = countySlug(name);
  const title = `Biohazard & Crime Scene Cleanup in ${name} County, FL | Peak Bio-Clean`;
  const description = `Peak Bio-Clean provides 24/7 crime scene, trauma, and biohazard cleanup in ${name} County, Florida. Licensed, insured, discreet. Call ${PHONE_DISPLAY}.`;
  const canonical = `${DOMAIN}/${slug}-county/`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Peak Bio-Clean — ${name} County`,
    telephone: PHONE_TEL,
    url: canonical,
    areaServed: { '@type': 'AdministrativeArea', name: `${name} County, Florida` }
  });
  const otherCounties = COUNTIES.filter(c => c !== name).slice(0, 12)
    .map(c => `<a class="svc-pill" href="/${countySlug(c)}-county/">${esc(c)} County</a>`).join('');
  const coreServiceLinks = CORE_MENU.map(([n, s]) => `<a class="svc-pill" href="/${s}/">${esc(n)}</a>`).join('');
  const bodyHtml = `
<section class="subhero">
  <div class="container">
    <p class="breadcrumbs"><a href="/">Home</a> / <a href="/#areas">Service Areas</a> / ${esc(name)} County</p>
    <p class="eyebrow">Local 24/7 Response</p>
    <h1>Biohazard &amp; Crime Scene Cleanup in ${esc(name)} County</h1>
    <p class="lead">Peak Bio-Clean responds quickly across ${esc(name)} County — compassionate, certified, and discreet crime scene, trauma, and biohazard cleanup, available any hour of the day.</p>
    <div class="hero-cta">
      <a href="tel:${PHONE_TEL}" class="btn btn-red">Call Now — ${PHONE_DISPLAY}</a>
      <a href="/#contact" class="btn btn-outline" style="color:#fff;border-color:#fff;">Request Cleanup Assistance</a>
    </div>
  </div>
</section>
<section class="section">
  <div class="container sub-grid">
    <div>
      <p>When something happens in ${esc(name)} County — an unattended death, a violent crime, a hoarding situation, or any biohazard exposure — Peak Bio-Clean is available around the clock. We arrive quickly, work discreetly with unmarked vehicles, and handle the entire remediation so you don't have to face it alone.</p>
      <p>Our technicians are OSHA trained, EPA compliant, and fully licensed, insured, and bondable in Florida. We coordinate directly with your insurance provider whenever possible to reduce your out-of-pocket cost.</p>
      <h2>Our Services in ${esc(name)} County</h2>
      <div class="pill-row">${coreServiceLinks}</div>
      <h2 style="margin-top:2rem;">Our Process</h2>
      <ul class="sub-list">
        <li>Call anytime, 24/7 — a real person answers immediately</li>
        <li>Fast on-site assessment and a clear plan before we begin</li>
        <li>Complete biohazard removal, decontamination, and disinfection</li>
        <li>Documentation and insurance coordination</li>
        <li>A safe, sanitary property when we're done</li>
      </ul>
      <h2>Insurance &amp; Cost</h2>
      <p>Most cleanup in ${esc(name)} County is covered by homeowners, renters, or auto insurance — often with little to no out-of-pocket cost to you. We document everything and work directly with your provider.</p>
      <h2>We Also Serve</h2>
      <div class="pill-row">${otherCounties}</div>
    </div>
    <div>
      <div class="side-card">
        <h3>Need Help in ${esc(name)} County?</h3>
        <p class="muted">Available 24/7, including holidays. A real person answers every call.</p>
        <a href="tel:${PHONE_TEL}" class="btn btn-red">Call ${PHONE_DISPLAY}</a>
        <a href="/#contact" class="btn btn-outline">Request Assessment</a>
      </div>
    </div>
  </div>
</section>
`;
  writePage(`/${slug}-county`, pageShell({ title, description, canonical, bodyHtml, jsonLd }));
  addSitemap(`/${slug}-county/`, '0.7');
});

// ============================= CITY + SERVICE PAGES =============================
CITIES.forEach(city => {
  CITY_SERVICE_SLUGS.forEach(slug => {
    const d = SVC[slug];
    if (!d) return;
    const pagePath = `${slug}-${city.slug}`;
    const title = `${d.title} in ${city.name}, FL | 24/7 Peak Bio-Clean`;
    const description = `${d.title} in ${city.name}, Florida. Available 24/7, licensed and insured, discreet response. Call ${PHONE_DISPLAY} for immediate help.`;
    const canonical = `${DOMAIN}/${pagePath}/`;
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: d.title,
      name: `${d.title} — ${city.name}, FL`,
      description: d.sub,
      provider: { '@type': 'LocalBusiness', name: 'Peak Bio-Clean', telephone: PHONE_TEL, url: DOMAIN },
      areaServed: { '@type': 'City', name: city.name }
    });
    const otherCityServices = CITY_SERVICE_SLUGS.filter(s => s !== slug)
      .map(s => `<a class="svc-pill" href="/${s}-${city.slug}/">${esc(SVC[s].title)}</a>`).join('');
    const nearbyCities = CITIES.filter(c => c.slug !== city.slug && c.county === city.county).slice(0, 6)
      .map(c => `<a class="svc-pill" href="/${slug}-${c.slug}/">${esc(c.name)}</a>`).join('');
    const bodyHtml = `
<section class="subhero">
  <div class="container">
    <p class="breadcrumbs"><a href="/">Home</a> / <a href="/${slug}/">${esc(d.title)}</a> / ${esc(city.name)}</p>
    <p class="eyebrow">${esc(city.name)}, ${esc(city.county)} County</p>
    <h1>${esc(d.title)} in ${esc(city.name)}, FL</h1>
    <p class="lead">${esc(d.sub)} Serving ${esc(city.name)} and all of ${esc(city.county)} County, 24/7.</p>
    <div class="hero-cta">
      <a href="tel:${PHONE_TEL}" class="btn btn-red">Call Now — ${PHONE_DISPLAY}</a>
      <a href="/#contact" class="btn btn-outline" style="color:#fff;border-color:#fff;">Request Cleanup Assistance</a>
    </div>
  </div>
</section>
<section class="section">
  <div class="container sub-grid">
    <div>
      ${d.intros.map(p => `<p>${esc(p)}</p>`).join('')}
      <h2 style="margin-top:2rem;">What's Included</h2>
      <ul class="sub-list">${d.incl.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2>Insurance &amp; Cost</h2>
      <p>Most ${esc(d.title).toLowerCase()} calls in ${esc(city.name)} are covered by homeowners, renters, or auto insurance — often with little to no out-of-pocket cost. We document everything and work directly with your provider.</p>
      <h2>Other Services in ${esc(city.name)}</h2>
      <div class="pill-row">${otherCityServices}</div>
      ${nearbyCities ? `<h2>Nearby Areas</h2><div class="pill-row">${nearbyCities}</div>` : ''}
    </div>
    <div>
      <div class="side-card">
        <h3>Need Help in ${esc(city.name)}?</h3>
        <p class="muted">Available 24/7, including holidays. A real person answers every call.</p>
        <a href="tel:${PHONE_TEL}" class="btn btn-red">Call ${PHONE_DISPLAY}</a>
        <a href="/#contact" class="btn btn-outline">Request Assessment</a>
      </div>
      <div class="side-card">
        <h3>${esc(city.county)} County</h3>
        <p class="muted">Peak Bio-Clean serves all of ${esc(city.county)} County.</p>
        <a href="/${countySlug(city.county)}-county/" class="btn btn-outline">View County Page</a>
      </div>
    </div>
  </div>
</section>
`;
    writePage(`/${pagePath}`, pageShell({ title, description, canonical, bodyHtml, jsonLd }));
    addSitemap(`/${pagePath}/`, '0.65');
  });
});

// ============================= REFERRAL PARTNER PAGES =============================
const PARTNERS = require('./partner-pages-data.js');
PARTNERS.forEach(p => {
  const canonical = `${DOMAIN}/for/${p.slug}/`;
  const bodyHtml = `
<section class="subhero">
  <div class="container">
    <p class="breadcrumbs"><a href="/">Home</a> / <a href="/vendor-partners/">Referral Partners</a> / ${esc(p.h1Sub)}</p>
    <p class="eyebrow">For ${esc(p.h1Sub)}</p>
    <h1>${esc(p.h1)}</h1>
    <p class="lead">${esc(p.lead)}</p>
    <div class="hero-cta">
      <a href="tel:${PHONE_TEL}" class="btn btn-red">Call Now — ${PHONE_DISPLAY}</a>
      <a href="/#contact" class="btn btn-outline" style="color:#fff;border-color:#fff;">Get Us in Your Vendor File</a>
    </div>
  </div>
</section>
<section class="section">
  <div class="container sub-grid">
    <div>
      ${p.body.map(para => `<p>${esc(para)}</p>`).join('')}
      <h2 style="margin-top:2rem;">${esc(p.listTitle)}</h2>
      <ul class="sub-list">${p.list.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>
    <div>
      <div class="side-card">
        <h3>Let's Talk</h3>
        <p class="muted">${esc(p.ctaNote)}</p>
        <a href="tel:${PHONE_TEL}" class="btn btn-red">Call ${PHONE_DISPLAY}</a>
        <a href="/#contact" class="btn btn-outline">Send a Message</a>
      </div>
      <div class="side-card">
        <h3>Vendor-Ready</h3>
        <p class="muted">Insurance, W-9, and credentials are ready to submit to your vendor file today.</p>
        <a href="/vendor-partners/" class="btn btn-outline">Vendor Partner Info</a>
      </div>
    </div>
  </div>
</section>
`;
  writePage(`/for/${p.slug}`, pageShell({
    title: `${p.title} | Peak Bio-Clean Referral Partners`,
    description: p.description,
    canonical, bodyHtml
  }));
  addSitemap(`/for/${p.slug}/`, '0.7');
});

// ============================= VENDOR PARTNERS PAGE =============================
{
  const partnerCards = PARTNERS.map(p =>
    `<a class="icp-card" href="/for/${p.slug}/"><h3>${esc(p.h1Sub)}</h3><p class="muted">${esc(p.lead)}</p></a>`
  ).join('');
  const bodyHtml = `
<section class="subhero">
  <div class="container">
    <p class="breadcrumbs"><a href="/">Home</a> / Referral Partners</p>
    <p class="eyebrow">Become a Referral Partner</p>
    <h1>Partner With Peak Bio-Clean</h1>
    <p class="lead">A direct line, real availability, and documentation your team can rely on — 24/7, including nights and holidays. Let's get us into your vendor file.</p>
    <div class="hero-cta">
      <a href="tel:${PHONE_TEL}" class="btn btn-red">Call Now — ${PHONE_DISPLAY}</a>
      <a href="/#contact" class="btn btn-outline" style="color:#fff;border-color:#fff;">Add Us to Your Vendor File</a>
    </div>
  </div>
</section>
<section class="section">
  <div class="container">
    <p>Peak Bio-Clean works with property managers, funeral homes, law enforcement and victim advocates, hospice and senior-care teams, restoration companies, realtors and probate attorneys, and insurance professionals across Florida. Let's get our insurance certificate, W-9, response number, and credentials into your file now — so nobody is scrambling during the next incident.</p>
    <div class="icp-grid">${partnerCards}</div>
    <h2 style="margin-top:3rem;">What We Send Every Partner</h2>
    <ul class="sub-list">
      <li>Certificate of insurance and W-9 on file</li>
      <li>A one-page vendor packet with our services, certifications, and direct line</li>
      <li>A direct 24/7 response number — no call center, no hold music</li>
      <li>Documented, insurance-ready reporting on every job</li>
    </ul>
    <div class="text-center" style="margin-top:2.5rem;">
      <a href="/vendor-packet.pdf" class="btn btn-red">Download Our Vendor Packet (PDF)</a>
    </div>
  </div>
</section>
`;
  writePage('/vendor-partners', pageShell({
    title: 'Referral Partners | Vendor Program | Peak Bio-Clean',
    description: 'Property managers, funeral homes, law enforcement, hospice, restoration companies, and insurance professionals — get Peak Bio-Clean in your vendor file for 24/7 cleanup response.',
    canonical: `${DOMAIN}/vendor-partners/`,
    bodyHtml
  }));
  addSitemap('/vendor-partners/', '0.75');
}

// ============================= INSURANCE & COST PAGE =============================
{
  const bodyHtml = `
<section class="subhero">
  <div class="container">
    <p class="breadcrumbs"><a href="/">Home</a> / Insurance &amp; Cost</p>
    <p class="eyebrow">How It Works</p>
    <h1>Insurance &amp; Cost</h1>
    <p class="lead">We don't promise coverage — every policy is different. But we make the insurance process as easy as possible, and we handle the documentation so you don't have to.</p>
    <div class="hero-cta">
      <a href="tel:${PHONE_TEL}" class="btn btn-red">Call Now — ${PHONE_DISPLAY}</a>
      <a href="/#contact" class="btn btn-outline" style="color:#fff;border-color:#fff;">Request a Free Assessment</a>
    </div>
  </div>
</section>
<section class="section">
  <div class="container sub-grid">
    <div>
      <h2>What's Typically Covered</h2>
      <p>Most biohazard, crime scene, trauma, and unattended-death cleanup is covered under homeowners, renters, or auto insurance policies — often with little to no out-of-pocket cost. Coverage depends on your specific policy and the cause of the incident.</p>
      <h2>What We Document</h2>
      <ul class="sub-list">
        <li>Full photo documentation before, during, and after cleanup</li>
        <li>A detailed scope of work and line-item estimate</li>
        <li>Certificates of destruction for disposed materials</li>
        <li>Direct communication with your adjuster</li>
      </ul>
      <h2>How the Process Works</h2>
      <ul class="sub-list">
        <li>You call — we respond and assess the situation, day or night</li>
        <li>We give you a clear estimate before any work begins</li>
        <li>We contact your insurance provider directly, if you'd like us to</li>
        <li>We complete the cleanup and provide full documentation for your claim</li>
      </ul>
      <h2>No Insurance?</h2>
      <p>We also work directly with property owners, families, and businesses paying out of pocket. We'll give you a clear, upfront estimate before any work begins — no surprises.</p>
    </div>
    <div>
      <div class="side-card">
        <h3>Questions About Cost?</h3>
        <p class="muted">Call us any time — we'll walk you through it honestly, with no pressure.</p>
        <a href="tel:${PHONE_TEL}" class="btn btn-red">Call ${PHONE_DISPLAY}</a>
        <a href="/#contact" class="btn btn-outline">Request Assessment</a>
      </div>
    </div>
  </div>
</section>
`;
  writePage('/insurance-and-cost', pageShell({
    title: 'Insurance & Cost | Peak Bio-Clean',
    description: 'How insurance works for crime scene, trauma, and biohazard cleanup in Florida. Documentation, adjuster coordination, and honest cost guidance from Peak Bio-Clean.',
    canonical: `${DOMAIN}/insurance-and-cost/`,
    bodyHtml
  }));
  addSitemap('/insurance-and-cost/', '0.6');
}

// ============================= SITEMAP =============================
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml);

console.log(`Generated ${SERVICES.length} service pages`);
console.log(`Generated 1 all-services index`);
console.log(`Generated ${COUNTIES.length} county pages`);
console.log(`Generated ${CITIES.length * CITY_SERVICE_SLUGS.length} city+service pages`);
console.log(`Generated ${PARTNERS.length} referral partner pages`);
console.log(`Generated vendor-partners + insurance-and-cost pages`);
console.log(`Sitemap: ${sitemapUrls.length} URLs written to sitemap.xml`);
