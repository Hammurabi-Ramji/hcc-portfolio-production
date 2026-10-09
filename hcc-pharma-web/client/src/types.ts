// Type definitions for the application

export interface Document {
  id: number;
  documentNumber: string;
  title: string;
  description?: string | null;
  category: "sop" | "batch_record" | "quality_report" | "compliance" | "training" | "safety" | "other";
  fileUrl: string;
  fileType?: string | null;
  version?: string | null;
  effectiveDate?: Date | null;
  expirationDate?: Date | null;
  isPublic: boolean | null;
  createdBy?: number | null;
  approvedBy?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  ndc?: string | null;
  productNumber?: string | null;
  size?: string | null;
  specifications?: string | null;
  activeIngredients?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  unitPrice: string;
  price?: number | string;
  unitOfMeasure: string;
  storageConditions?: string | null;
  shelfLifeDays?: number | null;
  isActive: boolean;
  isFeatured: boolean;
  isHighlighted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type?: string;
}

export interface Vendor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  tier?: string;
  status?: string;
}

export interface Order {
  id: number;
  customerId: number;
  status: string;
  totalAmount?: number;
  orderDate?: Date;
  shippedDate?: Date;
}

export interface InventoryLot {
  id: number;
  productId: number;
  lotNumber: string;
  quantity: number;
  expirationDate?: Date;
  receivedDate?: Date;
  location?: string;
}

export interface ManufacturingBatch {
  id: number;
  productId: number;
  batchNumber: string;
  quantity: number;
  status: string;
  startDate?: Date;
  completionDate?: Date;
}

export interface Deviation {
  id: number;
  title: string;
  description?: string;
  severity: string;
  status: string;
  reportedBy?: number;
  reportedDate?: Date;
  closedDate?: Date;
}

export interface Grievance {
  id: number;
  title: string;
  description?: string;
  anonymous: boolean;
  status: string;
  submittedDate?: Date;
  resolvedDate?: Date;
}

export interface KnowledgeArticle {
  id: number;
  title: string;
  department: string;
  content?: string;
  steps?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
