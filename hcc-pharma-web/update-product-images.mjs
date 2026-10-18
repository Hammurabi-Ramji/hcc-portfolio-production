import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { products } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Update products with image URLs
const imageMap = {
  "Calcium Gluconate 23% Injection": "/images/products/calcium-injection-1.png",
  "Calcium Borogluconate": "/images/products/calcium-injection-2.webp",
  "Dextrose 50% Solution": "/images/products/calcium-gluconate.jpg",
  "Magnesium Sulfate 50%": "/images/products/antibiotic-vial.jpg",
  "Potassium Chloride Solution": "/images/products/calcium-injection-1.png",
  "Sodium Bicarbonate 8.4%": "/images/products/calcium-gluconate.jpg",
  "Vitamin B Complex Injectable": "/images/products/antibiotic-vial.jpg",
  "Oxytocin Injectable": "/images/products/calcium-injection-2.webp",
  "Flunixin Meglumine": "/images/products/antibiotic-vial.jpg",
  "Penicillin G Procaine": "/images/products/antibiotic-vial.jpg",
  "Oxytetracycline 200mg/ml": "/images/products/antibiotic-vial.jpg",
  "Ivermectin 1% Injectable": "/images/products/antibiotic-vial.jpg",
};

console.log("Updating product images...");

for (const [productName, imageUrl] of Object.entries(imageMap)) {
  await db.update(products)
    .set({ imageUrl })
    .where(eq(products.name, productName));
  console.log(`✓ Updated ${productName}`);
}

console.log("All product images updated!");
await connection.end();
