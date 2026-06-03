import React, { useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import {
  parseAtlasJson, useImportExitTicket,
  type AtlasExitTicketJson,
} from '@/hooks/useImportExitTicket';
import { useToast } from '@/hooks/use-toast';

interface ImportExitTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface ParsedPreview {
  parsed: AtlasExitTicketJson;
  className: string | null;
  classId: string | null;
  questionCount: number;
  totalMarks: number;
}

export const ImportExitTicketDialog: React.FC<ImportExitTicketDialogProps> = ({
  open, onClose, onImported,
}) => {
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const importMutation = useImportExitTicket();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const reset = () => {
    setParseError(null);
    setPreview(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = async (file: File) => {
    setParseError(null);
    setPreview(null);
    setIsProcessing(true);

    if (!file.name.endsWith('.json')) {
      setParseError('Please upload a .json file');
      setIsProcessing(false);
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      setParseError('File is too large. Expected a small Atlas .json export.');
      setIsProcessing(false);
      return;
    }

    try {
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error('File is not valid JSON');
      }

      const parsed = parseAtlasJson(raw);
      const classCode = parsed.exit_ticket.class_code;
      let className: string | null = null;
      let classId: string | null = null;

      if (classCode && currentUser?.school_id) {
        const { data: cls } = await supabase
          .from('classes')
          .select('id, class_name')
          .eq('class_code', classCode)
          .eq('school_id', currentUser.school_id)
          .maybeSingle();
        if (cls) {
          classId = cls.id;
          className = cls.class_name;
        }
      }

      const questions = parsed.exit_ticket.questions;
      setPreview({
        parsed,
        className,
        classId,
        questionCount: questions.length,
        totalMarks: questions.reduce((sum, q) => sum + (Number(q.max_score) || 0), 0),
      });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!preview || !currentUser?.id || !currentUser?.school_id) return;
    try {
      const result = await importMutation.mutateAsync({
        parsed: preview.parsed,
        classId: preview.classId,
        teacherId: currentUser.id,
        schoolId: currentUser.school_id,
      });
      toast({
        title: result.deployed
          ? `Exit ticket imported and deployed to ${preview.className}`
          : 'Exit ticket imported',
        description: result.deployed
          ? 'It\'s in your class as a draft — activate it from the Classroom page.'
          : 'Find it in your Exit Ticket library.',
      });
      onImported();
      handleClose();
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const isBusy = importMutation.isPending || isProcessing;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isBusy) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from Atlas</DialogTitle>
          <DialogDescription>
            Export an exit ticket from Atlas, then upload the .json file here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File drop zone — shown until a valid file is parsed */}
          {!preview && !isProcessing && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Drop your .json file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Processing spinner */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading file…
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 px-4 py-3 space-y-2">
                <p className="font-semibold">{preview.parsed.exit_ticket.name}</p>
                {preview.parsed.exit_ticket.description && (
                  <p className="text-sm text-muted-foreground">{preview.parsed.exit_ticket.description}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {preview.questionCount} question{preview.questionCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {preview.totalMarks} mark{preview.totalMarks !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {preview.classId ? (
                <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Will be deployed as a draft to <strong>{preview.className}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Class not found — will be saved as a template only. You can deploy it manually.
                  </span>
                </div>
              )}

              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={reset}
                disabled={isBusy}
              >
                Choose a different file
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!preview || isBusy}>
            {importMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing…</>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
