CREATE TABLE `contactInquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`company` varchar(255),
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`inquiryType` enum('general','quote','support','partnership','regulatory') NOT NULL DEFAULT 'general',
	`status` enum('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
	`assignedTo` int,
	`responseNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contactInquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `subcategory` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `productNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `size` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `specifications` text;--> statement-breakpoint
ALTER TABLE `products` ADD `activeIngredients` text;--> statement-breakpoint
ALTER TABLE `products` ADD `dosageForm` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `strength` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `imageUrl` text;--> statement-breakpoint
ALTER TABLE `products` ADD `isFeatured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `contactInquiries` ADD CONSTRAINT `contactInquiries_assignedTo_users_id_fk` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `email_idx` ON `contactInquiries` (`email`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `contactInquiries` (`status`);