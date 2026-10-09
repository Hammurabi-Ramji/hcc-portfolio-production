// SUE — View Transitions Manager
// Smooth morphing between sidebar views using View Transitions API

// Check if View Transitions API is supported
function supportsViewTransitions() {
  return 'startViewTransition' in document;
}

// Navigate between views with smooth transition
function navigateWithTransition(updateCallback) {
  if (!supportsViewTransitions()) {
    updateCallback();
    return;
  }

  try {
    document
      .startViewTransition(function () {
        updateCallback();
      })
      .finished.then(function () {
        console.log('[SUE ViewTransitions] View transition completed');
      });
  } catch (err) {
    console.warn('[SUE ViewTransitions] Transition failed, using fallback:', err);
    updateCallback();
  }
}

// Configure view transition styles
function configureViewTransitionStyles() {
  if (!supportsViewTransitions()) return;

  // Apply default transition styles
  document.documentElement.animate(
    {
      opacity: [1, 0.7, 1],
      transform: ['scale(1)', 'scale(0.99)', 'scale(1)'],
    },
    {
      duration: 300,
      easing: 'ease-out',
      pseudoElement: '::view-transition-old(root)',
    }
  );

  document.documentElement.animate(
    {
      opacity: [0.7, 1],
      transform: ['scale(0.99)', 'scale(1)'],
    },
    {
      duration: 300,
      easing: 'ease-out',
      pseudoElement: '::view-transition-new(root)',
    }
  );
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.SUEViewTransitionsManager = {
    supportsViewTransitions: supportsViewTransitions,
    navigateWithTransition: navigateWithTransition,
    configureViewTransitionStyles: configureViewTransitionStyles,
  };
} else {
  self.SUEViewTransitionsManager = {
    supportsViewTransitions: supportsViewTransitions,
    navigateWithTransition: navigateWithTransition,
    configureViewTransitionStyles: configureViewTransitionStyles,
  };
}
