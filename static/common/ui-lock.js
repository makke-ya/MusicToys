// Prevent context menu (long press) on the entire page
document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
}, { passive: false });

// Prevent multi-touch gestures and pinch-to-zoom
document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Also prevent multi-touch move (pinch)
document.addEventListener('touchmove', function (event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Prevent double-tap zoom (alternative to CSS touch-action if needed, but touch-action is better)
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);