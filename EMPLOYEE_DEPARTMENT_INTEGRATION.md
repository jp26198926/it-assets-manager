# Employee-Department Integration

## Overview

The employee module has been updated to use **proper database references** to the department collection instead of storing department names as strings.

## Changes Made

### 1. Data Model Updates

**Before:**

```typescript
interface Employee {
  department: string; // Plain text department name
}
```

**After:**

```typescript
interface Employee {
  departmentId: ObjectId; // Reference to Department collection
}

interface EmployeeWithDepartment {
  departmentId: ObjectId;
  department: {
    _id: ObjectId;
    name: string;
    code: string;
  };
}
```

### 2. Database Structure

**Employees Collection:**

- Changed `department` field from `string` to `departmentId: ObjectId`
- References the `departments` collection via `_id`

**Benefits:**

- ✅ Data integrity - Can't assign non-existent departments
- ✅ Consistent naming - Department changes update everywhere
- ✅ Better querying - Can join employee and department data
- ✅ Relational data - Proper database normalization

### 3. Files Modified

#### Models

- **`lib/models/types.ts`**
  - Changed `Employee.department` from `string` to `departmentId: ObjectId`
  - Added `EmployeeWithDepartment` interface for populated data

#### Actions

- **`lib/actions/employees.ts`**
  - `createEmployee()` now validates department exists
  - `getEmployees()` uses MongoDB aggregation with `$lookup`
  - `getEmployeeById()` populates department data
  - Employees are returned with department details

#### Components

- **`components/employees/add-employee-dialog.tsx`**
  - Changed from text input to dropdown select
  - Loads departments from database
  - Validates department selection
- **`components/employees/employee-list.tsx`**

  - Displays department as badge with neo-flat styling
  - Shows populated department name
  - Updated type from `Employee[]` to `EmployeeWithDepartment[]`

- **`components/issuance/issue-item-form.tsx`**
  - Updated to use `EmployeeWithDepartment` type
  - Displays department name next to employee name

### 4. Migration Script

A migration script is provided to convert existing employee data:

**`scripts/migrate-employee-departments.ts`**

- Finds all employees with string department field
- Matches to existing departments by name (case-insensitive)
- Creates new department if not found
- Updates employee with department ObjectId reference
- Removes old string department field

## Usage

### 1. Run Migration (If you have existing data)

```bash
npm run migrate:employee-departments
```

This will:

- Find all employees with string departments
- Match them to existing departments
- Create new departments if needed
- Update all employee records

**Output:**

```
Connected to MongoDB
Found 25 employees to migrate
✓ Migrated John Doe -> IT
✓ Created department "Marketing" and migrated Jane Smith
✓ Migrated Bob Wilson -> IT
...
✅ Migration complete!
==================
Migrated: 25
Skipped: 0
Failed: 0
Total: 25
```

### 2. Creating Employees

The Add Employee dialog now shows a dropdown of available departments:

```typescript
// Select from existing departments
const result = await createEmployee({
  employeeId: "EMP001",
  name: "John Doe",
  email: "john@company.com",
  departmentId: "507f1f77bcf86cd799439011", // ObjectId
  position: "Software Engineer",
  phone: "+1234567890",
});
```

### 3. Querying Employees

Employees are automatically populated with department data:

```typescript
const employees = await getEmployees();
// Returns: EmployeeWithDepartment[]
// Each employee includes:
// {
//   _id: ObjectId,
//   employeeId: "EMP001",
//   name: "John Doe",
//   departmentId: ObjectId,
//   department: {
//     _id: ObjectId,
//     name: "IT",
//     code: "IT"
//   }
// }
```

## Benefits

### Data Integrity

- Cannot assign employees to non-existent departments
- Department changes automatically reflect in employee records
- Referential integrity enforced at database level

### Performance

- Efficient joins using MongoDB aggregation
- Single query to get employee with department data
- Indexed lookups on department references

### Maintainability

- Centralized department management
- No duplicate department names
- Easy to rename/reorganize departments

### User Experience

- Dropdown selection prevents typos
- Autocomplete from existing departments
- Visual department badges in lists

## API Examples

### Get all employees with departments

```typescript
const employees = await getEmployees();
// Automatically includes department.name, department.code
```

### Search employees

```typescript
const results = await getEmployees("john");
// Searches name, employeeId, email
// Still returns employees with populated department data
```

### Get single employee

```typescript
const employee = await getEmployeeById(id);
// Returns employee with department: { _id, name, code }
```

## Database Schema

### Before Migration

```json
{
  "_id": ObjectId("..."),
  "employeeId": "EMP001",
  "name": "John Doe",
  "email": "john@company.com",
  "department": "IT",  // String
  "position": "Software Engineer",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### After Migration

```json
{
  "_id": ObjectId("..."),
  "employeeId": "EMP001",
  "name": "John Doe",
  "email": "john@company.com",
  "departmentId": ObjectId("507f1f77bcf86cd799439011"),  // Reference
  "position": "Software Engineer",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

## Aggregation Pipeline

The `getEmployees()` function uses MongoDB aggregation:

```javascript
[
  {
    $lookup: {
      from: "departments",
      localField: "departmentId",
      foreignField: "_id",
      as: "departmentData",
    },
  },
  {
    $unwind: {
      path: "$departmentData",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      // ... all employee fields
      department: {
        _id: "$departmentData._id",
        name: "$departmentData.name",
        code: "$departmentData.code",
      },
    },
  },
];
```

## Troubleshooting

### Issue: "Selected department does not exist"

- **Cause:** Department was deleted or ID is invalid
- **Solution:** Create the department first, then assign employee

### Issue: Employee shows "No department"

- **Cause:** Employee's departmentId references deleted department
- **Solution:** Re-assign employee to valid department or run migration script

### Issue: Migration fails

- **Cause:** Database connection or data inconsistency
- **Solution:** Check MongoDB URI, ensure departments collection exists

## Next Steps

Consider implementing:

1. **Department deletion protection** - Prevent deleting departments with employees
2. **Bulk employee transfer** - Move multiple employees between departments
3. **Department hierarchy** - Parent/child department relationships
4. **Employee count per department** - Dashboard statistics
5. **Department-based permissions** - RBAC enhancement

## Rollback (If Needed)

If you need to rollback to string departments:

```typescript
// Rollback script (not recommended)
const employees = await db.collection("employees").find({}).toArray();
for (const emp of employees) {
  if (emp.departmentId) {
    const dept = await db
      .collection("departments")
      .findOne({ _id: emp.departmentId });
    await db.collection("employees").updateOne(
      { _id: emp._id },
      {
        $set: { department: dept?.name || "Unknown" },
        $unset: { departmentId: "" },
      }
    );
  }
}
```

## Summary

✅ Employees now properly reference departments via ObjectId
✅ Migration script provided for existing data
✅ All components updated to use department references
✅ Data integrity enforced at database level
✅ Better UX with dropdown selection
✅ Improved performance with aggregation pipeline
