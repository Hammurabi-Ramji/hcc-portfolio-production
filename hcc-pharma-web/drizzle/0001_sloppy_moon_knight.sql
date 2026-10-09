CREATE TABLE `auditTrail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`resource` varchar(100) NOT NULL,
	`resourceId` int,
	`details` text,
	`ipAddress` varchar(50),
	`userAgent` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditTrail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`country` varchar(100) NOT NULL DEFAULT 'USA',
	`customerType` enum('veterinarian','distributor','clinic','farm','other') NOT NULL DEFAULT 'veterinarian',
	`taxId` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deviations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviationNumber` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`severity` enum('critical','major','minor') NOT NULL,
	`status` enum('open','investigating','resolved','closed') NOT NULL DEFAULT 'open',
	`reportedBy` int NOT NULL,
	`reportedDate` timestamp NOT NULL DEFAULT (now()),
	`affectedBatch` varchar(100),
	`rootCause` text,
	`correctiveAction` text,
	`closedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deviations_id` PRIMARY KEY(`id`),
	CONSTRAINT `deviations_deviationNumber_unique` UNIQUE(`deviationNumber`)
);
--> statement-breakpoint
CREATE TABLE `inventoryLots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`lotNumber` varchar(100) NOT NULL,
	`quantityAvailable` int NOT NULL DEFAULT 0,
	`quantityAllocated` int NOT NULL DEFAULT 0,
	`quantityOnHold` int NOT NULL DEFAULT 0,
	`expirationDate` timestamp NOT NULL,
	`manufacturingDate` timestamp NOT NULL,
	`storageLocation` varchar(100),
	`status` enum('available','allocated','quarantined','expired') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryLots_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventoryLots_lotNumber_unique` UNIQUE(`lotNumber`)
);
--> statement-breakpoint
CREATE TABLE `manufacturingBatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchNumber` varchar(100) NOT NULL,
	`productId` int NOT NULL,
	`quantityProduced` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`completionDate` timestamp,
	`status` enum('planned','in_progress','completed','failed') NOT NULL DEFAULT 'planned',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manufacturingBatches_id` PRIMARY KEY(`id`),
	CONSTRAINT `manufacturingBatches_batchNumber_unique` UNIQUE(`batchNumber`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(100) NOT NULL,
	`customerId` int NOT NULL,
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`totalAmount` decimal(12,2) NOT NULL,
	`shippingAddress` text,
	`trackingNumber` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`ndc` varchar(50),
	`unitPrice` decimal(10,2) NOT NULL,
	`unitOfMeasure` varchar(50) NOT NULL DEFAULT 'unit',
	`storageConditions` text,
	`shelfLifeDays` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poNumber` varchar(100) NOT NULL,
	`vendorId` int NOT NULL,
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`expectedDelivery` timestamp,
	`status` enum('pending','confirmed','shipped','received','cancelled') NOT NULL DEFAULT 'pending',
	`totalAmount` decimal(12,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchaseOrders_poNumber_unique` UNIQUE(`poNumber`)
);
--> statement-breakpoint
CREATE TABLE `qualityTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`testType` varchar(100) NOT NULL,
	`testDate` timestamp NOT NULL DEFAULT (now()),
	`result` enum('pass','fail','pending') NOT NULL DEFAULT 'pending',
	`testedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qualityTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`address` text,
	`vendorType` varchar(100) NOT NULL,
	`tier` enum('platinum','gold','silver','bronze') NOT NULL DEFAULT 'bronze',
	`performanceScore` decimal(5,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','customer','vendor','employee','regulatory') NOT NULL DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE `auditTrail` ADD CONSTRAINT `auditTrail_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deviations` ADD CONSTRAINT `deviations_reportedBy_users_id_fk` FOREIGN KEY (`reportedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryLots` ADD CONSTRAINT `inventoryLots_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manufacturingBatches` ADD CONSTRAINT `manufacturingBatches_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchaseOrders` ADD CONSTRAINT `purchaseOrders_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qualityTests` ADD CONSTRAINT `qualityTests_batchId_manufacturingBatches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `manufacturingBatches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qualityTests` ADD CONSTRAINT `qualityTests_testedBy_users_id_fk` FOREIGN KEY (`testedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_idx` ON `auditTrail` (`userId`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `auditTrail` (`timestamp`);--> statement-breakpoint
CREATE INDEX `resource_idx` ON `auditTrail` (`resource`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `deviation_number_idx` ON `deviations` (`deviationNumber`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `deviations` (`status`);--> statement-breakpoint
CREATE INDEX `lot_number_idx` ON `inventoryLots` (`lotNumber`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `inventoryLots` (`productId`);--> statement-breakpoint
CREATE INDEX `expiration_idx` ON `inventoryLots` (`expirationDate`);--> statement-breakpoint
CREATE INDEX `batch_number_idx` ON `manufacturingBatches` (`batchNumber`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `orderItems` (`orderId`);--> statement-breakpoint
CREATE INDEX `order_number_idx` ON `orders` (`orderNumber`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `orders` (`customerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `po_number_idx` ON `purchaseOrders` (`poNumber`);--> statement-breakpoint
CREATE INDEX `vendor_idx` ON `purchaseOrders` (`vendorId`);--> statement-breakpoint
CREATE INDEX `batch_idx` ON `qualityTests` (`batchId`);