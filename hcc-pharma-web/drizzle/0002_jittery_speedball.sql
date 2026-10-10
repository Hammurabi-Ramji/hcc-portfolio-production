CREATE TABLE `documentChanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`changeType` enum('created','amended','corrected','modified','approved') NOT NULL,
	`changeDescription` text NOT NULL,
	`previousVersion` varchar(50),
	`newVersion` varchar(50),
	`changedBy` int NOT NULL,
	`changeOrderNumber` varchar(100),
	`justification` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentChanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentNumber` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('sop','batch_record','quality_report','compliance','training','safety','other') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` varchar(50),
	`fileSize` int,
	`version` varchar(50) NOT NULL,
	`isHallOfRecords` boolean DEFAULT false,
	`isPublic` boolean DEFAULT false,
	`uploadedBy` int NOT NULL,
	`approvedBy` int,
	`approvalDate` timestamp,
	`expirationDate` date,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `documents_documentNumber_unique` UNIQUE(`documentNumber`)
);
--> statement-breakpoint
CREATE TABLE `employeeAnniversaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`anniversaryType` enum('hire_date','promotion','achievement') NOT NULL,
	`anniversaryDate` date NOT NULL,
	`yearsOfService` int,
	`description` text,
	`isPublic` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeAnniversaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`employeeNumber` varchar(50) NOT NULL,
	`department` varchar(100),
	`position` varchar(100),
	`hireDate` date,
	`status` enum('active','on_leave','terminated') NOT NULL DEFAULT 'active',
	`isInOffice` boolean DEFAULT false,
	`photoUrl` text,
	`funFact` text,
	`performanceScore` decimal(5,2),
	`consecutiveDaysWorked` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employeeNumber_unique` UNIQUE(`employeeNumber`)
);
--> statement-breakpoint
CREATE TABLE `grievances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grievanceNumber` varchar(50) NOT NULL,
	`category` enum('workplace_safety','harassment','discrimination','policy_violation','other') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`description` text NOT NULL,
	`desiredOutcome` text,
	`status` enum('submitted','under_review','investigating','resolved','closed') NOT NULL DEFAULT 'submitted',
	`resolutionNotes` text,
	`resolutionDate` timestamp,
	`isAnonymous` boolean NOT NULL DEFAULT true,
	`submittedBy` int,
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grievances_id` PRIMARY KEY(`id`),
	CONSTRAINT `grievances_grievanceNumber_unique` UNIQUE(`grievanceNumber`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`department` varchar(100) NOT NULL,
	`position` varchar(100) NOT NULL,
	`category` enum('daily_tasks','emergency_procedures','system_access','contacts','troubleshooting') NOT NULL,
	`content` text NOT NULL,
	`estimatedTime` int,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`prerequisites` text,
	`relatedArticles` text,
	`authorId` int NOT NULL,
	`isPublished` boolean DEFAULT false,
	`views` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeArticles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` text,
	`videoUrl` text,
	`tips` text,
	`warnings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rawMaterialAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialName` varchar(255) NOT NULL,
	`supplierName` varchar(255),
	`alertType` enum('price_increase','shortage','quality_issue','regulatory_change') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`currentPrice` decimal(10,2),
	`predictedPrice` decimal(10,2),
	`priceChangePercent` decimal(5,2),
	`description` text NOT NULL,
	`source` varchar(255),
	`sourceUrl` text,
	`affectedProducts` text,
	`recommendedAction` text,
	`status` enum('active','monitoring','resolved') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rawMaterialAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salesMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricDate` date NOT NULL,
	`quotesGenerated` int DEFAULT 0,
	`ordersReceived` int DEFAULT 0,
	`shipmentsCompleted` int DEFAULT 0,
	`receivingCompleted` int DEFAULT 0,
	`expectedSales` decimal(12,2),
	`actualSales` decimal(12,2),
	`expensesClearing` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salesMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`clockIn` timestamp NOT NULL,
	`clockOut` timestamp,
	`verificationMethod` enum('facial_recognition','manual','badge') NOT NULL,
	`faceMatchConfidence` decimal(5,2),
	`location` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `documentChanges` ADD CONSTRAINT `documentChanges_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employeeAnniversaries` ADD CONSTRAINT `employeeAnniversaries_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `knowledgeSteps` ADD CONSTRAINT `knowledgeSteps_articleId_knowledgeArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `knowledgeArticles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeEntries` ADD CONSTRAINT `timeEntries_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;