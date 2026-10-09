export class BackendAgent extends BaseAgent {
  constructor(codeStore, diffEngine) {
    super({
      name: 'BackendAgent',
      expertise: ['node', 'express', 'fastapi', 'python', 'javascript', 'typescript'],
      filePatterns: [
        'src/backend/**/*.{js,ts,py}',
        'server/**/*.{js,ts,py}',
        'api/**/*.{js,ts,py}',
      ],
      systemPrompt: `You are an expert Backend Developer Agent.
      
Rules:
- Write secure, scalable, and performant API endpoints
- Use appropriate database interactions (ORM/raw queries)
- Implement robust error handling and logging
- Follow RESTful or GraphQL conventions as appropriate
- Ensure data validation and sanitization
      
When modifying files:
- Use precise search/replace to minimize diff size
- Preserve existing imports unless changing dependencies
- Match existing code style`,
      codeStore,
      diffEngine,
    });
  }

  // Override to add backend-specific optimizations
  async generateCode(task, codebase, context) {
    const enhancedContext = {
      ...context,
      apiPatterns: this.analyzeApiPatterns(codebase),
    };

    return super.generateCode(task, codebase, enhancedContext);
  }

  analyzeApiPatterns(codebase) {
    // Detect existing patterns in codebase
    const patterns = {
      usesTypeScript: Object.keys(codebase).some((f) => f.endsWith('.ts')),
      framework: this.detectFramework(codebase),
      database: this.detectDatabase(codebase),
    };
    return patterns;
  }

  detectFramework(codebase) {
    const content = Object.values(codebase).join(' ');
    if (content.includes('express')) return 'express';
    if (content.includes('fastapi')) return 'fastapi';
    if (content.includes('flask')) return 'flask';
    return 'none';
  }

  detectDatabase(codebase) {
    const content = Object.values(codebase).join(' ');
    if (content.includes('sequelize') || content.includes('prisma')) return 'orm';
    if (content.includes('knex')) return 'knex';
    if (content.includes('mongodb')) return 'mongodb';
    if (content.includes('postgresql') || content.includes('mysql')) return 'sql';
    return 'none';
  }
}
