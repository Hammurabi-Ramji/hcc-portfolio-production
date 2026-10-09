export class Director {
  constructor() {
    this.systemPrompt = `You are the Director of a code generation swarm.
    Your job: Break down user requests into atomic, parallelizable tasks.
    
    Output JSON format:
    {
      "goal": "clear statement of what we're building",
      "techStack": {
        "frontend": "react|vue|vanilla|svelte",
        "styling": "tailwind|css|scss",
        "backend": "none|express|fastapi",
        "storage": "local|indexeddb|none"
      },
      "tasks": [
        {
          "id": "unique-id",
          "agent": "frontend|backend|styling|data|security|qa",
          "description": "what to build",
          "dependencies": ["other-task-ids"],
          "acceptanceCriteria": ["specific requirements"],
          "estimatedTokens": 1000
        }
      ],
      "sharedContracts": {
        "interfaces": {...},
        "apiEndpoints": [...],
        "dataSchemas": {...}
      }
    }`;
  }

  async decomposeGoal(userRequest, context = {}) {
    const startedAt = Date.now();
    // Analyze request with LLM
    const analysis = await this.callDirectorLLM(userRequest, context);

    // Validate and optimize task graph
    const optimized = this.optimizeTaskGraph(analysis.tasks);

    // Detect parallelizable groups
    const parallelGroups = this.findParallelGroups(optimized);

    return {
      goal: analysis.goal,
      techStack: analysis.techStack,
      taskGraph: optimized,
      parallelGroups,
      contracts: analysis.sharedContracts,
      estimatedTime: this.estimateCompletion(optimized),
      promptMeta: analysis._prompt || null,
      planningLatencyMs: Date.now() - startedAt,
      usage: analysis._usage || null,
    };
  }

  optimizeTaskGraph(tasks) {
    // Topological sort for dependencies
    const sorted = [];
    const visited = new Set();
    const temp = new Set();

    const visit = (task) => {
      if (temp.has(task.id)) throw new Error('Circular dependency detected');
      if (visited.has(task.id)) return;

      temp.add(task.id);

      // Visit dependencies first
      for (const depId of task.dependencies || []) {
        const dep = tasks.find((t) => t.id === depId);
        if (dep) visit(dep);
      }

      temp.delete(task.id);
      visited.add(task.id);
      sorted.push(task);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) visit(task);
    }

    return sorted;
  }

  findParallelGroups(tasks) {
    // Group tasks that can run simultaneously
    const groups = [];
    const remaining = new Set(tasks.map((t) => t.id));
    const completed = new Set();

    while (remaining.size > 0) {
      const group = [];

      for (const taskId of remaining) {
        const task = tasks.find((t) => t.id === taskId);
        const depsSatisfied = (task.dependencies || []).every((d) => completed.has(d));

        if (depsSatisfied) {
          group.push(task);
        }
      }

      if (group.length === 0) {
        throw new Error('Dependency resolution failed');
      }

      groups.push(group);
      group.forEach((t) => {
        remaining.delete(t.id);
        completed.add(t.id);
      });
    }

    return groups;
  }

  async callDirectorLLM(request, context) {
    const safeContext = this.sanitizeContext(context);
    const promptVariant = context?.promptLab?.render(
      'director',
      {
        request,
        context: JSON.stringify(safeContext),
      },
      {
        taskType: 'planning',
      }
    );
    const userPrompt =
      promptVariant?.user || `Request: ${request}\nContext: ${JSON.stringify(safeContext)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: promptVariant?.system || this.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Deterministic for planning
      }),
    });

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);
    const usage = result?.usage || {};
    parsed._usage = {
      model: 'gpt-4-turbo-preview',
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
    };

    if (promptVariant) {
      parsed._prompt = {
        template: promptVariant.template,
        variant: promptVariant.variant,
      };
    }

    return parsed;
  }

  sanitizeContext(context = {}) {
    return {
      constraints: context.constraints || [],
      techStack: context.techStack || {},
      contracts: context.contracts || {},
      enableApprovalGates: Boolean(context.enableApprovalGates),
      autoApproveCritical: Boolean(context.autoApproveCritical),
      mode: context.mode || 'default',
    };
  }

  estimateCompletion(tasks = []) {
    const tokens = tasks.reduce((sum, task) => sum + (task.estimatedTokens || 0), 0);
    const seconds = Math.max(5, Math.round(tokens / 120));
    return `${seconds}s`;
  }

  async getApiKey() {
    return 'YOUR_OPENAI_API_KEY';
  }
}
