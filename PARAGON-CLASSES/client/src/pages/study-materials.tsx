import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import FileUpload from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Download, 
  FileText, 
  Trash2, 
  Filter,
  Clock,
  Upload as UploadIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { StudyMaterial, Batch } from "@shared/schema";
import { useEffect } from "react";

export default function StudyMaterials() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterBatch, setFilterBatch] = useState<string>("all");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: studyMaterials = [] } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/study-materials"],
    retry: false,
  });

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
    retry: false,
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: number) => {
      await apiRequest('DELETE', `/api/study-materials/${materialId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-materials'] });
      toast({
        title: "Material Deleted",
        description: "Study material has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isTeacher = user.role === 'teacher';

  // Filter materials by batch
  const filteredMaterials = studyMaterials.filter(material => {
    if (filterBatch === "all") return true;
    return material.batchId.toString() === filterBatch;
  });

  const handleDownload = async (materialId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/study-materials/${materialId}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: `${fileName} is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (materialId: number) => {
    if (confirm("Are you sure you want to delete this study material?")) {
      deleteMaterialMutation.mutate(materialId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBatchName = (batchId: number) => {
    const batch = batches.find(b => b.id === batchId);
    return batch?.name || `Batch ${batchId}`;
  };

  const getBatchColor = (batchId: number) => {
    const batch = batches.find(b => b.id === batchId);
    if (batch?.className === '11th') return "bg-primary/10 text-primary border-primary/20";
    if (batch?.className === '12th') return "bg-purple-100 text-purple-600 border-purple-200";
    return "bg-neutral-100 text-neutral-600 border-neutral-200";
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Study Materials" 
          subtitle={isTeacher ? "Manage and upload study materials" : "Access your study materials"}
          actions={
            isTeacher && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                <Select value={filterBatch} onValueChange={setFilterBatch}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id.toString()}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section - Only for Teachers */}
            {isTeacher && (
              <div className="lg:col-span-1">
                <FileUpload />
              </div>
            )}

            {/* Materials List */}
            <div className={isTeacher ? "lg:col-span-2" : "lg:col-span-3"}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>Study Materials</span>
                      </CardTitle>
                      <CardDescription>
                        {isTeacher 
                          ? "All uploaded materials across batches"
                          : "Materials available for your batch"
                        }
                      </CardDescription>
                    </div>
                    {!isTeacher && user.batchId && (
                      <Badge className={getBatchColor(user.batchId)}>
                        {getBatchName(user.batchId)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredMaterials.length === 0 ? (
                      <div className="text-center py-12">
                        <UploadIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                          No study materials found
                        </h3>
                        <p className="text-neutral-500">
                          {isTeacher 
                            ? "Upload your first study material to get started."
                            : "No materials have been uploaded for your batch yet."
                          }
                        </p>
                      </div>
                    ) : (
                      filteredMaterials.map((material) => (
                        <div key={material.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <h4 className="font-medium text-neutral-900 truncate">
                                  {material.title}
                                </h4>
                                {isTeacher && (
                                  <Badge className={getBatchColor(material.batchId)}>
                                    {getBatchName(material.batchId)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-neutral-500">
                                <span>{material.fileName}</span>
                                <span>•</span>
                                <span>{formatFileSize(material.fileSize)}</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(material.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => handleDownload(material.id, material.fileName)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                            {isTeacher && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-accent hover:text-accent hover:bg-accent/10"
                                onClick={() => handleDelete(material.id)}
                                disabled={deleteMaterialMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
