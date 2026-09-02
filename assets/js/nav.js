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

  var FL_SVG = '<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><path fill="var(--red)" d="M28,138 L60,120 L110,104 L160,94 L205,93 L233,102 L230,118 L236,138 L256,152 L274,190 L290,235 L300,285 L297,330 L284,368 L264,400 L248,382 L260,358 L238,332 L220,298 L204,254 L194,210 L199,186 L180,180 L187,152 L150,145 L108,141 L66,146 L38,152 Z"/></svg>';
  var REGION_FLAGSHIPS = [["South Florida",["Miami-Dade","Broward","Palm Beach"]],["Southwest Florida",["Lee","Collier","Sarasota"]],["Tampa Bay",["Hillsborough","Pinellas","Polk"]],["Central Florida",["Orange","Volusia","Brevard"]],["North Florida",["Duval","St. Johns","Alachua"]],["Panhandle",["Leon","Escambia","Bay"]]];
  var cm = document.getElementById('countiesMenu');
  if (cm) {
    var regionsHtml = REGION_FLAGSHIPS.map(function (r) {
      return '<div class="areas-region"><h5>' + r[0] + '</h5>' + r[1].map(function (c) {
        return '<a href="/' + countySlug(c) + '-county/"><span class="mm-dot"></span>' + c + '</a>';
      }).join('') + '</div>';
    }).join('');
    cm.innerHTML = '<div class="areas-map">' + FL_SVG + '<span class="areas-map-label">All 67 Florida Counties</span></div><div class="areas-regions">' + regionsHtml + '<div class="areas-viewall"><a href="/service-areas/">View All 67 Counties →</a></div></div>';
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
