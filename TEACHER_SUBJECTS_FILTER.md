# Teacher Subjects Filter Feature

## Overview
Teachers now see only the subjects they are assigned to teach based on their timetable entries, rather than all subjects in the school.

## Changes Made

### Component: `SubjectManagement.tsx`

#### 1. **Role-Based Subject Filtering**
- **Teachers**: See only subjects they are assigned in the timetable
- **School Admins**: See all subjects in their school
- **Super Admins**: See all subjects for the selected school

#### 2. **Data Flow for Teachers**
```typescript
1. Fetch teacher record using auth.uid()
2. Query timetable for teacher's assigned subject_ids
3. Fetch only those subjects
4. Display filtered list
```

#### 3. **UI Changes for Teachers**
- **Header**: Changed from "Subject Management" to "My Subjects"
- **Description**: "View subjects you teach based on your timetable"
- **Add Button**: Hidden for teachers (read-only access)
- **Edit/Delete Buttons**: Hidden for teachers
- **Empty State**: Shows helpful message if no subjects assigned

#### 4. **Query Structure**
```sql
-- Step 1: Get teacher ID
SELECT id FROM teachers WHERE user_id = [current_user_id]

-- Step 2: Get assigned subjects from timetable
SELECT subject_id FROM timetable 
WHERE teacher_id = [teacher_id] AND school_id = [school_id]

-- Step 3: Fetch subject details
SELECT * FROM subjects WHERE id IN ([subject_ids]) ORDER BY name
```

## Database Dependencies

### Tables Used
1. **teachers**: Links user_id to teacher_id
2. **timetable**: Links teacher_id to subject_id (via class scheduling)
3. **subjects**: Contains subject details

### Key Relationships
```
auth.users → teachers.user_id
teachers.id → timetable.teacher_id
timetable.subject_id → subjects.id
```

## User Experience

### For Teachers
1. Click "My Subjects" from dashboard or sidebar
2. See only subjects they teach (based on timetable)
3. View subject details (name, code, class level, type)
4. No ability to add, edit, or delete subjects
5. If no subjects assigned: See friendly message to contact admin

### For Admins
- Full CRUD access to all subjects in their school
- Can add/edit/delete subjects
- Can assign subjects to teachers via timetable

## Testing Checklist

### ✅ As a Teacher
- [ ] Login as teacher
- [ ] Navigate to "My Subjects"
- [ ] Verify only assigned subjects are shown
- [ ] Verify no Add/Edit/Delete buttons visible
- [ ] Test empty state (remove all timetable entries)

### ✅ As School Admin
- [ ] Login as school admin
- [ ] Navigate to "Subject Management"
- [ ] Verify all school subjects are visible
- [ ] Verify Add/Edit/Delete buttons work
- [ ] Assign subjects to teacher via timetable
- [ ] Verify teacher can see the assigned subjects

### ✅ As Super Admin
- [ ] Login as super admin
- [ ] Select a school
- [ ] Verify all subjects for that school are visible
- [ ] Verify full CRUD operations work

## Implementation Notes

### Key Code Changes

**fetchSubjects() function:**
```typescript
if (profile?.role === 'teacher') {
  // Get teacher record
  const teacherData = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', profile.user_id)
    .single();

  // Get assigned subject IDs from timetable
  const timetableData = await supabase
    .from('timetable')
    .select('subject_id')
    .eq('teacher_id', teacherData.id);

  // Fetch only assigned subjects
  const subjectIds = [...new Set(timetableData.map(t => t.subject_id))];
  const data = await supabase
    .from('subjects')
    .select('*')
    .in('id', subjectIds);
}
```

**UI Conditional Rendering:**
```typescript
// Hide Add button for teachers
{profile?.role !== 'teacher' && (
  <Button onClick={() => setIsAddDialogOpen(true)}>
    Add New Subject
  </Button>
)}

// Hide Edit/Delete for teachers
{profile?.role !== 'teacher' && (
  <div className="flex gap-2">
    <Button onClick={() => openEditDialog(subject)}>
      <Edit />
    </Button>
    <Button onClick={() => handleDeleteSubject(subject.id)}>
      <Trash2 />
    </Button>
  </div>
)}
```

## Benefits

### 1. **Better User Experience**
- Teachers see relevant information only
- Reduces cognitive load and confusion
- Clear distinction between view-only and management access

### 2. **Data Security**
- Teachers cannot modify subjects
- Teachers cannot see unassigned subjects
- Follows principle of least privilege

### 3. **Accurate Information**
- Subjects shown match teacher's actual schedule
- Automatically updates when timetable changes
- No manual subject assignment needed

## Future Enhancements

### Potential Improvements
1. **Subject Stats for Teachers**
   - Show number of classes teaching per subject
   - Display total students per subject
   - Show upcoming classes for each subject

2. **Quick Links**
   - Link to class timetable for each subject
   - Link to student list for each subject
   - Link to grade entry for each subject

3. **Bulk Operations**
   - Export subject list
   - Print subject schedule
   - Share subject details with students

4. **Subject Resources**
   - Attach teaching materials to subjects
   - Share lesson plans
   - Upload subject-specific resources

## Troubleshooting

### Issue: Teacher sees no subjects
**Cause**: Teacher not assigned in timetable
**Solution**: School admin must create timetable entries for the teacher

### Issue: Teacher sees wrong subjects
**Cause**: Outdated or incorrect timetable entries
**Solution**: School admin must update timetable

### Issue: Subject count mismatch
**Cause**: Duplicate subject_id entries in timetable (multiple classes)
**Solution**: This is expected - using `Set` to get unique subjects

## Related Files
- `src/components/SubjectManagement.tsx` - Main component
- `src/components/TeacherDashboard.tsx` - Dashboard card
- `src/components/AppSidebar.tsx` - Sidebar menu
- `src/pages/Index.tsx` - Routing logic
- `supabase/migrations/20250924052341_*.sql` - Timetable table schema

## Git Commit
```
feat: filter subjects for teachers to show only their assigned subjects from timetable
```

## Status
✅ **COMPLETE** - Feature implemented and pushed to GitHub
