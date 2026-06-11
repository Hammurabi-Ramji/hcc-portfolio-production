'use strict';

/**
 * SUEWARM-Agent Core: Stateful Web Agent Runtime Module
 * Implements the ReAct pattern (Thought-Action-Observation)
 * with state management and autonomous planning.
 */

class SUEWARMAgentCore {
  constructor({ intentRouter, toolRegistry, vectorStore, security, onEvent }) {
    this.intentRouter = intentRouter;
    this.toolRegistry = toolRegistry;
    this.vectorStore = vectorStore;
    this.security = security;
    this.onEvent = typeof onEvent === 'function' ? onEvent : () => {};

    // State machine
    this.state = 'idle'; // idle | planning | acting | waiting | error
    this.activeTasks = new Map();
    this.maxPlanDepth = 10;
    this.observationBuffer = [];
    this.maxObservations = 50;
  }

  /**
   * Main entry point: Process user intent with full ReAct loop
   */
  async run(userIntent, context = {}) {
    if (this.state !== 'idle') {
      return {
        success: false,
        error: `Agent is busy. Current state: ${this.state}`,
      };
    }

    const taskId = this._generateTaskId();
    const task = {
      id: taskId,
      userIntent,
      createdAt: Date.now(),
      state: 'planning',
      thoughts: [],
      actions: [],
      observations: [],
      result: null,
      error: null,
    };

    this.activeTasks.set(taskId, task);
    this._setState('planning');

    try {
      // 1. Retrieve relevant context from memory
      const retrievedContext = await this._retrieveContext(userIntent);
      task.context = retrievedContext;

      // 2. Generate initial plan
      const plan = await this._generatePlan(userIntent, retrievedContext);
      task.plan = plan;

      this._emitEvent('PLAN_GENERATED', {
        taskId,
        plan,
        stepCount: plan.steps.length,
      });

      // 3. Execute plan with ReAct loop
      const result = await this._executePlanWithReAct(task, plan);
      task.result = result;
      task.state = 'completed';

      // 4. Store final observation
      await this.vectorStore.addMemory({
        text: `Task completed: ${userIntent}. Result: ${JSON.stringify(result).slice(0, 500)}`,
        source: 'agent',
        sessionId: context.tabId ? String(context.tabId) : 'global',
      });

      this._setState('idle');
      this.activeTasks.delete(taskId);

      return {
        success: true,
        data: {
          type: 'MULTI_STEP',
          taskId,
          message: `Task completed with ${task.actions.length} action(s).`,
          task,
        },
      };
    } catch (error) {
      task.error = String(error?.message || error);
      task.state = 'failed';
      this._setState('error');

      this._emitEvent('TASK_FAILED', {
        taskId,
        error: task.error,
      });

      this.activeTasks.delete(taskId);

      return {
        success: false,
        error: task.error,
        data: { type: 'MULTI_STEP', task },
      };
    }
  }

  /**
   * Execute plan with ReAct loop: Thought → Action → Observation → Re-plan
   */
  async _executePlanWithReAct(task, plan) {
    let depth = 0;

    for (const step of plan.steps) {
      if (depth >= this.maxPlanDepth) {
        throw new Error('Max plan depth exceeded');
      }

      depth += 1;
      this._setState('acting');

      // Thought: Analyze current step
      const thought = {
        stepIndex: task.actions.length,
        description: step.description,
        toolName: step.toolName,
        reasoning: step.reasoning || 'Execute planned action',
        timestamp: Date.now(),
      };

      task.thoughts.push(thought);

      this._emitEvent('AGENT_THOUGHT', {
        taskId: task.id,
        thought,
      });

      try {
        // Action: Execute tool
        const actionResult = await this._executeTool(step, task.context);
        const action = {
          stepIndex: task.actions.length,
          toolName: step.toolName,
          params: step.params,
          result: actionResult,
          timestamp: Date.now(),
        };

        task.actions.push(action);

        this._emitEvent('AGENT_ACTION', {
          taskId: task.id,
          action,
        });

        // Observation: Analyze result
        const observation = {
          stepIndex: task.observations.length,
          actionIndex: task.actions.length - 1,
          success: actionResult.success !== false,
          data: actionResult,
          timestamp: Date.now(),
        };

        task.observations.push(observation);
        this._addObservation(observation);

        this._emitEvent('AGENT_OBSERVATION', {
          taskId: task.id,
          observation,
        });

        // Re-plan if needed
        if (this._shouldReplan(observation, plan)) {
          const newPlan = await this._replan(task.userIntent, task.observations, task.context);

          this._emitEvent('AGENT_REPLANNED', {
            taskId: task.id,
            oldStepCount: plan.steps.length,
            newStepCount: newPlan.steps.length,
          });

          plan = newPlan;
        }
      } catch (error) {
        const failedAction = {
          stepIndex: task.actions.length,
          toolName: step.toolName,
          params: step.params,
          error: String(error?.message || error),
          timestamp: Date.now(),
        };

        task.actions.push(failedAction);

        this._emitEvent('AGENT_ACTION_FAILED', {
          taskId: task.id,
          action: failedAction,
        });

        throw error;
      }
    }

    this._setState('idle');
    return {
      success: true,
      actionCount: task.actions.length,
      observationCount: task.observations.length,
    };
  }

  /**
   * Retrieve relevant context from memory
   */
  async _retrieveContext(userIntent) {
    const memories = await this.vectorStore.search(userIntent, { limit: 5 });
    return {
      userIntent,
      memories,
      availableTools: this.toolRegistry.getAvailableTools(),
      timestamp: Date.now(),
    };
  }

  /**
   * Generate initial plan from user intent
   */
  async _generatePlan(userIntent, _context) {
    // Parse intent into steps
    const steps = this._parseIntentIntoSteps(userIntent);

    // Enrich each step with tool selection
    const enrichedSteps = steps.map((description, index) => {
      const toolName = this._selectToolForStep(description);
      const params = this._extractParamsForTool(description, toolName);

      return {
        index,
        description,
        toolName,
        params,
        reasoning: `Step ${index + 1}: ${description}`,
      };
    });

    return {
      userIntent,
      steps: enrichedSteps,
      createdAt: Date.now(),
    };
  }

  /**
   * Re-plan based on observations
   */
  async _replan(userIntent, observations, _context) {
    const lastObservation = observations[observations.length - 1];

    if (!lastObservation || lastObservation.success) {
      // Continue with original plan
      return { steps: [] };
    }

    // If last action failed, generate recovery steps
    const recoverySteps = [
      {
        index: 0,
        description: 'Assess current page state',
        toolName: 'capture_dom',
        params: { selector: 'body' },
        reasoning: 'Understand what changed after failure',
      },
    ];

    return {
      userIntent: `${userIntent} (recovery after failure)`,
      steps: recoverySteps,
      createdAt: Date.now(),
    };
  }

  /**
   * Execute a single tool
   */
  async _executeTool(step, context) {
    this._setState('acting');

    try {
      const result = await this.toolRegistry.execute(step.toolName, step.params || {}, context);

      return {
        success: true,
        tool: step.toolName,
        result,
      };
    } catch (error) {
      return {
        success: false,
        tool: step.toolName,
        error: String(error?.message || error),
      };
    }
  }

  /**
   * Determine if re-planning is needed
   */
  _shouldReplan(observation, _plan) {
    // Re-plan if action failed
    if (!observation.success) {
      return true;
    }

    // Re-plan if observation suggests deviation from plan
    const data = observation.data || {};
    if (data.error || data.warning) {
      return true;
    }

    return false;
  }

  /**
   * Parse user intent into steps
   */
  _parseIntentIntoSteps(intent) {
    const normalized = String(intent || '')
      .replace(/\s+/g, ' ')
      .trim();

    // Split on common conjunctions
    const parts = normalized
      .split(/\s+(?:and then|then|after that|next,?)\s+/i)
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.length > 0 ? parts : [normalized];
  }

  /**
   * Select appropriate tool for a step
   */
  _selectToolForStep(description) {
    const text = String(description || '').toLowerCase();

    if (/^(go to|navigate to|open|visit)\s+/i.test(text)) {
      return 'navigate';
    }
    if (/^click\s+/i.test(text)) {
      return 'clickElement';
    }
    if (/^(fill|type)\s+/i.test(text)) {
      return 'fillInput';
    }
    if (/^download\s+/i.test(text)) {
      return 'downloadFile';
    }
    if (/^(extract|capture|read|get)\s+/i.test(text)) {
      return 'capture_dom';
    }
    if (/^(screenshot|capture screen)\s+/i.test(text)) {
      return 'screenshot';
    }
    if (/^(search|query|find)\s+/i.test(text)) {
      return 'memory_search';
    }

    return 'capture_dom'; // Default fallback
  }

  /**
   * Extract parameters for a tool from step description
   */
  _extractParamsForTool(description, toolName) {
    const text = String(description || '').trim();

    switch (toolName) {
      case 'navigate': {
        const match = text.match(/(?:go to|navigate to|open|visit)\s+(.+)/i);
        return { url: match ? match[1].trim() : text };
      }

      case 'clickElement': {
        const match = text.match(/^click\s+(.+)/i);
        return { selector: match ? match[1].trim() : text };
      }

      case 'fillInput': {
        const match = text.match(/^(?:fill|type)\s+(.+?)\s+(?:with|as)\s+(.+)$/i);
        return {
          selector: match ? match[1].trim() : 'input',
          value: match ? match[2].trim() : text,
        };
      }

      case 'downloadFile': {
        const match = text.match(/^download\s+(.+)/i);
        return { url: match ? match[1].trim() : text };
      }

      case 'capture_dom': {
        return { selector: 'body' };
      }

      case 'screenshot': {
        return {};
      }

      case 'memory_search': {
        const match = text.match(/(?:search|query|find)\s+(.+)/i);
        return { query: match ? match[1].trim() : text };
      }

      default:
        return {};
    }
  }

  /**
   * Add observation to buffer
   */
  _addObservation(observation) {
    this.observationBuffer.unshift(observation);
    if (this.observationBuffer.length > this.maxObservations) {
      this.observationBuffer.pop();
    }
  }

  /**
   * Get recent observations
   */
  getRecentObservations(limit = 10) {
    return this.observationBuffer.slice(0, limit);
  }

  /**
   * State management
   */
  _setState(newState) {
    const oldState = this.state;
    this.state = newState;

    if (oldState !== newState) {
      this._emitEvent('STATE_CHANGED', {
        oldState,
        newState,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Event emission
   */
  _emitEvent(type, payload) {
    this.onEvent({
      type,
      payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Generate unique task ID
   */
  _generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Get active task info
   */
  getTaskInfo(taskId) {
    return this.activeTasks.get(taskId) || null;
  }

  /**
   * Get all active tasks
   */
  getAllActiveTasks() {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.state = 'cancelled';
      task.error = 'Task cancelled by user';
      this._emitEvent('TASK_CANCELLED', { taskId });
      this.activeTasks.delete(taskId);
      if (this.state !== 'idle' && this.activeTasks.size === 0) {
        this._setState('idle');
      }
      return true;
    }
    return false;
  }

  /**
   * Enhanced error reporting with context
   */
  _reportError(taskId, message, originalError) {
    const errorDetail = {
      message,
      originalError: String(originalError?.message || originalError),
      stack: originalError?.stack,
      timestamp: Date.now(),
    };

    this._emitEvent('ERROR_REPORTED', { taskId, error: errorDetail });
    console.error(`[SUEWARM Agent] Error in task ${taskId}:`, message, originalError);
    return errorDetail;
  }
}

globalThis.SUEWARMAgentCore = SUEWARMAgentCore;
