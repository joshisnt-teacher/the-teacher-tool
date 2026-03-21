import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen } from 'lucide-react';
import { useContentItemByCode } from '@/hooks/useContentItems';
import { useNavigate } from 'react-router-dom';

interface ContentItemBadgeProps {
  contentItemCode: string;
}

export const ContentItemBadge: React.FC<ContentItemBadgeProps> = ({ contentItemCode }) => {
  const { data: contentItem, isLoading } = useContentItemByCode(contentItemCode);
  const navigate = useNavigate();

  const handleClick = () => {
    if (contentItem?.id) {
      navigate(`/curriculum-browser/content/${contentItem.id}`);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-block">
          <Badge 
            variant="outline" 
            className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center"
            onClick={handleClick}
          >
            <BookOpen className="w-3 h-3 mr-1" />
            {contentItemCode}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <div className="font-medium">{contentItemCode}</div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading description...</div>
          ) : contentItem?.description ? (
            <div className="text-sm text-muted-foreground">{contentItem.description}</div>
          ) : (
            <div className="text-sm text-muted-foreground">No description available</div>
          )}
          <div className="text-xs text-muted-foreground">Click to view in curriculum browser</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
