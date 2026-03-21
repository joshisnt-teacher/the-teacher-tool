import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useStrands } from '@/hooks/useStrands';
import { useContentItems } from '@/hooks/useContentItems';
import { useClassContentItems, useClassContentItemMutations } from '@/hooks/useClassContentItems';
import { Class } from '@/hooks/useClasses';

interface ClassCriteriaTabProps {
  classData: Class;
}

const truncateDescription = (description: string, maxLength = 150) => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + '...';
};

export const ClassCriteriaTab: React.FC<ClassCriteriaTabProps> = ({ classData }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: curricula = [], isLoading: curriculaLoading } = useCurriculum();
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>(classData.curriculum_id || '');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [expandedStrands, setExpandedStrands] = useState<Set<string>>(new Set());
  const [selectedContentItems, setSelectedContentItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: strands = [] } = useStrands(selectedCurriculum);
  const { data: contentItems = [] } = useContentItems({ curriculumId: selectedCurriculum });
  const { data: existingClassContentItems = [] } = useClassContentItems(classData.id);
  const { updateClassContentItems } = useClassContentItemMutations();

  React.useEffect(() => {
    if (existingClassContentItems.length > 0) {
      setSelectedContentItems(existingClassContentItems.map(item => item.content_item_id));
    }
  }, [existingClassContentItems]);

  const contentItemsByStrand = useMemo(() => {
    const grouped: Record<string, typeof contentItems> = {};
    contentItems.forEach(item => {
      if (item.strand) {
        if (!grouped[item.strand.id]) grouped[item.strand.id] = [];
        grouped[item.strand.id].push(item);
      }
    });
    return grouped;
  }, [contentItems]);

  const isStrandFullySelected = (strandId: string) => {
    const items = contentItemsByStrand[strandId] || [];
    return items.length > 0 && items.every(item => selectedContentItems.includes(item.id));
  };

  const isStrandPartiallySelected = (strandId: string) => {
    const items = contentItemsByStrand[strandId] || [];
    return items.some(item => selectedContentItems.includes(item.id)) && !isStrandFullySelected(strandId);
  };

  const handleContentItemToggle = (contentItemId: string, checked: boolean) => {
    setSelectedContentItems(prev =>
      checked ? [...prev, contentItemId] : prev.filter(id => id !== contentItemId)
    );
  };

  const toggleStrandExpansion = (strandId: string) => {
    setExpandedStrands(prev => {
      const next = new Set(prev);
      next.has(strandId) ? next.delete(strandId) : next.add(strandId);
      return next;
    });
  };

  const handleSelectAllStrand = (strandId: string, selectAll: boolean) => {
    const strandItemIds = (contentItemsByStrand[strandId] || []).map(item => item.id);
    setSelectedContentItems(prev =>
      selectAll
        ? [...prev, ...strandItemIds.filter(id => !prev.includes(id))]
        : prev.filter(id => !strandItemIds.includes(id))
    );
  };

  const handleSave = async () => {
    if (!selectedCurriculum) {
      toast({ title: 'No Curriculum Selected', description: 'Please select a curriculum before saving.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error: classError } = await supabase
        .from('classes')
        .update({ curriculum_id: selectedCurriculum })
        .eq('id', classData.id);

      if (classError) {
        if (classError.message.includes('curriculum_id')) {
          toast({
            title: 'Database Schema Update Required',
            description: 'Please run the migration to add curriculum_id column to classes table.',
            variant: 'destructive',
          });
          return;
        }
        throw classError;
      }

      await updateClassContentItems.mutateAsync({ classId: classData.id, contentItemIds: selectedContentItems });
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Curriculum and Content Items Saved',
        description: `Class has been linked to curriculum with ${selectedContentItems.length} content items.`,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save curriculum and content items.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCurriculumData = curricula.find(c => c.id === selectedCurriculum);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Content Descriptors &amp; Curriculum
        </CardTitle>
        <CardDescription>
          Link your class to a curriculum and select relevant content descriptors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Curriculum Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="curriculum-select">Select Curriculum</Label>
            <Select value={selectedCurriculum} onValueChange={setSelectedCurriculum} disabled={curriculaLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a curriculum..." />
              </SelectTrigger>
              <SelectContent>
                {curricula.map((curriculum) => (
                  <SelectItem key={curriculum.id} value={curriculum.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{curriculum.authority} - {curriculum.learning_area}</span>
                      <span className="text-sm text-muted-foreground">{curriculum.year_band} • {curriculum.version}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Select a curriculum to link all relevant content items to this class
            </p>
          </div>

          {selectedCurriculumData && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Selected Curriculum</h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedCurriculumData.authority}</Badge>
                  <Badge variant="outline">{selectedCurriculumData.learning_area}</Badge>
                  <Badge variant="outline">{selectedCurriculumData.year_band}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isDescriptionExpanded
                      ? selectedCurriculumData.year_level_description
                      : truncateDescription(selectedCurriculumData.year_level_description)}
                  </p>
                  {selectedCurriculumData.year_level_description.length > 150 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    >
                      {isDescriptionExpanded ? (
                        <><ChevronUp className="w-3 h-3 mr-1" />Read less</>
                      ) : (
                        <><ChevronDown className="w-3 h-3 mr-1" />Read more</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Descriptors */}
        {selectedCurriculum && strands.length > 0 && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Content Descriptors</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Select the content descriptors that apply to this class. Items are organized by curriculum strands.
              </p>

              <div className="space-y-3">
                {strands.map(strand => {
                  const strandContentItems = contentItemsByStrand[strand.id] || [];
                  if (strandContentItems.length === 0) return null;

                  const isExpanded = expandedStrands.has(strand.id);
                  const isFullySelected = isStrandFullySelected(strand.id);
                  const isPartiallySelected = isStrandPartiallySelected(strand.id);

                  return (
                    <div key={strand.id} className="border rounded-lg">
                      <div className="flex items-center justify-between p-4 bg-muted/20">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStrandExpansion(strand.id)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                          <h5 className="font-medium text-sm text-primary">{strand.name}</h5>
                          <Badge variant="secondary" className="text-xs">{strandContentItems.length} items</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {(isFullySelected || isPartiallySelected) && (
                            <Badge variant={isFullySelected ? 'default' : 'outline'} className="text-xs">
                              {isFullySelected ? 'All selected' : 'Partially selected'}
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAllStrand(strand.id, !isFullySelected)}
                            className="h-8 text-xs"
                          >
                            {isFullySelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 pt-0">
                          <div className="grid grid-cols-1 gap-3">
                            {strandContentItems.map(item => (
                              <div
                                key={item.id}
                                className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors"
                              >
                                <Checkbox
                                  id={`content-item-${item.id}`}
                                  checked={selectedContentItems.includes(item.id)}
                                  onCheckedChange={(checked) => handleContentItemToggle(item.id, checked as boolean)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <Label htmlFor={`content-item-${item.id}`} className="text-sm font-medium cursor-pointer">
                                    {item.code}
                                  </Label>
                                  {item.title && (
                                    <p className="text-sm font-medium text-muted-foreground mt-1">{item.title}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedContentItems.length > 0 && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{selectedContentItems.length}</span> content descriptor{selectedContentItems.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isLoading || !selectedCurriculum} size="lg">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
