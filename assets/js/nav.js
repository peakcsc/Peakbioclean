/* Shared header/footer behavior for Peak Bio-Clean subpages (service, county, city, and partner pages).
   The homepage (index.html) has its own inline copy of this logic — kept separate so it isn't disturbed. */
(function () {
  var CORE = [
    ["Crime Scene Cleanup", "crime-scene-cleanup"],
    ["Homicide Cleanup", "homicide-cleanup"],
    ["Suicide Cleanup", "suicide-cleanup"],
    ["Unattended Death Cleanup", "unattended-death-cleanup"],
    ["Trauma Cleanup", "trauma-cleanup"],
    ["Blood Cleanup", "blood-cleanup"],
    ["Decomposition Cleanup", "decomposition-cleanup"],
    ["Biohazard Waste Disposal", "biohazard-waste-disposal"],
    ["Hoarding Cleanup", "hoarding-cleanup"],
    ["Infectious Disease Cleanup", "infectious-disease-cleanup"],
    ["Tear Gas Cleanup", "tear-gas-cleanup"],
    ["Rodent Waste Removal", "rodent-waste-removal"]
  ];
  var COUNTIES = ["Alachua","Baker","Bay","Bradford","Brevard","Broward","Calhoun","Charlotte","Citrus","Clay","Collier","Columbia","DeSoto","Dixie","Duval","Escambia","Flagler","Franklin","Gadsden","Gilchrist","Glades","Gulf","Hamilton","Hardee","Hendry","Hernando","Highlands","Hillsborough","Holmes","Indian River","Jackson","Jefferson","Lafayette","Lake","Lee","Leon","Levy","Liberty","Madison","Manatee","Marion","Martin","Miami-Dade","Monroe","Nassau","Okaloosa","Okeechobee","Orange","Osceola","Palm Beach","Pasco","Pinellas","Polk","Putnam","Santa Rosa","Sarasota","Seminole","St. Johns","St. Lucie","Sumter","Suwannee","Taylor","Union","Volusia","Wakulla","Walton","Washington"];
  function countySlug(c){ return c.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 100 20 10 10 0 000-20z" opacity=".2"/></svg>';

  var mm = document.getElementById('megaMenu');
  if (mm) {
    mm.innerHTML = CORE.map(function (x) {
      return '<a href="/' + x[1] + '/"><span class="mm-icon">' + ICON + '</span>' + x[0] + '</a>';
    }).join('') + '<a href="/services/"><span class="mm-icon">' + ICON + '</span>All Services</a>';
  }

  var cm = document.getElementById('countiesMenu');
  if (cm) {
    cm.innerHTML = COUNTIES.map(function (c) {
      return '<a href="/' + countySlug(c) + '-county/"><span class="mm-dot"></span>' + c + ' County</a>';
    }).join('');
  }

  Array.prototype.forEach.call(document.querySelectorAll('.has-dropdown'), function (dd) {
    var t;
    dd.addEventListener('mouseenter', function () { clearTimeout(t); dd.classList.add('open'); });
    dd.addEventListener('mouseleave', function () { t = setTimeout(function () { dd.classList.remove('open'); }, 400); });
  });

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
    Array.prototype.forEach.call(navLinks.querySelectorAll('a'), function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });
  }
})();
