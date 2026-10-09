export class BaseAgent {
  constructor(config) {
    this.name = config.name;
    this.expertise = config.expertise; // Array of tech areas
    this.filePatterns = config.filePatterns; // Glob patterns
    this.systemPrompt = config.systemPrompt;
    this.codeStore = config.codeStore;
    this.diffEngine = config.diffEngine;
  }

  async executeTask(task, context) {
    console.log(`🐝 ${this.name} executing: ${task.description}`);
    const traceSpan = context?.tracer?.startSpan('agent.executeTask', {
      agent: this.name,
      taskId: task.id,
    });
    const taskStartedAt = Date.now();

    try {
      // Read relevant code from shared store
      const relevantFiles = await this.findRelevantFiles(task);
      const codebase = await this.codeStore.readFiles(relevantFiles);

      // Generate code/modifications
      const result = await this.generateCode(task, codebase, context);

      // Apply changes using diff engine
      const patches = await this.diffEngine.createPatches(result.changes || []);

      await this.resolvePatchDependencies(patches, context);
      const approvedPatches = await this.reviewPatches(patches, context);
      await this.applyPatches(approvedPatches, context);
      const costEntry = this.trackUsageCost(result, task, context);

      // Notify other agents of changes
      await this.broadcastChanges(approvedPatches);

      this.recordPromptOutcome(result?._prompt, true, taskStartedAt, costEntry?.cost || 0, context);

      context?.tracer?.endSpan(traceSpan, {
        success: true,
        patches: approvedPatches.length,
      });

      return {
        success: true,
        agent: this.name,
        taskId: task.id,
        filesModified: approvedPatches.map((p) => p.file),
        summary: result.summary,
        promptMeta: result?._prompt || null,
        usage: result?._usage || null,
      };
    } catch (error) {
      context?.tracer?.endSpan(traceSpan, {
        success: false,
        error: String(error?.message || error),
      });
      this.recordPromptOutcome(null, false, taskStartedAt, 0, context);
      throw error;
    }
  }

  async resolvePatchDependencies(patches, context) {
    if (!context?.dependencyManager) {
      return;
    }

    for (const patch of patches) {
      if (typeof patch?.replace === 'string') {
        await context.dependencyManager.resolveImports(patch.replace);
      }
    }
  }

  async reviewPatches(patches, context) {
    if (!context?.approvalGates || !context?.enableApprovalGates) {
      return patches;
    }

    const review = await context.approvalGates.reviewChanges(patches, {
      autoApproveCritical: Boolean(context.autoApproveCritical),
    });
    if (review.blocked) {
      throw new Error(`Approval gate blocked ${review.deniedPatches.length} patch(es)`);
    }
    return review.approvedPatches;
  }

  async applyPatches(approvedPatches, context) {
    if (context?.syncManager && typeof context.syncManager.applyAgentPatches === 'function') {
      await context.syncManager.applyAgentPatches(this.name, approvedPatches);
      return;
    }
    await this.codeStore.applyPatches(approvedPatches);
  }

  trackUsageCost(result, task, context) {
    if (!result?._usage || !context?.costTracker) {
      return null;
    }

    return context.costTracker.trackRequest({
      model: result._usage.model,
      inputTokens: result._usage.inputTokens,
      outputTokens: result._usage.outputTokens,
      agent: this.name,
      metadata: {
        taskId: task.id,
        promptTemplate: result?._prompt?.template || null,
        promptVariant: result?._prompt?.variant || null,
      },
    });
  }

  recordPromptOutcome(promptMeta, success, taskStartedAt, cost, context) {
    if (!context?.promptLab || !promptMeta?.template || !promptMeta?.variant) {
      return;
    }

    context.promptLab.recordOutcome({
      template: promptMeta.template,
      variant: promptMeta.variant,
      success,
      latencyMs: Date.now() - taskStartedAt,
      cost,
      score: success ? 1 : 0,
    });
  }

  async findRelevantFiles(task) {
    // Search codebase for files this agent owns
    const allFiles = await this.codeStore.listFiles();
    return allFiles.filter((file) =>
      this.filePatterns.some((pattern) => this.matchPattern(file, pattern))
    );
  }

  matchPattern(file, pattern) {
    // Simple glob matching
    const regex = new RegExp(`^${pattern.replaceAll('*', '.*').replaceAll('?', '.')}$`);
    return regex.test(file);
  }

  async generateCode(task, codebase, context) {
    const promptEnvelope = this.buildPromptEnvelope(task, codebase, context);
    const prompt = `${promptEnvelope.systemPrompt}\n---\n${promptEnvelope.userContent}`;
    if (context?.semanticCache) {
      const cached = await context.semanticCache.get(prompt, {
        agent: this.name,
        taskType: task.task_type || task.type || 'unknown',
        promptVariant: promptEnvelope.promptMeta?.variant || 'default',
      });
      if (cached) {
        return cached;
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: promptEnvelope.systemPrompt },
          { role: 'user', content: promptEnvelope.userContent },
        ],
        response_format: { type: 'json_object' },
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
    parsed._prompt = promptEnvelope.promptMeta;

    if (context?.semanticCache) {
      await context.semanticCache.set(prompt, parsed, {
        agent: this.name,
        taskType: task.task_type || task.type || 'unknown',
        promptVariant: promptEnvelope.promptMeta?.variant || 'default',
      });
    }

    return parsed;
  }

  buildPrompt(task, codebase, context) {
    return this.buildPromptEnvelope(task, codebase, context).userContent;
  }

  buildPromptEnvelope(task, codebase, context) {
    const codebaseText = Object.entries(codebase)
      .map(
        ([file, content]) => `
=== ${file} ===
${String(content || '').substring(0, 5000)} // Truncated for token limit
`
      )
      .join('\n');

    const fallbackUserContent = `
TASK: ${task.description}
ACCEPTANCE CRITERIA: ${JSON.stringify(task.acceptanceCriteria)}
TECH STACK: ${JSON.stringify(context.techStack)}

CURRENT CODEBASE:
${codebaseText}

SHARED CONTRACTS:
${JSON.stringify(context.contracts, null, 2)}

Generate the necessary code changes. Output JSON:
{
  "changes": [
    {
      "file": "path/to/file",
      "operation": "create|modify|delete",
      "search": "text to find (for modify)",
      "replace": "new content",
      "explanation": "why this change"
    }
  ],
  "summary": "what was done",
  "nextSteps": ["suggested follow-up tasks"]
}`;

    const selected = context?.promptLab?.render(
      'agent',
      {
        task: task.description,
        criteria: JSON.stringify(task.acceptanceCriteria),
        techStack: JSON.stringify(context.techStack),
        codebase: codebaseText,
        contracts: JSON.stringify(context.contracts, null, 2),
      },
      {
        agent: this.name,
        taskType: task.task_type || task.type || 'unknown',
      }
    );

    return {
      systemPrompt: selected?.system || this.systemPrompt,
      userContent: selected?.user || fallbackUserContent,
      promptMeta: selected
        ? { template: selected.template, variant: selected.variant }
        : { template: 'agent', variant: 'legacy' },
    };
  }

  async broadcastChanges(patches) {
    // Notify orchestrator of changes
    await chrome.runtime.sendMessage({
      type: 'AGENT_COMPLETED',
      agent: this.name,
      patches,
    });
  }

  onCodebaseChange(_patches) {
    // Agents can override this hook when they need reactive behavior.
  }

  async getApiKey() {
    // Placeholder for API key retrieval
    // In a real extension, this would come from chrome.storage.sync or a secure config
    return 'YOUR_OPENAI_API_KEY';
  }
}
