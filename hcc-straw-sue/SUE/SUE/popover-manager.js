// SUE — Popover & Anchor Positioning Manager
// Native dropdowns and tooltips using CSS Popover API

// Check if Popover API is supported
function supportsPopover() {
  return 'showPopover' in HTMLElement.prototype;
}

// Show a popover element
function showPopover(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    if (supportsPopover()) {
      element.showPopover();
    } else {
      // Fallback: custom popover
      element.style.display = 'block';
      element.classList.add('popover-open');
    }
    console.log('[SUE Popover] Showing: ' + elementId);
  }
}

// Hide a popover element
function hidePopover(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    if (supportsPopover()) {
      element.hidePopover();
    } else {
      // Fallback
      element.style.display = 'none';
      element.classList.remove('popover-open');
    }
    console.log('[SUE Popover] Hiding: ' + elementId);
  }
}

// Toggle a popover element
function togglePopover(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    if (supportsPopover()) {
      element.showPopover();
    } else {
      // Fallback
      element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
    console.log('[SUE Popover] Toggled: ' + elementId);
  }
}

// Close all open popovers
function closeAllPopovers() {
  document.querySelectorAll('[popover]').forEach(function (el) {
    el.hidePopover();
  });
  console.log('[SUE Popover] All popovers closed');
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.SUEPopoverManager = {
    supportsPopover: supportsPopover,
    showPopover: showPopover,
    hidePopover: hidePopover,
    togglePopover: togglePopover,
    closeAllPopovers: closeAllPopovers,
  };
} else {
  self.SUEPopoverManager = {
    supportsPopover: supportsPopover,
    showPopover: showPopover,
    hidePopover: hidePopover,
    togglePopover: togglePopover,
    closeAllPopovers: closeAllPopovers,
  };
}
