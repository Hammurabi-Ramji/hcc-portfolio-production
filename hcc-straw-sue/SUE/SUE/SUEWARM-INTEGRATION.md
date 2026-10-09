# SUEWARM-Agent Integration for SUE

## Overview

This document describes the integration of the **SUEWARM-Agent** (Stateful Web Agent Runtime Module) architecture into the SUE browser extension. SUEWARM provides a sophisticated autonomy layer with ReAct pattern execution, hierarchical memory, and structured tool orchestration.

## Architecture Components

### 1. Core Agent (`suewarm-agent-core.js`)

The **SUEWARMAgentCore** class implements the ReAct (Thought-Action-Observation) loop:

- **State Machine**: `idle | planning | acting | waiting | error`
- **Planning**: Decomposes user intent into executable steps
- **Tool Selection**: Automatically selects appropriate tools for each step
- **Re-planning**: Adapts plan based on observations
- **Event Emission**: Broadcasts agent state and progress to the UI

#### Key Methods

- `run(userIntent, context)`: Main entry point for agent execution
- `_executePlanWithReAct(task, plan)`: Core ReAct loop implementation
- `_generatePlan(userIntent, context)`: Creates execution plan
- `_replan(userIntent, observations, context)`: Adapts plan on failure
- `getTaskInfo(taskId)`: Retrieve active task information
- `cancelTask(taskId)`: Stop running task

#### Usage Example

```javascript
const result = await suewarmAgent.run('Go to github.com and search for "react"', {
  tabId: 123
});

// Result includes:
// - success: boolean
// - data.taskId: unique task identifier
// - data.task.thoughts: agent reasoning steps
// - data.task.actions: executed tools
// - data.task.observations: results from each action
```

### 2. Memory Manager (`memory-manager.js`)

The **SUEMemoryManager** implements a three-tier memory hierarchy:

#### Working Memory (Session-Scoped)
- Volatile, in-memory storage (Map-based)
- Max 100 items per session
- Used for immediate context

#### Episodic Memory (Persistent)
- Stores session-aware events and actions
- Uses IndexedDB with fallback to `chrome.storage.local`
- Schema: `{ id, text, source, sessionId, url, actionTaken, result, embedding, timestamp }`
- Max 1000 items
- Supports full-text search with semantic similarity

#### Semantic Memory (Long-Term Patterns)
- Stores user preferences and learned patterns
- Persistent across sessions
- Types: `user_goals`, `site_patterns`, `failures`

#### Key Methods

- `addToWorkingMemory(key, value)`: Add session-scoped data
- `addEpisodic(entry)`: Record action/observation
- `searchEpisodic(query, options)`: Find related memories
- `addSemantic(key, value)`: Store long-term pattern
- `getSemantic(key)`: Retrieve pattern
- `recordUserGoal(goal)`: Track learned objectives
- `recordSitePattern(domain, pattern)`: Store domain-specific patterns
- `recordFailure(failureInfo)`: Log failure for avoidance
- `getMemoryStats()`: Get memory usage statistics

#### Usage Example

```javascript
// Add episodic memory
await sueMemoryManager.addEpisodic({
  text: 'Clicked login button on github.com',
  source: 'agent',
  sessionId: '123',
  url: 'https://github.com/login',
  actionTaken: 'clickElement',
  result: { success: true }
});

// Search episodic memory
const memories = await sueMemoryManager.searchEpisodic('github login', {
  sessionId: '123',
  limit: 5
});

// Record semantic pattern
await sueMemoryManager.recordSitePattern('github.com', {
  loginSelector: 'button[name="commit"]',
  searchSelector: '.header-search-input'
});
```

### 3. Enhanced Tool Registry (`suewarm-tool-registry.js`)

Extends the base **SUEToolRegistry** with SUEWARM-specific tools:

#### DOM Interaction Tools
- `capture_dom`: Extract structured page data (HTML, text, links, buttons, forms)
- `click`: Click element by selector
- `fillInput`: Fill form field
- `scroll_to_element`: Scroll element into view
- `wait_for_element`: Wait for element to appear
- `get_element_text`: Extract element text
- `get_element_attribute`: Get element attribute
- `is_element_visible`: Check visibility

#### Page Analysis Tools
- `get_page_title`: Get current page title and URL
- `get_page_metadata`: Extract meta tags (title, description, OG tags)
- `get_all_links`: Extract all links on page
- `get_all_buttons`: Extract all buttons
- `get_all_forms`: Extract all forms with inputs
- `screenshot`: Capture visible tab as PNG

#### Storage Tools
- `get_local_storage`: Retrieve localStorage
- `set_local_storage`: Set localStorage value
- `get_cookies`: Get cookies for domain
- `set_cookie`: Set cookie

#### Advanced Tools
- `memory_search`: Search agent memory
- `execute_javascript`: Execute custom JS on page
- `fetch`: External API calls

#### Tool Schema

Each tool follows a consistent schema:

```javascript
{
  name: "tool_name",
  description: "What the tool does",
  parameters: {
    param1: { type: "string", description: "..." },
    param2: { type: "number", description: "..." }
  },
  returns: "{ success, data/error }"
}
```

#### Usage Example

```javascript
// Execute a tool
const result = await sueToolRegistry.execute(
  'capture_dom',
  { selector: 'body' },
  { tabId: 123 }
);

// Returns: { success: true, data: { html, text, links, buttons, forms, images } }
```

### 4. Content Script Enhancements (`content.js`)

Added SUEWARM message handlers for structured DOM operations:

- `CAPTURE_DOM`: Extract structured page data
- `WAIT_FOR_ELEMENT`: Wait for element to appear
- `SCROLL_TO_ELEMENT`: Scroll element into view
- `GET_ELEMENT_TEXT`: Extract element text
- `GET_ELEMENT_ATTRIBUTE`: Get element attribute
- `IS_ELEMENT_VISIBLE`: Check element visibility
- `GET_PAGE_METADATA`: Extract page metadata
- `GET_LOCAL_STORAGE`: Retrieve localStorage
- `SET_LOCAL_STORAGE`: Set localStorage value
- `GET_ALL_LINKS`: Extract all links
- `GET_ALL_BUTTONS`: Extract all buttons
- `GET_ALL_FORMS`: Extract all forms

### 5. Background Service Worker Integration (`background.js`)

Integrated SUEWARM components into the background worker:

#### Initialization

```javascript
// Import SUEWARM modules
importScripts(
  './suewarm-tool-registry.js',
  './memory-manager.js',
  './suewarm-agent-core.js'
);

// Initialize instances
const sueToolRegistry = new globalThis.SUEWARMToolRegistry();
const sueMemoryManager = new globalThis.SUEMemoryManager();
const suewarmAgent = new globalThis.SUEWARMAgentCore({
  intentRouter: sueIntentRouter,
  toolRegistry: sueToolRegistry,
  vectorStore: sueVectorStore,
  security: sueSecurity,
  onEvent: (payload) => { /* emit to UI */ }
});

// Initialize on startup
await sueMemoryManager.initialize();
```

#### Message Handlers

New message types for SUEWARM operations:

- `SUEWARM_AGENT_RUN`: Execute agent with intent
- `SUEWARM_AGENT_CANCEL`: Cancel running task
- `SUEWARM_AGENT_STATUS`: Get task status
- `SUEWARM_AGENT_OBSERVATIONS`: Get recent observations
- `SUEWARM_MEMORY_ADD_EPISODIC`: Add episodic memory
- `SUEWARM_MEMORY_SEARCH_EPISODIC`: Search episodic memory
- `SUEWARM_MEMORY_ADD_SEMANTIC`: Add semantic memory
- `SUEWARM_MEMORY_GET_SEMANTIC`: Get semantic memory
- `SUEWARM_MEMORY_STATS`: Get memory statistics

## Message Protocol

### Running an Agent Task

```javascript
// From sidebar/UI to background
chrome.runtime.sendMessage({
  type: 'SUEWARM_AGENT_RUN',
  payload: {
    intent: 'Go to github.com and search for react'
  }
});

// Response
{
  success: true,
  data: {
    type: 'MULTI_STEP',
    taskId: 'task_1234567890_abc123',
    message: 'Task completed with 3 action(s).',
    task: {
      id: 'task_1234567890_abc123',
      userIntent: '...',
      state: 'completed',
      thoughts: [ /* reasoning steps */ ],
      actions: [ /* executed tools */ ],
      observations: [ /* results */ ],
      result: { success: true, actionCount: 3, observationCount: 3 }
    }
  }
}
```

### Agent Progress Events

The agent emits events via `onEvent` callback:

```javascript
// Event types
{
  type: 'PLAN_GENERATED',
  payload: { taskId, plan, stepCount }
}

{
  type: 'AGENT_THOUGHT',
  payload: { taskId, thought: { stepIndex, description, toolName, reasoning } }
}

{
  type: 'AGENT_ACTION',
  payload: { taskId, action: { toolName, params, result } }
}

{
  type: 'AGENT_OBSERVATION',
  payload: { taskId, observation: { success, data } }
}

{
  type: 'AGENT_REPLANNED',
  payload: { taskId, oldStepCount, newStepCount }
}

{
  type: 'STATE_CHANGED',
  payload: { oldState, newState }
}
```

### Memory Operations

```javascript
// Add episodic memory
chrome.runtime.sendMessage({
  type: 'SUEWARM_MEMORY_ADD_EPISODIC',
  entry: {
    text: 'User logged into github.com',
    source: 'agent',
    sessionId: '123',
    url: 'https://github.com',
    actionTaken: 'fillInput'
  }
});

// Search episodic memory
chrome.runtime.sendMessage({
  type: 'SUEWARM_MEMORY_SEARCH_EPISODIC',
  query: 'github login',
  options: { sessionId: '123', limit: 10 }
});

// Add semantic memory (pattern)
chrome.runtime.sendMessage({
  type: 'SUEWARM_MEMORY_ADD_SEMANTIC',
  key: 'site_patterns',
  value: {
    'github.com': {
      loginSelector: 'button[name="commit"]',
      searchSelector: '.header-search-input'
    }
  }
});
```

## UI Integration

The sidebar should display agent progress with the following components:

### Active Mode
- Progress indicator showing current step
- Real-time thought/action/observation stream
- Cancel/Pause buttons
- Estimated time remaining

### Chat Mode
- Message history with collapsible tool call details
- Context pills showing loaded memories
- Suggested actions based on page content

### Debug Mode
- Full ReAct chain visualization
- Memory retrieval traces
- Tool execution logs with timing

## Security Considerations

1. **Permission Model**: Uses `activeTab`, `scripting`, and `host_permissions`
2. **CSP**: Allows `wasm-unsafe-eval` for WASM runtime
3. **Data Leakage**: Implement privacy mode toggle before sending DOM to remote LLM
4. **Selector Validation**: All CSS selectors are sanitized before execution
5. **Rate Limiting**: Agent operations are rate-limited per tab/global scope

## Performance Optimization

1. **DOM Compression**: Summarize large DOM hierarchies before LLM processing
2. **Memory Compaction**: Automatic deduplication of episodic memory
3. **Embedding Caching**: Vector embeddings are cached with memories
4. **Lazy Loading**: Memory is loaded on-demand, not all at startup

## Testing

### Unit Tests

```javascript
// Test agent planning
const plan = await suewarmAgent._generatePlan('click button', {});
assert(plan.steps.length > 0);
assert(plan.steps[0].toolName === 'clickElement');

// Test memory operations
await sueMemoryManager.addEpisodic({ text: 'test', source: 'test' });
const results = await sueMemoryManager.searchEpisodic('test');
assert(results.length > 0);
```

### Integration Tests

```javascript
// Test full agent execution
const result = await suewarmAgent.run('navigate to github.com', { tabId: 123 });
assert(result.success === true);
assert(result.data.task.actions.length > 0);
```

## Troubleshooting & Maintenance

### Agent Not Responding
- **Service Worker Check**: Open `chrome://extensions`, find SUE, and click "service worker" to inspect logs.
- **Tool Availability**: Verify tools are registered by calling `sueToolRegistry.getAvailableTools()` in the background console.
- **Rate Limiting**: Check `sueSecurity.checkRateLimit()` if the agent suddenly stops processing intents.

### Memory Issues
- **IndexedDB Status**: Run `indexedDB.open('SUEMemoryDB')` in the console to check accessibility.
- **Storage Quota**: Use `chrome.storage.local.getBytesInUse()` to monitor usage.
- **Compaction**: SUEWARM automatically compacts episodic memory when it exceeds 1000 items. You can manually trigger this via `sueMemoryManager.compact()`.

### Tool Execution Failures
- **Content Script Injection**: Verify `content.js` is active by checking the page console for "SUE Content Script initialized".
- **Selector Validity**: Test selectors directly in the browser's element inspector before using them in agent intents.
- **Tab Permissions**: The agent cannot operate on restricted pages like `chrome://`, `edge://`, or the Chrome Web Store.

## Production Readiness Checklist

- [x] **ReAct Loop**: Validated with multi-step intent parsing and recovery.
- [x] **Hierarchical Memory**: Working, Episodic, and Semantic layers operational.
- [x] **Structured Tools**: 20+ specialized tools for DOM, storage, and analysis.
- [x] **Persistence**: Hybrid IndexedDB + Chrome Storage fallback implemented.
- [x] **Error Handling**: Centralized reporting and task cancellation wired.
- [x] **Verification**: All 29 automated checks passing in `check.js`.

## Future Enhancements

1. **Distributed Execution**: Support multi-tab coordination
2. **Advanced Planning**: LLM-based plan generation
3. **Skill Learning**: Agent learns new patterns from user feedback
4. **Persistent State**: Cross-session task resumption
5. **Collaborative Agents**: Multiple agents working on same task
6. **Custom Tools**: User-defined tool registration

## References

- SUEWARM-Agent Specification: See `pasted_content.txt`
- SUE Architecture: See `AGENT-SPEC.md`
- Chrome Extension API: https://developer.chrome.com/docs/extensions/
- ReAct Pattern: https://arxiv.org/abs/2210.03629
