CREATE TABLE `pricingTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`minQuantity` int NOT NULL,
	`maxQuantity` int,
	`discountPercentage` decimal(5,2) NOT NULL,
	`discountedPrice` decimal(10,2),
	`tierName` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricingTiers_id` PRIMARY KEY(`id`)
);
