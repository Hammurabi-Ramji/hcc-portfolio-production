import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import NeonCard from "@/components/NeonCard";
import MetricWidget from "@/components/MetricWidget";
import AnimatedProgressBar from "@/components/AnimatedProgressBar";
import AnimatedList from "@/components/AnimatedList";
import { TrendingUp, MessageSquare, CheckSquare, Database, Clock, Zap } from "lucide-react";

const conversationData = [
  { name: "Mon", thisWeek: 2800, lastWeek: 2400 },
  { name: "Tue", thisWeek: 3200, lastWeek: 2800 },
  { name: "Wed", thisWeek: 2900, lastWeek: 2600 },
  { name: "Thu", thisWeek: 3800, lastWeek: 3200 },
  { name: "Fri", thisWeek: 3500, lastWeek: 3000 },
  { name: "Sat", thisWeek: 3900, lastWeek: 3400 },
  { name: "Sun", thisWeek: 3842, lastWeek: 3200 },
];

const tasksData = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 520 },
  { name: "Wed", value: 480 },
  { name: "Thu", value: 780 },
  { name: "Fri", value: 650 },
  { name: "Sat", value: 890 },
  { name: "Sun", value: 1025 },
];

const intentsData = [
  { name: "Data Analysis", value: 32 },
  { name: "Report Generation", value: 24 },
  { name: "Information Lookup", value: 18 },
  { name: "Task Automation", value: 15 },
  { name: "Other", value: 11 },
];

const COLORS = ["#d946ef", "#8b5cf6", "#6366f1", "#a78bfa", "#c4b5fd"];

export default function Dashboard() {
  const recentActivityItems = [
    { id: "1", icon: <Zap size={16} />, title: "Generated sales report", subtitle: "2 min ago" },
    { id: "2", icon: <MessageSquare size={16} />, title: "Analyzed customer feedback", subtitle: "15 min ago" },
    { id: "3", icon: <CheckSquare size={16} />, title: "Automated data import", subtitle: "1 hr ago" },
    { id: "4", icon: <Zap size={16} />, title: "Created marketing insights", subtitle: "2 hrs ago" },
    { id: "5", icon: <MessageSquare size={16} />, title: "Scheduled weekly report", subtitle: "3 hrs ago" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2 animate-slide-in">
        <h1 className="text-4xl font-heading font-bold text-white">Welcome back, Alex!</h1>
        <p className="text-muted-foreground">Here's what's happening with your AI workspace today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-slide-in" style={{ animationDelay: "0ms" }}>
          <MetricWidget
            icon={<MessageSquare size={20} className="text-accent" />}
            label="Total Conversations"
            value="12,549"
            change={23.5}
            trend="up"
            accentColor="pink"
          />
        </div>
        <div className="animate-slide-in" style={{ animationDelay: "50ms" }}>
          <MetricWidget
            icon={<CheckSquare size={20} className="text-accent" />}
            label="Tasks Automated"
            value="3,247"
            change={18.7}
            trend="up"
            accentColor="pink"
          />
        </div>
        <div className="animate-slide-in" style={{ animationDelay: "100ms" }}>
          <MetricWidget
            icon={<Database size={20} className="text-accent" />}
            label="Data Processed"
            value="98.4 GB"
            change={32.1}
            trend="up"
            accentColor="purple"
          />
        </div>
        <div className="animate-slide-in" style={{ animationDelay: "150ms" }}>
          <MetricWidget
            icon={<Clock size={20} className="text-accent" />}
            label="Time Saved"
            value="156.3 hrs"
            change={27.4}
            trend="up"
            accentColor="pink"
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation Activity */}
        <NeonCard accentColor="purple" className="animate-scale-in">
          <h2 className="text-xl font-heading font-bold text-white mb-6">Conversation Activity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" />
                <XAxis stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1229",
                    border: "1px solid #1e2a4a",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="thisWeek" stroke="#d946ef" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="lastWeek" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-fuchsia-500" />
              <span className="text-muted-foreground">This Week</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">Last Week</span>
            </div>
          </div>
        </NeonCard>

        {/* Tasks Completed */}
        <NeonCard accentColor="pink" className="animate-scale-in" style={{ animationDelay: "50ms" }}>
          <h2 className="text-xl font-heading font-bold text-white mb-6">Tasks Completed</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" />
                <XAxis stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1229",
                    border: "1px solid #1e2a4a",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Intents */}
        <NeonCard accentColor="pink" className="lg:col-span-1 animate-scale-in">
          <h2 className="text-xl font-heading font-bold text-white mb-6">Top Intents</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={intentsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {intentsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {intentsData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </NeonCard>

        {/* AI Model Performance */}
        <NeonCard accentColor="purple" className="animate-scale-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-xl font-heading font-bold text-white mb-6">AI Model Performance</h2>
          <div className="space-y-6">
            <div>
              <AnimatedProgressBar value={96.7} label="Overall Accuracy" showPercentage accentColor="pink" />
              <p className="text-xs text-green-400 mt-2">↑ 2.4% vs last week</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Response Time</p>
                <p className="text-2xl font-heading font-bold text-white">1.2s</p>
                <p className="text-xs text-green-400">↓ 0.3s</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Satisfaction Rate</p>
                <p className="text-2xl font-heading font-bold text-white">4.8/5</p>
                <p className="text-xs text-green-400">↑ 0.5</p>
              </div>
            </div>
          </div>
        </NeonCard>

        {/* Recent Activity */}
        <NeonCard accentColor="pink" className="animate-scale-in" style={{ animationDelay: "150ms" }}>
          <h2 className="text-xl font-heading font-bold text-white mb-6">Recent Activity</h2>
          <AnimatedList items={recentActivityItems} staggerDelay={50} />
        </NeonCard>
      </div>
    </div>
  );
}
