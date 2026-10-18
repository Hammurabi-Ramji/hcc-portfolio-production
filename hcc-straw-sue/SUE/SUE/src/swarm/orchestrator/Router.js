export class Router {
  constructor(agents) {
    this.agents = agents; // Map of agentName -> agentInstance
  }

  async dispatchTask(task, context) {
    const agent = this.agents.get(task.agent);
    if (!agent) {
      throw new Error(`Agent ${task.agent} not found`);
    }
    return agent.executeTask(task, context);
  }

  getAgent(agentName) {
    return this.agents.get(agentName);
  }
}
