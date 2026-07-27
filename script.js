(function () {
  "use strict";

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LABELS = {
    0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
    45:'Fog',48:'Rime fog',
    51:'Light drizzle',53:'Drizzle',55:'Dense drizzle',56:'Freezing drizzle',57:'Freezing drizzle',
    61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',
    71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',
    80:'Rain showers',81:'Rain showers',82:'Violent showers',
    85:'Snow showers',86:'Snow showers',
    95:'Thunderstorm',96:'Thunderstorm, hail',99:'Severe thunderstorm'
  };

  function category(code){
    if(code===0) return 'clear';
    if(code===1||code===2) return 'partly';
    if(code===3) return 'cloudy';
    if(code===45||code===48) return 'fog';
    if([51,53,55,56,57].includes(code)) return 'drizzle';
    if([61,63,65,66,67,80,81,82].includes(code)) return 'rain';
    if([71,73,75,77,85,86].includes(code)) return 'snow';
    if([95,96,99].includes(code)) return 'storm';
    return 'cloudy';
  }

  function cloudCategory(coverPct){
    if(coverPct<=20) return 'clear';
    if(coverPct<=60) return 'partly';
    return 'cloudy';
  }
  const CLOUD_LABELS = { clear:'Clear sky', partly:'Partly cloudy', cloudy:'Overcast' };

  function refineCategory(weatherCode, rainMm, showersMm, snowfallMm, cloudCoverPct){
    let cat = category(weatherCode);
    let label = LABELS[weatherCode] || 'Unsettled';
    const rainingNow = (rainMm + showersMm) > 0.05; 
    const snowingNow = snowfallMm > 0.02;         

    if((cat==='drizzle' || cat==='rain' || cat==='storm') && !rainingNow){
      cat = cloudCategory(cloudCoverPct);
      label = CLOUD_LABELS[cat];
    } else if(cat==='snow' && !snowingNow){
      cat = cloudCategory(cloudCoverPct);
      label = CLOUD_LABELS[cat];
    }
    return { cat, label };
  }

  const PALETTES = {
    clear:  { day:['#3E8EDE','#BFE4F5'], night:['#050A18','#131C33'] },
    partly: { day:['#4C8FCB','#CBDCE8'], night:['#0A1024','#1A2540'] },
    cloudy: { day:['#6B7686','#B9C0C9'], night:['#12151F','#252B37'] },
    fog:    { day:['#8B95A0','#D3D8DC'], night:['#161A20','#2A2F36'] },
    drizzle:{ day:['#5A6B7A','#96A4B0'], night:['#0D131C','#1E2530'] },
    rain:   { day:['#41505E','#71818E'], night:['#080C13','#161C26'] },
    snow:   { day:['#8FA3B8','#E7EEF3'], night:['#0F1626','#232E42'] },
    storm:  { day:['#282E38','#4A5260'], night:['#05070C','#12151C'] },
  };
  const GLOW = [255,150,90]; 

  function hexToRgb(h){
    const n = parseInt(h.slice(1),16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }

  function lerp(a,b,t){ return a+(b-a)*t; }
  // Same, but for a whole [r,g,b] color at once.
  function lerpRgb(c1,c2,t){
    return [lerp(c1[0],c2[0],t),lerp(c1[1],c2[1],t),lerp(c1[2],c2[2],t)];
  }
  function rgbStr(c){ return `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; }
  // Keep a number between a minimum and maximum.
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

  function iconSvg(cat,isDay){
    const stroke = 'stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" fill="none"';
    const sun = `<circle cx="50" cy="46" r="16" ${stroke}/>
      <g ${stroke}>
        <path d="M50 14v8M50 70v8M18 46h8M74 46h8M27 23l6 6M67 23l-6 6M27 69l6-6M67 69l-6 6"/>
      </g>`;
    const moon = `<path d="M62 24c-14 0-24 11-24 25s10 25 24 25c6 0 11-2 15-5-16-1-27-13-27-27s6-20 12-23c0-0-0-0 0 0z" ${stroke}/>
      <circle cx="30" cy="24" r="1.6" fill="currentColor"/><circle cx="20" cy="40" r="1.2" fill="currentColor"/><circle cx="34" cy="14" r="1.2" fill="currentColor"/>`;
    const cloud = `<path d="M28 66h38a14 14 0 0 0 2-27.8 18 18 0 0 0-34.6-4A15 15 0 0 0 28 66z" ${stroke}/>`;
    const bolt = `<path d="M54 58l-10 16h9l-6 12" ${stroke}/>`;
    const drops = `<path d="M38 78l-4 8M52 78l-4 8M66 78l-4 8" ${stroke}/>`;
    const flakes = `<g ${stroke}><path d="M38 78v10M33 83h10"/><path d="M52 78v10M47 83h10"/><path d="M66 78v10M61 83h10"/></g>`;
    const fogLines = `<g ${stroke}><path d="M18 74h64M24 84h52"/></g>`;

    switch(cat){
      case 'clear': return `<svg viewBox="0 0 100 100">${isDay?sun:moon}</svg>`;
      case 'partly': return `<svg viewBox="0 0 100 100">${isDay?`<g transform="translate(-8,-10) scale(.55)">${sun}</g>`:`<g transform="translate(-6,-14) scale(.5)">${moon}</g>`}${cloud}</svg>`;
      case 'cloudy': return `<svg viewBox="0 0 100 100">${cloud}</svg>`;
      case 'fog': return `<svg viewBox="0 0 100 100"><path d="M26 54h40a12 12 0 0 0 1.6-23.9A15.5 15.5 0 0 0 38 25a13 13 0 0 0-12 13.2A11 11 0 0 0 26 54z" ${stroke}/>${fogLines}</svg>`;
      case 'drizzle': return `<svg viewBox="0 0 100 100">${cloud}${drops}</svg>`;
      case 'rain': return `<svg viewBox="0 0 100 100">${cloud}<g ${stroke}><path d="M36 80l-5 12M50 80l-5 12M64 80l-5 12"/></g></svg>`;
      case 'snow': return `<svg viewBox="0 0 100 100">${cloud}${flakes}</svg>`;
      case 'storm': return `<svg viewBox="0 0 100 100">${cloud}${bolt}</svg>`;
      default: return `<svg viewBox="0 0 100 100">${cloud}</svg>`;
    }
  }

  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2); // cap for performance

  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W*DPR; canvas.height = H*DPR;
    canvas.style.width = W+'px'; canvas.style.height = H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  const scene = {
    cat:'clear',       
    isDay:true,         
    sunProgress:0.5,   
    glow:0,             
    particles:[],      
    particleType:null,  
  };

  function buildParticles(cat, isDay){
    const arr = [];
    if(cat==='rain' || cat==='drizzle' || cat==='storm'){
      const n = cat==='drizzle'?40:(cat==='storm'?90:70);
      for(let i=0;i<n;i++){
        arr.push({x:Math.random()*W, y:Math.random()*H, len:10+Math.random()*14, spd:6+Math.random()*6});
      }
      scene.particleType='rain';
    } else if(cat==='snow'){
      for(let i=0;i<60;i++){
        arr.push({x:Math.random()*W, y:Math.random()*H, r:1.5+Math.random()*2.4, spd:0.6+Math.random()*1.1, sway:Math.random()*Math.PI*2});
      }
      scene.particleType='snow';
    } else if(cat==='fog'){
      for(let i=0;i<5;i++){
        arr.push({x:Math.random()*W, y:H*(0.55+Math.random()*0.4), w:W*0.9, h:40+Math.random()*40, spd:4+Math.random()*6});
      }
      scene.particleType='fog';
    } else if(cat==='cloudy' || cat==='partly'){
      const n = cat==='cloudy'?6:4;
      for(let i=0;i<n;i++){
        arr.push({x:Math.random()*W, y:H*(0.12+Math.random()*0.34), s:0.6+Math.random()*0.9, spd:3+Math.random()*5});
      }
      scene.particleType='cloud';
    } else if(cat==='clear' && !isDay){
      for(let i=0;i<70;i++){
        arr.push({x:Math.random()*W, y:Math.random()*H*0.75, r:0.5+Math.random()*1.3, tw:Math.random()*Math.PI*2});
      }
      scene.particleType='stars';
    } else {
      scene.particleType=null; // clear daytime sky needs no particles
    }
    scene.particles = arr;
  }

  function drawCloudBlob(x,y,scale){
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(scale,scale);
    ctx.beginPath();
    ctx.arc(0,0,26,Math.PI*0.5,Math.PI*1.5);
    ctx.arc(20,-14,20,Math.PI*1,Math.PI*1.9);
    ctx.arc(46,0,24,Math.PI*1.4,Math.PI*0.55,true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function frame(){
    ctx.clearRect(0,0,W,H);

  
    const pal = PALETTES[scene.cat] || PALETTES.cloudy;
    const stops = scene.isDay ? pal.day : pal.night;
    let top = hexToRgb(stops[0]);
    let bottom = hexToRgb(stops[1]);
    if(scene.glow>0){

      top = lerpRgb(top, GLOW, scene.glow*0.28);
      bottom = lerpRgb(bottom, GLOW, scene.glow*0.55);
    }
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, rgbStr(top));
    g.addColorStop(1, rgbStr(bottom));
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
    const sx = W*0.12 + scene.sunProgress*(W*0.76);
    const sy = H*0.62 - Math.sin(scene.sunProgress*Math.PI)*H*0.40;
    if(scene.isDay){
      const glowR = 70 + scene.glow*40;
      const rg = ctx.createRadialGradient(sx,sy,0,sx,sy,glowR);
      rg.addColorStop(0, scene.glow>0.3 ? 'rgba(255,190,120,.85)' : 'rgba(255,244,210,.75)');
      rg.addColorStop(1, 'rgba(255,244,210,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(sx,sy,glowR,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = scene.glow>0.3 ? '#FFD9A8' : '#FFFDF3';
      ctx.beginPath(); ctx.arc(sx,sy,18,0,Math.PI*2); ctx.fill();
    } else {
      const rg = ctx.createRadialGradient(sx,sy,0,sx,sy,46);
      rg.addColorStop(0,'rgba(230,236,246,.55)');
      rg.addColorStop(1,'rgba(230,236,246,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(sx,sy,46,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#E9EEF6';
      ctx.beginPath(); ctx.arc(sx,sy,13,0,Math.PI*2); ctx.fill();
    }

    // --- particles (rain / snow / clouds / fog / stars) ---
    ctx.lineCap='round';
    if(scene.particleType==='stars'){
      ctx.fillStyle='#fff';
      scene.particles.forEach(p=>{
        const a = 0.4+0.6*Math.abs(Math.sin(p.tw)); // gentle twinkle
        ctx.globalAlpha=a;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        if(!reduceMotion) p.tw += 0.02;
      });
      ctx.globalAlpha=1;
    } else if(scene.particleType==='cloud'){
      ctx.fillStyle='rgba(255,255,255,.28)';
      scene.particles.forEach(p=>{
        drawCloudBlob(p.x,p.y,p.s);
        if(!reduceMotion){ p.x += p.spd*0.05; if(p.x>W+80) p.x=-80; } // drift right, wrap around
      });
    } else if(scene.particleType==='fog'){
      scene.particles.forEach(p=>{
        const fg = ctx.createLinearGradient(p.x-p.w/2,0,p.x+p.w/2,0);
        fg.addColorStop(0,'rgba(255,255,255,0)');
        fg.addColorStop(0.5,'rgba(255,255,255,.16)');
        fg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=fg;
        ctx.fillRect(p.x-p.w/2,p.y,p.w,p.h);
        if(!reduceMotion){ p.x += p.spd*0.06; if(p.x-p.w/2>W) p.x=-p.w/2; }
      });
    } else if(scene.particleType==='rain'){
      ctx.strokeStyle='rgba(210,225,240,.55)';
      ctx.lineWidth=1.4;
      scene.particles.forEach(p=>{
        ctx.beginPath();
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(p.x-2,p.y+p.len);
        ctx.stroke();
        if(!reduceMotion){
          p.y += p.spd; p.x -= 0.6; 
          if(p.y>H){ p.y=-20; p.x=Math.random()*W; } 
        }
      });
    } else if(scene.particleType==='snow'){
      ctx.fillStyle='rgba(255,255,255,.85)';
      scene.particles.forEach(p=>{
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        if(!reduceMotion){
          p.y += p.spd; p.x += Math.sin(p.sway)*0.6; p.sway += 0.02; // gentle drifting fall
          if(p.y>H){ p.y=-10; p.x=Math.random()*W; }
        }
      });
    }

    if(!reduceMotion) requestAnimationFrame(frame); // keep animating
  }
  requestAnimationFrame(frame);
  if(reduceMotion){
    setInterval(frame, 4000);
  }

  const $ = id => document.getElementById(id);
  const placeName   = $('placeName'), statusDot = $('statusDot'), localTimeEl = $('localTime');
  const tempEl      = $('temp'), condLabel = $('condLabel'), condIcon = $('condIcon');
  const feelsLike   = $('feelsLike'), windEl = $('wind'), humidityEl = $('humidity'), pressureEl = $('pressure');
  const updatedEl   = $('updated'), toast = $('toast');
  const searchForm  = $('searchForm'), citySearch = $('citySearch'), suggestions = $('suggestions');
  const locateBtn   = $('locateBtn');

  let clockTimer = null, refreshTimer = null;

  function showToast(msg, ms){
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>{ toast.hidden=true; }, ms||4200);
  }

  function localEpoch(isoNoOffset){ return Date.parse(isoNoOffset+'Z'); }
  function nowLocalEpoch(offsetSec){ return Date.now() + offsetSec*1000; }
  function startClock(offsetSec){
    if(clockTimer) clearInterval(clockTimer);
    function tick(){
      const t = new Date(nowLocalEpoch(offsetSec));
      const hh = String(t.getUTCHours()).padStart(2,'0');
      const mm = String(t.getUTCMinutes()).padStart(2,'0');
      localTimeEl.textContent = `${hh}:${mm}`;
    }
    tick();
    clockTimer = setInterval(tick,1000);
  }

  async function reverseGeocode(lat,lon){
    try{
      const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const d = await r.json();
      const city = d.city || d.locality || d.principalSubdivision;
      const country = d.countryName;
      return city ? (country ? `${city}, ${country}` : city) : `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    }catch(e){
      return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    }
  }

  async function loadWeatherFor(lat, lon, knownName){
    statusDot.classList.add('loading');
    placeName.textContent = knownName || 'Locating…';
    try{
      const [namePromise, weatherRes] = await Promise.all([
        knownName ? Promise.resolve(knownName) : reverseGeocode(lat,lon),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,surface_pressure,wind_speed_10m&daily=sunrise,sunset&timezone=auto&forecast_days=2`)
      ]);
      if(!weatherRes.ok) throw new Error('weather fetch failed');
      const data = await weatherRes.json();
      const name = namePromise;

      const cw = data.current;
      const offset = data.utc_offset_seconds || 0;
      const isDay = !!cw.is_day;
      const { cat, label } = refineCategory(cw.weather_code, cw.rain, cw.showers, cw.snowfall, cw.cloud_cover);

      const feels = Math.round(cw.apparent_temperature);
      const hum = Math.round(cw.relative_humidity_2m);
      const pres = Math.round(cw.surface_pressure);

      const sunrise0 = localEpoch(data.daily.sunrise[0]);
      const sunset0  = localEpoch(data.daily.sunset[0]);
      const sunrise1 = data.daily.sunrise[1] ? localEpoch(data.daily.sunrise[1]) : sunrise0 + 86400000;
      const now = nowLocalEpoch(offset);

      let progress;
      if(isDay){

        progress = clamp((now-sunrise0)/(sunset0-sunrise0),0,1);
      } else if(now < sunrise0){
        // It's the early hours, before today's sunrise —
        // approximate "night start" as 24h before today's sunrise
        const pseudoStart = sunset0 - 86400000;
        progress = clamp((now-pseudoStart)/(sunrise0-pseudoStart),0,1);
      } else {
        progress = clamp((now-sunset0)/(sunrise1-sunset0),0,1);
      }
      const minsToSunrise = Math.abs(now-sunrise0)/60000;
      const minsToSunset  = Math.abs(now-sunset0)/60000;
      const glow = clamp(1 - Math.min(minsToSunrise,minsToSunset)/90, 0, 1); // strongest within 90 min of either

      if(scene.cat!==cat || scene.isDay!==isDay){
        buildParticles(cat, isDay); // only rebuild particles if the category actually changed
      }
      scene.cat = cat; scene.isDay = isDay; scene.sunProgress = progress; scene.glow = glow;
      if(reduceMotion) frame();

      // --- update all the on-screen text ---
      placeName.textContent = name;
      statusDot.classList.remove('loading');
      tempEl.textContent = `${Math.round(cw.temperature_2m)}°`;
      condLabel.textContent = label;
      condIcon.innerHTML = iconSvg(cat, isDay);
      feelsLike.textContent = `${feels}°`;
      windEl.textContent = `${Math.round(cw.wind_speed_10m)} km/h`;
      humidityEl.textContent = `${hum}%`;
      pressureEl.textContent = `${pres} hPa`;
      startClock(offset);
      updatedEl.textContent = 'Live · updates every 10 min · via Open‑Meteo';

      state.lat=lat; state.lon=lon; state.name=name;
      if(refreshTimer) clearInterval(refreshTimer);
      refreshTimer = setInterval(()=>loadWeatherFor(lat,lon,name), 10*60*1000);

    }catch(err){
      statusDot.classList.remove('loading');
      showToast("Couldn't load weather — check connection and try again.");
      updatedEl.textContent = 'Not updated';
    }
  }

  // Remembers whichever location is currently showing.
  const state = {lat:null,lon:null,name:null};

  function detectLocation(){
    statusDot.classList.add('loading');
    placeName.textContent = 'Locating…';
    locateBtn.classList.add('spinning');
    if(!navigator.geolocation){
      fallbackLocation("Geolocation not supported — showing Nagpur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      // Success: the browser gave us real coordinates
      pos=>{
        locateBtn.classList.remove('spinning');
        loadWeatherFor(pos.coords.latitude, pos.coords.longitude);
      },
      // Failure: permission denied, or it timed out
      err=>{
        locateBtn.classList.remove('spinning');
        fallbackLocation("Location access unavailable — showing Nagpur. Search any city below.");
      },
      { timeout:8000, maximumAge:300000 }
    );
  }

  function fallbackLocation(msg){
    showToast(msg, 5000);
    loadWeatherFor(21.1458, 79.0882, 'Nagpur, India');
  }

  locateBtn.addEventListener('click', detectLocation);

  let searchAbort = null, searchDebounce = null;

  citySearch.addEventListener('input', ()=>{
    clearTimeout(searchDebounce);
    const q = citySearch.value.trim();
    if(q.length<2){ suggestions.hidden=true; suggestions.innerHTML=''; return; }

    searchDebounce = setTimeout(async ()=>{
      try{
        if(searchAbort) searchAbort.abort(); // cancel any lookup still in flight
        searchAbort = new AbortController();
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`, {signal:searchAbort.signal});
        const d = await r.json();
        const results = d.results || [];
        if(!results.length){ suggestions.hidden=true; suggestions.innerHTML=''; return; }

        suggestions.innerHTML = results.map((res,i)=>{
          const label = [res.name, res.admin1, res.country].filter(Boolean).join(', ');
          return `<button type="button" data-i="${i}">${label}</button>`;
        }).join('');
        suggestions.hidden = false;

        Array.from(suggestions.children).forEach((btn,i)=>{
          btn.addEventListener('click', ()=>{
            const res = results[i];
            const label = [res.name, res.admin1, res.country].filter(Boolean).join(', ');
            suggestions.hidden = true;
            citySearch.value = '';
            loadWeatherFor(res.latitude, res.longitude, label);
          });
        });
      }catch(e){ /* a cancelled or failed lookup — just ignore it */ }
    }, 320);
  });

  document.addEventListener('click', (e)=>{
    if(!suggestions.contains(e.target) && e.target!==citySearch){
      suggestions.hidden = true;
    }
  });

  searchForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const first = suggestions.querySelector('button');
    if(first) first.click();
  });

  detectLocation();

})();