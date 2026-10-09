// SUE — View Transitions Configuration
// Custom transition styles for smooth view morphing

/**
 * Configure view transition styles
 */
export function configureViewTransitionStyles() {
  if (!document.startViewTransition) return;

  // Apply smooth fade and scale transition
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

/**
 * Configure modal transition (for popups/dialogs)
 */
export function configureModalTransition() {
  if (!document.startViewTransition) return;

  document.documentElement.animate(
    {
      opacity: [1, 0],
      transform: ['scale(1)', 'scale(0.95)'],
    },
    {
      duration: 200,
      easing: 'ease-out',
      pseudoElement: '::view-transition-old(modal)',
    }
  );

  document.documentElement.animate(
    {
      opacity: [0, 1],
      transform: ['scale(0.95)', 'scale(1)'],
    },
    {
      duration: 200,
      easing: 'ease-out',
      pseudoElement: '::view-transition-new(modal)',
    }
  );
}
