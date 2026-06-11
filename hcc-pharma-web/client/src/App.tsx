import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import QADocuments from "./pages/QADocuments";
import AboutPage from "./pages/about-page";
import ProductsPage from "./pages/products-page";
import ServicesPage from "./pages/services-page";
import QualityPage from "./pages/quality-page";
import ResourcesPage from "./pages/resources-page";
import ContactPage from "./pages/contact-page";
import CustomerDashboardNew from "./pages/customer-dashboard";
import PrivacyPolicy from "./pages/privacy-policy";
import TermsOfService from "./pages/terms-of-service";
import CookiePolicy from "./pages/cookie-policy";

// Customer Portal
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerOrders from "./pages/customer/Orders";
import CustomerOrderCreate from "./pages/customer/OrderCreate";
import CustomerInvoices from "./pages/customer/Invoices";
import CustomerComplianceDocuments from "./pages/customer/ComplianceDocuments";

// Vendor Portal
import VendorDashboard from "./pages/vendor/Dashboard";
import VendorPurchaseOrders from "./pages/vendor/PurchaseOrders";

// Employee Portal
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeInventory from "./pages/employee/Inventory";
import EmployeeManufacturing from "./pages/employee/Manufacturing";
import EmployeeQuality from "./pages/employee/Quality";
import EmployeeDeviations from "./pages/employee/Deviations";
import Grievances from "./pages/employee/Grievances";
import KnowledgeBase from "./pages/employee/KnowledgeBase";
import TimeClock from "./pages/employee/TimeClock";
import EmployeeOrderFulfillment from "./pages/employee/OrderFulfillment";

// Regulatory Portal
import RegulatoryDashboard from "./pages/regulatory/Dashboard";
import RegulatoryAuditTrail from "./pages/regulatory/AuditTrail";
import RegulatoryDeviations from "./pages/regulatory/Deviations";
import RegulatoryDataExport from "./pages/regulatory/DataExport";

// Admin Portal
import AdminDashboard from "./pages/admin/Dashboard";
import SuperDashboard from "@/pages/admin/SuperDashboard";
import Signatures from "@/pages/admin/Signatures";
import VendorPerformance from "@/pages/admin/VendorPerformance";
import OSINTMonitoring from "@/pages/admin/OSINTMonitoring";
import AdminCustomers from "./pages/admin/Customers";
import CustomerManagement from "./pages/customer-management";
import ProductManagement from "./pages/product-management";
import AdminOrders from "./pages/admin-orders";
import AdminVendors from "./pages/admin/Vendors";
import AdminProducts from "./pages/admin/Products";
import OrderManagement from "./pages/order-management";
import InventoryManagement from "./pages/inventory-management";
import ManufacturingManagement from "./pages/manufacturing-management";
import QualityTestManagement from "./pages/quality-test-management";
import DeviationManagement from "./pages/deviation-management";
import InvoicesPage from "./pages/invoices";
import ComplianceDocumentsPage from "./pages/compliance-documents";
import DataExportPage from "./pages/data-export";
import AnalyticsDashboard from "./pages/analytics-dashboard";
import CustomerDashboardEnhanced from "./pages/customer-dashboard-enhanced";
import VendorDashboardEnhanced from "./pages/vendor-dashboard-enhanced";
import EmployeeDashboardEnhanced from "./pages/employee-dashboard-enhanced";
import RegulatoryDashboardEnhanced from "./pages/regulatory-dashboard-enhanced";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path={"/"} component={Home} />
      <Route path={"/about"} component={AboutPage} />
      <Route path={"/products"} component={ProductsPage} />
      <Route path={"/services"} component={ServicesPage} />
      <Route path={"/quality"} component={QualityPage} />
      <Route path={"/resources"} component={ResourcesPage} />
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/qa-documents"} component={QADocuments} />
      <Route path={"/privacy-policy"} component={PrivacyPolicy} />
      <Route path={"/terms-of-service"} component={TermsOfService} />
      <Route path={"/cookie-policy"} component={CookiePolicy} />
      
      {/* Customer Portal */}
      <Route path="/my-dashboard" component={CustomerDashboardNew} />
      <Route path="/client-portal" component={CustomerDashboard} />
      <Route path="/client-portal/dashboard" component={CustomerDashboard} />
      <Route path="/client-portal/orders" component={CustomerOrders} />
      <Route path="/client-portal/orders/new" component={CustomerOrderCreate} />
      <Route path="/client-portal/invoices" component={CustomerInvoices} />
      <Route path="/client-portal/documents" component={CustomerComplianceDocuments} />
      <Route path="/client-portal/compliance" component={CustomerComplianceDocuments} />
      <Route path="/client-portal/compliance-documents" component={CustomerComplianceDocuments} />
      <Route path="/client-portal/quality-docs" component={CustomerComplianceDocuments} />
      <Route path="/customer" component={CustomerDashboard} />
      <Route path="/customer/orders" component={CustomerOrders} />
      <Route path="/customer/orders/new" component={CustomerOrderCreate} />
      <Route path="/customer/invoices" component={CustomerInvoices} />
      <Route path="/customer/compliance" component={CustomerComplianceDocuments} />
      
      {/* Vendor Portal */}
      <Route path="/vendor" component={VendorDashboard} />
      <Route path="/vendor/purchase-orders" component={VendorPurchaseOrders} />
      
      {/* Employee Portal */}
      <Route path="/employee" component={EmployeeDashboard} />
      <Route path="/employee/inventory" component={EmployeeInventory} />
      <Route path="/employee/manufacturing" component={EmployeeManufacturing} />
      <Route path="/employee/quality" component={EmployeeQuality} />
      <Route path="/employee/deviations" component={EmployeeDeviations} />
      <Route path="/employee/fulfillment" component={EmployeeOrderFulfillment} />
      <Route path="/employee/grievances" component={Grievances} />
      <Route path="/employee/knowledge" component={KnowledgeBase} />
      <Route path="/employee/time-clock" component={TimeClock} />
      
      {/* Regulatory Portal */}
      <Route path="/regulatory" component={RegulatoryDashboard} />
      <Route path="/regulatory/audit-trail" component={RegulatoryAuditTrail} />
      <Route path="/regulatory/deviations" component={RegulatoryDeviations} />
      <Route path="/regulatory/export" component={RegulatoryDataExport} />
      
      {/* Admin Portal */}
      <Route path={"/admin"} component={AdminDashboard} />      <Route path="/admin/dashboard" component={SuperDashboard} />
      <Route path="/admin/signatures" component={Signatures} />
      <Route path="/admin/vendor-performance" component={VendorPerformance} />
      <Route path="/admin/osint" component={OSINTMonitoring} />    <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/vendors" component={AdminVendors} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={OrderManagement} />
      <Route path="/admin/inventory" component={InventoryManagement} />
      <Route path="/admin/manufacturing" component={ManufacturingManagement} />
      <Route path="/admin/quality" component={QualityTestManagement} />
      <Route path="/admin/deviations" component={DeviationManagement} />
      <Route path="/admin/customer-management" component={CustomerManagement} />
      <Route path="/admin/product-management" component={ProductManagement} />
      <Route path="/invoices" component={InvoicesPage} />
      <Route path="/compliance-documents" component={ComplianceDocumentsPage} />
      <Route path="/data-export" component={DataExportPage} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
