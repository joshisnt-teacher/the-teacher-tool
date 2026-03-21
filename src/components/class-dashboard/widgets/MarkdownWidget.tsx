import React from 'react';
import { DashboardWidget } from '@/hooks/useDashboardWidgets';

interface MarkdownWidgetProps {
  widget: DashboardWidget;
  classId: string;
}

export const MarkdownWidget: React.FC<MarkdownWidgetProps> = ({ widget }) => {
  // For now, render basic text. In a full implementation, you'd use a markdown parser
  const content = widget.config?.content || 'Add your notes here...';

  return (
    <div className="h-full w-full overflow-auto">
      <div className="prose prose-sm max-w-none text-sm leading-relaxed">
        {content.split('\n').map((line: string, index: number) => (
          <p key={index} className="mb-2 last:mb-0">
            {line || '\u00A0'}
          </p>
        ))}
      </div>
    </div>
  );
};