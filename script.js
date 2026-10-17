document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const form = document.querySelector('[data-request-form]');
  if (form) {
    const params = new URLSearchParams(window.location.search);
    const role = form.elements.namedItem('role');
    const application = form.elements.namedItem('application');
    const sportParam = params.get('sport');

    if (role && params.has('role')) role.value = params.get('role');
    if (application && params.has('application')) application.value = params.get('application');

    if (sportParam) {
      const matchingSport = Array.from(form.querySelectorAll('[name="sports"]'))
        .find((input) => input.value.toLowerCase() === sportParam.toLowerCase());
      if (matchingSport) matchingSport.checked = true;
    }

    const sportChecks = Array.from(form.querySelectorAll('[name="sports"]'));
    const updateSportValidity = () => {
      if (sportChecks.length > 0) {
        sportChecks[0].setCustomValidity(sportChecks.some((input) => input.checked)
          ? '' : 'Select at least one sport.');
      }
    };
    sportChecks.forEach((input) => input.addEventListener('change', updateSportValidity));
    updateSportValidity();

    const selectAll = form.querySelector('[data-select-all]');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        sportChecks.forEach((input) => { input.checked = selectAll.checked; });
        updateSportValidity();
      });
      sportChecks.forEach((input) => input.addEventListener('change', () => {
        selectAll.checked = sportChecks.length > 0 && sportChecks.every((item) => item.checked);
      }));
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      updateSportValidity();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const lines = Array.from(data.entries())
        .filter(([key]) => key !== 'email' && key !== 'name')
        .map(([key, value]) => `${key}: ${value}`);
      const email = String(data.get('email') || '');
      const subject = form.dataset.subject || 'THE READ access request';
      const body = `Name: ${data.get('name') || ''}\nEmail: ${email}\n\n${lines.join('\n')}`;
      window.location.href = `mailto:hello@thereadathletics.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  const preview = document.querySelector('[data-preview]');
  if (preview) {
    const links = Array.from(preview.querySelectorAll('[data-preview-page]'));
    const heading = preview.querySelector('[data-preview-heading]');
    links.forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      links.forEach((item) => item.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'page');
      if (heading) heading.textContent = link.dataset.previewPage;
    }));
  }
});
