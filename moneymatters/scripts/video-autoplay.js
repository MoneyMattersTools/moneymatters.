document.addEventListener('DOMContentLoaded', function() {
  const videoCards = document.querySelectorAll('.video-card[data-video-id]');
  if (!videoCards.length) return;

  videoCards.forEach((card) => {
    const id = card.dataset.videoId;
    const thumb = card.querySelector('.video-thumb');
    if (thumb) {
      thumb.style.backgroundImage = `url(https://img.youtube.com/vi/${id}/hqdefault.jpg)`;
      thumb.style.backgroundSize = 'cover';
      thumb.style.backgroundPosition = 'center';
    }
  });

  // Click-to-play only — unlike a scroll-triggered autoplay, this doesn't
  // need a prefers-reduced-motion check, since the visitor explicitly
  // requested playback themselves.
  const loadVideo = (card) => {
    const id = card.dataset.videoId;
    const frame = card.querySelector('.video-frame');
    if (!frame || frame.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', card.dataset.videoTitle || 'Video');
    frame.querySelector('.video-thumb')?.remove();
    frame.appendChild(iframe);
  };
  videoCards.forEach(c => c.addEventListener('click', () => loadVideo(c)));
  videoCards.forEach(c => c.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadVideo(c); }
  }));
});
