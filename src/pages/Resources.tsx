import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Search,
  ExternalLink,
  BookMarked,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Library,
  Users,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useClasses } from '@/hooks/useClasses';
import { useResources, useCreateResource, useUpdateResource, useDeleteResource, type Resource } from '@/hooks/useResources';
import { useAssignResource, useClassResources } from '@/hooks/useClassResources';
import { useToast } from '@/hooks/use-toast';

// --- Create / Edit form state ---
interface ResourceFormState {
  title: string;
  url: string;
  description: string;
  category: string;
  access_notes: string;
  how_to_use: string;
  tags: string;
}

const emptyForm: ResourceFormState = {
  title: '',
  url: '',
  description: '',
  category: '',
  access_notes: '',
  how_to_use: '',
  tags: '',
};

function resourceToForm(r: Resource): ResourceFormState {
  return {
    title: r.title,
    url: r.url,
    description: r.description ?? '',
    category: r.category,
    access_notes: r.access_notes ?? '',
    how_to_use: r.how_to_use ?? '',
    tags: r.tags.join(', '),
  };
}

// --- Assign button for an individual card ---
function AssignToClassButton({ resource, teacherId }: { resource: Resource; teacherId: string }) {
  const { data: classes = [] } = useClasses();
  const assign = useAssignResource();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleAssign = async (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    try {
      await assign.mutateAsync({ class_id: classId, resource_id: resource.id, teacher_id: teacherId });
      toast({ title: 'Resource assigned', description: `"${resource.title}" is now on the Classroom page for ${cls?.class_name ?? 'that class'}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      // Unique violation means already assigned
      if (msg.includes('unique') || msg.includes('duplicate')) {
        toast({ title: 'Already assigned', description: `This resource is already assigned to ${cls?.class_name ?? 'that class'}.`, variant: 'destructive' });
      } else {
        toast({ title: 'Failed to assign', description: msg, variant: 'destructive' });
      }
    }
    setOpen(false);
  };

  if (classes.length === 0) return null;

  return (
    <div className="relative">
      {open ? (
        <div className="flex items-center gap-2">
          <Select onValueChange={handleAssign} disabled={assign.isPending}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="Pick a class..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Users className="w-3.5 h-3.5 mr-1.5" />
          Assign to class
        </Button>
      )}
    </div>
  );
}

// --- CSV columns definition ---
const CSV_COLUMNS = ['title', 'url', 'category', 'description', 'access_notes', 'how_to_use', 'tags'] as const;
const TEMPLATE_ROW = {
  title: 'Historical Maps of the British Empire',
  url: 'https://example.com/maps',
  category: 'Maps and Visualisations',
  description: 'A collection of historical maps.',
  access_notes: 'Free, no login required',
  how_to_use: 'Display the map and ask students to identify patterns.',
  tags: 'HASS, Year 9, Map',
};

function downloadTemplate() {
  const csv = Papa.unparse({ fields: [...CSV_COLUMNS], data: [TEMPLATE_ROW] });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'resources_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface CsvRow {
  title: string;
  url: string;
  category: string;
  description?: string;
  access_notes?: string;
  how_to_use?: string;
  tags?: string;
  _error?: string;
}

function parseResourcesCsv(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: CsvRow[] = results.data.map((row, i) => {
          const title = (row['title'] ?? '').trim();
          const url = (row['url'] ?? '').trim();
          const category = (row['category'] ?? '').trim();
          if (!title || !url || !category) {
            return { title, url, category, _error: `Row ${i + 2}: title, url, and category are required` };
          }
          return {
            title,
            url,
            category,
            description: (row['description'] ?? '').trim() || undefined,
            access_notes: (row['access_notes'] ?? '').trim() || undefined,
            how_to_use: (row['how_to_use'] ?? '').trim() || undefined,
            tags: (row['tags'] ?? '').trim() || undefined,
          };
        });
        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}

// --- CSV Import Dialog ---
interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  teacherId: string;
}

function ImportCsvDialog({ open, onOpenChange, schoolId, teacherId }: ImportCsvDialogProps) {
  const { toast } = useToast();
  const createResource = useCreateResource();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState('');

  const validRows = rows.filter((r) => !r._error);
  const errorRows = rows.filter((r) => r._error);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Please upload a CSV file', variant: 'destructive' });
      return;
    }
    setFileName(file.name);
    try {
      const parsed = await parseResourcesCsv(file);
      setRows(parsed);
    } catch {
      toast({ title: 'Failed to parse CSV', variant: 'destructive' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!validRows.length) return;
    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;
    for (const row of validRows) {
      try {
        await createResource.mutateAsync({
          school_id: schoolId,
          teacher_id: teacherId,
          title: row.title,
          url: row.url,
          category: row.category,
          description: row.description ?? null,
          access_notes: row.access_notes ?? null,
          how_to_use: row.how_to_use ?? null,
          tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        });
        successCount++;
      } catch {
        failCount++;
      }
    }
    setIsImporting(false);
    toast({
      title: `Imported ${successCount} resource${successCount === 1 ? '' : 's'}`,
      description: failCount > 0 ? `${failCount} failed to save.` : undefined,
      variant: failCount > 0 ? 'destructive' : 'default',
    });
    if (successCount > 0) {
      handleClose();
    }
  };

  const handleClose = () => {
    setRows([]);
    setFileName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Resources from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your resources. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/60">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4 shrink-0" />
              <span>Columns: <span className="font-mono text-xs">{CSV_COLUMNS.join(', ')}</span></span>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download template
            </Button>
          </div>

          {/* Drop zone */}
          <div
            className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
            <Upload className="w-8 h-8 text-muted-foreground" />
            {fileName ? (
              <p className="text-sm font-medium">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium">Drop a CSV file here, or click to browse</p>
                <p className="text-xs text-muted-foreground">Only .csv files are accepted</p>
              </>
            )}
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium">{validRows.length} row{validRows.length === 1 ? '' : 's'} ready to import</span>
                {errorRows.length > 0 && (
                  <span className="text-destructive ml-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errorRows.length} with errors (will be skipped)
                  </span>
                )}
              </div>

              {errorRows.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1">
                  {errorRows.map((r, i) => (
                    <p key={i} className="text-xs text-destructive">{r._error}</p>
                  ))}
                </div>
              )}

              {validRows.length > 0 && (
                <div className="rounded-md border overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold">Title</th>
                          <th className="text-left px-3 py-2 font-semibold">Category</th>
                          <th className="text-left px-3 py-2 font-semibold">URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.map((row, i) => (
                          <tr key={i} className="border-t border-border/50">
                            <td className="px-3 py-2 max-w-[180px] truncate">{row.title}</td>
                            <td className="px-3 py-2 max-w-[120px] truncate">{row.category}</td>
                            <td className="px-3 py-2 max-w-[160px] truncate text-muted-foreground">{row.url}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || isImporting}
          >
            {isImporting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
            ) : (
              <>Import {validRows.length > 0 ? validRows.length : ''} Resource{validRows.length === 1 ? '' : 's'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Resources = () => {
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const schoolId = currentUser?.school_id ?? undefined;
  const teacherId = currentUser?.id ?? '';

  const { data: resources = [], isLoading, isError } = useResources(schoolId);
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ResourceFormState>(emptyForm);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ResourceFormState>(emptyForm);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CSV import
  const [importOpen, setImportOpen] = useState(false);

  // Derived filter options from current data
  const allCategories = useMemo(() => Array.from(new Set(resources.map((r) => r.category))).sort(), [resources]);
  const allTags = useMemo(() => Array.from(new Set(resources.flatMap((r) => r.tags))).sort(), [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
      const matchesTag = selectedTag === 'all' || r.tags.includes(selectedTag);
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [resources, searchQuery, selectedCategory, selectedTag]);

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedTag !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTag('all');
  };

  // --- Inline edit ---
  const startEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setEditForm(resourceToForm(resource));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const saveEdit = async () => {
    if (!editingId || !schoolId) return;
    try {
      await updateResource.mutateAsync({
        id: editingId,
        title: editForm.title,
        url: editForm.url,
        description: editForm.description || null,
        category: editForm.category,
        access_notes: editForm.access_notes || null,
        how_to_use: editForm.how_to_use || null,
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast({ title: 'Resource updated' });
      cancelEdit();
    } catch (err: unknown) {
      toast({ title: 'Failed to update', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    }
  };

  // --- Create ---
  const handleCreate = async () => {
    if (!schoolId || !teacherId) return;
    try {
      await createResource.mutateAsync({
        school_id: schoolId,
        teacher_id: teacherId,
        title: createForm.title,
        url: createForm.url,
        description: createForm.description || null,
        category: createForm.category,
        access_notes: createForm.access_notes || null,
        how_to_use: createForm.how_to_use || null,
        tags: createForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast({ title: 'Resource created' });
      setCreateOpen(false);
      setCreateForm(emptyForm);
    } catch (err: unknown) {
      toast({ title: 'Failed to create', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    }
  };

  // --- Delete ---
  const handleDeleteConfirm = async () => {
    if (!deleteId || !schoolId) return;
    setIsDeleting(true);
    try {
      await deleteResource.mutateAsync({ id: deleteId, schoolId });
      toast({ title: 'Resource deleted' });
      if (expandedId === deleteId) setExpandedId(null);
      if (editingId === deleteId) cancelEdit();
    } catch (err: unknown) {
      toast({ title: 'Failed to delete', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Resources</h1>
              <p className="text-sm text-muted-foreground">
                Online resources for your lessons — maps, primary sources, videos, and more
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => { setCreateForm(emptyForm); setCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search & Filters */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, description, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <BookMarked className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tags</SelectItem>
                      {allTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                    <X className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error state */}
        {isError && (
          <div className="p-4 border border-destructive rounded-md bg-destructive/10 mb-6">
            <p className="text-sm text-destructive font-medium">Failed to load resources.</p>
          </div>
        )}

        {/* Results count */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredResources.length}</span> resource
              {filteredResources.length === 1 ? '' : 's'}
              {activeFiltersCount > 0 && (
                <span> with {activeFiltersCount} filter{activeFiltersCount === 1 ? '' : 's'} applied</span>
              )}
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border bg-muted/50 h-40" />
            ))}
          </div>
        )}

        {/* Resource Cards */}
        {!isLoading && !isError && (
          filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((resource) => {
                const isExpanded = expandedId === resource.id;
                const isEditing = editingId === resource.id;
                return (
                  <Card
                    key={resource.id}
                    className="border-border/80 hover:border-primary/50 hover:shadow-md transition-all flex flex-col"
                  >
                    <CardHeader className="pb-3 flex-1">
                      <div className="flex flex-col gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {resource.category}
                            </Badge>
                            {resource.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs font-normal">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <CardTitle className="text-base leading-snug">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary hover:underline inline-flex items-start gap-2"
                            >
                              {resource.title}
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            </a>
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {resource.description}
                      </p>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1 block">Title</label>
                                <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="text-sm" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1 block">URL</label>
                                <Input value={editForm.url} onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))} className="text-sm" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1 block">Category</label>
                                <Input value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} className="text-sm" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1 block">Description</label>
                                <textarea
                                  value={editForm.description}
                                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1 block">Access Notes</label>
                                <Input value={editForm.access_notes} onChange={(e) => setEditForm((f) => ({ ...f, access_notes: e.target.value }))} className="text-sm" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1 block">How to use in class</label>
                                <textarea
                                  value={editForm.how_to_use}
                                  onChange={(e) => setEditForm((f) => ({ ...f, how_to_use: e.target.value }))}
                                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1 block">Tags (comma-separated)</label>
                                <Input value={editForm.tags} onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))} className="text-sm" placeholder="HASS, Year 9, Map" />
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <Button size="sm" onClick={saveEdit} disabled={updateResource.isPending}>
                                  {updateResource.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {resource.access_notes && (
                                <div>
                                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Access Notes</p>
                                  <p className="text-sm text-muted-foreground">{resource.access_notes}</p>
                                </div>
                              )}
                              {resource.how_to_use && (
                                <div>
                                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">How to use in class</p>
                                  <p className="text-sm text-muted-foreground">{resource.how_to_use}</p>
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Button size="sm" variant="outline" onClick={() => startEdit(resource)}>
                                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => setDeleteId(resource.id)}>
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                  Delete
                                </Button>
                                <AssignToClassButton resource={resource} teacherId={teacherId} />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button size="sm" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            setExpandedId(isExpanded ? null : resource.id);
                            if (isExpanded) cancelEdit();
                          }}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Library className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {resources.length === 0 ? 'No resources yet' : 'No resources found'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {resources.length === 0
                  ? 'Add your first resource to get started.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {resources.length === 0 ? (
                <Button onClick={() => { setCreateForm(emptyForm); setCreateOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              ) : (
                <Button onClick={clearFilters}>Clear all filters</Button>
              )}
            </div>
          )
        )}
      </main>

      {/* Create Resource Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block">Title *</label>
              <Input value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Historical Maps of the British Empire" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block">URL *</label>
              <Input value={createForm.url} onChange={(e) => setCreateForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block">Category *</label>
              <Input value={createForm.category} onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Maps and Visualisations, Primary Sources, Video" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block">Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="What is this resource?"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block">Access Notes</label>
              <Input value={createForm.access_notes} onChange={(e) => setCreateForm((f) => ({ ...f, access_notes: e.target.value }))} placeholder="e.g. Free, no login required" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block">How to use in class</label>
              <textarea
                value={createForm.how_to_use}
                onChange={(e) => setCreateForm((f) => ({ ...f, how_to_use: e.target.value }))}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="How will you use this with students?"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block">Tags (comma-separated)</label>
              <Input value={createForm.tags} onChange={(e) => setCreateForm((f) => ({ ...f, tags: e.target.value }))} placeholder="HASS, Year 9, Map" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!createForm.title || !createForm.url || !createForm.category || createResource.isPending}
            >
              {createResource.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      {schoolId && teacherId && (
        <ImportCsvDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          schoolId={schoolId}
          teacherId={teacherId}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource? This cannot be undone and will remove it from any classes it's assigned to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Resources;
