# 📘 Supabase TypeScript Type Usage Guide

## 🎯 Quick Reference for Type-Safe Supabase Operations

This guide demonstrates how to properly use TypeScript types with Supabase in the SchoolXnow application.

---

## 📦 Core Type Imports

### Database Types
```typescript
// Import the main Database type
import type { Database } from '@/integrations/supabase/types';

// Extract specific table types
type Tables = Database['public']['Tables'];
type Schools = Tables['schools'];
type Students = Tables['students'];
type Teachers = Tables['teachers'];

// Extract row types (for reading)
type SchoolRow = Schools['Row'];
type StudentRow = Students['Row'];

// Extract insert types (for creating)
type SchoolInsert = Schools['Insert'];
type StudentInsert = Students['Insert'];

// Extract update types (for updating)
type SchoolUpdate = Schools['Update'];
type StudentUpdate = Students['Update'];
```

### Client Types
```typescript
// Import client types
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Type your client instances
const client: SupabaseClient<Database> = supabase;
```

### Auth Types
```typescript
// Import auth types
import { User, Session, AuthError } from '@supabase/supabase-js';

// Use in hooks/components
const [user, setUser] = useState<User | null>(null);
const [session, setSession] = useState<Session | null>(null);
```

### Realtime Types
```typescript
// Import realtime types
import { 
  RealtimeChannel, 
  RealtimePostgresChangesPayload 
} from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Type your channels
const channel: RealtimeChannel = supabase.channel('room-1');

// Type your change payloads
type StudentPayload = RealtimePostgresChangesPayload<
  Database['public']['Tables']['students']['Row']
>;
```

---

## 🔍 Type-Safe Query Examples

### 1. SELECT Queries

**Basic Select:**
```typescript
// Return type is automatically inferred
const { data, error } = await supabase
  .from('schools')
  .select('*');

// data is typed as Database['public']['Tables']['schools']['Row'][] | null
```

**Select with Specific Columns:**
```typescript
const { data, error } = await supabase
  .from('schools')
  .select('id, name, address');

// data is typed with only id, name, address properties
```

**Select with Relationships:**
```typescript
const { data, error } = await supabase
  .from('students')
  .select(`
    *,
    classes (
      id,
      name,
      section
    )
  `);

// data includes nested classes relationship
```

**Type-Safe Single Row:**
```typescript
const { data, error } = await supabase
  .from('schools')
  .select('*')
  .eq('id', schoolId)
  .single();

// data is typed as Database['public']['Tables']['schools']['Row'] | null
```

### 2. INSERT Queries

**Basic Insert:**
```typescript
import type { Database } from '@/integrations/supabase/types';

type SchoolInsert = Database['public']['Tables']['schools']['Insert'];

const newSchool: SchoolInsert = {
  name: 'Test School',
  address: '123 Main St',
  email: 'test@school.com',
  phone: '1234567890',
  // TypeScript will error if required fields are missing
};

const { data, error } = await supabase
  .from('schools')
  .insert(newSchool)
  .select();

// data is typed as Database['public']['Tables']['schools']['Row'][]
```

**Multiple Insert:**
```typescript
const newStudents: StudentInsert[] = [
  {
    school_id: schoolId,
    class_id: classId,
    name: 'John Doe',
    roll_number: '001',
    // ... other fields
  },
  {
    school_id: schoolId,
    class_id: classId,
    name: 'Jane Smith',
    roll_number: '002',
    // ... other fields
  }
];

const { data, error } = await supabase
  .from('students')
  .insert(newStudents)
  .select();
```

### 3. UPDATE Queries

**Basic Update:**
```typescript
import type { Database } from '@/integrations/supabase/types';

type SchoolUpdate = Database['public']['Tables']['schools']['Update'];

const updates: SchoolUpdate = {
  name: 'Updated School Name',
  address: 'New Address',
  // Only include fields you want to update
};

const { data, error } = await supabase
  .from('schools')
  .update(updates)
  .eq('id', schoolId)
  .select();
```

**Partial Update:**
```typescript
// You can update just one field
const { data, error } = await supabase
  .from('students')
  .update({ attendance_percentage: 95.5 })
  .eq('id', studentId);
```

### 4. DELETE Queries

**Basic Delete:**
```typescript
const { error } = await supabase
  .from('students')
  .delete()
  .eq('id', studentId);
```

**Conditional Delete:**
```typescript
const { data, error } = await supabase
  .from('students')
  .delete()
  .eq('class_id', classId)
  .select(); // Return deleted rows
```

---

## 🔐 Type-Safe Auth Operations

### Sign Up
```typescript
import { User, Session } from '@supabase/supabase-js';

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'teacher'
    }
  }
});

// data.user is typed as User | null
// data.session is typed as Session | null
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// data.user is typed as User
// data.session is typed as Session
```

### Get Session
```typescript
const { data: { session }, error } = await supabase.auth.getSession();

// session is typed as Session | null
if (session) {
  console.log(session.user.id); // Typed access to user properties
  console.log(session.access_token); // Typed access to token
}
```

### Get User
```typescript
const { data: { user }, error } = await supabase.auth.getUser();

// user is typed as User | null
if (user) {
  console.log(user.email); // Typed access
  console.log(user.user_metadata); // Typed access
}
```

---

## 📡 Type-Safe Realtime Subscriptions

### Basic Subscription
```typescript
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type StudentRow = Database['public']['Tables']['students']['Row'];

const channel = supabase
  .channel('students-changes')
  .on<StudentRow>(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'students'
    },
    (payload: RealtimePostgresChangesPayload<StudentRow>) => {
      console.log('Change received:', payload);
      
      // payload.new is typed as StudentRow (for INSERT/UPDATE)
      // payload.old is typed as StudentRow (for UPDATE/DELETE)
      // payload.eventType is typed as 'INSERT' | 'UPDATE' | 'DELETE'
    }
  )
  .subscribe();
```

### Filtered Subscription
```typescript
const channel = supabase
  .channel('class-students')
  .on<StudentRow>(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'students',
      filter: `class_id=eq.${classId}`
    },
    (payload) => {
      const newStudent = payload.new; // Typed as StudentRow
      console.log('New student added:', newStudent.name);
    }
  )
  .subscribe();
```

### Presence Subscription
```typescript
interface PresenceState {
  user_id: string;
  username: string;
  online_at: string;
}

const channel = supabase.channel('online-users');

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState<PresenceState>();
    console.log('Online users:', state);
  })
  .on('presence', { event: 'join' }, ({ newPresences }) => {
    console.log('User joined:', newPresences);
  })
  .on('presence', { event: 'leave' }, ({ leftPresences }) => {
    console.log('User left:', leftPresences);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: userId,
        username: username,
        online_at: new Date().toISOString()
      });
    }
  });
```

---

## 🛠️ Type-Safe Helper Functions

### Generic Query Function
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

async function fetchRows<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  filters?: Record<string, any>
): Promise<Database['public']['Tables'][T]['Row'][] | null> {
  let query = client.from(table).select('*');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Query error:', error);
    return null;
  }
  
  return data;
}

// Usage
const schools = await fetchRows(supabase, 'schools', { id: schoolId });
// schools is typed as Database['public']['Tables']['schools']['Row'][] | null
```

### Generic Insert Function
```typescript
async function insertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  data: Database['public']['Tables'][T]['Insert']
): Promise<Database['public']['Tables'][T]['Row'] | null> {
  const { data: inserted, error } = await client
    .from(table)
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error('Insert error:', error);
    return null;
  }
  
  return inserted;
}

// Usage
const newSchool = await insertRow(supabase, 'schools', {
  name: 'New School',
  address: '123 Main St',
  // TypeScript enforces required fields
});
```

### Generic Update Function
```typescript
async function updateRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  id: string,
  updates: Database['public']['Tables'][T]['Update']
): Promise<Database['public']['Tables'][T]['Row'] | null> {
  const { data, error } = await client
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Update error:', error);
    return null;
  }
  
  return data;
}

// Usage
const updated = await updateRow(supabase, 'students', studentId, {
  name: 'Updated Name',
  // TypeScript allows partial updates
});
```

---

## 🎨 Component Type Patterns

### React Component with Typed Props
```typescript
import type { Database } from '@/integrations/supabase/types';

type StudentRow = Database['public']['Tables']['students']['Row'];

interface StudentCardProps {
  student: StudentRow;
  onUpdate?: (student: StudentRow) => void;
}

export function StudentCard({ student, onUpdate }: StudentCardProps) {
  // student properties are fully typed
  return (
    <div>
      <h3>{student.name}</h3>
      <p>Roll: {student.roll_number}</p>
      <p>Attendance: {student.attendance_percentage}%</p>
    </div>
  );
}
```

### Custom Hook with Types
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SchoolRow = Database['public']['Tables']['schools']['Row'];

export function useSchool(schoolId: string) {
  const [school, setSchool] = useState<SchoolRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchool() {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('id', schoolId)
          .single();

        if (error) throw error;
        setSchool(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSchool();
  }, [schoolId]);

  return { school, loading, error };
}

// Usage in component
const { school, loading, error } = useSchool(schoolId);
// school is typed as SchoolRow | null
```

---

## 🧪 Type-Safe Testing Patterns

### Mock Data with Types
```typescript
import type { Database } from '@/integrations/supabase/types';

type StudentInsert = Database['public']['Tables']['students']['Insert'];

const mockStudent: StudentInsert = {
  school_id: 'test-school-id',
  class_id: 'test-class-id',
  name: 'Test Student',
  roll_number: '001',
  gender: 'male',
  date_of_birth: '2010-01-01',
  email: 'test@student.com',
  phone: '1234567890',
  address: 'Test Address',
  guardian_name: 'Test Guardian',
  guardian_phone: '0987654321',
  // TypeScript ensures all required fields are present
};
```

---

## ⚠️ Common Type Pitfalls

### ❌ Don't: Use `any`
```typescript
// BAD
const data: any = await supabase.from('schools').select('*');
```

### ✅ Do: Let TypeScript Infer or Use Proper Types
```typescript
// GOOD - Type inference
const { data } = await supabase.from('schools').select('*');
// data is automatically typed

// GOOD - Explicit typing
const { data }: { data: SchoolRow[] | null } = await supabase
  .from('schools')
  .select('*');
```

### ❌ Don't: Ignore Null Checks
```typescript
// BAD
const { data } = await supabase.from('schools').select('*');
console.log(data[0].name); // Could crash if data is null
```

### ✅ Do: Handle Null Cases
```typescript
// GOOD
const { data, error } = await supabase.from('schools').select('*');

if (error) {
  console.error('Error:', error);
  return;
}

if (!data || data.length === 0) {
  console.log('No data found');
  return;
}

console.log(data[0].name); // Safe access
```

---

## 📚 Type Generation Workflow

### When to Regenerate Types

1. **After database schema changes**
   ```bash
   npx supabase gen types typescript --project-id YOUR_ID > src/integrations/supabase/types.ts
   ```

2. **After adding/removing tables**
3. **After modifying column types**
4. **After changing relationships**
5. **After Supabase package major updates**

### Verify Types After Generation
```bash
npm run type-check
```

---

## 🎯 Best Practices Summary

1. **Always import Database type** for type safety
2. **Use type inference** when possible (let TypeScript infer from queries)
3. **Extract specific types** for component props and state
4. **Handle null cases** properly
5. **Use Insert/Update types** for mutations
6. **Type your hooks and functions** properly
7. **Avoid `any` types** in Supabase operations
8. **Regenerate types** after schema changes
9. **Run type checks** regularly
10. **Document custom type patterns** in your code

---

## 📞 Resources

- **TypeScript Documentation:** `src/integrations/supabase/types.ts`
- **Supabase TypeScript Guide:** https://supabase.com/docs/reference/javascript/typescript-support
- **Generated Types:** `src/integrations/supabase/types.ts`
- **Type Generator:** https://supabase.com/docs/reference/cli/supabase-gen-types-typescript

---

*This guide demonstrates type-safe patterns used throughout the SchoolXnow application.*
