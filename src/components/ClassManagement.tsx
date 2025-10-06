import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  BookOpen,
  Users,
  Loader2
} from "lucide-react";

interface Class {
  id: string;
  name: string;
  name_bangla: string | null;
  section: string;
  class_level: string;
  capacity: number;
  is_active: boolean;
  student_count?: number;
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

export function ClassManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<FilterValue[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const filterFields: FilterField[] = [
    { key: 'name', label: 'Class Name', type: 'text', placeholder: 'Enter class name...' },
    { key: 'section', label: 'Section', type: 'text', placeholder: 'Enter section...' },
    { key: 'class_level', label: 'Class Level', type: 'select', options: CLASS_LEVELS },
    { key: 'capacity', label: 'Capacity', type: 'number', placeholder: 'Enter capacity...' },
    { key: 'is_active', label: 'Status', type: 'select', options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' }
    ]},
  ];

  const isAdmin = profile?.role === 'school_admin' || profile?.role === 'super_admin';

  const form = useForm<{
    name: string;
    name_bangla: string;
    section: string;
    class_level: string;
    capacity: number;
  }>({
    defaultValues: {
      name: "",
      name_bangla: "",
      section: "A",
      class_level: "",
      capacity: 40
    }
  });

  useEffect(() => {
    if (profile?.school_id) {
      fetchClasses();
    }

    // Set up real-time subscription for classes
    const channel = supabase
      .channel('classes_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes'
        },
        (payload) => {
          console.log('Class change detected:', payload);
          if (profile?.school_id) {
            fetchClasses();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchClasses = async () => {
    if (!profile?.school_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch classes with student count
      const { data: classesData, error } = await supabase
        .from('classes')
        .select(`
          *,
          students:students(count)
        `)
        .eq('school_id', profile.school_id)
        .order('name');

      if (error) throw error;

      const classesWithCount = classesData?.map(classItem => ({
        ...classItem,
        student_count: classItem.students?.[0]?.count || 0
      })) || [];

      setClasses(classesWithCount);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (values: any) => {
    if (!profile?.school_id) return;
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to add classes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .insert({
          ...values,
          school_id: profile.school_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class added successfully",
      });

      setIsAddDialogOpen(false);
      form.reset();
      fetchClasses();
    } catch (error: any) {
      console.error('Error adding class:', error);
      const message = error?.code === '42501'
        ? "You don't have permission to add classes. Please contact your school admin."
        : "Failed to add class";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleEditClass = async (values: any) => {
    if (!editingClass) return;

    try {
      const { error } = await supabase
        .from('classes')
        .update(values)
        .eq('id', editingClass.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class updated successfully",
      });

      setEditingClass(null);
      form.reset();
      fetchClasses();
    } catch (error: any) {
      console.error('Error updating class:', error);
      toast({
        title: "Error",
        description: "Failed to update class",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: false })
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class deactivated successfully",
      });

      fetchClasses();
    } catch (error: any) {
      console.error('Error deactivating class:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate class",
        variant: "destructive",
      });
    }
  };

  const classesWithStringBooleans = classes.map(c => ({
    ...c,
    is_active_string: String(c.is_active)
  }));

  const filteredClassesWithMeta = useAdvancedFilter(
    classesWithStringBooleans,
    advancedFilters.map(f => f.field === 'is_active' ? { ...f, field: 'is_active_string' } : f),
    searchTerm,
    ['name', 'section', 'class_level']
  );

  const filteredClasses = filteredClassesWithMeta.map(c => classes.find(orig => orig.id === c.id)!).filter(Boolean);

  const openEditDialog = (classItem: Class) => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to edit classes.",
        variant: "destructive",
      });
      return;
    }
    setEditingClass(classItem);
    form.reset({
      name: classItem.name,
      name_bangla: classItem.name_bangla || "",
      section: classItem.section,
      class_level: classItem.class_level,
      capacity: classItem.capacity
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
          <h1 className="text-3xl font-bold text-foreground">Class Management</h1>
          <p className="text-muted-foreground">Manage school classes and sections</p>
        </div>
        {isAdmin && (
          <Button 
            className="bg-gradient-primary hover:opacity-90"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Class
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{classes.filter(c => c.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {classes.reduce((sum, c) => sum + c.capacity, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <AdvancedFilter
            fields={filterFields}
            onFilterChange={setAdvancedFilters}
            onSearch={setSearchTerm}
            searchPlaceholder="Search classes by name, section, or level..."
          />
        </CardContent>
      </Card>

      {/* Classes List */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Classes ({filteredClasses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClasses.map((classItem) => (
              <div key={classItem.id} className="border border-border rounded-lg p-4 hover:shadow-soft transition-shadow duration-200">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{classItem.name} - Section {classItem.section}</h3>
                      <p className="text-sm text-muted-foreground">
                        Level: {CLASS_LEVELS.find(l => l.value === classItem.class_level)?.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Students: {classItem.student_count}/{classItem.capacity}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={classItem.is_active ? 'default' : 'secondary'}>
                      {classItem.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(classItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClass(classItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || !!editingClass} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingClass(null);
          form.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
            <DialogDescription>Fill in class details and submit to save.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingClass ? handleEditClass : handleAddClass)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Class 10" />
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
                    <FormLabel>Class Name (Bangla)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., দশম শ্রেণী" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="A" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingClass(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClass ? 'Update' : 'Add'} Class
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}