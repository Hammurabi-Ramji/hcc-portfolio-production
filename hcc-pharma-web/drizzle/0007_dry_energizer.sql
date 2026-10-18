CREATE TABLE `cartItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cartItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quoteRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteNumber` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`customerId` int,
	`status` enum('pending','reviewed','quoted','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`items` text NOT NULL,
	`totalEstimate` decimal(12,2),
	`notes` text,
	`deliveryAddress` text,
	`requestedDeliveryDate` date,
	`quotedBy` int,
	`quotedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quoteRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `quoteRequests_quoteNumber_unique` UNIQUE(`quoteNumber`)
);
--> statement-breakpoint
ALTER TABLE `cartItems` ADD CONSTRAINT `cartItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quoteRequests` ADD CONSTRAINT `quoteRequests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quoteRequests` ADD CONSTRAINT `quoteRequests_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_product_idx` ON `cartItems` (`userId`,`productId`);--> statement-breakpoint
CREATE INDEX `quote_number_idx` ON `quoteRequests` (`quoteNumber`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `quoteRequests` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `quoteRequests` (`status`);