import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SchoolCombobox } from "@/components/SchoolCombobox";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdvancedFilter, FilterField, FilterValue } from "@/components/AdvancedFilter";
import { useAdvancedFilter } from "@/hooks/useAdvancedFilter";
import { 
  Plus, 
  Edit, 
  Trash2,
  Book,
  Loader2
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  name_bangla: string | null;
  code: string;
  class_level: string;
  is_optional: boolean;
  is_active: boolean;
}

const CLASS_LEVELS = [
  { value: 'nursery', label: 'Nursery' },
  { value: 'kg', label: 'KG' },
  { value: 'class_1', label: 'Class 1' },
  { value: 'class_2', label: 'Class 2' },
  { value: 'class_3', label: 'Class 3' },
  { value: 'class_4', label: 'Class 4' },
  { value: 'class_5', label: 'Class 5' },
  { value: 'class_6', label: 'Class 6' },
  { value: 'class_7', label: 'Class 7' },
  { value: 'class_8', label: 'Class 8' },
  { value: 'class_9', label: 'Class 9' },
  { value: 'class_10', label: 'Class 10' },
  { value: 'class_11', label: 'Class 11' },
  { value: 'class_12', label: 'Class 12' }
];

export function SubjectManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<FilterValue[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  const filterFields: FilterField[] = [
    { key: 'name', label: 'Subject Name', type: 'text', placeholder: 'Enter name...' },
    { key: 'code', label: 'Subject Code', type: 'text', placeholder: 'Enter code...' },
    { key: 'class_level', label: 'Class Level', type: 'select', options: CLASS_LEVELS },
    { key: 'is_optional', label: 'Type', type: 'select', options: [
      { value: 'true', label: 'Optional' },
      { value: 'false', label: 'Compulsory' }
    ]},
    { key: 'is_active', label: 'Status', type: 'select', options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' }
    ]},
  ];

  const form = useForm<{
    name: string;
    name_bangla: string;
    code: string;
    class_level: string;
    is_optional: boolean;
  }>({
    defaultValues: {
      name: "",
      name_bangla: "",
      code: "",
      class_level: "",
      is_optional: false
    }
  });

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      // Super admin needs to select a school first
      if (selectedSchoolId) {
        fetchSubjects();
      }
    } else if (profile?.school_id) {
      setSelectedSchoolId(profile.school_id);
      fetchSubjects();
    }
  }, [profile, selectedSchoolId]);

  const fetchSubjects = async () => {
    const schoolId = profile?.role === 'super_admin' ? selectedSchoolId : profile?.school_id;
    
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (values: any) => {
    const schoolId = profile?.role === 'super_admin' ? selectedSchoolId : profile?.school_id;
    
    if (!schoolId) {
      toast({
        title: "Error",
        description: "Please select a school first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('subjects')
        .insert({
          ...values,
          school_id: schoolId
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Duplicate Subject Code",
            description: "A subject with this code already exists for this class level. Please use a different code or edit the existing subject instead.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: "Subject added successfully",
      });

      setIsAddDialogOpen(false);
      form.reset();
      fetchSubjects();
    } catch (error: any) {
      console.error('Error adding subject:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add subject",
        variant: "destructive",
      });
    }
  };

  const handleEditSubject = async (values: any) => {
    if (!editingSubject) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .update(values)
        .eq('id', editingSubject.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject updated successfully",
      });

      setEditingSubject(null);
      form.reset();
      fetchSubjects();
    } catch (error: any) {
      console.error('Error updating subject:', error);
      toast({
        title: "Error",
        description: "Failed to update subject",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ is_active: false })
        .eq('id', subjectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject deactivated successfully",
      });

      fetchSubjects();
    } catch (error: any) {
      console.error('Error deactivating subject:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate subject",
        variant: "destructive",
      });
    }
  };

  const subjectsWithStringBooleans = subjects.map(s => ({
    ...s,
    is_active_string: String(s.is_active),
    is_optional_string: String(s.is_optional)
  }));

  const filteredSubjectsWithMeta = useAdvancedFilter(
    subjectsWithStringBooleans,
    advancedFilters.map(f => 
      f.field === 'is_active' ? { ...f, field: 'is_active_string' } :
      f.field === 'is_optional' ? { ...f, field: 'is_optional_string' } : f
    ),
    searchTerm,
    ['name', 'code', 'class_level']
  );

  const filteredSubjects = filteredSubjectsWithMeta.map(s => subjects.find(orig => orig.id === s.id)!).filter(Boolean);

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    form.reset({
      name: subject.name,
      name_bangla: subject.name_bangla || "",
      code: subject.code,
      class_level: subject.class_level,
      is_optional: subject.is_optional
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subject Management</h1>
          <p className="text-muted-foreground">Manage curriculum subjects by class</p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90"
          onClick={() => setIsAddDialogOpen(true)}
          disabled={profile?.role === 'super_admin' && !selectedSchoolId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Subject
        </Button>
      </div>

      {/* School Selector for Super Admin */}
      {profile?.role === 'super_admin' && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select School</label>
              <SchoolCombobox 
                value={selectedSchoolId} 
                onValueChange={setSelectedSchoolId}
              />
              <p className="text-xs text-muted-foreground">Select a school to manage its subjects. You can add, edit, or view subjects for any school.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subjects.filter(s => s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Book className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subjects.filter(s => !s.is_optional).length}</p>
                <p className="text-sm text-muted-foreground">Core Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Book className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subjects.filter(s => s.is_optional).length}</p>
                <p className="text-sm text-muted-foreground">Optional Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Book className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {[...new Set(subjects.map(s => s.class_level))].length}
                </p>
                <p className="text-sm text-muted-foreground">Class Levels</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <AdvancedFilter
            fields={filterFields}
            onFilterChange={setAdvancedFilters}
            onSearch={setSearchTerm}
            searchPlaceholder="Search subjects by name, code, or class level..."
          />
        </CardContent>
      </Card>

      {/* Subjects List */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Subjects ({filteredSubjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSubjects.map((subject) => (
              <div key={subject.id} className="border border-border rounded-lg p-4 hover:shadow-soft transition-shadow duration-200">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                      <Book className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Code: {subject.code} • 
                        Level: {CLASS_LEVELS.find(l => l.value === subject.class_level)?.label}
                      </p>
                      {subject.name_bangla && (
                        <p className="text-sm text-muted-foreground">
                          Bangla: {subject.name_bangla}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <Badge variant={subject.is_active ? 'default' : 'secondary'}>
                        {subject.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {subject.is_optional && (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(subject)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || !!editingSubject} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingSubject(null);
          form.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingSubject ? handleEditSubject : handleAddSubject)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Mathematics" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name_bangla"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name (Bangla)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., গণিত" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., MATH001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="class_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLASS_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_optional"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Optional Subject
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingSubject(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSubject ? 'Update' : 'Add'} Subject
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}