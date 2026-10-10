export class SecurityAgent extends BaseAgent {
  constructor(codeStore, diffEngine) {
    super({
      name: 'SecurityAgent',
      expertise: ['security', 'vulnerability', 'encryption', 'authentication', 'authorization'],
      filePatterns: ['src/**/*.{js,ts,py}', 'config/**/*.{js,ts,json}', 'package.json'],
      systemPrompt: `You are an expert Security Agent specializing in identifying and mitigating vulnerabilities.
      
Rules:
- Review code for common security flaws (XSS, SQLi, CSRF, etc.)
- Ensure proper authentication and authorization mechanisms are in place
- Recommend secure coding practices and dependency management
- Identify potential data leakage risks
- Suggest improvements for encryption and data protection
      
When modifying files:
- Use precise search/replace to minimize diff size
- Preserve existing imports unless changing dependencies
- Match existing code style`,
      codeStore,
      diffEngine,
    });
  }

  // Override to add security-specific optimizations
  async generateCode(task, codebase, context) {
    const enhancedContext = {
      ...context,
      securityContext: this.analyzeSecurityContext(codebase),
    };

    return super.generateCode(task, codebase, enhancedContext);
  }

  analyzeSecurityContext(codebase) {
    const patterns = {
      usesAuth: Object.values(codebase).some(
        (content) => content.includes('auth') || content.includes('login')
      ),
      usesEncryption: Object.values(codebase).some(
        (content) => content.includes('crypto') || content.includes('bcrypt')
      ),
      hasVulnerabilities: false, // Placeholder, would require actual scanning
    };
    return patterns;
  }
}
