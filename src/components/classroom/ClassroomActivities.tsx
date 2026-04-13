import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Ticket, AlertCircle } from "lucide-react";
import { useExitTicketsByClass } from "@/hooks/useExitTicketsByClass";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ClassroomActivitiesProps {
  classId: string;
}

export function ClassroomActivities({ classId }: ClassroomActivitiesProps) {
  const { data: exitTickets = [], isLoading } = useExitTicketsByClass(classId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'closed':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Exit Tickets
          </CardTitle>
          <CardDescription>Loading exit tickets...</CardDescription>
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
              <Ticket className="w-5 h-5" />
              Exit Tickets
            </CardTitle>
            <CardDescription>
              {exitTickets.length > 0 
                ? `${exitTickets.length} exit ticket${exitTickets.length === 1 ? '' : 's'} for this class`
                : 'No exit tickets for this class yet'
              }
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/activities')}
          >
            Exit Tickets
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {exitTickets.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">
              No exit tickets linked to this class yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {exitTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{ticket.name}</h3>
                      <Badge variant={getStatusVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <Badge variant="outline">
                        {ticket.question_count} question{ticket.question_count === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
