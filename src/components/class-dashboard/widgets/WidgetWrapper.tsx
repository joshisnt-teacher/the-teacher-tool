import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Settings } from 'lucide-react';
import { DashboardWidget, useDeleteDashboardWidget } from '@/hooks/useDashboardWidgets';

interface WidgetWrapperProps {
  widget: DashboardWidget;
  isEditMode: boolean;
  children: React.ReactNode;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  widget,
  isEditMode,
  children,
}) => {
  const deleteWidget = useDeleteDashboardWidget();

  const handleDelete = () => {
    deleteWidget.mutate(widget.id);
  };

  return (
    <Card className="h-full flex flex-col relative">
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
            onClick={handleDelete}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium truncate pr-8">
          {widget.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 pt-0 min-h-0">
        <div className="h-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};