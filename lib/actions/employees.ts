"use server";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type {
  Employee,
  Department,
  EmployeeWithDepartment,
  EmployeeWithDepartmentSerialized,
} from "@/lib/models/types";
import { revalidatePath } from "next/cache";

export async function createEmployee(data: {
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  departmentId: string;
  position?: string;
  phone?: string;
}): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Employee>("employees");

    // Validate department exists
    const departmentExists = await db
      .collection("departments")
      .findOne({ _id: new ObjectId(data.departmentId) });
    if (!departmentExists) {
      return { success: false, error: "Selected department does not exist" };
    }

    const employee: Employee = {
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      email: data.email,
      departmentId: new ObjectId(data.departmentId),
      position: data.position,
      phone: data.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(employee);
    employee._id = result.insertedId;

    // Serialize the employee data to plain objects
    const serializedEmployee: any = {
      _id: employee._id?.toString(),
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      middleName: employee.middleName,
      email: employee.email,
      departmentId: employee.departmentId.toString(),
      position: employee.position,
      phone: employee.phone,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };

    revalidatePath("/employees");
    return { success: true, employee: serializedEmployee };
  } catch (error) {
    console.error("Error creating employee:", error);
    return { success: false, error: "Failed to create employee" };
  }
}

export async function getEmployees(
  search?: string
): Promise<EmployeeWithDepartmentSerialized[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Employee>("employees");

    const pipeline: any[] = [
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
          _id: 1,
          employeeId: 1,
          firstName: 1,
          lastName: 1,
          middleName: 1,
          email: 1,
          departmentId: 1,
          position: 1,
          phone: 1,
          createdAt: 1,
          updatedAt: 1,
          department: {
            _id: "$departmentData._id",
            name: "$departmentData.name",
            code: "$departmentData.code",
          },
        },
      },
      {
        $sort: { lastName: 1, firstName: 1 },
      },
    ];

    if (search) {
      pipeline.unshift({
        $match: {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { employeeId: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const employees = await collection
      .aggregate<EmployeeWithDepartment>(pipeline)
      .toArray();

    // Convert to serialized format for client components
    const serialized: EmployeeWithDepartmentSerialized[] = employees.map(
      (emp) => ({
        _id: emp._id?.toString(),
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        middleName: emp.middleName,
        email: emp.email,
        departmentId: emp.departmentId.toString(),
        position: emp.position,
        phone: emp.phone,
        createdAt: emp.createdAt.toISOString(),
        updatedAt: emp.updatedAt.toISOString(),
        department: {
          _id: emp.department._id.toString(),
          name: emp.department.name,
          code: emp.department.code,
        },
      })
    );

    return serialized;
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
}

export async function getEmployeeById(
  id: string
): Promise<EmployeeWithDepartmentSerialized | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Employee>("employees");

    const pipeline = [
      {
        $match: { _id: new ObjectId(id) },
      },
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
          _id: 1,
          employeeId: 1,
          firstName: 1,
          lastName: 1,
          middleName: 1,
          email: 1,
          departmentId: 1,
          position: 1,
          phone: 1,
          createdAt: 1,
          updatedAt: 1,
          department: {
            _id: "$departmentData._id",
            name: "$departmentData.name",
            code: "$departmentData.code",
          },
        },
      },
    ];

    const employees = await collection
      .aggregate<EmployeeWithDepartment>(pipeline)
      .toArray();

    if (!employees[0]) return null;

    const emp = employees[0];
    return {
      _id: emp._id?.toString(),
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      middleName: emp.middleName,
      email: emp.email,
      departmentId: emp.departmentId.toString(),
      position: emp.position,
      phone: emp.phone,
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
      department: {
        _id: emp.department._id.toString(),
        name: emp.department.name,
        code: emp.department.code,
      },
    };
  } catch (error) {
    console.error("Error fetching employee:", error);
    return null;
  }
}

export async function createDepartment(data: {
  name: string;
  code: string;
  description?: string;
}): Promise<{ success: boolean; department?: Department; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Department>("departments");

    const department: Department = {
      ...data,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(department);
    department._id = result.insertedId;

    revalidatePath("/departments");
    return { success: true, department };
  } catch (error) {
    console.error("Error creating department:", error);
    return { success: false, error: "Failed to create department" };
  }
}

export async function updateEmployee(
  id: string,
  data: {
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    departmentId?: string;
    position?: string;
    phone?: string;
  }
): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Employee>("employees");

    // Validate department exists if departmentId is provided
    if (data.departmentId) {
      const departmentExists = await db
        .collection("departments")
        .findOne({ _id: new ObjectId(data.departmentId) });
      if (!departmentExists) {
        return { success: false, error: "Selected department does not exist" };
      }
    }

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Convert departmentId to ObjectId if present
    if (data.departmentId) {
      updateData.departmentId = new ObjectId(data.departmentId);
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return { success: false, error: "Employee not found" };
    }

    // Serialize the employee data to plain objects
    const serializedEmployee: any = {
      _id: result._id?.toString(),
      employeeId: result.employeeId,
      firstName: result.firstName,
      lastName: result.lastName,
      middleName: result.middleName,
      email: result.email,
      departmentId: result.departmentId.toString(),
      position: result.position,
      phone: result.phone,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    revalidatePath("/employees");
    return { success: true, employee: serializedEmployee };
  } catch (error) {
    console.error("Error updating employee:", error);
    return { success: false, error: "Failed to update employee" };
  }
}

export async function deleteEmployee(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Employee>("employees");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return { success: false, error: "Employee not found" };
    }

    revalidatePath("/employees");
    return { success: true };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return { success: false, error: "Failed to delete employee" };
  }
}

export async function getDepartments(): Promise<Department[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Department>("departments");
    const departments = await collection.find().sort({ name: 1 }).toArray();
    return JSON.parse(JSON.stringify(departments));
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
}
