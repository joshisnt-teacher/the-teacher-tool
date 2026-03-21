import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Plus, Eye, Save, X } from 'lucide-react';
import { DashboardGrid } from './DashboardGrid';
import { useDashboardLayouts, useCreateDashboardLayout } from '@/hooks/useDashboardLayouts';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { AddWidgetDialog } from './AddWidgetDialog';

interface CustomDashboardProps {
  classId: string;
}

export const CustomDashboard: React.FC<CustomDashboardProps> = ({ classId }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);

  const { data: layouts = [], isLoading: layoutsLoading } = useDashboardLayouts(classId);
  const { data: widgets = [], isLoading: widgetsLoading } = useDashboardWidgets(currentLayoutId || '');
  const createLayout = useCreateDashboardLayout();

  // Get or create default layout
  useEffect(() => {
    if (layouts.length > 0) {
      const defaultLayout = layouts.find(l => l.is_default) || layouts[0];
      setCurrentLayoutId(defaultLayout.id);
    } else if (!layoutsLoading && !createLayout.isPending) {
      // Create default layout if none exists
      createLayout.mutate({
        class_id: classId,
        name: 'Default Layout',
        is_default: true,
        layout_config: [],
      });
    }
  }, [layouts, layoutsLoading, classId, createLayout]);

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleAddWidget = () => {
    setIsAddWidgetOpen(true);
  };

  if (layoutsLoading || widgetsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentLayoutId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Setting up your dashboard...</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Custom Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            {isEditMode ? 'Drag and resize widgets to customize your layout' : 'View your personalized dashboard'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button onClick={handleAddWidget} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Widget
            </Button>
          )}
          <Button
            onClick={handleToggleEditMode}
            variant={isEditMode ? "default" : "outline"}
            size="sm"
          >
            {isEditMode ? (
              <>
                <Eye className="w-4 h-4 mr-1" />
                View Mode
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-1" />
                Edit Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      {widgets.length > 0 ? (
        <DashboardGrid
          widgets={widgets}
          isEditMode={isEditMode}
          layoutId={currentLayoutId}
          classId={classId}
        />
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No widgets yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first widget to start building your custom dashboard
              </p>
              <Button onClick={handleAddWidget}>
                <Plus className="w-4 h-4 mr-1" />
                Add Your First Widget
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Widget Dialog */}
      <AddWidgetDialog
        isOpen={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
        layoutId={currentLayoutId}
        classId={classId}
      />
    </div>
  );
};