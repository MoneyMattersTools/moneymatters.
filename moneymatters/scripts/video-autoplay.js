document.addEventListener('DOMContentLoaded', function() {
  const videoCards = document.querySelectorAll('.video-card[data-video-id]');
  if (!videoCards.length) return;
  const loadVideo = (card) => {
    const id = card.dataset.videoId;
    const frame = card.querySelector('.video-frame');
    if (!frame || frame.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0&playsinline=1`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', card.dataset.videoTitle || 'Video');
    frame.querySelector('.video-thumb')?.remove();
    frame.appendChild(iframe);
  };
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { loadVideo(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  videoCards.forEach(c => obs.observe(c));
  videoCards.forEach(c => c.addEventListener('click', () => loadVideo(c)));
});
