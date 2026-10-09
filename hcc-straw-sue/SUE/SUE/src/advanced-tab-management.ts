/**
 * Advanced Tab Management System
 * Tab grouping, session snapshots, search, recommendations, history, and organization
 */

export interface TabInfo {
  id: number;
  title: string;
  url: string;
  active: boolean;
  pinned: boolean;
  faviconUrl?: string;
  lastAccessed?: number;
  group?: string;
  tags?: string[];
}

export interface TabGroup {
  id: string;
  name: string;
  color?: string;
  tabs: TabInfo[];
  createdAt: number;
  updatedAt: number;
}

export interface TabSession {
  id: string;
  name: string;
  timestamp: number;
  tabs: TabInfo[];
  description?: string;
  archived?: boolean;
}

export interface TabHistoryEntry {
  tabId: number;
  title: string;
  url: string;
  timestamp: number;
  action: 'opened' | 'closed' | 'focused' | 'updated';
}

export interface TabRecommendation {
  tabId: number;
  title: string;
  url: string;
  score: number;
  reason: string;
}

/**
 * AdvancedTabManager handles tab grouping, sessions, search, and recommendations
 */
export class AdvancedTabManager {
  private tabGroups: Map<string, TabGroup> = new Map();
  private tabSessions: Map<string, TabSession> = new Map();
  private tabHistory: TabHistoryEntry[] = [];
  private tabArchive: TabInfo[] = [];
  private currentTabs: Map<number, TabInfo> = new Map();
  private maxHistorySize: number = 10000;

  constructor() {
    this.initializeDefaultGroups();
  }

  /**
   * Initialize default tab groups
   */
  private initializeDefaultGroups(): void {
    const defaultGroups = [
      { id: 'work', name: 'Work', color: '#3498db' },
      { id: 'personal', name: 'Personal', color: '#2ecc71' },
      { id: 'research', name: 'Research', color: '#e74c3c' },
      { id: 'entertainment', name: 'Entertainment', color: '#f39c12' },
    ];

    for (const group of defaultGroups) {
      this.tabGroups.set(group.id, {
        ...group,
        tabs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  /**
   * Create a new tab group
   */
  public createTabGroup(name: string, color?: string): TabGroup {
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const group: TabGroup = {
      id,
      name,
      color,
      tabs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tabGroups.set(id, group);
    return group;
  }

  /**
   * Add tab to group
   */
  public addTabToGroup(tabId: number, groupId: string, tab: TabInfo): void {
    const group = this.tabGroups.get(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    // Remove from other groups
    for (const [, otherGroup] of this.tabGroups) {
      otherGroup.tabs = otherGroup.tabs.filter((t) => t.id !== tabId);
    }

    // Add to new group
    const updatedTab = { ...tab, group: groupId };
    group.tabs.push(updatedTab);
    this.currentTabs.set(tabId, updatedTab);
    group.updatedAt = Date.now();
  }

  /**
   * Remove tab from group
   */
  public removeTabFromGroup(tabId: number): void {
    const tab = this.currentTabs.get(tabId);
    if (!tab || !tab.group) {
      return;
    }

    const group = this.tabGroups.get(tab.group);
    if (group) {
      group.tabs = group.tabs.filter((t) => t.id !== tabId);
      group.updatedAt = Date.now();
    }

    const updatedTab = { ...tab, group: undefined };
    this.currentTabs.set(tabId, updatedTab);
  }

  /**
   * Get all tab groups
   */
  public getTabGroups(): TabGroup[] {
    return Array.from(this.tabGroups.values());
  }

  /**
   * Get tabs in a group
   */
  public getGroupTabs(groupId: string): TabInfo[] {
    const group = this.tabGroups.get(groupId);
    return group ? group.tabs : [];
  }

  /**
   * Create a session snapshot of current tabs
   */
  public createSession(name: string, tabs: TabInfo[], description?: string): TabSession {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: TabSession = {
      id,
      name,
      timestamp: Date.now(),
      tabs: JSON.parse(JSON.stringify(tabs)), // Deep copy
      description,
      archived: false,
    };

    this.tabSessions.set(id, session);
    return session;
  }

  /**
   * Restore a session
   */
  public async restoreSession(sessionId: string): Promise<TabInfo[]> {
    const session = this.tabSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // In a real implementation, this would open tabs in the browser
    // For now, we return the tabs that would be opened
    return session.tabs;
  }

  /**
   * List all sessions
   */
  public listSessions(): TabSession[] {
    return Array.from(this.tabSessions.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete a session
   */
  public deleteSession(sessionId: string): boolean {
    return this.tabSessions.delete(sessionId);
  }

  /**
   * Archive a session
   */
  public archiveSession(sessionId: string): boolean {
    const session = this.tabSessions.get(sessionId);
    if (session) {
      session.archived = true;
      return true;
    }
    return false;
  }

  /**
   * Search tabs with fuzzy matching
   */
  public searchTabs(query: string): TabInfo[] {
    const lowerQuery = query.toLowerCase();
    const allTabs = Array.from(this.currentTabs.values());

    return allTabs.filter(
      (tab) =>
        tab.title.toLowerCase().includes(lowerQuery) ||
        tab.url.toLowerCase().includes(lowerQuery) ||
        tab.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get smart tab recommendations based on context
   */
  public getTabRecommendations(contextUrl?: string): TabRecommendation[] {
    const allTabs = Array.from(this.currentTabs.values());
    const recommendations: TabRecommendation[] = [];

    for (const tab of allTabs) {
      let score = 0;
      let reason = '';

      // Score based on recency
      if (tab.lastAccessed) {
        const timeSinceAccess = Date.now() - tab.lastAccessed;
        const recencyScore = Math.max(0, 100 - timeSinceAccess / (1000 * 60 * 60)); // Decay over hours
        score += recencyScore * 0.3;
      }

      // Score based on context similarity
      if (contextUrl) {
        const contextDomain = new URL(contextUrl).hostname;
        const tabDomain = new URL(tab.url).hostname;
        if (contextDomain === tabDomain) {
          score += 50;
          reason = 'Same domain as current context';
        }
      }

      // Score based on pinned status
      if (tab.pinned) {
        score += 20;
      }

      // Score based on group relevance
      if (tab.group) {
        score += 10;
      }

      if (score > 0) {
        recommendations.push({
          tabId: tab.id,
          title: tab.title,
          url: tab.url,
          score,
          reason: reason || 'Recommended based on usage patterns',
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Get tab history with timeline view
   */
  public getTabHistory(limit: number = 100): TabHistoryEntry[] {
    return this.tabHistory.slice(-limit).reverse();
  }

  /**
   * Record tab action in history
   */
  public recordTabAction(
    tabId: number,
    title: string,
    url: string,
    action: 'opened' | 'closed' | 'focused' | 'updated'
  ): void {
    this.tabHistory.push({
      tabId,
      title,
      url,
      timestamp: Date.now(),
      action,
    });

    // Maintain max history size
    if (this.tabHistory.length > this.maxHistorySize) {
      this.tabHistory = this.tabHistory.slice(-this.maxHistorySize);
    }

    // Update lastAccessed for tab
    const tab = this.currentTabs.get(tabId);
    if (tab) {
      tab.lastAccessed = Date.now();
    }
  }

  /**
   * Archive a tab
   */
  public archiveTab(tabId: number): void {
    const tab = this.currentTabs.get(tabId);
    if (tab) {
      this.tabArchive.push(tab);
      this.currentTabs.delete(tabId);
      this.removeTabFromGroup(tabId);
      this.recordTabAction(tabId, tab.title, tab.url, 'closed');
    }
  }

  /**
   * Get archived tabs
   */
  public getArchivedTabs(): TabInfo[] {
    return this.tabArchive;
  }

  /**
   * Restore archived tab
   */
  public restoreArchivedTab(tabId: number): TabInfo | null {
    const index = this.tabArchive.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      const [tab] = this.tabArchive.splice(index, 1);
      this.currentTabs.set(tabId, tab);
      return tab;
    }
    return null;
  }

  /**
   * Cleanup old archived tabs
   */
  public cleanupArchivedTabs(daysOld: number = 30): number {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const initialLength = this.tabArchive.length;

    this.tabArchive = this.tabArchive.filter((tab) => {
      const historyEntry = this.tabHistory.find((h) => h.tabId === tab.id && h.action === 'closed');
      return !historyEntry || historyEntry.timestamp > cutoffTime;
    });

    return initialLength - this.tabArchive.length;
  }

  /**
   * Update current tabs list
   */
  public updateCurrentTabs(tabs: TabInfo[]): void {
    this.currentTabs.clear();
    for (const tab of tabs) {
      this.currentTabs.set(tab.id, tab);
      this.recordTabAction(tab.id, tab.title, tab.url, 'updated');
    }
  }

  /**
   * Get all current tabs
   */
  public getCurrentTabs(): TabInfo[] {
    return Array.from(this.currentTabs.values());
  }

  /**
   * Add tag to tab
   */
  public addTagToTab(tabId: number, tag: string): void {
    const tab = this.currentTabs.get(tabId);
    if (tab) {
      if (!tab.tags) {
        tab.tags = [];
      }
      if (!tab.tags.includes(tag)) {
        tab.tags.push(tag);
      }
    }
  }

  /**
   * Remove tag from tab
   */
  public removeTagFromTab(tabId: number, tag: string): void {
    const tab = this.currentTabs.get(tabId);
    if (tab && tab.tags) {
      tab.tags = tab.tags.filter((t) => t !== tag);
    }
  }

  /**
   * Get tabs by tag
   */
  public getTabsByTag(tag: string): TabInfo[] {
    return Array.from(this.currentTabs.values()).filter((tab) => tab.tags?.includes(tag));
  }

  /**
   * Create tab organization template
   */
  public createTemplate(name: string, groupIds: string[]): Record<string, unknown> {
    return {
      id: `template_${Date.now()}`,
      name,
      groupIds,
      createdAt: Date.now(),
    };
  }

  /**
   * Apply template to create groups
   */
  public applyTemplate(template: Record<string, unknown>): void {
    const groupIds = template.groupIds as string[];
    for (const groupId of groupIds) {
      if (!this.tabGroups.has(groupId)) {
        const groupName = groupId.charAt(0).toUpperCase() + groupId.slice(1);
        this.createTabGroup(groupName);
      }
    }
  }
}

// Export singleton instance
export const advancedTabManager = new AdvancedTabManager();
