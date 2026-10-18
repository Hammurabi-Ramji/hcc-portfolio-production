import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClipboardCheckIcon, ClockIcon, AlertCircleIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon } from "lucide-react";
import { format } from "date-fns";

type Stage = {
  id: number;
  productId: number;
  stageType: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  description: string | null;
  responsibleUserId: number | null;
  color: string;
  order: number;
  milestones: Milestone[];
};

type Milestone = {
  id: number;
  stageId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedDate: string | null;
  status: string;
  priority: string;
  assignedTo: number | null;
  documentId: number | null;
  regulatoryRequirement: boolean;
  notes: string | null;
};

// Status badge colors
const statusColors = {
  planned: "bg-blue-100 text-blue-800",
  "in_progress": "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  delayed: "bg-red-100 text-red-800",
  canceled: "bg-gray-100 text-gray-800"
};

// Priority badge colors
const priorityColors = {
  low: "bg-blue-50 text-blue-700 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200"
};

// Stage type icons mapping
const stageIcons = {
  development: "🧪",
  testing: "🔍",
  certification: "🏅",
  production: "🏭",
  distribution: "🚚",
  maintenance: "🔧",
  retirement: "🔚"
};

const StatusBadge = ({ status }: { status: string }) => {
  const display = status.replace("_", " ");
  const className = statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  
  return (
    <Badge variant="outline" className={className}>
      {status === "completed" && <CheckCircleIcon className="h-3 w-3 mr-1" />}
      {status === "in_progress" && <ClockIcon className="h-3 w-3 mr-1" />}
      {status === "delayed" && <AlertCircleIcon className="h-3 w-3 mr-1" />}
      {status === "canceled" && <XCircleIcon className="h-3 w-3 mr-1" />}
      {display.charAt(0).toUpperCase() + display.slice(1)}
    </Badge>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const className = priorityColors[priority as keyof typeof priorityColors] || "bg-gray-50 text-gray-700 border-gray-200";
  
  return (
    <Badge variant="outline" className={className}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
    </Badge>
  );
};

interface ProductLifecycleViewProps {
  productId: number;
}

export const ProductLifecycleView = ({ productId }: ProductLifecycleViewProps) => {
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  
  const { data: lifecycleData, isLoading, error } = useQuery({
    queryKey: ['/api/products', productId, 'lifecycle'],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/lifecycle`);
      if (!res.ok) throw new Error('Failed to fetch product lifecycle data');
      return res.json() as Promise<Stage[]>;
    },
    enabled: !!productId
  });
  
  // Calculate overall progress and current status whenever lifecycle data changes
  useEffect(() => {
    if (lifecycleData && lifecycleData.length > 0) {
      const totalMilestones = lifecycleData.reduce((total, stage) => total + stage.milestones.length, 0);
      const completedMilestones = lifecycleData.reduce((total, stage) => {
        return total + stage.milestones.filter(m => m.status === "completed").length;
      }, 0);
      
      const percentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
      setCompletionPercentage(percentage);
      
      // Determine current status
      const activeStages = lifecycleData.filter(s => s.status === "in_progress");
      if (activeStages.length > 0) {
        setCurrentStatus(activeStages[0].stageType);
      } else {
        const lastCompletedStage = [...lifecycleData]
          .sort((a, b) => b.order - a.order)
          .find(s => s.status === "completed");
        
        if (lastCompletedStage) {
          setCurrentStatus(`${lastCompletedStage.stageType} (completed)`);
        } else {
          setCurrentStatus("Not started");
        }
      }
    }
  }, [lifecycleData]);
  
  if (isLoading) {
    return <ProductLifecycleSkeleton />;
  }
  
  if (error) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Product Lifecycle</CardTitle>
          <CardDescription>
            There was an error loading the product lifecycle data. Please try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!lifecycleData || lifecycleData.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Product Lifecycle</CardTitle>
          <CardDescription>
            No lifecycle data is available for this product.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Sort stages by order
  const sortedStages = [...lifecycleData].sort((a, b) => a.order - b.order);
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Product Lifecycle</CardTitle>
        <CardDescription>
          Current Status: <span className="font-medium">{currentStatus}</span> | 
          Overall Progress: <span className="font-medium">{completionPercentage}%</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Timeline visualization */}
        <div className="mb-6 relative">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2">
            {sortedStages.map((stage, index) => (
              <div 
                key={stage.id} 
                className="relative flex flex-col items-center"
                style={{ 
                  left: `${index * (100 / (sortedStages.length - 1 || 1))}%`,
                  marginLeft: index === 0 ? '0' : `-${24}px`,
                  position: index === 0 ? 'relative' : 'absolute'
                }}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium z-10 
                    ${stage.status === 'completed' ? 'bg-green-500' : 
                      stage.status === 'in_progress' ? 'bg-amber-500' : 'bg-gray-400'}`}
                >
                  <span>{stageIcons[stage.stageType as keyof typeof stageIcons]}</span>
                </div>
                <span className="text-xs mt-1 font-medium text-center whitespace-nowrap">
                  {stage.stageType.charAt(0).toUpperCase() + stage.stageType.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Detailed stage information */}
        <Tabs defaultValue={sortedStages[0]?.stageType || "development"} className="mt-6">
          <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${sortedStages.length}, 1fr)` }}>
            {sortedStages.map(stage => (
              <TabsTrigger key={stage.id} value={stage.stageType}>
                {stage.stageType.charAt(0).toUpperCase() + stage.stageType.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {sortedStages.map(stage => (
            <TabsContent key={stage.id} value={stage.stageType} className="pt-4">
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {stage.stageType.charAt(0).toUpperCase() + stage.stageType.slice(1)} Stage
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {stage.description || "No description available"}
                    </p>
                  </div>
                  
                  <div className="flex items-start mt-2 md:mt-0 space-x-2">
                    <StatusBadge status={stage.status} />
                    
                    <div className="text-xs text-muted-foreground">
                      {stage.startDate && stage.endDate ? (
                        <span className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {format(new Date(stage.startDate), "MM/dd/yyyy")} 
                          <ArrowRightIcon className="h-3 w-3 mx-1" />
                          {format(new Date(stage.endDate), "MM/dd/yyyy")}
                        </span>
                      ) : (
                        stage.startDate && (
                          <span className="flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Started: {format(new Date(stage.startDate), "MM/dd/yyyy")}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Milestones */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center">
                    <ClipboardCheckIcon className="h-4 w-4 mr-1" />
                    Milestones
                  </h4>
                  
                  {stage.milestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No milestones defined for this stage</p>
                  ) : (
                    <div className="grid gap-3">
                      {stage.milestones.map(milestone => (
                        <div 
                          key={milestone.id} 
                          className={`p-3 rounded-md border ${
                            milestone.status === 'completed' ? 'bg-green-50 border-green-200' : 
                            milestone.status === 'in_progress' ? 'bg-amber-50 border-amber-200' :
                            milestone.status === 'delayed' ? 'bg-red-50 border-red-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-sm font-medium">{milestone.title}</h5>
                              {milestone.description && (
                                <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              <StatusBadge status={milestone.status} />
                              <PriorityBadge priority={milestone.priority} />
                            </div>
                          </div>
                          
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            {milestone.dueDate && (
                              <span className="flex items-center mr-3">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Due: {format(new Date(milestone.dueDate), "MM/dd/yyyy")}
                              </span>
                            )}
                            
                            {milestone.completedDate && (
                              <span className="flex items-center">
                                <CheckCircleIcon className="h-3 w-3 mr-1 text-green-500" />
                                Completed: {format(new Date(milestone.completedDate), "MM/dd/yyyy")}
                              </span>
                            )}
                            
                            {milestone.regulatoryRequirement && (
                              <Badge variant="outline" className="ml-auto bg-purple-50 text-purple-700 border-purple-200">
                                Regulatory Requirement
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Loading skeleton
const ProductLifecycleSkeleton = () => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle><Skeleton className="h-7 w-48" /></CardTitle>
        <CardDescription className="flex gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Skeleton className="h-2 w-full mb-6" />
        
        <div className="flex justify-between mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          ))}
        </div>
        
        <Skeleton className="h-10 w-full mb-4" />
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 border rounded-md">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mt-2" />
                <div className="flex mt-2">
                  <Skeleton className="h-4 w-24 mr-2" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductLifecycleView;