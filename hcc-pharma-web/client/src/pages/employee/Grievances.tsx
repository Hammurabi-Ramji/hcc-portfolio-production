import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { employeePortalNavigation } from "@/lib/portal-navigation";
import { toast } from "sonner";
import { 
  MessageSquare, 
  ShieldAlert, 
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

export default function Grievances() {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");

  const { data: grievances, isLoading, refetch } = trpc.grievances.list.useQuery();
  const createGrievance = trpc.grievances.create.useMutation({
    onSuccess: () => {
      toast.success("Grievance submitted successfully");
      setCategory("");
      setSeverity("");
      setDescription("");
      setDesiredOutcome("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to submit grievance: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !severity || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    createGrievance.mutate({
      category: category as any,
      severity: severity as any,
      description,
      desiredOutcome: desiredOutcome || null,
      isAnonymous,
    });
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "critical": return "bg-red-100 text-red-800 border-red-300";
      case "high": return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800";
      case "investigating": return "bg-purple-100 text-purple-800";
      case "under_review": return "bg-blue-100 text-blue-800";
      case "submitted": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const grievanceListContent = (() => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (grievances?.length) {
      return (
        <div className="space-y-4">
          {grievances.map((grievance: any) => (
            <div
              key={grievance.id}
              className="rounded-lg border border-purple-200 bg-linear-to-r from-purple-50 to-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {grievance.grievanceNumber}
                  </Badge>
                  <Badge className={getSeverityColor(grievance.severity)}>
                    {grievance.severity}
                  </Badge>
                  <Badge className={getStatusColor(grievance.status)}>
                    {grievance.status.replace('_', ' ')}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(grievance.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="mb-2 text-sm font-medium text-gray-900">
                {grievance.category.replace('_', ' ').toUpperCase()}
              </p>
              <p className="line-clamp-2 text-sm text-gray-700">
                {grievance.description}
              </p>

              {grievance.resolutionNotes && (
                <div className="mt-3 rounded border border-green-200 bg-green-50 p-3">
                  <p className="mb-1 text-xs font-medium text-green-900">Resolution:</p>
                  <p className="text-xs text-green-700">{grievance.resolutionNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="py-12 text-center text-muted-foreground">
        <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
        <p>No grievances submitted yet</p>
      </div>
    );
  })();

  return (
    <PortalLayout title="Anonymous Grievance System" navigation={employeePortalNavigation}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Anonymous Grievance System
          </h1>
          <p className="text-muted-foreground mt-2">
            Report workplace concerns safely and confidentially
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Form */}
          <Card className="lg:col-span-2 bg-linear-to-br from-purple-50 to-white border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Submit a Grievance
              </CardTitle>
              <CardDescription>
                Your report helps us maintain a safe and fair workplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between p-4 bg-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    {isAnonymous ? (
                      <EyeOff className="h-5 w-5 text-purple-700" />
                    ) : (
                      <Eye className="h-5 w-5 text-purple-700" />
                    )}
                    <div>
                      <Label className="text-purple-900 font-medium">Anonymous Submission</Label>
                      <p className="text-xs text-purple-700">
                        {isAnonymous 
                          ? "Your identity will not be recorded" 
                          : "Your name will be attached to this report"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workplace_safety">Workplace Safety</SelectItem>
                      <SelectItem value="harassment">Harassment</SelectItem>
                      <SelectItem value="discrimination">Discrimination</SelectItem>
                      <SelectItem value="policy_violation">Policy Violation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Severity */}
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Minor concern</SelectItem>
                      <SelectItem value="medium">Medium - Moderate issue</SelectItem>
                      <SelectItem value="high">High - Serious problem</SelectItem>
                      <SelectItem value="critical">Critical - Immediate danger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the situation in detail. Focus on what happened, not who was involved..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Focus on the issue and its impact, not individual blame
                  </p>
                </div>

                {/* Desired Outcome */}
                <div className="space-y-2">
                  <Label htmlFor="desiredOutcome">Desired Outcome (Optional)</Label>
                  <Textarea
                    id="desiredOutcome"
                    placeholder="What resolution would you like to see?"
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createGrievance.isPending}
                >
                  {createGrievance.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Submit Grievance
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-linear-to-br from-green-50 to-white border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-green-900">Submit Anonymously</p>
                  <p className="text-sm text-green-700">Your identity is protected</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-green-900">Review & Investigation</p>
                  <p className="text-sm text-green-700">Management reviews your concern</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-green-900">Resolution</p>
                  <p className="text-sm text-green-700">Issue is addressed and resolved</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                <p className="text-sm text-green-900 font-medium mb-1">Your Privacy</p>
                <p className="text-xs text-green-700">
                  Anonymous submissions are stored without any identifying information. 
                  Focus on the problem, not the people.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grievance List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Recent Grievances
            </CardTitle>
            <CardDescription>
              Track the status of reported concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {grievanceListContent}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
