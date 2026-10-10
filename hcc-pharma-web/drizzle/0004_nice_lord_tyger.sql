CREATE TABLE `sigSigners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signatureRequestId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` varchar(100) NOT NULL,
	`order` int,
	`status` varchar(50) NOT NULL,
	`signedAt` timestamp,
	CONSTRAINT `sigSigners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sigRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`envelopeId` varchar(255) NOT NULL,
	`documentId` varchar(255) NOT NULL,
	`documentName` varchar(255) NOT NULL,
	`documentType` enum('batch_record','coa','compliance_report','deviation') NOT NULL,
	`status` enum('created','sent','delivered','signed','completed','declined','voided') NOT NULL,
	`signingUrl` text,
	`signedDocumentUrl` text,
	`requestedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `sigRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `sigRequests_envelopeId_unique` UNIQUE(`envelopeId`)
);
--> statement-breakpoint
DROP TABLE `signatureRequestSigners`;--> statement-breakpoint
DROP TABLE `signatureRequests`;--> statement-breakpoint
ALTER TABLE `sigRequests` ADD CONSTRAINT `sigRequests_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sig_request_idx` ON `sigSigners` (`signatureRequestId`);--> statement-breakpoint
CREATE INDEX `envelope_idx` ON `sigRequests` (`envelopeId`);--> statement-breakpoint
CREATE INDEX `sig_status_idx` ON `sigRequests` (`status`);