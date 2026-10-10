import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { employeePortalNavigation } from "@/lib/portal-navigation";
import { 
  BookOpen, 
  Clock, 
  Search,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Lightbulb
} from "lucide-react";

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const { data: articles, isLoading } = trpc.knowledge.list.useQuery();

  const filteredArticles = articles?.filter((article: any) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "daily_tasks": return <CheckCircle2 className="h-4 w-4" />;
      case "emergency_procedures": return <AlertCircle className="h-4 w-4" />;
      case "system_access": return <BookOpen className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const articleGridContent = (() => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (filteredArticles?.length) {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article: any) => (
            <Card
              key={article.id}
              className="cursor-pointer border-purple-200 bg-linear-to-br from-white to-purple-50 transition-shadow hover:shadow-lg"
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader>
                <div className="mb-2 flex items-start justify-between">
                  <Badge className={getDifficultyColor(article.difficulty)}>
                    {article.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span className="text-xs">{article.views}</span>
                  </div>
                </div>
                <CardTitle className="line-clamp-2 text-lg">{article.title}</CardTitle>
                <CardDescription className="mt-2 flex items-center gap-2">
                  {getCategoryIcon(article.category)}
                  <span>{article.category.replace('_', ' ')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Department:</span>
                    <Badge variant="outline">{article.department}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Position:</span>
                    <span className="text-sm font-medium">{article.position}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{article.estimatedTime} minutes</span>
                  </div>
                </div>
                <Button className="mt-4 w-full" variant="outline">
                  Start Training
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p className="text-muted-foreground">No articles found</p>
        </CardContent>
      </Card>
    );
  })();

  return (
    <PortalLayout title="Knowledge Base - Hit by a Bus Training" navigation={employeePortalNavigation}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-2">
            "Hit by a Bus" training - Learn any role, anytime
          </p>
        </div>

        {selectedArticle ? (
          /* Article Detail View */
          <div className="space-y-6">
            <Button variant="outline" onClick={() => setSelectedArticle(null)}>
              ← Back to Articles
            </Button>

            <Card className="bg-linear-to-br from-purple-50 to-white border-purple-200">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <Badge className={getDifficultyColor(selectedArticle.difficulty)}>
                      {selectedArticle.difficulty}
                    </Badge>
                    <CardTitle className="text-3xl">{selectedArticle.title}</CardTitle>
                    <CardDescription className="text-base">
                      {selectedArticle.department} • {selectedArticle.position}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{selectedArticle.estimatedTime} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{selectedArticle.views} views</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedArticle.prerequisites && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-900 mb-2">Prerequisites:</p>
                    <p className="text-sm text-amber-700">{selectedArticle.prerequisites}</p>
                  </div>
                )}

                <Separator />

                <div className="prose max-w-none">
                  <h3 className="text-xl font-bold mb-4">Training Content</h3>
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedArticle.content}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <Button className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Print Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Search */}
            <Card className="bg-linear-to-br from-purple-50 to-white border-purple-200">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, department, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-linear-to-br from-purple-100 to-purple-50 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                  <BookOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{articles?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Training resources</p>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-green-100 to-green-50 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Departments</CardTitle>
                  <GraduationCap className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">
                    {new Set(articles?.map((a: any) => a.department)).size || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Cross-training available</p>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-100 to-amber-50 border-amber-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
                  <Clock className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">
                    {articles?.length 
                      ? Math.round(articles.reduce((sum: number, a: any) => sum + (a.estimatedTime || 0), 0) / articles.length)
                      : 0} min
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Per article</p>
                </CardContent>
              </Card>
            </div>

            {/* Articles Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Training Articles</h2>
              {articleGridContent}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
