export interface Tenant {
	id: string;
	name: string;
	industry: Industry;
	status: "active" | "suspended" | "pending";
}

export type Industry =
	| "healthcare"
	| "finance"
	| "ecommerce"
	| "education"
	| "logistics"
	| "manufacturing"
	| "realestate"
	| "travel"
	| "entertainment";

export interface User {
	id: string;
	email: string;
	role: "ADMIN" | "USER" | "SUPER_ADMIN";
	tenantId: string;
}

export interface ApiResponse<T> {
	data: T;
	timestamp: string;
	requestId: string;
}
