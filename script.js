document.addEventListener('DOMContentLoaded', () => {
  const year = new Date().getFullYear();

  const currentYear = document.createElement('span');
  currentYear.textContent = `© ${year} THE READ`;
  currentYear.style.display = 'block';
  currentYear.style.marginTop = '0.75rem';
  currentYear.style.fontSize = '0.83rem';
  currentYear.style.color = 'rgba(26, 26, 26, 0.6)';

  const footer = document.querySelector('.site-footer .footer-inner');
  if (footer) {
    footer.appendChild(currentYear);
  }
});
