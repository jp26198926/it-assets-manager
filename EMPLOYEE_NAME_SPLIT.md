# Employee Name Split Migration

## Overview

Successfully split the employee `name` field into three separate fields:

- **firstName** (required)
- **lastName** (required)
- **middleName** (optional)

## Changes Made

### 1. Database Model ([lib/models/types.ts](../lib/models/types.ts))

Updated the `Employee` interface and `EmployeeWithDepartmentSerialized`:

```typescript
export interface Employee {
  _id?: ObjectId;
  employeeId: string;
  firstName: string; // ← NEW
  lastName: string; // ← NEW
  middleName?: string; // ← NEW (optional)
  email: string;
  departmentId: ObjectId;
  position?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Server Actions ([lib/actions/employees.ts](../lib/actions/employees.ts))

#### createEmployee

- Updated parameters to accept `firstName`, `lastName`, `middleName`
- Stores individual name fields in database

#### updateEmployee

- Updated parameters to allow updating individual name fields
- All name fields are optional in updates

#### getEmployees & getEmployeeById

- Updated MongoDB aggregation `$project` to include new name fields
- Updated search to search across `firstName` and `lastName`
- Changed sort order to `lastName` then `firstName`
- Serialization properly converts name fields to strings

### 3. UI Components

#### Add Employee Dialog ([components/employees/add-employee-dialog.tsx](../components/employees/add-employee-dialog.tsx))

- Replaced single "Full Name" field with:
  - **First Name** (required)
  - **Last Name** (required)
  - **Middle Name** (optional)
- Uses grid layout for first/last name side-by-side

#### Edit Employee Dialog ([components/employees/edit-employee-dialog.tsx](../components/employees/edit-employee-dialog.tsx))

- Same layout as Add dialog
- Pre-fills existing values for each name field

#### Employee List ([components/employees/employee-list.tsx](../components/employees/employee-list.tsx))

- Updated display to concatenate name parts
- Format: "LastName, FirstName, MiddleName"
- Filters out empty values automatically

### 4. Migration Script ([scripts/migrate-employee-names.ts](../scripts/migrate-employee-names.ts))

Created script to migrate existing employee data:

- Finds all employees with old `name` field
- Splits names intelligently:
  - 1 part → lastName only
  - 2 parts → firstName lastName
  - 3+ parts → firstName middleName(s) lastName
- Updates documents with new fields
- Removes old `name` field
- Provides detailed migration summary

## Running the Migration

For existing data, run:

```bash
npm run migrate:employee-names
```

This will:

1. Connect to MongoDB
2. Find all employees with the old `name` field
3. Split names into firstName, lastName, middleName
4. Update database records
5. Remove the old `name` field
6. Show migration statistics

## Example Data

### Before:

```json
{
  "employeeId": "EMP001",
  "name": "John Michael Doe",
  "email": "john@company.com"
}
```

### After:

```json
{
  "employeeId": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Michael",
  "email": "john@company.com"
}
```

## Display Format

Employees are now displayed as:

- **"Doe, John, Michael"** (with middle name)
- **"Doe, John"** (without middle name)

## Search Functionality

The search now works across:

- First Name
- Last Name
- Employee ID
- Email

Sorting is by Last Name, then First Name.

## Backward Compatibility

⚠️ **Important**: After running the migration, the old `name` field is removed. Make sure to:

1. Backup your database before migration
2. Update any external systems that reference the old field
3. Test thoroughly before deploying to production

## Next Steps

1. **Backup database** before running migration
2. **Run migration** on staging environment first
3. **Test all functionality**:
   - Creating new employees
   - Editing existing employees
   - Searching and filtering
   - Employee list display
4. **Deploy to production** when confident
5. **Run migration** on production database

## Rollback Plan

If you need to rollback:

1. Restore database from backup
2. Revert code changes to previous commit
3. Redeploy application
