import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';
import 'survey-core/defaultV2.min.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Trash2, Plus, GripVertical, Eye } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClasses } from '@/hooks/useClasses';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SurveyChoice = string;

type PaletteType = 'radiogroup' | 'text' | 'comment' | 'rating' | 'html' | 'image';

type QuestionElement = {
  type: 'radiogroup' | 'text' | 'comment' | 'rating';
  name: string;
  title: string;
  isRequired?: boolean;
  choices?: SurveyChoice[];
  maxLength?: number;
  rows?: number;
  rateMin?: number;
  rateMax?: number;
};

type HtmlElement = {
  type: 'html';
  name: string;
  html: string;
  title?: string;
};

type ImageElement = {
  type: 'image';
  name: string;
  imageLink?: string;
  imageAlt?: string;
  title?: string;
};

type SurveyElement = QuestionElement | HtmlElement | ImageElement;

interface SurveySchema {
  elements: SurveyElement[];
}

interface PaletteItem {
  type: PaletteType;
  label: string;
  description: string;
}

let uidCounter = 0;
const uid = (prefix = 'q') => {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter}`;
};

const createShortAnswerElement = (): QuestionElement => ({
  type: 'text',
  name: uid('question'),
  title: 'Short answer question',
  maxLength: 200,
  isRequired: false,
});

const createDefaultSurvey = (): SurveySchema => ({
  elements: [createShortAnswerElement()],
});

const paletteItems: PaletteItem[] = [
  {
    type: 'radiogroup',
    label: 'Multiple Choice',
    description: 'Single answer question with multiple choices.',
  },
  {
    type: 'text',
    label: 'Short Answer',
    description: 'One-line text response field.',
  },
  {
    type: 'comment',
    label: 'Long Answer',
    description: 'Multi-line text response field.',
  },
  {
    type: 'rating',
    label: 'Rating',
    description: 'Numerical rating scale question.',
  },
  {
    type: 'html',
    label: 'Text Block',
    description: 'Static content block for instructions or context.',
  },
  {
    type: 'image',
    label: 'Image Block',
    description: 'Display an image within the survey.',
  },
];

const createTemplateElement = (type: PaletteType): SurveyElement => {
  switch (type) {
    case 'radiogroup':
      return {
        type: 'radiogroup',
        name: uid('question'),
        title: 'Multiple choice question',
        isRequired: true,
        choices: ['Option A', 'Option B', 'Option C'],
      };
    case 'text':
      return {
        type: 'text',
        name: uid('question'),
        title: 'Short answer question',
        maxLength: 200,
        isRequired: false,
      };
    case 'comment':
      return {
        type: 'comment',
        name: uid('question'),
        title: 'Long answer question',
        rows: 5,
        maxLength: 1000,
        isRequired: false,
      };
    case 'rating':
      return {
        type: 'rating',
        name: uid('question'),
        title: 'Rating question',
        isRequired: false,
        rateMin: 1,
        rateMax: 5,
      };
    case 'html':
      return {
        type: 'html',
        name: uid('text'),
        html: '<p>Static text block</p>',
        title: 'Text Block',
      };
    case 'image':
      return {
        type: 'image',
        name: uid('image'),
        imageLink: 'https://placehold.co/600x400',
        imageAlt: 'Descriptive alternative text',
        title: 'Image Block',
      };
    default:
      return createShortAnswerElement();
  }
};

const cloneSchema = (schema: SurveySchema): SurveySchema => JSON.parse(JSON.stringify(schema));

const normalizeSchema = (input: any): SurveySchema => {
  if (!input || typeof input !== 'object') {
    return createDefaultSurvey();
  }

  const rawElements = Array.isArray(input.elements) ? input.elements : [];
  if (rawElements.length === 0) {
    return createDefaultSurvey();
  }

  const elements: SurveyElement[] = rawElements.map((raw: any) => {
    const baseName = typeof raw?.name === 'string' && raw.name ? raw.name : uid('question');
    const type = raw?.type as PaletteType;

    switch (type) {
      case 'radiogroup': {
        const rawChoices = Array.isArray(raw?.choices) ? raw.choices : [];
        const choices = rawChoices.length
          ? rawChoices.map((choice: any, index: number) => {
              if (typeof choice === 'string') return choice;
              if (choice && typeof choice === 'object') {
                return (
                  choice.value ??
                  choice.text ??
                  `Option ${String.fromCharCode(65 + index)}`
                );
              }
              return `Option ${String.fromCharCode(65 + index)}`;
            })
          : ['Option A', 'Option B', 'Option C'];

        return {
          type: 'radiogroup',
          name: baseName,
          title: raw?.title || 'Multiple choice question',
          isRequired: !!raw?.isRequired,
          choices,
        } satisfies QuestionElement;
      }
      case 'comment':
        return {
          type: 'comment',
          name: baseName,
          title: raw?.title || 'Long answer question',
          isRequired: !!raw?.isRequired,
          rows: Number(raw?.rows) || 5,
          maxLength: raw?.maxLength ? Number(raw.maxLength) : undefined,
        } satisfies QuestionElement;
      case 'rating':
        return {
          type: 'rating',
          name: baseName,
          title: raw?.title || 'Rating question',
          isRequired: !!raw?.isRequired,
          rateMin: Number.isFinite(Number(raw?.rateMin)) ? Number(raw.rateMin) : 1,
          rateMax: Number.isFinite(Number(raw?.rateMax)) ? Number(raw.rateMax) : 5,
        } satisfies QuestionElement;
      case 'text':
        return {
          type: 'text',
          name: baseName,
          title: raw?.title || 'Short answer question',
          isRequired: !!raw?.isRequired,
          maxLength: Number.isFinite(Number(raw?.maxLength)) ? Number(raw.maxLength) : 200,
        } satisfies QuestionElement;
      case 'html':
        return {
          type: 'html',
          name: baseName,
          html: typeof raw?.html === 'string' ? raw.html : '<p>Static text block</p>',
          title: raw?.title || 'Text Block',
        } satisfies HtmlElement;
      case 'image':
        return {
          type: 'image',
          name: baseName,
          imageLink: raw?.imageLink || raw?.image || raw?.url || 'https://placehold.co/600x400',
          imageAlt: raw?.imageAlt || raw?.altText || 'Image description',
          title: raw?.title || 'Image Block',
        } satisfies ImageElement;
      default:
        return createShortAnswerElement();
    }
  });

  return { elements };
};

const sanitizeSchemaForSave = (schema: SurveySchema): SurveySchema => cloneSchema(schema);

const getElementLabel = (element: SurveyElement, index: number) => {
  const base = element.title || element.name;
  switch (element.type) {
    case 'radiogroup':
      return `${index + 1}. ${base || 'Multiple choice question'}`;
    case 'text':
      return `${index + 1}. ${base || 'Short answer question'}`;
    case 'comment':
      return `${index + 1}. ${base || 'Long answer question'}`;
    case 'rating':
      return `${index + 1}. ${base || 'Rating question'}`;
    case 'html':
      return `${index + 1}. Text block`;
    case 'image':
      return `${index + 1}. Image block`;
    default:
      return `${index + 1}. Survey item`;
  }
};

const generateJoinCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getElementPreview = (element: SurveyElement): string => {
  switch (element.type) {
    case 'radiogroup': {
      const choices = element.choices || [];
      if (choices.length > 0) {
        const preview = choices.slice(0, 3).join(', ');
        return choices.length > 3 ? `${preview}... (+${choices.length - 3} more)` : preview;
      }
      return 'No choices yet';
    }
    case 'text': {
      const title = element.title || 'Short answer question';
      const maxLength = element.maxLength ? ` (max ${element.maxLength} chars)` : '';
      return `${title}${maxLength}`;
    }
    case 'comment': {
      const title = element.title || 'Long answer question';
      const details = [];
      if (element.rows) details.push(`${element.rows} rows`);
      if (element.maxLength) details.push(`max ${element.maxLength} chars`);
      return details.length > 0 ? `${title} (${details.join(', ')})` : title;
    }
    case 'rating': {
      const title = element.title || 'Rating question';
      const min = element.rateMin ?? 1;
      const max = element.rateMax ?? 5;
      return `${title} (${min}-${max})`;
    }
    case 'html': {
      if (!element.html) return 'Empty HTML block';
      const textContent = element.html.replace(/<[^>]*>/g, '');
      const preview = textContent.substring(0, 50);
      return textContent.length > 50 ? `${preview}...` : preview || 'Empty HTML block';
    }
    case 'image': {
      if (element.imageLink) {
        return element.imageAlt || element.imageLink.substring(0, 40) + (element.imageLink.length > 40 ? '...' : '');
      }
      return 'No image URL';
    }
    default:
      return '';
  }
};

interface SortableOutlineItemProps {
  element: SurveyElement;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  isFormDisabled: boolean;
}

const SortableOutlineItem: React.FC<SortableOutlineItemProps> = ({
  element,
  index,
  isSelected,
  onSelect,
  onRemove,
  isFormDisabled,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const preview = getElementPreview(element);
  const isQuestion = element.type === 'radiogroup' || element.type === 'text' || element.type === 'comment' || element.type === 'rating';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-1.5 rounded-md border px-3 py-2.5 text-sm transition-colors ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border/70 hover:bg-muted/40'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="font-medium break-words">
              {getElementLabel(element, index)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={isFormDisabled}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {preview && (
        <div className="pl-6 text-xs text-muted-foreground break-words line-clamp-2">
          {preview}
        </div>
      )}
      {isQuestion && 'isRequired' in element && element.isRequired && (
        <div className="pl-6">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
            Required
          </span>
        </div>
      )}
    </div>
  );
};

const CreateSurveyActivity = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activityIdParam = searchParams.get('activityId');
  const { toast } = useToast();
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useCurrentUser();
  const { data: classes = [], isLoading: isLoadingClasses } = useClasses();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const defaultSurveyRef = useRef(createDefaultSurvey());
  const [surveyJson, setSurveyJson] = useState<SurveySchema>(defaultSurveyRef.current);
  const [selectedElementName, setSelectedElementName] = useState<string | null>(
    defaultSurveyRef.current.elements[0]?.name ?? null
  );
  const [activityId, setActivityId] = useState<string | null>(activityIdParam);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(Boolean(activityIdParam));
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autosaveResetRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  const isEditing = Boolean(activityId || activityIdParam);
  const isFormDisabled = isSaving || isDeleting || isPublishing || isLoadingSurvey || isLoadingCurrentUser;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSurveyJson((prev) => {
        const oldIndex = prev.elements.findIndex((el) => el.name === active.id);
        const newIndex = prev.elements.findIndex((el) => el.name === over.id);

        return {
          ...prev,
          elements: arrayMove(prev.elements, oldIndex, newIndex),
        };
      });
    }
  };

  const selectedElement = useMemo(() => {
    if (!selectedElementName) return null;
    return surveyJson.elements.find((element) => element.name === selectedElementName) ?? null;
  }, [surveyJson, selectedElementName]);

  useEffect(() => {
    if (!activityIdParam || !currentUser?.school_id || isLoadingCurrentUser) {
      if (!activityIdParam && !isLoadingCurrentUser) {
        hasLoadedRef.current = true;
        setIsLoadingSurvey(false);
      }
      return;
    }

    const loadSurvey = async (existingActivityId: string) => {
      setIsLoadingSurvey(true);
      try {
        const { data, error } = await supabase
          .from('activities')
          .select(`
            id,
            title,
            description,
            status,
            class_id,
            activity_forms (
              schema_json
            )
          `)
          .eq('id', existingActivityId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast({
            title: 'Form not found',
            description: 'The requested form could not be found.',
            variant: 'destructive',
          });
          return;
        }

        setActivityId(data.id);
        setTitle(data.title ?? '');
        setDescription(data.description ?? '');
        setStatus(data.status === 'published' ? 'published' : 'draft');
        setSelectedClassId(data.class_id);

        const formRecord = Array.isArray(data.activity_forms)
          ? data.activity_forms[0]
          : data.activity_forms;

        const schemaInput = formRecord?.schema_json;
        const parsedSchema = typeof schemaInput === 'string' ? JSON.parse(schemaInput) : schemaInput;
        const normalized = normalizeSchema(parsedSchema);

        setSurveyJson(normalized);
        setSelectedElementName(normalized.elements[0]?.name ?? null);
      } catch (loadError: any) {
        console.error('Error loading form:', loadError);
        toast({
          title: 'Failed to load form',
          description: loadError?.message || 'An unexpected error occurred while loading the form.',
          variant: 'destructive',
        });
      } finally {
        hasLoadedRef.current = true;
        setIsLoadingSurvey(false);
      }
    };

    loadSurvey(activityIdParam);
  }, [activityIdParam, currentUser?.school_id, isLoadingCurrentUser, toast]);

  useEffect(() => {
    if (selectedElementName) return;
    if (surveyJson.elements.length > 0) {
      setSelectedElementName(surveyJson.elements[0].name);
    }
  }, [surveyJson.elements, selectedElementName]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (isSaving || isDeleting || isPublishing || isLoadingSurvey) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    setAutosaveState('saving');

    autosaveTimeoutRef.current = setTimeout(() => {
      (async () => {
        try {
          await persist({ auto: true });
          setAutosaveState('saved');
          if (autosaveResetRef.current) {
            clearTimeout(autosaveResetRef.current);
          }
          autosaveResetRef.current = setTimeout(() => setAutosaveState('idle'), 2000);
        } catch (error) {
          console.error('Autosave failed:', error);
          setAutosaveState('error');
        }
      })();
    }, 700);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [title, description, surveyJson]);

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      if (autosaveResetRef.current) {
        clearTimeout(autosaveResetRef.current);
      }
    };
  }, []);

  const updateElement = (name: string, updater: (element: SurveyElement) => SurveyElement) => {
    setSurveyJson((prev) => {
      const updatedElements = prev.elements.map((element) =>
        element.name === name ? updater({ ...element }) : element
      );
      return { ...prev, elements: updatedElements };
    });
  };

  const addElement = (type: PaletteType) => {
    const newElement = createTemplateElement(type);
    setSurveyJson((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedElementName(newElement.name);
  };

  const moveElement = (name: string, direction: number) => {
    setSurveyJson((prev) => {
      const index = prev.elements.findIndex((element) => element.name === name);
      if (index === -1) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.elements.length) return prev;

      const updated = [...prev.elements];
      const [moved] = updated.splice(index, 1);
      updated.splice(newIndex, 0, moved);

      return { ...prev, elements: updated };
    });
  };

  const removeElement = (name: string) => {
    let nextSelection: string | null = null;
    setSurveyJson((prev) => {
      const index = prev.elements.findIndex((element) => element.name === name);
      if (index === -1) return prev;
      const updated = prev.elements.filter((element) => element.name !== name);
      nextSelection = updated[index]?.name ?? updated[index - 1]?.name ?? null;
      return { ...prev, elements: updated };
    });
    setSelectedElementName(nextSelection);
  };

  const persist = async ({ auto }: { auto: boolean }): Promise<string | null> => {
    if (isLoadingCurrentUser) {
      if (auto) return null;
      throw new Error('User is still loading.');
    }

    if (!currentUser) {
      if (auto) return null;
      throw new Error('User session not found.');
    }

    if (!currentUser.school_id) {
      if (auto) return null;
      throw new Error('You must belong to a school to create activities.');
    }

    let workingActivityId = activityId;
    const normalizedTitle = title.trim() || 'Untitled Form';
    const normalizedDescription = description.trim();

    try {
      if (!workingActivityId) {
        // Generate join code for new activity
        let joinCode = generateJoinCode();
        let codeExists = true;
        let attempts = 0;
        
        // Ensure unique join code (check if it exists, regenerate if needed)
        while (codeExists && attempts < 10) {
          const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('join_code', joinCode)
            .maybeSingle();
          
          if (!existing) {
            codeExists = false;
          } else {
            joinCode = generateJoinCode();
            attempts++;
          }
        }

        const { data: activity, error: insertError } = await supabase
          .from('activities')
          .insert({
            school_id: currentUser.school_id,
            created_by: currentUser.id,
            class_id: selectedClassId || null,
            title: normalizedTitle,
            description: normalizedDescription ? normalizedDescription : null,
            type: 'FORM',
            status: 'draft',
            join_code: joinCode,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (!activity) throw new Error('Failed to create form activity.');

        workingActivityId = activity.id;
        setActivityId(activity.id);
        setStatus('draft');
      } else {
        const { error: updateError } = await supabase
          .from('activities')
          .update({
            title: normalizedTitle,
            description: normalizedDescription ? normalizedDescription : null,
            status: status,
            class_id: selectedClassId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workingActivityId);

        if (updateError) throw updateError;
      }

      const schemaToSave = sanitizeSchemaForSave(surveyJson);

      const { error: formError } = await supabase
        .from('activity_forms')
        .upsert(
          {
            activity_id: workingActivityId,
            schema_json: schemaToSave,
          },
          {
            onConflict: 'activity_id',
          }
        );

      if (formError) throw formError;

      hasLoadedRef.current = true;
      return workingActivityId;
    } catch (persistError) {
      if (!auto) throw persistError;
      throw persistError;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await persist({ auto: false });
      setAutosaveState('saved');
      if (autosaveResetRef.current) {
        clearTimeout(autosaveResetRef.current);
      }
      autosaveResetRef.current = setTimeout(() => setAutosaveState('idle'), 2000);
      toast({
        title: 'Form Saved',
        description: 'Your form has been saved successfully.',
      });
    } catch (saveError: any) {
      console.error('Error saving form:', saveError);
      setAutosaveState('error');
      toast({
        title: 'Failed to save form',
        description: saveError?.message || 'An unexpected error occurred while saving the form.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activityId) {
      navigate('/activities');
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast({
        title: 'Form Deleted',
        description: 'The form activity has been deleted.',
      });

      navigate('/activities');
    } catch (deleteError: any) {
      console.error('Error deleting form:', deleteError);
      toast({
        title: 'Failed to delete form',
        description: deleteError?.message || 'An unexpected error occurred while deleting the form.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublishToggle = async () => {
    if (isPublishing) return;

    setIsPublishing(true);
    try {
      let ensuredActivityId = activityId;
      if (!ensuredActivityId) {
        ensuredActivityId = await persist({ auto: false });
        if (!ensuredActivityId) {
          throw new Error('Unable to create activity before publishing.');
        }
        setActivityId(ensuredActivityId);
      }

      const nextStatus = status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('activities')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', ensuredActivityId);

      if (error) throw error;

      setStatus(nextStatus);

      toast({
        title: nextStatus === 'published' ? 'Form Published' : 'Form Unpublished',
        description: nextStatus === 'published'
          ? 'Students can now access this form.'
          : 'Form is no longer visible to students.',
      });
    } catch (publishError: any) {
      console.error('Error updating publish state:', publishError);
      toast({
        title: 'Failed to update publish state',
        description: publishError?.message || 'An unexpected error occurred when updating publish status.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const surveyModel = useMemo(() => {
    const model = new Model(cloneSchema(surveyJson) as any);
    model.mode = 'display';
    model.showQuestionNumbers = 'on';
    model.showProgressBar = 'off';
    model.showNavigationButtons = false;
    return model;
  }, [surveyJson]);

  const handlePreviewForm = () => {
    const schema = cloneSchema(surveyJson);
    const schemaJson = JSON.stringify(schema);
    
    const previewWindow = window.open('', '_blank', 'width=900,height=700');
    if (!previewWindow) {
      toast({
        title: 'Popup blocked',
        description: 'Please allow popups for this site to preview the form.',
        variant: 'destructive',
      });
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Form Preview</title>
  <link href="https://unpkg.com/survey-core@1.9.129/defaultV2.min.css" type="text/css" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    #surveyContainer {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div id="surveyContainer"></div>
  <script src="https://cdn.jsdelivr.net/npm/survey-core@1.9.129/survey.core.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/survey-js-ui@1.9.129/survey-js-ui.min.js"></script>
  <script>
    (function() {
      const schema = ${schemaJson};
      let attempts = 0;
      const maxAttempts = 50;
      
      function initSurvey() {
        attempts++;
        if (typeof Survey === 'undefined' || typeof Survey.Survey === 'undefined') {
          if (attempts < maxAttempts) {
            setTimeout(initSurvey, 100);
          } else {
            const container = document.getElementById('surveyContainer');
            if (container) {
              container.innerHTML = '<div style="color: red; padding: 20px; text-align: center;"><p>Failed to load SurveyJS library.</p><p style="font-size: 12px; margin-top: 10px;">Please check your internet connection.</p></div>';
            }
          }
          return;
        }
        
        try {
          const survey = new Survey.Survey(schema);
          survey.mode = 'display';
          survey.showQuestionNumbers = 'on';
          survey.showProgressBar = 'off';
          survey.showNavigationButtons = false;
          survey.render('surveyContainer');
        } catch (error) {
          console.error('Error rendering survey:', error);
          const container = document.getElementById('surveyContainer');
          if (container) {
            container.innerHTML = '<div style="color: red; padding: 20px; text-align: center;"><p>Error loading form preview.</p><p style="font-size: 12px; margin-top: 10px;">' + (error.message || 'Unknown error') + '</p><pre style="font-size: 10px; text-align: left; margin-top: 10px; overflow: auto;">' + JSON.stringify(schema, null, 2).substring(0, 500) + '</pre></div>';
          }
        }
      }
      
      // Wait for scripts to load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(initSurvey, 200);
        });
      } else {
        setTimeout(initSurvey, 200);
      }
    })();
  </script>
</body>
</html>`;

    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
  };

  const renderAutosaveStatus = () => {
    switch (autosaveState) {
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Autosaving…
          </span>
        );
      case 'saved':
        return <span className="text-xs text-muted-foreground">Saved</span>;
      case 'error':
        return <span className="text-xs text-destructive">Autosave failed</span>;
      default:
        return null;
    }
  };

  const isQuestionElement = (element: SurveyElement | null): element is QuestionElement => {
    if (!element) return false;
    return element.type === 'radiogroup' || element.type === 'text' || element.type === 'comment' || element.type === 'rating';
  };

  const addChoice = (element: QuestionElement) => {
    if (element.type !== 'radiogroup') return;
    const nextIndex = (element.choices?.length ?? 0) + 1;
    const nextChoice = `Option ${String.fromCharCode(64 + nextIndex)}`;
    updateElement(element.name, (current) => {
      if (current.type !== 'radiogroup') return current;
      const choices = current.choices ? [...current.choices, nextChoice] : [nextChoice];
      return { ...current, choices };
    });
  };

  const updateChoice = (element: QuestionElement, choiceIndex: number, value: string) => {
    if (element.type !== 'radiogroup' || !element.choices) return;
    updateElement(element.name, (current) => {
      if (current.type !== 'radiogroup' || !current.choices) return current;
      const updatedChoices = [...current.choices];
      updatedChoices[choiceIndex] = value;
      return { ...current, choices: updatedChoices };
    });
  };

  const removeChoice = (element: QuestionElement, choiceIndex: number) => {
    if (element.type !== 'radiogroup' || !element.choices) return;
    updateElement(element.name, (current) => {
      if (current.type !== 'radiogroup' || !current.choices) return current;
      const updatedChoices = current.choices.filter((_, index) => index !== choiceIndex);
      return { ...current, choices: updatedChoices.length ? updatedChoices : ['Option A', 'Option B'] };
    });
  };

  const outlineElements = surveyJson.elements;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activities')}
              disabled={isFormDisabled}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Activities
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {isEditing ? 'Edit Form' : 'Create Form'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Build and configure your form
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={status === 'published'}
                onCheckedChange={handlePublishToggle}
                disabled={isPublishing || isFormDisabled}
                aria-label="Toggle publish"
              />
              <span className="text-sm text-muted-foreground">
                {status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
            {renderAutosaveStatus()}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePreviewForm}
                disabled={isFormDisabled || surveyJson.elements.length === 0}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Form
              </Button>
              <Button
                variant={isEditing ? 'destructive' : 'outline'}
                onClick={handleDelete}
                disabled={isFormDisabled}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {isEditing ? 'Delete' : 'Discard'}
              </Button>
              <Button onClick={handleSave} disabled={isFormDisabled}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEditing ? 'Update Form' : 'Save Form'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle>Form Details</CardTitle>
              <CardDescription className="text-xs">Set the title and description for your form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Title *</Label>
                  <Input
                    id="form-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter form title"
                    disabled={isFormDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-description">Description</Label>
                  <Textarea
                    id="form-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the purpose of this form (optional)"
                    rows={3}
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-class">Link to Class (Optional)</Label>
                <Select
                  value={selectedClassId || 'none'}
                  onValueChange={(value) => setSelectedClassId(value === 'none' ? null : value)}
                  disabled={isFormDisabled || isLoadingClasses}
                >
                  <SelectTrigger id="form-class">
                    <SelectValue placeholder="Select a class (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.class_name}
                        {classItem.subject ? ` - ${classItem.subject}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link this activity to a specific class. Students in that class will see this activity.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[260px_1fr_320px]">
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Question</CardTitle>
                  <CardDescription className="text-xs">Choose a block to append to the form</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {paletteItems.map((item) => (
                    <Button
                      key={item.type}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4 whitespace-normal"
                      onClick={() => addElement(item.type)}
                      disabled={isFormDisabled}
                    >
                      <div className="w-full text-left space-y-1">
                        <div className="font-medium break-words">{item.label}</div>
                        <div className="text-xs text-muted-foreground break-words leading-relaxed">{item.description}</div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Form Outline</CardTitle>
                  <CardDescription className="text-xs">Reorder or select form items</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {outlineElements.length === 0 && (
                    <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground break-words">
                      No items yet. Add questions to get started.
                    </div>
                  )}
                  {outlineElements.length > 0 && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={outlineElements.map((el) => el.name)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {outlineElements.map((element, index) => (
                            <SortableOutlineItem
                              key={element.name}
                              element={element}
                              index={index}
                              isSelected={selectedElementName === element.name}
                              onSelect={() => setSelectedElementName(element.name)}
                              onRemove={() => removeElement(element.name)}
                              isFormDisabled={isFormDisabled}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Properties</CardTitle>
                  <CardDescription className="text-xs">Configure the selected item</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedElement && (
                    <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground break-words">
                      Select a form item to edit its properties.
                    </div>
                  )}

                  {selectedElement && (
                    <div className="space-y-4">
                      {isQuestionElement(selectedElement) && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="question-title">Title / Prompt</Label>
                            <Textarea
                              id="question-title"
                              value={selectedElement.title}
                              onChange={(e) =>
                                updateElement(selectedElement.name, (current) => ({
                                  ...current,
                                  title: e.target.value,
                                }))
                              }
                              rows={2}
                              disabled={isFormDisabled}
                              className="resize-none"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5">
                            <div className="flex-1 min-w-0">
                              <Label className="text-sm font-medium block">Required</Label>
                              <p className="text-xs text-muted-foreground break-words">
                                Student must answer this question.
                              </p>
                            </div>
                            <Switch
                              checked={!!selectedElement.isRequired}
                              onCheckedChange={(value) =>
                                updateElement(selectedElement.name, (current) => ({
                                  ...current,
                                  isRequired: value,
                                }))
                              }
                              disabled={isFormDisabled}
                            />
                          </div>
                        </div>
                      )}

                      {selectedElement?.type === 'radiogroup' && (
                        <div className="space-y-3">
                          <Label>Choices</Label>
                          <div className="space-y-2">
                            {(selectedElement.choices || []).map((choice, index) => (
                              <div key={`${selectedElement.name}-choice-${index}`} className="flex items-center gap-2">
                                <Input
                                  value={choice}
                                  onChange={(e) => updateChoice(selectedElement, index, e.target.value)}
                                  disabled={isFormDisabled}
                                  className="flex-1 min-w-0"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => removeChoice(selectedElement, index)}
                                  disabled={isFormDisabled || (selectedElement.choices?.length ?? 0) <= 2}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addChoice(selectedElement)}
                            disabled={isFormDisabled}
                            className="w-full"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add Choice
                          </Button>
                        </div>
                      )}

                      {selectedElement?.type === 'text' && (
                        <div className="space-y-2">
                          <Label htmlFor="max-length">Max length</Label>
                          <Input
                            id="max-length"
                            type="number"
                            min={1}
                            value={selectedElement.maxLength ?? 200}
                            onChange={(e) =>
                              updateElement(selectedElement.name, (current) => ({
                                ...current,
                                maxLength: Math.max(1, Number(e.target.value) || 200),
                              }))
                            }
                            disabled={isFormDisabled}
                          />
                        </div>
                      )}

                      {selectedElement?.type === 'comment' && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="rows">Rows</Label>
                            <Input
                              id="rows"
                              type="number"
                              min={1}
                              value={selectedElement.rows ?? 5}
                              onChange={(e) =>
                                updateElement(selectedElement.name, (current) => ({
                                  ...current,
                                  rows: Math.max(1, Number(e.target.value) || 5),
                                }))
                              }
                              disabled={isFormDisabled}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="comment-max-length">Max length</Label>
                            <Input
                              id="comment-max-length"
                              type="number"
                              min={1}
                              value={selectedElement.maxLength ?? 1000}
                              onChange={(e) =>
                                updateElement(selectedElement.name, (current) => ({
                                  ...current,
                                  maxLength: Math.max(1, Number(e.target.value) || 1000),
                                }))
                              }
                              disabled={isFormDisabled}
                            />
                          </div>
                        </div>
                      )}

                      {selectedElement?.type === 'rating' && (
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="rate-min">Minimum</Label>
                            <Input
                              id="rate-min"
                              type="number"
                              value={selectedElement.rateMin ?? 1}
                              onChange={(e) =>
                                updateElement(selectedElement.name, (current) => ({
                                  ...current,
                                  rateMin: Number(e.target.value) || 1,
                                }))
                              }
                              disabled={isFormDisabled}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rate-max">Maximum</Label>
                            <Input
                              id="rate-max"
                              type="number"
                              value={selectedElement.rateMax ?? 5}
                              onChange={(e) =>
                                updateElement(selectedElement.name, (current) => ({
                                  ...current,
                                  rateMax: Number(e.target.value) || 5,
                                }))
                              }
                              disabled={isFormDisabled}
                            />
                          </div>
                        </div>
                      )}

                      {selectedElement?.type === 'html' && (
                        <div className="space-y-2">
                          <Label htmlFor="html-content">HTML Content</Label>
                          <Textarea
                            id="html-content"
                            value={selectedElement.html}
                            onChange={(e) =>
                              updateElement(selectedElement.name, (current) => ({
                                ...current,
                                html: e.target.value,
                              }))
                            }
                            rows={6}
                            disabled={isFormDisabled}
                            className="resize-none font-mono text-sm"
                          />
                        </div>
                      )}

                      {selectedElement?.type === 'image' && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="image-link">Image URL</Label>
                            <Input
                              id="image-link"
                              value={selectedElement.imageLink ?? ''}
                              onChange={(e) =>
                                updateElement(selectedElement.name, (current) => ({
                                  ...current,
                                  imageLink: e.target.value,
                                }))
                              }
                              disabled={isFormDisabled}
                              placeholder="https://example.com/image.png"
                              className="break-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="image-alt">Alt text</Label>
                            <Input
                              id="image-alt"
                              value={selectedElement.imageAlt ?? ''}
                              onChange={(e) =>
                                updateElement(selectedElement.name, (current) => ({
                                  ...current,
                                  imageAlt: e.target.value,
                                }))
                              }
                              disabled={isFormDisabled}
                              placeholder="Describe the image for accessibility"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateSurveyActivity;
