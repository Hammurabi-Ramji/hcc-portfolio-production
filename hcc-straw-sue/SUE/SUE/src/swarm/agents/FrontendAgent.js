export class FrontendAgent extends BaseAgent {
  constructor(codeStore, diffEngine) {
    super({
      name: 'FrontendAgent',
      expertise: ['react', 'vue', 'svelte', 'html', 'javascript', 'typescript', 'jsx', 'tsx'],
      filePatterns: ['src/**/*.{js,jsx,ts,tsx,vue,svelte}', '*.html', 'components/**/*'],
      systemPrompt: `You are an expert Frontend Developer Agent.
      
Rules:
- Write clean, modern React/Vue components
- Use functional components with hooks
- Follow file structure conventions
- Export components as default
- Include PropTypes/TypeScript interfaces
- Handle loading and error states
- Make components responsive
      
When modifying files:
- Use precise search/replace to minimize diff size
- Preserve existing imports unless changing dependencies
- Match existing code style`,
      codeStore,
      diffEngine,
    });
  }

  // Override to add React-specific optimizations
  async generateCode(task, codebase, context) {
    // Add React best practices to prompt
    const enhancedContext = {
      ...context,
      componentPatterns: this.analyzeComponentPatterns(codebase),
    };

    return super.generateCode(task, codebase, enhancedContext);
  }

  analyzeComponentPatterns(codebase) {
    // Detect existing patterns in codebase
    const patterns = {
      usesTypeScript: Object.keys(codebase).some((f) => f.endsWith('.tsx') || f.endsWith('.ts')),
      stylingApproach: this.detectStyling(codebase),
      stateManagement: this.detectStateManagement(codebase),
    };
    return patterns;
  }

  detectStyling(codebase) {
    const files = Object.keys(codebase).join(' ');
    if (files.includes('tailwind')) return 'tailwind';
    if (files.includes('.module.css')) return 'css-modules';
    if (files.includes('styled')) return 'styled-components';
    return 'css';
  }

  detectStateManagement(codebase) {
    const content = Object.values(codebase).join(' ');
    if (content.includes('useState') || content.includes('useReducer')) return 'hooks';
    if (content.includes('createContext')) return 'context';
    if (content.includes('Redux') || content.includes('useSelector')) return 'redux';
    return 'none';
  }
}
