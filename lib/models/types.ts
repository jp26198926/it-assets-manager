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
  | "closed"
  | "defective_closed";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface InventoryItem {
  _id?: ObjectId;
  barcode: string;
  name: string;
  description?: string;
  categoryId: ObjectId; // Reference to Category collection
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

// Extended inventory item with populated category data
export interface InventoryItemWithCategory extends Omit<
  InventoryItem,
  "categoryId"
> {
  categoryId: ObjectId;
  category: {
    _id: ObjectId;
    name: string;
    code: string;
  };
}

// Serialized version for client components
export interface InventoryItemWithCategorySerialized {
  _id?: string;
  barcode: string;
  name: string;
  description?: string;
  categoryId: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: ItemStatus;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  category: {
    _id: string;
    name: string;
    code: string;
  };
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

export interface Category {
  _id?: ObjectId;
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
}

// Serialized version for client components
export interface CategorySerialized {
  _id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
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
  returnRemarks?: string;
  returnStatus?: "good" | "damaged" | "needs_repair" | "beyond_repair";
}

export interface TicketComment {
  _id?: ObjectId;
  userId: ObjectId; // Reference to User collection
  userName: string;
  userEmail: string;
  comment: string;
  createdAt: Date;
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
    departmentId?: ObjectId; // Reference to Department collection
  };
  assignedToId?: ObjectId; // Reference to User collection
  itemId?: ObjectId;
  itemBarcode?: string;
  itemName?: string;
  comments?: TicketComment[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

// Extended ticket with populated department and assigned user data
export interface TicketWithDepartment extends Omit<Ticket, "reportedBy"> {
  reportedBy: {
    name: string;
    email: string;
    departmentId?: ObjectId;
    department?: {
      _id: ObjectId;
      name: string;
      code: string;
    };
  };
  assignedUser?: {
    _id: ObjectId;
    name: string;
    email: string;
    role: string;
  };
}

// Serialized version for client components
export interface TicketWithDepartmentSerialized {
  _id?: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  reportedBy: {
    name: string;
    email: string;
    departmentId?: string;
    department?: {
      _id: string;
      name: string;
      code: string;
    };
  };
  assignedToId?: string;
  assignedUser?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  itemId?: string;
  itemBarcode?: string;
  itemName?: string;
  comments?: TicketComment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}
