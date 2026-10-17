document.addEventListener('DOMContentLoaded', () => {
  const MAIL_TO = 'hello@thereadathletics.com';

  // Footer year
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Mobile navigation toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // ---------- Request forms (validate, then prepare a mailto) ----------
  const fieldLabel = (form, el) => {
    if (el.dataset.label) return el.dataset.label;
    const fs = el.closest('fieldset');
    if (fs && (el.type === 'checkbox' || el.type === 'radio')) {
      const legend = fs.querySelector('legend');
      if (legend) return legend.textContent.replace('*', '').trim();
    }
    const lab = el.id ? form.querySelector(`label[for="${el.id}"]`) : null;
    return lab ? lab.textContent.replace('*', '').trim() : el.name;
  };

  const setError = (el, message) => {
    const holder = el.closest('.field') || el.closest('fieldset');
    if (!holder) return;
    let err = holder.querySelector('.field-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error';
      err.setAttribute('role', 'alert');
      holder.appendChild(err);
    }
    err.textContent = message;
    el.setAttribute('aria-invalid', 'true');
  };

  const clearErrors = (form) => {
    form.querySelectorAll('.field-error').forEach((e) => e.remove());
    form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
  };

  const buildBody = (form) => {
    const lines = [];
    const seen = new Set();
    Array.from(form.elements).forEach((el) => {
      if (!el.name || seen.has(el.name) || el.type === 'submit' || el.type === 'button') return;
      if (el.dataset.skip === 'true') return;
      seen.add(el.name);
      const group = form.querySelectorAll(`[name="${el.name}"]`);
      let value;
      if (el.type === 'checkbox' || el.type === 'radio') {
        value = Array.from(group).filter((g) => g.checked && g.dataset.skip !== 'true').map((g) => g.value).join(', ');
      } else {
        value = el.value.trim();
      }
      lines.push(`${fieldLabel(form, el)}: ${value || '(not provided)'}`);
    });
    return lines.join('\n');
  };

  document.querySelectorAll('form[data-mailto]').forEach((form) => {
    const status = form.querySelector('.form-status');
    form.setAttribute('novalidate', '');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearErrors(form);
      let firstBad = null;

      form.querySelectorAll('input, select, textarea').forEach((el) => {
        if (el.type === 'checkbox' && el.closest('fieldset[data-require-one]')) return;
        if (!el.checkValidity()) {
          let msg = 'Please fill in this field.';
          if (el.validity.typeMismatch) msg = 'Please enter a valid value (for example name@school.edu).';
          if (el.type === 'checkbox') msg = 'Please check this box to continue.';
          setError(el, msg);
          if (!firstBad) firstBad = el;
        }
      });

      form.querySelectorAll('fieldset[data-require-one]').forEach((fs) => {
        const boxes = fs.querySelectorAll('input[type="checkbox"]:not([data-skip="true"])');
        if (!Array.from(boxes).some((b) => b.checked)) {
          setError(fs, 'Please choose at least one option.');
          if (!firstBad) firstBad = boxes[0];
        }
      });

      if (firstBad) {
        if (status) {
          status.textContent = 'Please fix the highlighted fields and try again.';
          status.classList.add('error');
        }
        firstBad.focus();
        return;
      }

      const subject = form.dataset.subject || 'Request from thereadathletics.com';
      const body = `${form.dataset.intro || 'New request'}\n\n${buildBody(form)}\n\n(Sent from the THE READ Athletics website form)`;
      const href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      if (status) {
        status.classList.remove('error');
        status.textContent = '';
        status.append('Your email app should open with this request filled in. Press Send there to finish. Nothing is stored on this website. If nothing opened, ');
        const a = document.createElement('a');
        a.href = href;
        a.textContent = 'click here to open the email';
        status.append(a, ` or write to ${MAIL_TO}.`);
      }
      window.location.href = href;
    });

    form.addEventListener('input', (e) => {
      const el = e.target;
      if (el.getAttribute && el.getAttribute('aria-invalid')) {
        el.removeAttribute('aria-invalid');
        const holder = el.closest('.field');
        const err = holder && holder.querySelector('.field-error');
        if (err) err.remove();
      }
      const fs = el.closest && el.closest('fieldset[aria-invalid]');
      if (fs) {
        fs.removeAttribute('aria-invalid');
        const err = fs.querySelector('.field-error');
        if (err) err.remove();
      }
    });
  });

  // ---------- Select-all checkboxes ----------
  document.querySelectorAll('input[data-select-all]').forEach((all) => {
    const fs = all.closest('fieldset');
    const items = () => fs.querySelectorAll('input[type="checkbox"]:not([data-select-all])');
    all.addEventListener('change', () => {
      items().forEach((i) => { i.checked = all.checked; });
    });
    fs.addEventListener('change', (e) => {
      if (e.target === all) return;
      all.checked = Array.from(items()).every((i) => i.checked);
    });
  });

  // ---------- Query parameters ----------
  const params = new URLSearchParams(window.location.search);

  const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, '').replace('and', '');
  const sportParam = norm(params.get('sport') || '');
  if (sportParam) {
    document.querySelectorAll('input[name="sports"]').forEach((box) => {
      if (norm(box.value) === sportParam) box.checked = true;
    });
    const all = document.querySelector('input[data-select-all]');
    if (all) {
      const items = all.closest('fieldset').querySelectorAll('input[name="sports"]:not([data-select-all])');
      all.checked = Array.from(items).every((i) => i.checked);
    }
  }

  const roleParam = params.get('role');
  const roleSelect = document.getElementById('role');
  if (roleParam && roleSelect) {
    const match = Array.from(roleSelect.options).find((o) => o.value.toLowerCase() === roleParam.toLowerCase());
    if (match) {
      roleSelect.value = match.value;
    } else {
      roleSelect.add(new Option(roleParam, roleParam, true, true));
    }
  }

  const appSelect = document.getElementById('application');
  if (params.get('application') === 'upgrade' && appSelect) {
    appSelect.value = 'Upgrade an individual account';
    const note = document.getElementById('upgrade-note');
    if (note) note.hidden = false;
  }

  // ---------- Internal preview navigation ----------
  const wsButtons = document.querySelectorAll('[data-view]');
  if (wsButtons.length) {
    const panels = document.querySelectorAll('[data-view-panel]');
    const heading = document.getElementById('ws-heading');
    const show = (name) => {
      wsButtons.forEach((b) => {
        const on = b.dataset.view === name;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
        if (on && heading) heading.textContent = b.dataset.title || b.textContent;
      });
      panels.forEach((p) => { p.hidden = p.dataset.viewPanel !== name; });
    };
    wsButtons.forEach((b) => b.addEventListener('click', () => {
      show(b.dataset.view);
      history.replaceState(null, '', `#${b.dataset.view}`);
    }));
    const initial = window.location.hash.replace('#', '');
    show(Array.from(wsButtons).some((b) => b.dataset.view === initial) ? initial : wsButtons[0].dataset.view);
  }
});
