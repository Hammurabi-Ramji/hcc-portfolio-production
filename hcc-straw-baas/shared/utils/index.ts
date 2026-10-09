import { v4 as uuidv4 } from "uuid";

export const generateId = () => uuidv4();

export const formatDate = (date: Date) => date.toISOString();

export const logInfo = (message: string, context?: Record<string, unknown>) => {
	console.log(`[INFO] ${new Date().toISOString()}: ${message}`, context || "");
};

export const logError = (message: string, error?: Record<string, unknown>) => {
	console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || "");
};
