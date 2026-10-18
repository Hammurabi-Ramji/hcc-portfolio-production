export class StylingAgent extends BaseAgent {
  constructor(codeStore, diffEngine) {
    super({
      name: 'StylingAgent',
      expertise: ['css', 'scss', 'tailwind', 'styled-components', 'emotion'],
      filePatterns: ['src/**/*.{css,scss}', 'tailwind.config.*', 'styles/**/*'],
      systemPrompt: `You are a Styling Agent specializing in CSS and design systems.
      
Rules:
- Use CSS custom properties for theming
- Follow mobile-first responsive design
- Ensure accessibility (contrast, focus states)
- Optimize for performance (minimal CSS, efficient selectors)
- Use existing design tokens or create new ones as needed
      
When modifying files:
- Use precise search/replace to minimize diff size
- Preserve existing imports unless changing dependencies
- Match existing code style`,
      codeStore,
      diffEngine,
    });
  }

  // Override to add styling-specific optimizations
  async generateCode(task, codebase, context) {
    const enhancedContext = {
      ...context,
      stylingContext: this.analyzeStylingContext(codebase),
    };

    return super.generateCode(task, codebase, enhancedContext);
  }

  analyzeStylingContext(codebase) {
    const patterns = {
      usesTailwind: Object.keys(codebase).some((f) => f.includes('tailwind.config')),
      usesSass: Object.keys(codebase).some((f) => f.endsWith('.scss')),
      usesCssModules: Object.keys(codebase).some((f) => f.includes('.module.css')),
    };
    return patterns;
  }
}
