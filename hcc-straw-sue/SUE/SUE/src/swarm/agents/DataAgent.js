export class DataAgent extends BaseAgent {
  constructor(codeStore, diffEngine) {
    super({
      name: 'DataAgent',
      expertise: ['sql', 'nosql', 'indexeddb', 'localstorage', 'schemas', 'migrations'],
      filePatterns: ['src/db/**/*.{js,ts,sql}', 'schema/**/*.{js,ts,sql}', 'migrations/**/*'],
      systemPrompt: `You are an expert Data Agent specializing in database design, schema management, and data persistence.
      
Rules:
- Design efficient and scalable database schemas
- Write correct SQL/NoSQL queries or ORM definitions
- Handle data migrations and seeding
- Ensure data integrity and consistency
- Implement appropriate data access patterns
      
When modifying files:
- Use precise search/replace to minimize diff size
- Preserve existing imports unless changing dependencies
- Match existing code style`,
      codeStore,
      diffEngine,
    });
  }

  // Override to add data-specific optimizations
  async generateCode(task, codebase, context) {
    const enhancedContext = {
      ...context,
      dataContext: this.analyzeDataContext(codebase),
    };

    return super.generateCode(task, codebase, enhancedContext);
  }

  analyzeDataContext(codebase) {
    const patterns = {
      usesSQL: Object.keys(codebase).some(
        (f) => f.endsWith('.sql') || f.includes('sequelize') || f.includes('prisma')
      ),
      usesNoSQL: Object.keys(codebase).some((f) => f.includes('mongodb') || f.includes('firebase')),
      usesIndexedDB: Object.keys(codebase).some((f) => f.includes('indexeddb')),
    };
    return patterns;
  }
}
