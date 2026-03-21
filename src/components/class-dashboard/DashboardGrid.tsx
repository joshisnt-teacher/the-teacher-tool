import React, { useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { DashboardWidget, useUpdateDashboardWidget } from '@/hooks/useDashboardWidgets';
import { WidgetWrapper } from './widgets/WidgetWrapper';
import { KPIWidget } from './widgets/KPIWidget';
import { LineChartWidget } from './widgets/LineChartWidget';
import { BarChartWidget } from './widgets/BarChartWidget';
import { PieChartWidget } from './widgets/PieChartWidget';
import { HeatmapWidget } from './widgets/HeatmapWidget';
import { MarkdownWidget } from './widgets/MarkdownWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  widgets: DashboardWidget[];
  isEditMode: boolean;
  layoutId: string;
  classId: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  isEditMode,
  layoutId,
  classId,
}) => {
  const updateWidget = useUpdateDashboardWidget();

  const layouts = useMemo(() => {
    const layout: Layout[] = widgets.map(widget => ({
      i: widget.id,
      x: widget.position.x || 0,
      y: widget.position.y || 0,
      w: widget.position.w || 4,
      h: widget.position.h || 4,
      minW: 2,
      minH: 2,
    }));

    return { lg: layout, md: layout, sm: layout, xs: layout, xxs: layout };
  }, [widgets]);

  const handleLayoutChange = (layout: Layout[]) => {
    if (!isEditMode) return;

    layout.forEach(item => {
      const widget = widgets.find(w => w.id === item.i);
      if (widget) {
        const newPosition = { x: item.x, y: item.y, w: item.w, h: item.h };
        if (JSON.stringify(widget.position) !== JSON.stringify(newPosition)) {
          updateWidget.mutate({
            id: widget.id,
            position: newPosition,
          });
        }
      }
    });
  };

  const renderWidget = (widget: DashboardWidget) => {
    const baseProps = {
      widget,
      classId,
    };

    let WidgetComponent;
    switch (widget.widget_type) {
      case 'kpi':
        WidgetComponent = KPIWidget;
        break;
      case 'line_chart':
        WidgetComponent = LineChartWidget;
        break;
      case 'bar_chart':
        WidgetComponent = BarChartWidget;
        break;
      case 'pie_chart':
        WidgetComponent = PieChartWidget;
        break;
      case 'heatmap':
        WidgetComponent = HeatmapWidget;
        break;
      case 'markdown':
        WidgetComponent = MarkdownWidget;
        break;
      default:
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Unknown widget type: {widget.widget_type}
          </div>
        );
    }

    return (
      <WidgetWrapper key={widget.id} widget={widget} isEditMode={isEditMode}>
        <WidgetComponent {...baseProps} />
      </WidgetWrapper>
    );
  };

  return (
    <div className={`w-full ${isEditMode ? 'dashboard-edit-mode' : ''}`}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {widgets.map(widget => (
          <div key={widget.id} className="dashboard-widget-container">
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>

      <style>{`
        /* React Grid Layout essential styles */
        .react-grid-layout {
          position: relative;
        }
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
          position: absolute;
        }
        .react-grid-item.cssTransforms {
          transition-property: transform;
        }
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTk5IiBkPSJtMTUgMTJsLTMtM3YxSDlWOUg2djFsMy0zeiIvPgo8L3N2Zz4K');
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }
        
        /* Dashboard specific styles */
        .dashboard-edit-mode .react-grid-item {
          border: 2px dashed hsl(var(--border));
          transition: border-color 0.2s ease;
        }
        .dashboard-edit-mode .react-grid-item:hover {
          border-color: hsl(var(--primary));
        }
        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.1) !important;
          border: 2px dashed hsl(var(--primary)) !important;
        }
        .dashboard-widget-container {
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
};