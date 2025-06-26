import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, FileText, Paperclip, Plus, Download, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { IdeaWithDetails } from "@shared/schema";

interface IdeaCardProps {
  idea: IdeaWithDetails;
}

export default function IdeaCard({ idea }: IdeaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: api.voteIdea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Vote recorded!",
        description: "Your vote has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downvoteMutation = useMutation({
    mutationFn: api.downvoteIdea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to downvote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ ideaId, content }: { ideaId: number; content: string }) =>
      api.addNote(ideaId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      setIsAddingNote(false);
      setNoteContent("");
      toast({
        title: "Note added!",
        description: "Your note has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addAttachmentsMutation = useMutation({
    mutationFn: ({ ideaId, files }: { ideaId: number; files: File[] }) =>
      api.addAttachments(ideaId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      setIsAddingAttachment(false);
      setSelectedFiles([]);
      toast({
        title: "Attachments added!",
        description: "Your files have been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add attachments",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVote = () => {
    voteMutation.mutate(idea.id);
  };

  const handleDownvote = () => {
    downvoteMutation.mutate(idea.id);
  };

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addNoteMutation.mutate({ ideaId: idea.id, content: noteContent.trim() });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleAddAttachments = () => {
    if (selectedFiles.length > 0) {
      addAttachmentsMutation.mutate({ ideaId: idea.id, files: selectedFiles });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-primary bg-primary text-white";
      case "medium":
        return "border-orange-400 bg-orange-400 text-white";
      case "low":
        return "border-green-400 bg-green-400 text-white";
      default:
        return "border-gray-300 bg-gray-300 text-gray-800";
    }
  };

  const getBorderColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-primary";
      case "medium":
        return "border-l-orange-400";
      case "low":
        return "border-l-green-400";
      default:
        return "border-l-gray-300";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.includes("pdf")) return "📄";
    if (mimetype.includes("image")) return "🖼️";
    if (mimetype.includes("document") || mimetype.includes("word")) return "📝";
    if (mimetype.includes("spreadsheet") || mimetype.includes("excel")) return "📊";
    if (mimetype.includes("presentation") || mimetype.includes("powerpoint")) return "📽️";
    return "📎";
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    if (diffInHours < 672) return `${Math.floor(diffInHours / 168)} weeks ago`;
    return d.toLocaleDateString();
  };

  return (
    <Card className={`shadow-card hover:shadow-card-hover transition-shadow border-l-4 ${getBorderColor(idea.priority)}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-lg text-secondary">{idea.title}</h3>
              <Badge className={`text-xs ${getPriorityColor(idea.priority)}`}>
                {idea.priority.charAt(0).toUpperCase() + idea.priority.slice(1)} Priority
              </Badge>
            </div>
            <p className="text-gray-600 mb-3">{idea.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{idea.author}</span>
              <span>{formatDate(idea.createdAt)}</span>
              {idea.attachments.length > 0 && (
                <span className="flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{idea.attachments.length} files</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 ml-6">
            <div className="text-center">
              <Button
                size="sm"
                className="w-12 h-12 bg-accent text-white rounded-lg hover:bg-green-600 transition-colors mb-1"
                onClick={handleVote}
                disabled={voteMutation.isPending}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold text-secondary block">{idea.votes}</span>
              <Button
                size="sm"
                variant="outline"
                className="w-12 h-12 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors mt-1"
                onClick={handleDownvote}
                disabled={downvoteMutation.isPending}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <div className="border-t border-gray-200 pt-4">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-primary hover:text-blue-700 mb-3 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            <span>View Details & Notes</span>
          </Button>

          {isExpanded && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Notes Section */}
              <div>
                <h4 className="font-medium text-secondary mb-2">Notes</h4>
                
                {idea.notes.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center text-gray-500">
                    No notes yet. Add the first note!
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {idea.notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {isAddingNote ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Enter your note..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={!noteContent.trim() || addNoteMutation.isPending}
                      >
                        Save Note
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsAddingNote(false);
                          setNoteContent("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary hover:text-blue-700"
                    onClick={() => setIsAddingNote(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Note
                  </Button>
                )}
              </div>

              {/* Attachments Section */}
              <div>
                <h4 className="font-medium text-secondary mb-2">Attachments</h4>
                
                {idea.attachments.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center text-gray-500">
                    No attachments yet. Upload some files!
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {idea.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">{getFileIcon(attachment.mimetype)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-secondary">{attachment.originalName}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => window.open(api.downloadAttachment(attachment.id), '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {isAddingAttachment ? (
                  <div className="space-y-3">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.ppt,.pptx"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="text-sm text-gray-600">
                        {selectedFiles.length} file(s) selected
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleAddAttachments}
                        disabled={selectedFiles.length === 0 || addAttachmentsMutation.isPending}
                      >
                        Upload Files
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsAddingAttachment(false);
                          setSelectedFiles([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary hover:text-blue-700"
                    onClick={() => setIsAddingAttachment(true)}
                  >
                    <Paperclip className="w-4 h-4 mr-1" />
                    Add Attachment
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
