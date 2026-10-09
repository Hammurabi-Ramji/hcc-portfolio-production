// SUE — View Transitions Manager (Enhanced)
// Complete view transition system with morphing and styling

/**
 * Configure view transition styles
 */
export function configureViewTransitions() {
  if (!document.startViewTransition) {
    console.warn('[HCC ViewTransitions] View Transitions API not supported');
    return false;
  }

  // Apply custom transition effects
  document.documentElement.animate(
    {
      opacity: [1, 0.8, 1],
      transform: ['scale(1)', 'scale(0.98)', 'scale(1)'],
    },
    {
      duration: 300,
      easing: 'ease-out',
      pseudoElement: '::view-transition-old(root)',
    }
  );

  document.documentElement.animate(
    {
      opacity: [0.8, 1],
      transform: ['scale(0.98)', 'scale(1)'],
    },
    {
      duration: 300,
      easing: 'ease-out',
      pseudoElement: '::view-transition-new(root)',
    }
  );

  return true;
}

/**
 * Navigate between views with transition
 * @param {Function} updateCallback
 * @param {string} transitionType - 'fade', 'slide', 'zoom'
 */
export async function navigateWithTransition(updateCallback, transitionType = 'fade') {
  if (!document.startViewTransition) {
    updateCallback();
    return;
  }

  await document.startViewTransition(async () => {
    updateCallback();

    // Apply transition-specific animation
    switch (transitionType) {
      case 'slide':
        applySlideTransition();
        break;
      case 'zoom':
        applyZoomTransition();
        break;
      default:
        applyFadeTransition();
    }
  }).finished;
}

/**
 * Apply fade transition
 */
function applyFadeTransition() {
  document.documentElement.animate(
    { opacity: [1, 0.5, 1] },
    {
      duration: 300,
      easing: 'ease-in-out',
      pseudoElement: '::view-transition-old(root)',
    }
  );
  document.documentElement.animate(
    { opacity: [0.5, 1] },
    {
      duration: 300,
      easing: 'ease-in-out',
      pseudoElement: '::view-transition-new(root)',
    }
  );
}

/**
 * Apply slide transition (from right)
 */
function applySlideTransition() {
  document.documentElement.animate(
    { transform: ['translateX(0)', 'translateX(50px)'] },
    {
      duration: 300,
      easing: 'ease-out',
      pseudoElement: '::view-transition-old(root)',
    }
  );
  document.documentElement.animate(
    { transform: ['translateX(-50px)', 'translateX(0)'] },
    {
      duration: 300,
      easing: 'ease-out',
      pseudoElement: '::view-transition-new(root)',
    }
  );
}

/**
 * Apply zoom transition
 */
function applyZoomTransition() {
  document.documentElement.animate(
    { transform: ['scale(1)', 'scale(1.2)'] },
    {
      duration: 300,
      easing: 'ease-out',
      pseudoElement: '::view-transition-old(root)',
    }
  );
  document.documentElement.animate(
    { transform: ['scale(0.8)', 'scale(1)'] },
    {
      duration: 300,
      easing: 'ease-out',
      pseudoElement: '::view-transition-new(root)',
    }
  );
}

/**
 * Get transition support status
 * @returns {Object}
 */
export function getTransitionSupport() {
  return {
    supported: 'startViewTransition' in document,
    canAnimate: CSS.supports('animation-timeline', 'view-transition()'),
  };
}
