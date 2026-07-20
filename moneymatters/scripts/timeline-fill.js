document.addEventListener('DOMContentLoaded', function () {
  var timelines = document.querySelectorAll('.timeline');
  if (!timelines.length) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-filled');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });
  timelines.forEach(function (el) { observer.observe(el); });
});
