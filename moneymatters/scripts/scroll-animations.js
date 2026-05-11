document.addEventListener('DOMContentLoaded', function() {
  const animatedElements = document.querySelectorAll('.fade-up');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  animatedElements.forEach(el => observer.observe(el));

  const orb = document.querySelector('.gradient-orb');
  if (orb) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      orb.style.transform = `translate(${scrolled * 0.1}px, ${scrolled * 0.3}px)`;
    }, { passive: true });
  }
});
