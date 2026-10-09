export class SwarmTracer {
  currentTrace = null;

  spans = [];

  startTrace(goal) {
    this.currentTrace = {
      id: `trace_${Date.now()}`,
      goal,
      startedAt: Date.now(),
    };
    this.spans = [];
    return this.currentTrace.id;
  }

  startSpan(name, attributes = {}) {
    const span = {
      id: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      attributes,
      start: performance.now(),
      events: [],
    };
    this.spans.push(span);
    return span;
  }

  addEvent(span, event) {
    if (!span) return;
    span.events.push({ timestamp: performance.now(), ...event });
  }

  endSpan(span, result = {}) {
    if (!span) return;
    span.end = performance.now();
    span.duration = span.end - span.start;
    span.result = result;
  }

  exportTrace(extra = {}) {
    if (!this.currentTrace) return null;
    return {
      ...this.currentTrace,
      completedAt: Date.now(),
      totalDurationMs: Date.now() - this.currentTrace.startedAt,
      spans: this.spans,
      ...extra,
    };
  }
}
