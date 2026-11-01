/* =========================================================
   EDIT ME: everything business-specific lives here
   ========================================================= */
const SHOP_EMAIL = 'parties@example.com'; // where party requests go
// Hours: 0=Sun … 6=Sat → [open, close] in 24h, null = closed
// photo: storefront image for that shop's card ('' shows a placeholder)
const LOCATIONS = {
  elmwood:{name:'Elmwood', street:'929 Elmwood Ave', city:'Buffalo, NY 14222', phone:'(716) 381-8699', photo:'', color:'var(--pink)',
    hours:{0:[14,21],1:null,2:[15,21],3:[15,21],4:[15,21],5:[15,21],6:[14,21]}},
  seneca:{name:'Seneca St', street:'2114 Seneca St', city:'Buffalo, NY 14210', phone:'', photo:'', color:'var(--mint)', // EDIT: phone + real hours
    hours:{0:[14,21],1:null,2:[15,21],3:[15,21],4:[15,21],5:[15,21],6:[14,21]}}
};
const FLAVORS = [ // [name, colour, pattern] — also fills the ticker
  ['Strawberry Cheesecake','#F9B8C6',''],['Pistachio','#C9EBB0',''],['Butter Pecan','#EED6A6','radial-gradient(#9b6a3a 2px,transparent 2.5px) 0 0/12px 12px'],
  ['Cookies & Cream','#F3F0EA','radial-gradient(#2A2E35 2.5px,transparent 3px) 0 0/14px 14px'],['Mint Chocolate Chip','#A8EBD3','radial-gradient(#4a2c1d 2px,transparent 2.5px) 0 0/12px 12px'],
  ['Cotton Candy','#F6B7E4','linear-gradient(90deg,#F6B7E4 50%,#A9D8F7 50%)'],['Maple Walnut','#E2B878',''],['Moose Tracks','#F2E3C6','radial-gradient(#5a3420 2.5px,transparent 3px) 0 0/14px 14px'],
  ['Superman','#FF6B6B','linear-gradient(90deg,#FF6B6B 33%,#FFE173 33% 66%,#6FB7FF 66%)'],['Rainbow Sherbet','#FFB3A7','linear-gradient(90deg,#FFB3A7 33%,#FFE59E 33% 66%,#B6EBCB 66%)'],
  ['Chocolate','#7A4A2E',''],['Cookie Dough','#F1E2C6','radial-gradient(#b68752 2.5px,transparent 3px) 0 0/14px 14px']
];
const PACKAGES = {sprinkle:'Sprinkle',social:'Sundae Social',bash:'Cookie Cake Bash'};
const ADDONS = {balloons:'Balloon garland',cake:'Extra 6" cookie cake',cookies:'Dozen frosted cookies',extra:'30 extra minutes'};

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const fmt = h => `${(Math.floor(h)%12)||12}${h%1?':30':''}${h>=12?'pm':'am'}`;
const swatch = f => f[2] ? (f[2].startsWith('radial') ? `${f[2]},${f[1]}` : f[2]) : f[1];
const tel = p => 'tel:+1' + p.replace(/\D/g,'');
const q = l => encodeURIComponent(`${l.street}, ${l.city}`);
const contact = l => `${l.street}<br>${l.city}${l.phone?`<br><a href="${tel(l.phone)}">${l.phone}</a>`:''}`;
function openState(l){
  const n=new Date(), d=n.getDay(), hr=n.getHours()+n.getMinutes()/60, t=l.hours[d];
  if (t && hr>=t[0] && hr<t[1]) return {open:true, text:`Open till ${fmt(t[1])}`};
  for (let i=0;i<8;i++){ const day=(d+i)%7, h=l.hours[day];
    if (h && (i>0 || hr<h[0])) return {open:false, text:`Opens ${i===0?'today':i===1?'tomorrow':DAYS[day]} at ${fmt(h[0])}`}; }
  return {open:false, text:'Closed'};
}
const pill = s => `<a class="pill" href="locations.html"><i class="${s.open?'on':''}"></i>${s.text}</a>`;

/* ---------- shared: nav, ticker, footer, photo slots ---------- */
const burger = $('burger');
if (burger) burger.onclick = () => { const o=$('navlist').classList.toggle('open'); burger.setAttribute('aria-expanded', o); };

if ($('tickerRow')){
  const T=[...FLAVORS.map(f=>f[0].toLowerCase()),'warm cookies','party room bookings open','elmwood + seneca'];
  $('tickerRow').innerHTML=[...T,...T].map(t=>`<span>${t}</span>`).join('');
}
if ($('footLocs')) $('footLocs').innerHTML = Object.values(LOCATIONS).map(l=>`<div><h4>${l.name}</h4><p>${contact(l)}</p></div>`).join('');
if ($('yr')) $('yr').textContent = new Date().getFullYear();

function initSlots(root=document){
  root.querySelectorAll('.slot').forEach(el=>{
    if (!el.querySelector(':scope > .tag')) el.insertAdjacentHTML('beforeend',`<span class="tag">${el.dataset.label||'Image'}</span>`);
    const src=el.dataset.src; if (!src) return;
    const i=new Image(); i.onload=()=>{ el.style.backgroundImage=`url("${src}")`; el.setAttribute('data-loaded',''); }; i.src=src;
  });
}

/* ---------- open/closed status (home + locations) ---------- */
function renderLocations(){
  const today=new Date().getDay(), L=Object.values(LOCATIONS), S=L.map(openState);
  if ($('heroStatus')) $('heroStatus').innerHTML = L.map((l,i)=>`<a class="pill" href="locations.html"><i class="${S[i].open?'on':''}"></i><b>${l.name}</b>&nbsp;${S[i].text.toLowerCase()}</a>`).join('');
  if ($('tickets')) $('tickets').innerHTML = L.map((l,i)=>`
    <div class="ticket">
      <div class="main"><h3>${l.name}</h3><p>${contact(l)}</p></div>
      <div class="stub" style="--c:${l.color}">${pill(S[i])}<a class="btn" href="locations.html">Hours &amp; map</a></div>
    </div>`).join('');
  if ($('locGrid')){
    $('locGrid').innerHTML = L.map((l,i)=>`
      <article class="loc">
        <div class="top" style="--c:${l.color}"><h2>${l.name}</h2></div>
        <div class="slot" data-src="${l.photo}" data-label="Image: ${l.name} storefront"></div>
        <div class="loc-body">
          <span style="justify-self:start">${pill(S[i])}</span>
          <p><b>${l.street}</b><br>${l.city}${l.phone?`<br><a href="${tel(l.phone)}">${l.phone}</a>`:''}</p>
          <details class="hrs" ${innerWidth>700?'open':''}><summary>Hours this week</summary><table class="hours">${[2,3,4,5,6,0,1].map(d=>{const h=l.hours[d];return `<tr class="${d===today?'today':''}"><td>${DAYS[d]}</td><td>${h?fmt(h[0])+'–'+fmt(h[1]):'Closed'}</td></tr>`}).join('')}</table></details>
          <div class="ctas"><a class="btn ink" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${q(l)}">Get directions</a>${l.phone?`<a class="btn" href="${tel(l.phone)}">Call</a>`:''}</div>
        </div>
        <iframe title="Map of ${l.name}" loading="lazy" src="https://www.google.com/maps?q=${q(l)}&output=embed"></iframe>
      </article>`).join('');
    initSlots($('locGrid'));
  }
}

/* ---------- menu tabs (menu.html#scoops opens that tab) ---------- */
if (document.querySelector('.tabs')){
  const showTab = n => {
    if (!$('tab-'+n)) n='sundaes';
    document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected', b.dataset.tab===n));
    document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on', p.id==='tab-'+n));
  };
  document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{ showTab(b.dataset.tab); history.replaceState(null,'','#'+b.dataset.tab); });
  showTab(location.hash.slice(1));
  addEventListener('hashchange',()=>showTab(location.hash.slice(1)));
}
if ($('flavorCase')) $('flavorCase').innerHTML = FLAVORS.map(f=>`<div class="tub"><i style="background:${swatch(f)}"></i><span>${f[0]}</span></div>`).join('');

/* ---------- booking (book.html?pkg=social preselects a package) ---------- */
const form = $('bookingForm');
if (form){
  const dateIn=$('date'), timeIn=$('time');
  $('locChoice').innerHTML = Object.entries(LOCATIONS).map(([k,l],i)=>`<label><input type="radio" name="loc" value="${k}" ${i?'':'checked'}><b>${l.name}</b>${l.street}</label>`).join('');
  $('addsList').innerHTML = Object.entries(ADDONS).map(([k,a])=>`<label><input type="checkbox" name="addon" value="${k}"> ${a}</label>`).join('');
  const params=new URLSearchParams(location.search);
  if (PACKAGES[params.get('pkg')]) form.querySelector(`[name=pkg][value=${params.get('pkg')}]`).checked=true;
  if (LOCATIONS[params.get('shop')]) form.querySelector(`[name=loc][value=${params.get('shop')}]`).checked=true;

  const minD=new Date(); minD.setDate(minD.getDate()+3); dateIn.min=minD.toISOString().slice(0,10);
  const loc = () => LOCATIONS[form.querySelector('[name=loc]:checked').value];
  const fillTimes = () => {
    const d=dateIn.value?new Date(dateIn.value+'T12:00'):null;
    const h=d?(loc().hours[d.getDay()]||[12,21]):[14,21]; // closed days = private-event hours
    const prev=timeIn.value; timeIn.innerHTML='<option value="">Choose a time</option>';
    for (let t=h[0]; t<=h[1]-2; t+=.5) timeIn.insertAdjacentHTML('beforeend',`<option value="${t}">${fmt(t)}</option>`);
    if ([...timeIn.options].some(o=>o.value===prev)) timeIn.value=prev;
  };
  const summarize = () => {
    const d=dateIn.value?new Date(dateIn.value+'T12:00'):null;
    const adds=[...form.querySelectorAll('[name=addon]:checked')].map(c=>ADDONS[c.value]);
    $('sLoc').textContent=loc().name;
    $('sDate').textContent=d?d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):'—';
    $('sTime').textContent=timeIn.value?timeIn.selectedOptions[0].text:'—';
    $('sGuests').textContent=$('guests').value||'—';
    $('sPkg').textContent=PACKAGES[form.querySelector('[name=pkg]:checked').value];
    $('sAdd').textContent=adds.length?adds.join(', '):'None';
  };
  form.addEventListener('input',e=>{ if(e.target===dateIn) fillTimes(); e.target.classList.remove('err'); summarize(); });
  form.addEventListener('change',e=>{ if(e.target.name==='loc') fillTimes(); summarize(); });
  form.addEventListener('submit',e=>{
    e.preventDefault(); let ok=true;
    ['date','time','guests','name','phone','email'].forEach(id=>{ const el=$(id), bad=!el.value||!el.checkValidity(); el.classList.toggle('err',bad); if(bad) ok=false; });
    if (!ok){ form.querySelector('.err').focus(); return; }
    summarize();
    const body=[`Shop: ${loc().name} (${loc().street})`,`Name: ${$('name').value}`,`Phone: ${$('phone').value}`,`Email: ${$('email').value}`,
      `Date: ${$('sDate').textContent}`,`Start: ${$('sTime').textContent}`,`Guests: ${$('guests').value}`,`Occasion: ${$('occasion').value}`,
      `Package: ${$('sPkg').textContent}`,`Add-ons: ${$('sAdd').textContent}`,'',`Notes: ${$('notes').value||'none'}`].join('\n');
    /* Opens the guest's email app with the request filled in.
       Swap for Formspree / Netlify Forms / your booking tool to receive requests directly. */
    location.href=`mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(`Party request: ${loc().name}, ${$('sDate').textContent}`)}&body=${encodeURIComponent(body)}`;
    $('doneName').textContent=$('name').value.split(' ')[0];
    $('formBody').style.display='none'; $('done').classList.add('show');
  });
  $('again').onclick=()=>{ form.reset(); $('formBody').style.display=''; $('done').classList.remove('show'); fillTimes(); summarize(); };
  fillTimes(); summarize();
}

initSlots();
renderLocations();
setInterval(renderLocations, 60000);
