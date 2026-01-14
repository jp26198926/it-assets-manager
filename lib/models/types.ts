import type { ObjectId } from "mongodb";

export type ItemCategory =
  | "laptop"
  | "desktop"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "printer"
  | "network"
  | "storage"
  | "accessory"
  | "other";

export type ItemStatus =
  | "in_stock"
  | "issued"
  | "under_repair"
  | "beyond_repair"
  | "disposed";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_parts"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type RepairOutcome = "fixed" | "beyond_repair" | "pending";

export interface InventoryItem {
  _id?: ObjectId;
  barcode: string;
  name: string;
  description?: string;
  category: ItemCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: ItemStatus;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  _id?: ObjectId;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  departmentId: ObjectId; // Reference to Department collection
  position?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended employee with populated department data
export interface EmployeeWithDepartment extends Omit<Employee, "departmentId"> {
  departmentId: ObjectId;
  department: {
    _id: ObjectId;
    name: string;
    code: string;
  };
}

// Serialized version for client components (ObjectId -> string, Date -> string)
export interface EmployeeWithDepartmentSerialized {
  _id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  departmentId: string;
  position?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
}

export interface Department {
  _id?: ObjectId;
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
}

export interface Issuance {
  _id?: ObjectId;
  itemId: ObjectId;
  itemBarcode: string;
  itemName: string;
  issuedTo: {
    type: "employee" | "department";
    id: ObjectId;
    name: string;
  };
  issuedBy: string;
  issuedAt: Date;
  returnedAt?: Date;
  expectedReturn?: Date;
  notes?: string;
  status: "active" | "returned";
}

export interface Ticket {
  _id?: ObjectId;
  ticketNumber: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  reportedBy: {
    name: string;
    email: string;
    department?: string;
  };
  assignedTo?: string;
  itemId?: ObjectId;
  itemBarcode?: string;
  itemName?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

export interface RepairRecord {
  _id?: ObjectId;
  ticketId: ObjectId;
  ticketNumber: string;
  itemId: ObjectId;
  itemBarcode: string;
  itemName: string;
  technicianName: string;
  receivedAt: Date;
  diagnosis?: string;
  actionsTaken?: string;
  partsUsed?: string[];
  outcome: RepairOutcome;
  completedAt?: Date;
  returnedToUser: boolean;
  returnedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
