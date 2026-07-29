(function () {
  var video = document.querySelector('.hero-media-video');
  if (!video) return;

  var wideEnough = window.matchMedia('(min-width: 900px)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  var slowConnection = navigator.connection && /2g/.test(navigator.connection.effectiveType || '');

  // Mobile, touch, reduced-motion, and constrained-data visitors get the
  // static poster image only — the <video> has no src attribute until this
  // check passes, so those visitors never request the video file at all.
  if (!wideEnough || !finePointer || reducedMotion || saveData || slowConnection) return;

  // The source clip is a 7.007s loop (confirmed from the file's mvhd box).
  // §17.7 first tried half speed (14s loop) but the reset was still
  // noticeable (§18.4); §33.3 reported 0.35x (~20s loop, matching the
  // math) still noticeable live, so slowed further to 0.28x (~25s loop) —
  // real margin over the ~20s target rather than landing right on it, at
  // zero extra page weight either way. load() resets playbackRate to its
  // default, so it has to be set after — 'loadedmetadata' is the earliest
  // point that's reliably true post-load.
  video.addEventListener('loadedmetadata', function () {
    video.playbackRate = 0.28;
  });
  video.addEventListener('canplay', function () {
    video.playbackRate = 0.28;
    video.classList.add('is-playing');
  });
  video.src = 'video/hero-forest.mp4';
  video.load();
  video.play().catch(function () {});
})();
