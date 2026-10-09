import type { ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  Clock,
  Download,
  Factory,
  FileText,
  FlaskConical,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Truck,
} from "lucide-react";

export interface PortalNavigationItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export const customerPortalNavigation: PortalNavigationItem[] = [
  { label: "Dashboard", href: "/client-portal", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Orders", href: "/client-portal/orders", icon: <ShoppingCart className="h-4 w-4" /> },
  { label: "Invoices", href: "/client-portal/invoices", icon: <FileText className="h-4 w-4" /> },
  { label: "Compliance Docs", href: "/client-portal/documents", icon: <ShieldCheck className="h-4 w-4" /> },
  { label: "Products", href: "/products", icon: <Package className="h-4 w-4" /> },
];

export const employeePortalNavigation: PortalNavigationItem[] = [
  { label: "Dashboard", href: "/employee", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Inventory", href: "/employee/inventory", icon: <Package className="h-4 w-4" /> },
  { label: "Manufacturing", href: "/employee/manufacturing", icon: <Factory className="h-4 w-4" /> },
  { label: "Quality", href: "/employee/quality", icon: <FlaskConical className="h-4 w-4" /> },
  { label: "Deviations", href: "/employee/deviations", icon: <AlertTriangle className="h-4 w-4" /> },
  { label: "Order Fulfillment", href: "/employee/fulfillment", icon: <Truck className="h-4 w-4" /> },
  { label: "Knowledge Base", href: "/employee/knowledge", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Grievances", href: "/employee/grievances", icon: <ShieldAlert className="h-4 w-4" /> },
  { label: "Time Clock", href: "/employee/time-clock", icon: <Clock className="h-4 w-4" /> },
];

export const regulatoryPortalNavigation: PortalNavigationItem[] = [
  { label: "Dashboard", href: "/regulatory", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Audit Trail", href: "/regulatory/audit-trail", icon: <FileText className="h-4 w-4" /> },
  { label: "Deviations", href: "/regulatory/deviations", icon: <AlertTriangle className="h-4 w-4" /> },
  { label: "Data Export", href: "/regulatory/export", icon: <Download className="h-4 w-4" /> },
];
