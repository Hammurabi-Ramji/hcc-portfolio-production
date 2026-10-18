import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ChatInterface from "./pages/ChatInterface";
import { WorkPage, NotesPage, TabsPage, CloudPage } from "./pages/TabPages";
import ComponentLibrary from "./pages/ComponentLibrary";
import { cn } from "@/lib/utils";

function Router({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <Switch>
      <Route path={"/"}>
        {activeTab === "home" && <Dashboard />}
        {activeTab === "ai" && <ChatInterface />}
        {activeTab === "work" && <WorkPage />}
        {activeTab === "notes" && <NotesPage />}
        {activeTab === "tabs" && <TabsPage />}
        {activeTab === "cloud" && <CloudPage />}
        {activeTab === "components" && <ComponentLibrary />}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content */}
            <main className="flex-1 overflow-auto lg:ml-64">
              <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                <Router activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
            </main>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
