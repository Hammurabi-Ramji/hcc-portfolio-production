import { useState } from "react";
import { Cloud, Lock, HardDrive, RefreshCw, Plus, Check, AlertCircle, Download } from "lucide-react";
import NeonCard from "@/components/NeonCard";
import NeonButton from "@/components/NeonButton";

interface Integration {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: Date;
}

export default function CloudPage() {
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const [lastSync, setLastSync] = useState(new Date(Date.now() - 300000)); // 5 minutes ago
  const [dataUsage, setDataUsage] = useState(45); // 45%

  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: "notion", name: "Notion", icon: "📄", connected: true, lastSync: new Date(Date.now() - 3600000) },
    { id: "github", name: "GitHub", icon: "🐙", connected: true, lastSync: new Date(Date.now() - 7200000) },
    { id: "linear", name: "Linear", icon: "📋", connected: false },
    { id: "slack", name: "Slack", icon: "💬", connected: true, lastSync: new Date(Date.now() - 1800000) },
    { id: "obsidian", name: "Obsidian", icon: "🧠", connected: true, lastSync: new Date(Date.now() - 86400000) },
    { id: "zapier", name: "Zapier", icon: "⚡", connected: false },
  ]);

  const handleSync = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("synced");
      setLastSync(new Date());
    }, 2000);
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((int) =>
        int.id === id
          ? { ...int, connected: !int.connected, lastSync: !int.connected ? new Date() : undefined }
          : int
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Cloud</h1>
          <p className="text-muted-foreground mt-1">Sync, backup, and integrations</p>
        </div>
        <NeonButton accentColor="cyan" className="flex items-center gap-2">
          <Cloud size={16} />
          Sync Now
        </NeonButton>
      </div>

      {/* Sync Status */}
      <NeonCard accentColor="cyan">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white">Sync Status</h3>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                syncStatus === "synced"
                  ? "bg-green-500/20 text-green-400"
                  : syncStatus === "syncing"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-red-500/20 text-red-400"
              }`}
            >
              {syncStatus === "synced" && <Check size={14} />}
              {syncStatus === "syncing" && <RefreshCw size={14} className="animate-spin" />}
              {syncStatus === "error" && <AlertCircle size={14} />}
              <span className="capitalize">{syncStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Last Sync</p>
              <p className="text-sm font-medium text-white mt-1">
                {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data Usage</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-magenta-500 transition-all"
                    style={{ width: `${dataUsage}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-white">{dataUsage}%</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Storage</p>
              <p className="text-sm font-medium text-white mt-1">234 MB / 500 MB</p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncStatus === "syncing"}
            className="w-full px-4 py-2 bg-accent hover:bg-accent/80 disabled:opacity-50 text-accent-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={syncStatus === "syncing" ? "animate-spin" : ""} />
            {syncStatus === "syncing" ? "Syncing..." : "Force Sync"}
          </button>
        </div>
      </NeonCard>

      {/* Data Sovereignty */}
      <NeonCard accentColor="magenta">
        <div className="space-y-4">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <Lock size={18} />
            Data Sovereignty
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-secondary rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Local Storage</p>
              <p className="text-lg font-display font-bold text-white mt-1">SQLite 234 MB</p>
              <p className="text-xs text-muted-foreground mt-1">End-to-End Encrypted</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Backup Status</p>
              <p className="text-lg font-display font-bold text-white mt-1">Auto-Backup Active</p>
              <p className="text-xs text-muted-foreground mt-1">Last backup: 2 hours ago</p>
            </div>
          </div>

          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-colors flex items-center justify-center gap-2">
              <Download size={16} />
              Export All Data
            </button>
            <button className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-colors">
              Self-Host with Docker
            </button>
          </div>
        </div>
      </NeonCard>

      {/* Integrations */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">INTEGRATIONS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((integration) => (
            <NeonCard
              key={integration.id}
              accentColor={integration.connected ? "cyan" : "purple"}
              className="group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{integration.icon}</span>
                    <h4 className="font-display font-bold text-white">{integration.name}</h4>
                  </div>
                  <button
                    onClick={() => toggleIntegration(integration.id)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      integration.connected ? "bg-accent" : "bg-secondary"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        integration.connected ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {integration.connected && integration.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {integration.lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}

                {!integration.connected && (
                  <p className="text-xs text-muted-foreground">Not connected</p>
                )}

                <button className="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground text-xs rounded transition-colors">
                  {integration.connected ? "Manage" : "Connect"}
                </button>
              </div>
            </NeonCard>
          ))}
        </div>
      </div>

      {/* API Settings */}
      <NeonCard accentColor="purple">
        <div className="space-y-3">
          <h3 className="font-display font-bold text-white">API Key</h3>
          <div className="flex gap-2">
            <input
              type="password"
              value="••••••••••••••••••••••••"
              readOnly
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground"
            />
            <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded transition-colors">
              Copy
            </button>
            <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded transition-colors">
              Regenerate
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Keep your API key secure. Regenerate if compromised.</p>
        </div>
      </NeonCard>

      {/* Backup Schedule */}
      <NeonCard accentColor="cyan">
        <div className="space-y-3">
          <h3 className="font-display font-bold text-white">Backup Schedule</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Auto-Backup</p>
              <button className="relative w-10 h-6 rounded-full bg-accent">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Frequency</p>
              <select className="px-3 py-1 bg-secondary border border-border rounded text-sm text-foreground">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Retention</p>
              <select className="px-3 py-1 bg-secondary border border-border rounded text-sm text-foreground">
                <option>30 days</option>
                <option>90 days</option>
                <option>1 year</option>
              </select>
            </div>
          </div>
        </div>
      </NeonCard>
    </div>
  );
}
