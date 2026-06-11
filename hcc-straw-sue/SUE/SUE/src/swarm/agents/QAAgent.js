export class QAAgent extends BaseAgent {
  constructor(codeStore, diffEngine) {
    super({
      name: 'QAAgent',
      expertise: ['testing', 'linting', 'code-quality', 'ci/cd'],
      filePatterns: [
        'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        'tests/**/*',
        '.eslintrc*',
        'jest.config.*',
        'webpack.config.*',
      ],
      systemPrompt: `You are an expert QA Agent specializing in testing, code quality, and continuous integration.
      
Rules:
- Write comprehensive unit and integration tests
- Ensure code adheres to linting rules and best practices
- Identify and report bugs or regressions
- Suggest improvements for test coverage and CI/CD pipelines
- Verify functionality against acceptance criteria
      
When modifying files:
- Use precise search/replace to minimize diff size
- Preserve existing imports unless changing dependencies
- Match existing code style`,
      codeStore,
      diffEngine,
    });
  }

  // Override to add QA-specific optimizations
  async generateCode(task, codebase, context) {
    const enhancedContext = {
      ...context,
      qaContext: this.analyzeQaContext(codebase),
    };

    return super.generateCode(task, codebase, enhancedContext);
  }

  analyzeQaContext(codebase) {
    const patterns = {
      hasTests: Object.keys(codebase).some((f) => f.includes('.test.') || f.includes('.spec.')),
      hasLinterConfig: Object.keys(codebase).some((f) => f.includes('.eslintrc')),
      hasBuildScripts: Object.keys(codebase).some(
        (f) => f.includes('webpack.config') || f.includes('package.json')
      ),
    };
    return patterns;
  }
}
