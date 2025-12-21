// Prevent context menu (long press) on the entire page
document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
}, { passive: false });

// Additional prevention for long-press selection behavior which can trigger menus
document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
        // Prevent multi-touch gestures if necessary, though mostly we care about long press
        // event.preventDefault(); 
    }
}, { passive: false });
