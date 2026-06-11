import { Director } from './orchestrator/Director.js';
import { Router } from './orchestrator/Router.js';
import { SyncManager } from './orchestrator/SyncManager.js';
import { ConflictResolver } from './orchestrator/ConflictResolver.js';
import { ApprovalGates } from './orchestrator/ApprovalGates.js';

import { FrontendAgent } from './agents/FrontendAgent.js';
import { BackendAgent } from './agents/BackendAgent.js';
import { StylingAgent } from './agents/StylingAgent.js';
import { DataAgent } from './agents/DataAgent.js';
import { SecurityAgent } from './agents/SecurityAgent.js';
import { QAAgent } from './agents/QAAgent.js';

import { CodeStore } from './codebase/CodeStore.js';
import { CodeIndex } from './codebase/CodeIndex.js';
import { VersionManager } from './codebase/VersionManager.js';
import { DiffEngine } from './codebase/DiffEngine.js';
import { DependencyManager } from './codebase/DependencyManager.js';
import { CodeRunner } from './execution/CodeRunner.js';
import { CostTracker } from './utils/CostTracker.js';
import { SemanticCache } from './utils/SemanticCache.js';
import { SwarmTracer } from './observability/SwarmTracer.js';
import { PromptLab } from './utils/PromptLab.js';

export class Swarm {
  constructor() {
    this.codeStore = new CodeStore();
    this.diffEngine = new DiffEngine();
    this.codeIndex = new CodeIndex(this.codeStore);
    this.versionManager = new VersionManager(this.codeStore);
    this.conflictResolver = new ConflictResolver(this.codeStore);
    this.approvalGates = new ApprovalGates();
    this.dependencyManager = new DependencyManager(this.codeStore);
    this.codeRunner = new CodeRunner(this.codeStore);
    this.costTracker = new CostTracker();
    this.semanticCache = new SemanticCache();
    this.promptLab = new PromptLab();
    this.tracer = new SwarmTracer();

    this.agents = new Map();
    this.agents.set('frontend', new FrontendAgent(this.codeStore, this.diffEngine));
    this.agents.set('backend', new BackendAgent(this.codeStore, this.diffEngine));
    this.agents.set('styling', new StylingAgent(this.codeStore, this.diffEngine));
    this.agents.set('data', new DataAgent(this.codeStore, this.diffEngine));
    this.agents.set('security', new SecurityAgent(this.codeStore, this.diffEngine));
    this.agents.set('qa', new QAAgent(this.codeStore, this.diffEngine));

    this.router = new Router(this.agents);
    this.syncManager = new SyncManager(this.codeStore, this.conflictResolver);
    this.director = new Director();

    // Subscribe agents to sync manager for codebase changes
    this.agents.forEach((agent) => this.syncManager.subscribe(agent));
  }

  async initialize() {
    await this.codeIndex.buildIndex();
    console.log('Swarm initialized.');
  }

  async run(userRequest, context = {}) {
    console.log(`[Swarm] User Request: ${userRequest}`);
    this.tracer.startTrace(userRequest);
    const runStartedAt = Date.now();

    const runtimeContext = this.createRuntimeContext(context);

    const plan = await this.director.decomposeGoal(userRequest, runtimeContext);
    console.log('[Swarm] Generated Plan:', plan);

    this.recordPlanPromptOutcome(plan);
    await this.snapshotBaseVersions();

    for (const taskGroup of plan.parallelGroups) {
      const results = await this.executeTaskGroup(taskGroup, runtimeContext, plan);
      console.log('[Swarm] Task Group Results:', results);
      await this.validateTaskGroupResults(results);
    }

    return {
      success: true,
      message: 'Swarm execution completed.',
      trace: this.tracer.exportTrace({
        runtimeMs: Date.now() - runStartedAt,
        totalCost: this.costTracker.getTotalCost(),
        costRecommendations: this.costTracker.getRecommendations(),
        promptStats: this.promptLab.getStats(),
      }),
    };
  }

  createRuntimeContext(context = {}) {
    return {
      ...context,
      promptLab: this.promptLab,
      costTracker: this.costTracker,
      semanticCache: this.semanticCache,
      tracer: this.tracer,
      syncManager: this.syncManager,
      conflictResolver: this.conflictResolver,
      approvalGates: this.approvalGates,
      dependencyManager: this.dependencyManager,
      codeRunner: this.codeRunner,
      enableApprovalGates: Boolean(context.enableApprovalGates),
      autoApproveCritical: Boolean(context.autoApproveCritical),
    };
  }

  recordPlanPromptOutcome(plan) {
    if (!plan?.promptMeta) {
      return;
    }

    this.promptLab.recordOutcome({
      template: plan.promptMeta.template,
      variant: plan.promptMeta.variant,
      success: true,
      latencyMs: plan.planningLatencyMs || 0,
      cost: 0,
      score: 1,
    });
  }

  async snapshotBaseVersions() {
    const files = await this.codeStore.listFiles();
    for (const file of files) {
      const content = await this.codeStore.readFile(file);
      if (typeof content === 'string') {
        this.codeStore.recordVersion(file, content, 'base');
      }
    }
  }

  async executeTaskGroup(taskGroup, runtimeContext, plan) {
    const groupSpan = this.tracer.startSpan('swarm.taskGroup', {
      tasks: taskGroup.map((task) => task.id),
    });

    const results = await Promise.all(
      taskGroup.map((task) =>
        this.router.dispatchTask(task, {
          ...runtimeContext,
          techStack: plan.techStack,
          contracts: plan.contracts,
        })
      )
    );

    this.tracer.endSpan(groupSpan, { results });
    return results;
  }

  async validateTaskGroupResults(results = []) {
    const touchedFiles = [...new Set(results.flatMap((item) => item.filesModified || []))];
    if (touchedFiles.length === 0) {
      return;
    }

    const validation = await this.codeRunner.runStaticValidation(touchedFiles);
    if (validation.success) {
      return;
    }

    console.warn('[Swarm] Static validation found issues:', validation.checks);
    for (const result of results) {
      if (result?.promptMeta) {
        this.promptLab.recordOutcome({
          template: result.promptMeta.template,
          variant: result.promptMeta.variant,
          success: false,
          latencyMs: 0,
          cost: 0,
          score: 0.25,
        });
      }
    }
  }

  getPromptLabReport() {
    const promptReport = this.promptLab.exportReport();
    return {
      ...promptReport,
      totalCost: this.costTracker.getTotalCost(),
      costRecommendations: this.costTracker.getRecommendations(),
    };
  }

  setPromptLabWeight(templateName, variantId, weight) {
    return this.promptLab.updateVariantWeight(templateName, variantId, weight);
  }

  // Expose core components for external interaction if needed
  getCoreComponents() {
    return {
      codeStore: this.codeStore,
      codeIndex: this.codeIndex,
      versionManager: this.versionManager,
      director: this.director,
      router: this.router,
      syncManager: this.syncManager,
      conflictResolver: this.conflictResolver,
      approvalGates: this.approvalGates,
      dependencyManager: this.dependencyManager,
      codeRunner: this.codeRunner,
      costTracker: this.costTracker,
      semanticCache: this.semanticCache,
      promptLab: this.promptLab,
      tracer: this.tracer,
      agents: this.agents,
    };
  }
}
