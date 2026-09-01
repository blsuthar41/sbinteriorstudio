/* ==========================================================================
   SB CAD Studio — shared behaviour
   ========================================================================== */
(function () {
  'use strict';

  /* ---- Mobile nav toggle ---- */
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---- Sheet tag: running sheet number by page ---- */
  const SHEET_NUMBERS = {
    'index.html': 'A-100 — COVER',
    '': 'A-100 — COVER',
    'cad-services.html': 'A-201 — CAD DRAFTING',
    '3d-rendering.html': 'A-301 — 3D CGI',
    'portfolio.html': 'A-401 — PORTFOLIO',
    'about.html': 'A-501 — STUDIO',
    'contact.html': 'A-601 — INQUIRY',
  };
  const sheetTagEl = document.querySelector('[data-sheet-tag]');
  if (sheetTagEl) {
    const page = location.pathname.split('/').pop();
    sheetTagEl.innerHTML = `<strong>SHEET</strong> ${SHEET_NUMBERS[page] || 'A-100 — COVER'}`;
  }

  /* ---- Live regional clocks ---- */
  const clockCells = document.querySelectorAll('[data-tz]');
  if (clockCells.length) {
    const fmt = (tz) => new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz
    }).format(new Date());
    const tick = () => {
      clockCells.forEach((cell) => {
        const tz = cell.getAttribute('data-tz');
        const target = cell.querySelector('.time');
        if (target) target.textContent = fmt(tz);
      });
    };
    tick();
    setInterval(tick, 15000);
  }

  /* ---- Unit toggle (Imperial / Metric) ---- */
  document.querySelectorAll('[data-unit-toggle]').forEach((toggle) => {
    const buttons = toggle.querySelectorAll('button');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const unit = btn.getAttribute('data-unit');
        document.querySelectorAll('[data-imperial][data-metric]').forEach((el) => {
          el.textContent = unit === 'metric' ? el.getAttribute('data-metric') : el.getAttribute('data-imperial');
        });
      });
    });
  });

  /* ---- Before / after slider ---- */
  document.querySelectorAll('.ba-slider').forEach((slider) => {
    const before = slider.querySelector('.ba-before');
    const handle = slider.querySelector('.ba-handle');
    let dragging = false;

    const setPos = (clientX) => {
      const rect = slider.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left = pct + '%';
    };

    slider.addEventListener('pointerdown', (e) => { dragging = true; setPos(e.clientX); });
    window.addEventListener('pointermove', (e) => { if (dragging) setPos(e.clientX); });
    window.addEventListener('pointerup', () => { dragging = false; });
    slider.addEventListener('keydown', (e) => {
      const rect = slider.getBoundingClientRect();
      const current = parseFloat(handle.style.left) || 50;
      if (e.key === 'ArrowLeft') setPos(rect.left + (rect.width * (current - 5) / 100));
      if (e.key === 'ArrowRight') setPos(rect.left + (rect.width * (current + 5) / 100));
    });
  });

  /* ---- Mood / light-material switcher (3D rendering page) ---- */
  document.querySelectorAll('.mood-switcher').forEach((switcher) => {
    const tabs = switcher.querySelectorAll('.mood-tabs button');
    const scenes = switcher.querySelectorAll('.mood-scene');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('is-active'));
        scenes.forEach((s) => s.classList.remove('is-active'));
        tab.classList.add('is-active');
        const target = switcher.querySelector('#' + tab.getAttribute('data-target'));
        if (target) target.classList.add('is-active');
      });
    });
  });

  /* ---- Portfolio filter ---- */
  const filterBar = document.querySelector('[data-filter-bar]');
  if (filterBar) {
    const buttons = filterBar.querySelectorAll('button');
    const cards = document.querySelectorAll('[data-category]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.getAttribute('data-cat');
        cards.forEach((card) => {
          const match = cat === 'all' || card.getAttribute('data-category') === cat;
          card.hidden = !match;
        });
      });
    });
  }

  /* ---- Portfolio modal ---- */
  const modal = document.querySelector('[data-modal]');
  if (modal) {
    const modalBody = modal.querySelector('[data-modal-body]');
    const closeModal = () => modal.classList.remove('is-open');
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    document.querySelectorAll('[data-project]').forEach((card) => {
      card.addEventListener('click', () => {
        const d = card.dataset;
        modalBody.innerHTML = `
          <h3>${d.title}</h3>
          <p>${d.desc}</p>
          <div class="spec-grid">
            <div class="spec-item"><div class="k">Region</div><div class="v">${d.region}</div></div>
            <div class="spec-item"><div class="k">Units</div><div class="v">${d.units}</div></div>
            <div class="spec-item"><div class="k">Software</div><div class="v">${d.software}</div></div>
            <div class="spec-item"><div class="k">Timeframe</div><div class="v">${d.timeframe}</div></div>
          </div>`;
        modal.classList.add('is-open');
      });
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') card.click(); });
    });
  }

  /* ---- Multi-step quote estimator ---- */
  const wizard = document.querySelector('[data-wizard]');
  if (wizard) {
    const steps = Array.from(wizard.querySelectorAll('[data-step]'));
    const stepperItems = Array.from(document.querySelectorAll('.stepper .step'));
    const state = { region: null, service: null, scale: null, software: null };
    let current = 0;

    const render = () => {
      steps.forEach((s, i) => { s.hidden = i !== current; });
      stepperItems.forEach((s, i) => {
        s.classList.toggle('is-active', i === current);
        s.classList.toggle('is-done', i < current);
      });
      if (current === steps.length - 1) buildSummary();
    };

    wizard.querySelectorAll('[data-next]').forEach((btn) => btn.addEventListener('click', () => {
      if (current < steps.length - 1) { current++; render(); window.scrollTo({ top: wizard.offsetTop - 100, behavior: 'smooth' }); }
    }));
    wizard.querySelectorAll('[data-prev]').forEach((btn) => btn.addEventListener('click', () => {
      if (current > 0) { current--; render(); window.scrollTo({ top: wizard.offsetTop - 100, behavior: 'smooth' }); }
    }));

    wizard.querySelectorAll('[data-option]').forEach((card) => {
      card.addEventListener('click', () => {
        const group = card.getAttribute('data-group');
        wizard.querySelectorAll(`[data-group="${group}"]`).forEach((c) => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        state[group] = card.getAttribute('data-value');
      });
    });

    function buildSummary() {
      const summary = wizard.querySelector('[data-summary]');
      if (!summary) return;
      const rows = [
        ['Region & standard', state.region || 'Not selected'],
        ['Service required', state.service || 'Not selected'],
        ['Project scale', state.scale || 'Not selected'],
        ['Software preference', state.software || 'Not selected'],
      ];
      summary.innerHTML = rows.map(([k, v]) => `<div class="row"><span class="k">${k}</span><span>${v}</span></div>`).join('');
    }

    render();

    /* Dropzone */
    const dropzone = wizard.querySelector('.dropzone');
    const fileInput = wizard.querySelector('#file-input');
    const fileList = wizard.querySelector('.file-list');
    if (dropzone && fileInput) {
      const addFiles = (files) => {
        Array.from(files).forEach((f) => {
          const li = document.createElement('li');
          li.innerHTML = `<span>${f.name}</span><span>${(f.size / 1024).toFixed(0)} KB</span>`;
          fileList.appendChild(li);
        });
      };
      dropzone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => addFiles(fileInput.files));
      ['dragenter', 'dragover'].forEach((evt) => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('is-drag'); }));
      ['dragleave', 'drop'].forEach((evt) => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('is-drag'); }));
      dropzone.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
    }

    /* Submit */
    const form = wizard.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const confirmation = wizard.querySelector('[data-confirmation]');
        wizard.querySelectorAll('[data-step]').forEach((s) => s.hidden = true);
        document.querySelector('.stepper').hidden = true;
        if (confirmation) confirmation.hidden = false;
      });
    }
  }
})();
