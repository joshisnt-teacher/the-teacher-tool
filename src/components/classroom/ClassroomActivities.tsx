import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Activity, AlertCircle } from "lucide-react";
import { useActivitiesByClass } from "@/hooks/useActivities";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ClassroomActivitiesProps {
  classId: string;
}

export function ClassroomActivities({ classId }: ClassroomActivitiesProps) {
  const { data: activities = [], isLoading } = useActivitiesByClass(classId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyJoinCode = async (joinCode: string) => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopiedCode(joinCode);
      toast({
        title: "Join Code Copied",
        description: `Join code "${joinCode}" has been copied to clipboard.`,
      });
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to Copy",
        description: "Failed to copy join code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTypeLabel = (type: string) => {
    switch (type) {
      case 'QUIZ':
        return 'Quiz';
      case 'POLL':
        return 'Poll';
      case 'FLASHCARDS':
        return 'Flashcards';
      case 'EXIT_TICKET':
        return 'Exit Ticket';
      case 'BUZZER':
        return 'Buzzer';
      case 'FORM':
        return 'Form';
      default:
        return 'Activity';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default' as const;
      case 'archived':
        return 'secondary' as const;
      case 'draft':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activities
          </CardTitle>
          <CardDescription>Loading activities...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activities
            </CardTitle>
            <CardDescription>
              {activities.length > 0 
                ? `${activities.length} ${activities.length === 1 ? 'activity' : 'activities'} linked to this class`
                : 'No activities linked to this class'
              }
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/activities')}
          >
            Activities
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">
              Can't see your activity? Make sure you have linked it to this class in the activities page.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{activity.title}</h3>
                      <Badge variant={getStatusVariant(activity.status)}>
                        {activity.status}
                      </Badge>
                      <Badge variant="outline">
                        {formatTypeLabel(activity.type)}
                      </Badge>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    )}
                  </div>
                </div>
                
                {activity.join_code && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 flex items-center gap-2 p-2 bg-gray-100 rounded border">
                      <span className="text-sm font-mono font-semibold">
                        Join Code: {activity.join_code}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyJoinCode(activity.join_code!)}
                      className="flex-shrink-0"
                    >
                      {copiedCode === activity.join_code ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

