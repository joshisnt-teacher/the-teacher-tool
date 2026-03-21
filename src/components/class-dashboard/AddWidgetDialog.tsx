import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, PieChart, Grid, FileText, Activity } from 'lucide-react';
import { useCreateDashboardWidget, DashboardWidget } from '@/hooks/useDashboardWidgets';

interface AddWidgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  layoutId: string;
  classId: string;
}

const widgetTypes = [
  {
    type: 'kpi' as const,
    name: 'KPI Card',
    description: 'Display key metrics like class average or student count',
    icon: BarChart3,
    dataSources: [
      { value: 'class_average', label: 'Class Average' },
      { value: 'student_count', label: 'Student Count' },
      { value: 'assessment_count', label: 'Assessment Count' },
      { value: 'highest_score', label: 'Highest Score' },
    ],
  },
  {
    type: 'line_chart' as const,
    name: 'Line Chart',
    description: 'Show trends over time like progress tracking',
    icon: TrendingUp,
    dataSources: [
      { value: 'class_progress', label: 'Class Progress Over Time' },
      { value: 'individual_progress', label: 'Individual Student Progress' },
    ],
  },
  {
    type: 'bar_chart' as const,
    name: 'Bar Chart',
    description: 'Compare categories like grade distribution',
    icon: Activity,
    dataSources: [
      { value: 'grade_distribution', label: 'Grade Distribution' },
      { value: 'content_coverage', label: 'Content Descriptor Coverage' },
    ],
  },
  {
    type: 'pie_chart' as const,
    name: 'Pie Chart',
    description: 'Show proportions like grade band percentages',
    icon: PieChart,
    dataSources: [
      { value: 'grade_bands', label: 'Grade Band Distribution' },
      { value: 'task_types', label: 'Task Type Distribution' },
    ],
  },
  {
    type: 'heatmap' as const,
    name: 'Heatmap',
    description: 'Visualize performance patterns across students and questions',
    icon: Grid,
    dataSources: [
      { value: 'student_question_performance', label: 'Student × Question Performance' },
      { value: 'student_assessment_performance', label: 'Student × Assessment Performance' },
    ],
  },
  {
    type: 'markdown' as const,
    name: 'Notes',
    description: 'Add custom text and notes to your dashboard',
    icon: FileText,
    dataSources: [
      { value: 'custom_notes', label: 'Custom Notes' },
    ],
  },
];

export const AddWidgetDialog: React.FC<AddWidgetDialogProps> = ({
  isOpen,
  onClose,
  layoutId,
  classId,
}) => {
  const [selectedType, setSelectedType] = useState<DashboardWidget['widget_type'] | ''>('');
  const [title, setTitle] = useState('');
  const [dataSource, setDataSource] = useState('');
  
  const createWidget = useCreateDashboardWidget();

  const selectedWidgetType = widgetTypes.find(w => w.type === selectedType);

  const handleSubmit = () => {
    if (!selectedType || !title || !dataSource) return;

    // Find next available position
    const position = {
      x: 0,
      y: 0,
      w: selectedType === 'kpi' ? 3 : 6,
      h: selectedType === 'kpi' ? 3 : 4,
    };

    createWidget.mutate({
      layout_id: layoutId,
      widget_type: selectedType,
      title,
      data_source: dataSource,
      position,
      filters: {},
      config: {},
    });

    onClose();
    setSelectedType('');
    setTitle('');
    setDataSource('');
  };

  const handleClose = () => {
    onClose();
    setSelectedType('');
    setTitle('');
    setDataSource('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Widget Type Selection */}
          <div>
            <Label className="text-base font-medium">Choose Widget Type</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {widgetTypes.map((widget) => {
                const IconComponent = widget.icon;
                return (
                  <Card
                    key={widget.type}
                    className={`cursor-pointer transition-colors ${
                      selectedType === widget.type
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedType(widget.type)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-5 h-5" />
                        <CardTitle className="text-sm">{widget.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs">
                        {widget.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Widget Configuration */}
          {selectedType && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Widget Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Enter title for your ${selectedWidgetType?.name}`}
                />
              </div>

              <div>
                <Label htmlFor="dataSource">Data Source</Label>
                <Select value={dataSource} onValueChange={setDataSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select what data to display" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedWidgetType?.dataSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedType || !title || !dataSource || createWidget.isPending}
            >
              {createWidget.isPending ? 'Adding...' : 'Add Widget'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};