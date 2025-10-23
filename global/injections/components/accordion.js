// HOTEL INFO ACCORDION FUNCTIONALITY
document.querySelectorAll('.accordion-container').forEach(container => {
const header = container.querySelector('.accordion-header');
const body = container.querySelector('.accordion-body');

header.addEventListener('click', () => {
  const isOpen = container.classList.contains('open');

  // Close all other accordions if needed
  document.querySelectorAll('.accordion-container').forEach(c => {
    c.classList.remove('open');
    c.querySelector('.accordion-body').style.display = 'none';
  });

  if (!isOpen) {
    container.classList.add('open');
    body.style.display = 'block';

    // Lazy-load iframe ONLY IF a data-iframe-src attribute is present
    const iframeSrc = body.getAttribute('data-iframe-src');
    if (iframeSrc && !body.querySelector('iframe')) {
      const iframe = document.createElement('iframe');
      iframe.src = iframeSrc;
      iframe.width = '100%';
      iframe.height = '450';
      iframe.style.border = '0';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      body.appendChild(iframe);
    }
  }
});
});

// Automatically open the "Live Shuttle Wait Times" accordion
document.addEventListener('DOMContentLoaded', () => {
const defaultAccordion = document.querySelector('#wait-time-accordion');
if (defaultAccordion) {
  defaultAccordion.classList.add('open');
  const body = defaultAccordion.querySelector('.accordion-body');
  body.style.display = 'block';
}
});