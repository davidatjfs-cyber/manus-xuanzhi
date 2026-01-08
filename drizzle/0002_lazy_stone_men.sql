ALTER TABLE `siteEvaluations` ADD `hasSameCategory` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `siteEvaluations` ADD `nearbyRestaurant1` varchar(128);--> statement-breakpoint
ALTER TABLE `siteEvaluations` ADD `nearbyRestaurant2` varchar(128);--> statement-breakpoint
ALTER TABLE `siteEvaluations` ADD `nearbyRestaurant3` varchar(128);--> statement-breakpoint
ALTER TABLE `siteEvaluations` ADD `occupancyMonday` int;--> statement-breakpoint
ALTER TABLE `siteEvaluations` ADD `occupancyFriday` int;--> statement-breakpoint
ALTER TABLE `siteEvaluations` ADD `occupancySaturday` int;--> statement-breakpoint
ALTER TABLE `siteEvaluations` DROP COLUMN `occupancyMorning`;--> statement-breakpoint
ALTER TABLE `siteEvaluations` DROP COLUMN `occupancyNoon`;--> statement-breakpoint
ALTER TABLE `siteEvaluations` DROP COLUMN `occupancyEvening`;