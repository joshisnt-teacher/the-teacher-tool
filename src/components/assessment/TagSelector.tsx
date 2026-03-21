import React, { useState } from 'react';
import { Check, ChevronsUpDown, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useTags } from '@/hooks/useTags';

interface TagSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  type?: 'concept' | 'capability' | 'blooms_taxonomy';
  placeholder?: string;
  maxSelections?: number;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedIds,
  onSelectionChange,
  type,
  placeholder = "Search tags...",
  maxSelections = 10,
}) => {
  const [open, setOpen] = useState(false);
  
  const { data: tags = [], isLoading } = useTags(type);
  const selectedTags = tags.filter(tag => selectedIds.includes(tag.id));

  const handleSelect = (tagId: string) => {
    if (selectedIds.includes(tagId)) {
      // Remove tag
      onSelectionChange(selectedIds.filter(id => id !== tagId));
    } else if (selectedIds.length < maxSelections) {
      // Add tag
      onSelectionChange([...selectedIds, tagId]);
    }
  };

  const removeSelection = (tagId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== tagId));
  };

  const getTypeColor = (tagType: string) => {
    switch (tagType) {
      case 'concept':
        return 'bg-blue-100 text-blue-800';
      case 'capability':
        return 'bg-green-100 text-green-800';
      case 'blooms_taxonomy':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {selectedIds.length > 0 
                ? `${selectedIds.length} tag${selectedIds.length !== 1 ? 's' : ''} selected`
                : placeholder
              }
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-background border shadow-md z-50">
          <Command className="bg-background">
            <CommandInput placeholder="Search tags..." className="bg-background" />
            <CommandEmpty className="bg-background">
              {isLoading ? "Loading..." : "No tags found."}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto bg-background">
              {tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={() => handleSelect(tag.id)}
                  className="flex items-center gap-2 bg-background hover:bg-muted cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getTypeColor(tag.type))}
                    >
                      {tag.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm">{tag.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              className={cn("flex items-center gap-1", getTypeColor(tag.type))}
            >
              <span className="text-xs">{tag.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  removeSelection(tag.id);
                }}
              >
                ×
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};