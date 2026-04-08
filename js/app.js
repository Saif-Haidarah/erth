/**
 * 🔊 ENGINEERING SOUND ENGINE (Dynamic Signature)
 * محاكاة التوقيع الصوتي الطبقي
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.layers = {};
    this.isInit = false;
  }
  
  init() {
    if (this.isInit) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.isInit = true;
    this.setupLayers();
  }
  
  setupLayers() {
    this.layers.idle = this._createOsc(45, 'sine', 0.04);
    this.layers.turbine = this._createOsc(120, 'triangle', 0.0);
    this.layers.harmonics = this.ctx.createBiquadFilter();
    this.layers.harmonics.type = 'bandpass';
    this.layers.harmonics.frequency.value = 800;
    this.layers.harmonics.Q.value = 1.2;
    
    this.layers.turbine.osc.connect(this.layers.harmonics);
    this.layers.harmonics.connect(this.ctx.destination);
    this.layers.idle.osc.start();
    this.layers.turbine.osc.start();
  }
  
  _createOsc(freq, type, gain) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; 
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g); 
    g.connect(this.ctx.destination);
    return { osc, gain: g };
  }
  
  setState(state) {
    if (!this.isInit) return;
    const now = this.ctx.currentTime;
    // ✅ التصحيح: الوصول إلى AudioParam عبر .gain.gain
    const set = (node, val, t=0.2) => node.gain.gain.setTargetAtTime(val, now, t);
    const freq = (node, val, t=0.2) => node.osc.frequency.setTargetAtTime(val, now, t);

    switch(state) {
      case 'idle':
        set(this.layers.idle, 0.04); 
        set(this.layers.turbine, 0.0); 
        break;
      case 'core':
        set(this.layers.idle, 0.06, 0.3); 
        set(this.layers.turbine, 0.08, 0.4); 
        freq(this.layers.turbine, 220, 0.4); 
        break;
      case 'detail':
        set(this.layers.idle, 0.03, 0.1); 
        set(this.layers.turbine, 0.14, 0.2); 
        freq(this.layers.turbine, 480, 0.2); 
        break;
      case 'stealth':
        set(this.layers.idle, 0.01); 
        set(this.layers.turbine, 0.0); 
        break;
    }
  }
}

const audio = new SoundEngine();
let curL = 'ar'; 
let curLayer = 'shell';
let toastTimer;

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; 
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

function toggleLang() {
  audio.init();
  audio.setState(curL === 'ar' ? 'detail' : 'core');
  curL = curL === 'ar' ? 'en' : 'ar';
  document.documentElement.dir = curL === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('l-ar').style.opacity = curL === 'ar' ? 1 : 0;
  document.getElementById('l-en').style.opacity = curL === 'en' ? 1 : 0;
  document.querySelectorAll('[data-en]').forEach(el => { 
    let tmp = el.innerHTML; 
    el.innerHTML = el.getAttribute('data-en'); 
    el.setAttribute('data-en', tmp); 
  }); 
}

const images = {
  shell: './assets/shell.jpg',
  core: './assets/core.jpg',
  turbine: './assets/turbine.jpg',
  caps: './assets/caps.jpg'
};

const engine = document.getElementById('v-engine');
const overlay = document.getElementById('ui-overlay');
const hint = document.getElementById('hint');
const btnBack = document.getElementById('btn-back');
const btnReset = document.getElementById('btn-reset');
const loader = document.getElementById('loader');

function loadImg(src, cb) {
  loader.classList.add('active');
  const img = new Image();
  img.onload = () => {
    engine.style.backgroundImage = `url('${src}')`;
    loader.classList.remove('active');
    if(cb) cb();
  };
  img.onerror = () => { 
    loader.classList.remove('active'); 
    showToast('فشل تحميل الصورة - تحقق من المسار'); 
  };
  img.src = src;
}

function startDissection() {
  if (curLayer === 'shell') {
    audio.init(); 
    audio.setState('core');
    curLayer = 'core';
    loadImg(images.core, () => {
      overlay.classList.add('active'); 
      hint.style.display = 'none'; 
      btnReset.style.display = 'block';
    });
  }
}

function drillTo(part) {
  audio.setState('detail'); 
  curLayer = part; 
  overlay.classList.remove('active');
  loadImg(images[part]); 
  btnBack.style.display = 'block'; 
}

function goBack() {
  audio.setState('core'); 
  curLayer = 'core';
  loadImg(images.core, () => { 
    overlay.classList.add('active'); 
    btnBack.style.display = 'none'; 
  });
}

function resetAll() {
  audio.setState('idle'); 
  curLayer = 'shell';
  loadImg(images.shell, () => {
    overlay.classList.remove('active'); 
    btnReset.style.display = 'none'; 
    btnBack.style.display = 'none'; 
    hint.style.display = 'block';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('langToggle').addEventListener('click', toggleLang);
  engine.addEventListener('click', startDissection);
  
  document.querySelectorAll('.part-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      drillTo(btn.dataset.part); 
    });
  });
  
  btnBack.addEventListener('click', (e) => { 
    e.stopPropagation(); 
    goBack(); 
  });
  
  btnReset.addEventListener('click', (e) => { 
    e.stopPropagation(); 
    resetAll(); 
  });

  document.querySelectorAll('[tabindex="0"]').forEach(el => {
    el.addEventListener('keydown', e => { 
      if(e.key === 'Enter' || e.key === ' ') el.click(); 
    });
  });
});
