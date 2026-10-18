'use strict';

class SUEAIAgent {
  constructor({ intentRouter, toolRegistry, vectorStore, security, onEvent }) {
    this.intentRouter = intentRouter;
    this.toolRegistry = toolRegistry;
    this.vectorStore = vectorStore;
    this.security = security;
    this.onEvent = typeof onEvent === 'function' ? onEvent : () => {};
    this.activeTasks = new Map();
  }

  async processQuery(payload = {}, sender = {}) {
    const text = String(payload.text || payload.query || '').trim();
    if (!text) {
      return { success: false, error: 'Query text is required' };
    }

    const tabId = payload.tabId || sender?.tab?.id || null;
    const context = await this.buildContext(text, tabId);
    const intent = this.intentRouter.classify(text, context);

    await this.vectorStore.addMemory({
      text,
      source: 'user',
      sessionId: String(tabId || 'global'),
    });

    if (intent.category === 'NAVIGATION') {
      return this._runNavigationIntent(text, tabId);
    }

    if (intent.category === 'DOM_MANIPULATION') {
      return this._runDomIntent(text, tabId);
    }

    if (intent.category === 'FILE_OPERATION') {
      return this._runFileIntent(text, tabId);
    }

    if (intent.category === 'RESEARCH') {
      return this._runResearchIntent(text, context);
    }

    if (intent.category === 'MULTI_STEP_TASK' || this._looksMultiStep(text)) {
      return this._runMultiStepIntent(text, tabId);
    }

    return {
      success: true,
      data: {
        type: 'CONVERSATION',
        intent,
        message:
          'SUE understood your request and is ready to act. Try commands like "go to github.com", "click button.submit", or "summarize this page".',
        context,
      },
    };
  }

  async buildContext(query, tabId) {
    let page = null;
    if (tabId) {
      try {
        const tab = await chrome.tabs.get(tabId);
        page = { title: tab.title || '', url: tab.url || '' };
      } catch {
        page = null;
      }
    }

    const memories = await this.vectorStore.search(query, { limit: 5 });
    return {
      tabId,
      page,
      memories,
      availableTools: this.toolRegistry.getAvailableTools(),
      timestamp: Date.now(),
    };
  }

  async _runNavigationIntent(text, tabId) {
    const target = text.replace(/^(go to|navigate to|open|visit)\s+/i, '').trim();
    const result = tabId
      ? await this.toolRegistry.execute('navigateCurrent', { url: target }, { tabId })
      : await this.toolRegistry.execute('navigate', { url: target });

    await this.vectorStore.addMemory({
      text: `Navigated to ${result.url}`,
      source: 'assistant',
      sessionId: String(tabId || 'global'),
    });

    return {
      success: true,
      data: {
        type: 'ACTION',
        message: `Navigated to ${result.url}`,
        action: 'navigate',
        result,
      },
    };
  }

  async _runDomIntent(text, tabId) {
    if (!tabId) {
      return { success: false, error: 'DOM actions require an active tab' };
    }

    if (/^click\s+/i.test(text)) {
      const selector = this.security.sanitizeSelector(text.replace(/^click\s+/i, '').trim());
      const result = await this.toolRegistry.execute('clickElement', { selector }, { tabId });
      return {
        success: true,
        data: {
          type: 'ACTION',
          message: `Clicked ${selector}`,
          action: 'clickElement',
          result,
        },
      };
    }

    if (/^(fill|type)\s+/i.test(text)) {
      const match = text.match(/^(?:fill|type)\s+(.+?)\s+(?:with|as)\s+(.+)$/i);
      if (!match) {
        return {
          success: false,
          error: 'Use format: fill <selector> with <value>',
        };
      }

      const selector = this.security.sanitizeSelector(match[1]);
      const value = match[2].trim();
      const result = await this.toolRegistry.execute('fillInput', { selector, value }, { tabId });
      return {
        success: true,
        data: {
          type: 'ACTION',
          message: `Filled ${selector}`,
          action: 'fillInput',
          result,
        },
      };
    }

    if (/^highlight\s+/i.test(text)) {
      const selector = this.security.sanitizeSelector(text.replace(/^highlight\s+/i, '').trim());
      const result = await this.toolRegistry.execute('highlightElement', { selector }, { tabId });
      return {
        success: true,
        data: {
          type: 'ACTION',
          message: `Highlighted ${selector}`,
          action: 'highlightElement',
          result,
        },
      };
    }

    return {
      success: true,
      data: {
        type: 'ACTION',
        message: 'DOM intent recognized. Supported commands: click, fill/type, highlight.',
      },
    };
  }

  async _runFileIntent(text, tabId) {
    if (/^download\s+/i.test(text)) {
      const url = text.replace(/^download\s+/i, '').trim();
      const result = await this.toolRegistry.execute('downloadFile', { url }, { tabId });
      return {
        success: true,
        data: {
          type: 'ACTION',
          message: `Started download for ${url}`,
          action: 'downloadFile',
          result,
        },
      };
    }

    return {
      success: true,
      data: {
        type: 'ACTION',
        message: 'File intent recognized. Supported command: download <url>.',
      },
    };
  }

  async _runResearchIntent(text, context) {
    const snippets = context.memories
      .map((entry) => `- ${entry.text.slice(0, 160)}`)
      .slice(0, 5)
      .join('\n');

    return {
      success: true,
      data: {
        type: 'RESEARCH',
        message: snippets
          ? `I found related local memories:\n${snippets}`
          : 'No related local memories found yet. Keep using SUE and I will build context over time.',
        query: text,
      },
    };
  }

  _looksMultiStep(text) {
    return /\bthen\b|\band then\b|\bafter that\b/i.test(text);
  }

  _parseSteps(text) {
    const normalized = String(text || '')
      .replace(/\s+/g, ' ')
      .trim();
    const parts = normalized
      .split(/\s+(?:and then|then|after that)\s+/i)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length > 0) return parts;
    return [normalized];
  }

  async _runMultiStepIntent(text, tabId) {
    const steps = this._parseSteps(text);
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const task = {
      id: taskId,
      status: 'running',
      createdAt: Date.now(),
      steps: steps.map((description, index) => ({
        index,
        description,
        completed: false,
      })),
    };
    this.activeTasks.set(taskId, task);

    for (let index = 0; index < task.steps.length; index += 1) {
      const step = task.steps[index];
      this.onEvent({
        type: 'TASK_PROGRESS',
        taskId,
        step: index + 1,
        total: task.steps.length,
        description: step.description,
      });

      try {
        const stepResult = await this._executeStep(step.description, tabId);
        step.completed = true;
        step.result = stepResult;
      } catch (error) {
        step.completed = false;
        step.error = String(error?.message || error);
        task.status = 'failed';
        this.activeTasks.delete(taskId);
        return {
          success: false,
          error: `Step ${index + 1} failed: ${step.error}`,
          data: { type: 'MULTI_STEP', task },
        };
      }
    }

    task.status = 'completed';
    this.activeTasks.delete(taskId);
    return {
      success: true,
      data: {
        type: 'MULTI_STEP',
        message: `Completed ${task.steps.length} step${task.steps.length === 1 ? '' : 's'}.`,
        task,
      },
    };
  }

  async _executeStep(description, tabId) {
    const text = String(description || '').trim();
    if (!text) return { skipped: true };

    if (/^(go to|navigate to|open|visit)\s+/i.test(text)) {
      return this._runNavigationIntent(text, tabId);
    }

    if (/^(click|fill|type|highlight)\s+/i.test(text)) {
      return this._runDomIntent(text, tabId);
    }

    if (/^download\s+/i.test(text)) {
      return this._runFileIntent(text, tabId);
    }

    return {
      success: true,
      data: {
        type: 'STEP_NOTE',
        message: `No executable action for step: ${text}`,
      },
    };
  }
}

globalThis.SUEAIAgent = SUEAIAgent;
