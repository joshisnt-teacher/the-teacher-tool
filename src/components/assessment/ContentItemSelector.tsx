import React, { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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
import { useContentItems } from '@/hooks/useContentItems';

interface ContentItemSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
}

export const ContentItemSelector: React.FC<ContentItemSelectorProps> = ({
  selectedIds,
  onSelectionChange,
  placeholder = "Search content items...",
  maxSelections = 5,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const { data: contentItems = [], isLoading } = useContentItems({
    searchText: searchValue,
    searchCode: searchValue,
  });

  const selectedItems = contentItems.filter(item => selectedIds.includes(item.id));

  const handleSelect = (itemId: string) => {
    if (selectedIds.includes(itemId)) {
      // Remove item
      onSelectionChange(selectedIds.filter(id => id !== itemId));
    } else if (selectedIds.length < maxSelections) {
      // Add item
      onSelectionChange([...selectedIds, itemId]);
    }
  };

  const removeSelection = (itemId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== itemId));
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
              <Search className="w-4 h-4" />
              {selectedIds.length > 0 
                ? `${selectedIds.length} content item${selectedIds.length !== 1 ? 's' : ''} selected`
                : placeholder
              }
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-background border shadow-md z-50">
          <Command className="bg-background">
            <CommandInput 
              placeholder="Search by code or description..." 
              value={searchValue}
              onValueChange={setSearchValue}
              className="bg-background"
            />
            <CommandEmpty className="bg-background">
              {isLoading ? "Loading..." : "No content items found."}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto bg-background">
              {contentItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelect(item.id)}
                  className="flex items-center gap-2 bg-background hover:bg-muted cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.includes(item.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.code}
                      </Badge>
                      <span className="text-sm font-medium">
                        {item.strand?.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Items Display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span className="text-xs">
                {item.code}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  removeSelection(item.id);
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