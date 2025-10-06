# 📊 Performance Analytics - Implementation Guide

## Overview

The Performance Analytics feature provides comprehensive insights into class performance, student engagement, and academic trends. This document explains the implementation, metrics, calculations, and usage guidelines.

---

## Features Implemented

### 1. **Performance Metrics Dashboard**
Real-time analytics showing key performance indicators:

- **Attendance Rate**: Percentage of students present over the selected period
- **Average Grade**: Mean score across all exam results
- **Active Students**: Total students enrolled in tracked classes
- **At-Risk Students**: Students with grades below 50%

### 2. **Attendance Trend Analysis**
Visual representation of attendance patterns:

- **14-Day History**: Daily attendance data with progress bars
- **Trend Detection**: Automatic detection of improving/declining trends
- **Color Coding**: 
  - 🟢 Green (≥90%): Excellent attendance
  - 🟡 Yellow (≥70%): Good attendance
  - 🟠 Orange (≥50%): Needs improvement
  - 🔴 Red (<50%): Critical

### 3. **Grade Distribution**
Analysis of student performance across grade ranges:

- **6 Grade Ranges**: 90-100, 80-89, 70-79, 60-69, 50-59, <50
- **Percentage Breakdown**: Visual representation of distribution
- **Student Count**: Number of students in each range

### 4. **Performance Insights**
Actionable insights section showing:

- **Top Performers**: Students scoring ≥80%
- **At-Risk Students**: Students scoring <50%
- **Quick Identification**: Helps prioritize interventions

---

## Component Structure

### File Location
```
src/components/ClassPerformanceAnalytics.tsx
```

### Props Interface
```typescript
interface ClassPerformanceAnalyticsProps {
  classId?: string;      // Optional: Filter by specific class
  subjectId?: string;    // Optional: Filter by specific subject
  dateRange?: {          // Optional: Custom date range
    start: Date;
    end: Date;
  };
}
```

### Data Interfaces

#### PerformanceMetrics
```typescript
interface PerformanceMetrics {
  attendanceRate: number;          // Percentage (0-100)
  attendanceTrend: 'up' | 'down' | 'stable';
  averageGrade: number;            // Percentage (0-100)
  gradeTrend: 'up' | 'down' | 'stable';
  totalStudents: number;           // Count of active students
  activeStudents: number;          // Same as totalStudents
  atRiskStudents: number;          // Students with avg < 50%
  topPerformers: number;           // Students with avg ≥ 80%
}
```

#### AttendanceData
```typescript
interface AttendanceData {
  date: string;         // Format: 'YYYY-MM-DD'
  present: number;      // Number of present students
  total: number;        // Total students that day
  rate: number;         // Percentage (present/total * 100)
}
```

#### GradeDistribution
```typescript
interface GradeDistribution {
  range: string;        // e.g., "90-100", "80-89"
  count: number;        // Number of students
  percentage: number;   // Percentage of total
}
```

---

## Calculation Methods

### 1. Attendance Rate
```typescript
// Formula
attendanceRate = (totalPresentRecords / totalAttendanceRecords) × 100

// Implementation
const { data: attendanceData } = await supabase
  .from('attendance')
  .select('is_present, student_id')
  .gte('date', startDate)
  .lte('date', endDate);

const presentCount = attendanceData.filter(a => a.is_present).length;
const attendanceRate = (presentCount / attendanceData.length) * 100;
```

### 2. Average Grade
```typescript
// Formula
averageGrade = Σ(obtained_marks / total_marks × 100) / totalExams

// Implementation
const { data: examResults } = await supabase
  .from('exam_results')
  .select('obtained_marks, total_marks')
  .gte('exam_date', startDate)
  .lte('exam_date', endDate);

const grades = examResults.map(r => 
  (r.obtained_marks / r.total_marks) * 100
);
const averageGrade = grades.reduce((sum, g) => sum + g, 0) / grades.length;
```

### 3. Trend Detection
```typescript
// Compare recent 7 days vs previous 7 days
const recentAvg = calculateAverage(last7Days);
const previousAvg = calculateAverage(previous7Days);

const difference = recentAvg - previousAvg;
const percentChange = (difference / previousAvg) * 100;

if (percentChange > 5) return 'up';
if (percentChange < -5) return 'down';
return 'stable';
```

### 4. At-Risk Students
```typescript
// Students with average grade < 50%
const studentGrades = groupByStudent(examResults);
const atRiskStudents = studentGrades.filter(
  student => student.average < 50
);
```

### 5. Top Performers
```typescript
// Students with average grade ≥ 80%
const topPerformers = studentGrades.filter(
  student => student.average >= 80
);
```

### 6. Grade Distribution
```typescript
const ranges = [
  { min: 90, max: 100, label: '90-100' },
  { min: 80, max: 89, label: '80-89' },
  { min: 70, max: 79, label: '70-79' },
  { min: 60, max: 69, label: '60-69' },
  { min: 50, max: 59, label: '50-59' },
  { min: 0, max: 49, label: '<50' }
];

const distribution = ranges.map(range => {
  const count = grades.filter(
    g => g >= range.min && g <= range.max
  ).length;
  const percentage = (count / grades.length) * 100;
  return { range: range.label, count, percentage };
});
```

---

## Role-Based Data Filtering

### Teachers
- **Automatic Filtering**: Shows only classes/subjects assigned in timetable
- **Query**: Joins with `timetable` table to get teacher's assignments
- **Scope**: Limited to their own classes

### School Admins & Super Admins
- **Full Access**: Can view all classes in their school/system
- **Query**: Direct access to all classes and subjects
- **Scope**: School-wide or system-wide

### Implementation
```typescript
const { data: { user } } = await supabase.auth.getUser();

if (userRole === 'teacher') {
  // Get teacher's assigned classes from timetable
  const { data: timetableEntries } = await supabase
    .from('timetable')
    .select('class_id, subject_id')
    .eq('teacher_id', user.id);
  
  // Filter analytics by these classes/subjects
  const classIds = [...new Set(timetableEntries.map(t => t.class_id))];
} else {
  // Admin: show all classes
  const { data: allClasses } = await supabase
    .from('classes')
    .select('id');
}
```

---

## UI Components & Styling

### Metric Cards
- **Layout**: 2×2 grid on desktop, 1 column on mobile
- **Colors**:
  - Attendance: Indigo gradient
  - Average Grade: Purple gradient
  - Active Students: Blue gradient
  - At-Risk: Red gradient
- **Icons**: TrendingUp (improving), TrendingDown (declining), Minus (stable)

### Attendance Trend Chart
- **Display**: Last 14 days with progress bars
- **Color Coding**: Based on attendance rate thresholds
- **Format**: Date (MMM DD) + percentage + visual bar

### Grade Distribution
- **Display**: 6 ranges with count and percentage
- **Layout**: Stacked list with visual indicators
- **Color**: Indigo theme matching overall design

### Performance Insights
- **Sections**: Top Performers & At-Risk Students
- **Display**: Count + icon + color coding
- **Action**: Clicking shows relevant student lists

---

## Integration into TeacherDashboard

### Location
Added between "Quick Actions" and "Teacher Profile" sections

### Code Addition
```tsx
{/* Performance Analytics */}
<Card className="border-0 shadow-soft hover:shadow-elegant transition-all duration-300 bg-gradient-to-br from-card via-card/95 to-indigo-500/5">
  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 p-3 md:p-6">
    <CardTitle className="flex items-center gap-2 md:gap-3 text-sm md:text-lg">
      <div className="p-1.5 md:p-2 bg-indigo-500/10 rounded-full">
        <BarChart3 className="h-3.5 w-3.5 md:h-5 md:w-5 text-indigo-500" />
      </div>
      <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
        Performance Analytics
      </span>
      <Badge variant="secondary" className="ml-auto bg-indigo-500/10 text-indigo-600 text-xs">
        Live Data
      </Badge>
    </CardTitle>
  </CardHeader>
  <CardContent className="p-3 md:p-6">
    <ClassPerformanceAnalytics />
  </CardContent>
</Card>
```

### Import Statements
```tsx
import { ClassPerformanceAnalytics } from '@/components/ClassPerformanceAnalytics';
import { BarChart3 } from 'lucide-react';
```

---

## Database Requirements

### Tables Used
1. **attendance** - Daily attendance records
   - Columns: `id`, `student_id`, `date`, `is_present`, `class_id`, `subject_id`
   
2. **exam_results** - Exam grades and scores
   - Columns: `id`, `student_id`, `exam_id`, `obtained_marks`, `total_marks`, `exam_date`
   
3. **students** - Student information
   - Columns: `id`, `full_name`, `class_id`, `status`
   
4. **timetable** - Class assignments
   - Columns: `id`, `teacher_id`, `class_id`, `subject_id`

### Required Permissions (RLS)
```sql
-- Teachers can view their own analytics
CREATE POLICY "Teachers view own analytics"
ON attendance FOR SELECT
USING (
  class_id IN (
    SELECT DISTINCT class_id 
    FROM timetable 
    WHERE teacher_id = auth.uid()
  )
);

-- Similar policies for exam_results
CREATE POLICY "Teachers view own exam results"
ON exam_results FOR SELECT
USING (
  student_id IN (
    SELECT s.id 
    FROM students s
    JOIN timetable t ON s.class_id = t.class_id
    WHERE t.teacher_id = auth.uid()
  )
);
```

---

## Usage Examples

### Basic Usage (No Filters)
```tsx
<ClassPerformanceAnalytics />
```
Shows all data for current teacher's classes or all classes for admins.

### Filter by Class
```tsx
<ClassPerformanceAnalytics classId="class-uuid-here" />
```
Shows analytics for specific class only.

### Filter by Subject
```tsx
<ClassPerformanceAnalytics subjectId="subject-uuid-here" />
```
Shows analytics for specific subject across all classes.

### Custom Date Range
```tsx
<ClassPerformanceAnalytics 
  dateRange={{
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }}
/>
```
Shows analytics for January 2024.

### Combined Filters
```tsx
<ClassPerformanceAnalytics 
  classId="class-uuid-here"
  subjectId="subject-uuid-here"
  dateRange={{
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }}
/>
```
Shows specific class + subject data for January 2024.

---

## Performance Considerations

### Query Optimization
1. **Indexed Columns**: Ensure `date`, `student_id`, `class_id`, `teacher_id` are indexed
2. **Date Filtering**: Always use date range to limit data
3. **Parallel Queries**: Fetch attendance, grades, and students simultaneously
4. **Caching**: Consider caching results for 5-10 minutes

### Loading States
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchAnalytics().finally(() => setLoading(false));
}, [classId, subjectId, dateRange]);

if (loading) return <Skeleton />;
```

### Error Handling
```typescript
try {
  const { data, error } = await supabase.from('attendance').select();
  if (error) throw error;
} catch (error) {
  console.error('Analytics error:', error);
  toast.error('Failed to load analytics');
}
```

---

## Testing Checklist

### Data Accuracy
- [ ] Attendance rate matches manual calculation
- [ ] Average grade calculation correct
- [ ] Student counts accurate
- [ ] Trend detection working (up/down/stable)
- [ ] At-risk identification correct (grade < 50%)
- [ ] Top performers correct (grade ≥ 80%)

### Role-Based Access
- [ ] Teachers see only their classes
- [ ] Admins see all classes
- [ ] Proper filtering by timetable assignments

### UI/UX
- [ ] Responsive on mobile devices
- [ ] Cards display correctly
- [ ] Charts render properly
- [ ] Color coding clear and consistent
- [ ] Loading states smooth

### Edge Cases
- [ ] No attendance data - shows empty state
- [ ] No exam results - shows appropriate message
- [ ] Single day data - trends work
- [ ] All students absent - shows 0%
- [ ] All students perfect scores - shows 100%

---

## Future Enhancements

### Planned Features
1. **Export Functionality**: Download analytics as PDF/Excel
2. **Advanced Filters**: Multiple classes, date presets (This Week, This Month)
3. **Comparison Mode**: Compare two date ranges or classes
4. **Detailed Drill-Down**: Click metrics to see student-level details
5. **Alerts**: Automatic notifications for declining trends
6. **Goals**: Set and track attendance/grade targets
7. **Historical Trends**: Long-term performance tracking (semester/year)

### Potential Improvements
- Add charts using recharts or Chart.js
- Include subject-wise breakdown
- Show individual student performance cards
- Add prediction models for at-risk students
- Integrate with parent notifications

---

## Troubleshooting

### Issue: No Data Showing
**Possible Causes**:
- No attendance records in date range
- RLS policies blocking access
- Teacher not assigned to any classes

**Solution**:
1. Check database for records in date range
2. Verify RLS policies allow access
3. Confirm teacher has timetable entries

### Issue: Incorrect Calculations
**Possible Causes**:
- Null values in obtained_marks/total_marks
- Division by zero
- Date filtering not working

**Solution**:
1. Add null checks: `filter(r => r.obtained_marks && r.total_marks)`
2. Check for empty arrays before calculating averages
3. Verify date format: `YYYY-MM-DD`

### Issue: Performance Slow
**Possible Causes**:
- Large datasets without indexes
- Multiple sequential queries
- No date range limiting

**Solution**:
1. Add database indexes on frequently queried columns
2. Use parallel queries with `Promise.all()`
3. Always apply date filters to limit data

---

## Related Documentation

- [Teacher Dashboard Enhancement](./TEACHER_DASHBOARD_ENHANCEMENT.md)
- [Intelligent Timetable Integration](./INTELLIGENT_TIMETABLE_INTEGRATION.md)
- [Teacher Subjects Filter](./TEACHER_SUBJECTS_FILTER.md)
- [Supabase Features Guide](./SUPABASE_FEATURES_GUIDE.md)

---

## Git Commit Info

**Commit Message**: `feat: add performance analytics with attendance and grade tracking`

**Files Modified**:
1. `src/components/ClassPerformanceAnalytics.tsx` (new)
2. `src/components/TeacherDashboard.tsx` (modified)

**Branch**: main

---

## Summary

The Performance Analytics feature provides teachers and administrators with powerful insights into class performance, attendance trends, and student engagement. With automatic calculations, visual representations, and role-based filtering, it enables data-driven decision-making and early intervention for at-risk students.

**Key Benefits**:
- ✅ Real-time performance metrics
- ✅ Visual trend detection
- ✅ At-risk student identification
- ✅ Role-based access control
- ✅ Responsive mobile design
- ✅ Comprehensive grade distribution

**Impact**: Empowers teachers to monitor progress, identify struggling students early, and make informed instructional decisions based on concrete data.
