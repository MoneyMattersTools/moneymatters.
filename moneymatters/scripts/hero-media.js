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

  // The source clip is a ~7s loop — played back at half speed so the
  // repeat point (§17.7) is far less noticeable, at zero extra page weight.
  // load() resets playbackRate to its default, so it has to be set after —
  // 'loadedmetadata' is the earliest point that's reliably true post-load.
  video.addEventListener('loadedmetadata', function () {
    video.playbackRate = 0.5;
  });
  video.addEventListener('canplay', function () {
    video.playbackRate = 0.5;
    video.classList.add('is-playing');
  });
  video.src = 'video/hero-forest.mp4';
  video.load();
  video.play().catch(function () {});
})();
