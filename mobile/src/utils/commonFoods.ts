import { HealthLabel } from "../types/app";

export interface CommonFood {
  name: string;
  caloriesSmall: number;
  caloriesMedium: number;
  caloriesLarge: number;
  healthLabel: HealthLabel;
}

/**
 * Common Foods Calorie Database - Expanded Edition
 *
 * This comprehensive database contains calorie estimates for 200+ common foods.
 * Calorie values are based on standard serving sizes and nutritional data from:
 * - USDA FoodData Central (https://fdc.nal.usda.gov/)
 * - Standard portion sizes (Small/Medium/Large)
 *
 * Portion sizes defined as:
 * - Small: Child portion or half serving
 * - Medium: Standard adult serving
 * - Large: Generous adult serving or 1.5x standard
 *
 * Categories:
 * - Breakfast Items
 * - Proteins (Lunch/Dinner)
 * - Sandwiches & Wraps
 * - Pasta, Rice & Noodles
 * - Pizza
 * - Salads
 * - Sides & Vegetables
 * - Soups
 * - Asian Cuisine
 * - Mexican Cuisine
 * - Italian Cuisine
 * - American Classics
 * - Snacks
 * - Fruits
 * - Desserts & Sweets
 * - Fast Food
 * - Beverages (Coffee, Tea, Drinks)
 * - Dairy & Eggs
 * - Breads & Bakery
 */

// Common foods database with calorie estimates for different portion sizes
export const commonFoods: CommonFood[] = [
  // ===============================
  // BREAKFAST ITEMS
  // ===============================
  { name: "Scrambled Eggs", caloriesSmall: 120, caloriesMedium: 180, caloriesLarge: 250, healthLabel: "healthy" },
  { name: "Fried Eggs", caloriesSmall: 90, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "neutral" },
  { name: "Poached Eggs", caloriesSmall: 70, caloriesMedium: 140, caloriesLarge: 210, healthLabel: "healthy" },
  { name: "Hard Boiled Eggs", caloriesSmall: 70, caloriesMedium: 140, caloriesLarge: 210, healthLabel: "healthy" },
  { name: "Omelette", caloriesSmall: 150, caloriesMedium: 280, caloriesLarge: 400, healthLabel: "healthy" },
  { name: "Eggs Benedict", caloriesSmall: 400, caloriesMedium: 550, caloriesLarge: 700, healthLabel: "treat" },
  { name: "Oatmeal", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "healthy" },
  { name: "Overnight Oats", caloriesSmall: 200, caloriesMedium: 300, caloriesLarge: 400, healthLabel: "healthy" },
  { name: "Toast with Butter", caloriesSmall: 100, caloriesMedium: 150, caloriesLarge: 200, healthLabel: "neutral" },
  { name: "Toast with Jam", caloriesSmall: 120, caloriesMedium: 180, caloriesLarge: 240, healthLabel: "neutral" },
  { name: "Avocado Toast", caloriesSmall: 180, caloriesMedium: 280, caloriesLarge: 380, healthLabel: "healthy" },
  { name: "Pancakes", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Waffles", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "French Toast", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Bacon", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "neutral" },
  { name: "Turkey Bacon", caloriesSmall: 50, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "neutral" },
  { name: "Sausage", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "neutral" },
  { name: "Breakfast Sausage", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "neutral" },
  { name: "Hash Browns", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 300, healthLabel: "neutral" },
  { name: "Home Fries", caloriesSmall: 140, caloriesMedium: 220, caloriesLarge: 320, healthLabel: "neutral" },
  { name: "Yogurt", caloriesSmall: 80, caloriesMedium: 120, caloriesLarge: 180, healthLabel: "healthy" },
  { name: "Greek Yogurt", caloriesSmall: 100, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "healthy" },
  { name: "Yogurt Parfait", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "healthy" },
  { name: "Cereal", caloriesSmall: 110, caloriesMedium: 180, caloriesLarge: 250, healthLabel: "neutral" },
  { name: "Granola", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Bagel", caloriesSmall: 200, caloriesMedium: 280, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Bagel with Cream Cheese", caloriesSmall: 280, caloriesMedium: 380, caloriesLarge: 480, healthLabel: "neutral" },
  { name: "Croissant", caloriesSmall: 180, caloriesMedium: 280, caloriesLarge: 380, healthLabel: "treat" },
  { name: "Muffin", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 450, healthLabel: "treat" },
  { name: "Blueberry Muffin", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 450, healthLabel: "treat" },
  { name: "Bran Muffin", caloriesSmall: 150, caloriesMedium: 280, caloriesLarge: 400, healthLabel: "neutral" },
  { name: "Fruit Salad", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "healthy" },
  { name: "Breakfast Burrito", caloriesSmall: 300, caloriesMedium: 450, caloriesLarge: 600, healthLabel: "neutral" },
  { name: "Breakfast Sandwich", caloriesSmall: 300, caloriesMedium: 450, caloriesLarge: 600, healthLabel: "neutral" },
  { name: "Acai Bowl", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "healthy" },
  { name: "Smoothie Bowl", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "healthy" },

  // ===============================
  // PROTEINS (LUNCH/DINNER)
  // ===============================
  { name: "Grilled Chicken", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "healthy" },
  { name: "Grilled Chicken Breast", caloriesSmall: 140, caloriesMedium: 230, caloriesLarge: 320, healthLabel: "healthy" },
  { name: "Rotisserie Chicken", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "healthy" },
  { name: "Roast Chicken", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "healthy" },
  { name: "Baked Salmon", caloriesSmall: 180, caloriesMedium: 280, caloriesLarge: 400, healthLabel: "healthy" },
  { name: "Grilled Salmon", caloriesSmall: 180, caloriesMedium: 280, caloriesLarge: 400, healthLabel: "healthy" },
  { name: "Pan-Seared Salmon", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 440, healthLabel: "healthy" },
  { name: "Steak", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "neutral" },
  { name: "Ribeye Steak", caloriesSmall: 300, caloriesMedium: 450, caloriesLarge: 600, healthLabel: "neutral" },
  { name: "Filet Mignon", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Sirloin Steak", caloriesSmall: 220, caloriesMedium: 380, caloriesLarge: 520, healthLabel: "neutral" },
  { name: "Pork Chop", caloriesSmall: 200, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "neutral" },
  { name: "Pork Tenderloin", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "healthy" },
  { name: "Pork Belly", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "treat" },
  { name: "Pulled Pork", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Hamburger", caloriesSmall: 300, caloriesMedium: 450, caloriesLarge: 600, healthLabel: "neutral" },
  { name: "Hamburger Patty", caloriesSmall: 180, caloriesMedium: 280, caloriesLarge: 380, healthLabel: "neutral" },
  { name: "Hot Dog", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Turkey Breast", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "healthy" },
  { name: "Roast Turkey", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "healthy" },
  { name: "Fish Fillet", caloriesSmall: 150, caloriesMedium: 230, caloriesLarge: 320, healthLabel: "healthy" },
  { name: "Tilapia", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Cod", caloriesSmall: 90, caloriesMedium: 160, caloriesLarge: 240, healthLabel: "healthy" },
  { name: "Tuna Steak", caloriesSmall: 130, caloriesMedium: 220, caloriesLarge: 310, healthLabel: "healthy" },
  { name: "Shrimp", caloriesSmall: 60, caloriesMedium: 120, caloriesLarge: 180, healthLabel: "healthy" },
  { name: "Grilled Shrimp", caloriesSmall: 70, caloriesMedium: 140, caloriesLarge: 210, healthLabel: "healthy" },
  { name: "Fried Shrimp", caloriesSmall: 150, caloriesMedium: 280, caloriesLarge: 400, healthLabel: "neutral" },
  { name: "Lamb Chop", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Meatballs", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "neutral" },
  { name: "Meatloaf", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Tofu", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "healthy" },
  { name: "Tempeh", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Seitan", caloriesSmall: 90, caloriesMedium: 160, caloriesLarge: 240, healthLabel: "healthy" },

  // ===============================
  // SANDWICHES & WRAPS
  // ===============================
  { name: "Turkey Sandwich", caloriesSmall: 250, caloriesMedium: 350, caloriesLarge: 450, healthLabel: "healthy" },
  { name: "Ham Sandwich", caloriesSmall: 260, caloriesMedium: 360, caloriesLarge: 460, healthLabel: "neutral" },
  { name: "BLT Sandwich", caloriesSmall: 300, caloriesMedium: 450, caloriesLarge: 600, healthLabel: "neutral" },
  { name: "Club Sandwich", caloriesSmall: 350, caloriesMedium: 500, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Chicken Wrap", caloriesSmall: 280, caloriesMedium: 400, caloriesLarge: 520, healthLabel: "healthy" },
  { name: "Tuna Sandwich", caloriesSmall: 280, caloriesMedium: 380, caloriesLarge: 480, healthLabel: "healthy" },
  { name: "Grilled Cheese", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "neutral" },
  { name: "PB&J Sandwich", caloriesSmall: 280, caloriesMedium: 400, caloriesLarge: 520, healthLabel: "neutral" },
  { name: "Peanut Butter Sandwich", caloriesSmall: 250, caloriesMedium: 350, caloriesLarge: 450, healthLabel: "neutral" },
  { name: "Veggie Wrap", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 440, healthLabel: "healthy" },
  { name: "Philly Cheesesteak", caloriesSmall: 400, caloriesMedium: 600, caloriesLarge: 800, healthLabel: "treat" },
  { name: "Reuben Sandwich", caloriesSmall: 400, caloriesMedium: 550, caloriesLarge: 700, healthLabel: "treat" },
  { name: "Submarine Sandwich", caloriesSmall: 350, caloriesMedium: 500, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Hoagie", caloriesSmall: 350, caloriesMedium: 500, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Gyro", caloriesSmall: 350, caloriesMedium: 500, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Falafel Wrap", caloriesSmall: 300, caloriesMedium: 450, caloriesLarge: 600, healthLabel: "healthy" },

  // ===============================
  // PASTA, RICE & NOODLES
  // ===============================
  { name: "Spaghetti", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Spaghetti Bolognese", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Spaghetti Carbonara", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "treat" },
  { name: "Fettuccine Alfredo", caloriesSmall: 400, caloriesMedium: 600, caloriesLarge: 800, healthLabel: "treat" },
  { name: "Penne Pasta", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Penne Arrabiata", caloriesSmall: 280, caloriesMedium: 420, caloriesLarge: 560, healthLabel: "neutral" },
  { name: "Lasagna", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "treat" },
  { name: "Mac and Cheese", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Macaroni and Cheese", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Ravioli", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "neutral" },
  { name: "Cheese Ravioli", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "neutral" },
  { name: "Tortellini", caloriesSmall: 250, caloriesMedium: 380, caloriesLarge: 510, healthLabel: "neutral" },
  { name: "Gnocchi", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 440, healthLabel: "neutral" },
  { name: "Fried Rice", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "neutral" },
  { name: "White Rice", caloriesSmall: 150, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "neutral" },
  { name: "Brown Rice", caloriesSmall: 150, caloriesMedium: 220, caloriesLarge: 280, healthLabel: "healthy" },
  { name: "Jasmine Rice", caloriesSmall: 150, caloriesMedium: 210, caloriesLarge: 280, healthLabel: "neutral" },
  { name: "Risotto", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "neutral" },
  { name: "Pasta Salad", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "neutral" },
  { name: "Quinoa", caloriesSmall: 110, caloriesMedium: 180, caloriesLarge: 250, healthLabel: "healthy" },
  { name: "Couscous", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "neutral" },

  // ===============================
  // ASIAN CUISINE
  // ===============================
  { name: "Pad Thai", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "neutral" },
  { name: "Chicken Pad Thai", caloriesSmall: 380, caloriesMedium: 580, caloriesLarge: 780, healthLabel: "neutral" },
  { name: "Shrimp Pad Thai", caloriesSmall: 370, caloriesMedium: 560, caloriesLarge: 750, healthLabel: "neutral" },
  { name: "Lo Mein", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Chow Mein", caloriesSmall: 280, caloriesMedium: 450, caloriesLarge: 620, healthLabel: "neutral" },
  { name: "Beef Lo Mein", caloriesSmall: 320, caloriesMedium: 500, caloriesLarge: 680, healthLabel: "neutral" },
  { name: "Orange Chicken", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "treat" },
  { name: "General Tso Chicken", caloriesSmall: 400, caloriesMedium: 600, caloriesLarge: 800, healthLabel: "treat" },
  { name: "Kung Pao Chicken", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Sweet and Sour Chicken", caloriesSmall: 350, caloriesMedium: 520, caloriesLarge: 700, healthLabel: "treat" },
  { name: "Mongolian Beef", caloriesSmall: 320, caloriesMedium: 500, caloriesLarge: 680, healthLabel: "neutral" },
  { name: "Beef and Broccoli", caloriesSmall: 280, caloriesMedium: 440, caloriesLarge: 600, healthLabel: "neutral" },
  { name: "Teriyaki Chicken", caloriesSmall: 280, caloriesMedium: 450, caloriesLarge: 620, healthLabel: "neutral" },
  { name: "Teriyaki Salmon", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "healthy" },
  { name: "Sushi Roll", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "healthy" },
  { name: "California Roll", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 450, healthLabel: "healthy" },
  { name: "Spicy Tuna Roll", caloriesSmall: 220, caloriesMedium: 350, caloriesLarge: 480, healthLabel: "healthy" },
  { name: "Dragon Roll", caloriesSmall: 350, caloriesMedium: 500, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Salmon Nigiri", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "healthy" },
  { name: "Sashimi", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Pho", caloriesSmall: 300, caloriesMedium: 450, caloriesLarge: 600, healthLabel: "healthy" },
  { name: "Beef Pho", caloriesSmall: 320, caloriesMedium: 480, caloriesLarge: 640, healthLabel: "healthy" },
  { name: "Ramen", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "neutral" },
  { name: "Tonkotsu Ramen", caloriesSmall: 400, caloriesMedium: 600, caloriesLarge: 800, healthLabel: "neutral" },
  { name: "Miso Soup", caloriesSmall: 40, caloriesMedium: 70, caloriesLarge: 100, healthLabel: "healthy" },
  { name: "Wonton Soup", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Egg Drop Soup", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "healthy" },
  { name: "Hot and Sour Soup", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "healthy" },
  { name: "Spring Roll", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "healthy" },
  { name: "Egg Roll", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "neutral" },
  { name: "Dumplings", caloriesSmall: 150, caloriesMedium: 280, caloriesLarge: 400, healthLabel: "neutral" },
  { name: "Potstickers", caloriesSmall: 150, caloriesMedium: 280, caloriesLarge: 400, healthLabel: "neutral" },
  { name: "Dim Sum", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Fried Wontons", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "treat" },
  { name: "Bibimbap", caloriesSmall: 400, caloriesMedium: 600, caloriesLarge: 800, healthLabel: "healthy" },
  { name: "Korean BBQ", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "neutral" },
  { name: "Bulgogi", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Thai Green Curry", caloriesSmall: 350, caloriesMedium: 520, caloriesLarge: 700, healthLabel: "neutral" },
  { name: "Thai Red Curry", caloriesSmall: 350, caloriesMedium: 520, caloriesLarge: 700, healthLabel: "neutral" },
  { name: "Massaman Curry", caloriesSmall: 400, caloriesMedium: 600, caloriesLarge: 800, healthLabel: "neutral" },
  { name: "Chicken Tikka Masala", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "neutral" },
  { name: "Butter Chicken", caloriesSmall: 400, caloriesMedium: 600, caloriesLarge: 800, healthLabel: "treat" },
  { name: "Chicken Curry", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Palak Paneer", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "healthy" },
  { name: "Naan Bread", caloriesSmall: 150, caloriesMedium: 260, caloriesLarge: 370, healthLabel: "neutral" },
  { name: "Samosa", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },

  // ===============================
  // MEXICAN CUISINE
  // ===============================
  { name: "Taco", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Beef Taco", caloriesSmall: 180, caloriesMedium: 280, caloriesLarge: 380, healthLabel: "neutral" },
  { name: "Chicken Taco", caloriesSmall: 160, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Fish Taco", caloriesSmall: 180, caloriesMedium: 280, caloriesLarge: 380, healthLabel: "neutral" },
  { name: "Burrito", caloriesSmall: 300, caloriesMedium: 500, caloriesLarge: 700, healthLabel: "neutral" },
  { name: "Chicken Burrito", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "neutral" },
  { name: "Beef Burrito", caloriesSmall: 380, caloriesMedium: 600, caloriesLarge: 800, healthLabel: "neutral" },
  { name: "Burrito Bowl", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "healthy" },
  { name: "Quesadilla", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Cheese Quesadilla", caloriesSmall: 280, caloriesMedium: 450, caloriesLarge: 620, healthLabel: "neutral" },
  { name: "Chicken Quesadilla", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "neutral" },
  { name: "Enchiladas", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Nachos", caloriesSmall: 400, caloriesMedium: 650, caloriesLarge: 900, healthLabel: "treat" },
  { name: "Guacamole", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "healthy" },
  { name: "Chips and Salsa", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Tortilla Chips", caloriesSmall: 140, caloriesMedium: 220, caloriesLarge: 300, healthLabel: "neutral" },
  { name: "Rice and Beans", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "healthy" },
  { name: "Mexican Rice", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Refried Beans", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "neutral" },
  { name: "Black Beans", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "healthy" },
  { name: "Carnitas", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Tamale", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 440, healthLabel: "neutral" },
  { name: "Tostada", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 440, healthLabel: "neutral" },
  { name: "Chimichanga", caloriesSmall: 400, caloriesMedium: 600, caloriesLarge: 800, healthLabel: "treat" },
  { name: "Fajitas", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "neutral" },
  { name: "Chicken Fajitas", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "neutral" },
  { name: "Carne Asada", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "neutral" },

  // ===============================
  // PIZZA
  // ===============================
  { name: "Cheese Pizza", caloriesSmall: 200, caloriesMedium: 285, caloriesLarge: 380, healthLabel: "treat" },
  { name: "Pepperoni Pizza", caloriesSmall: 230, caloriesMedium: 320, caloriesLarge: 420, healthLabel: "treat" },
  { name: "Veggie Pizza", caloriesSmall: 180, caloriesMedium: 260, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Margherita Pizza", caloriesSmall: 200, caloriesMedium: 280, caloriesLarge: 370, healthLabel: "neutral" },
  { name: "Supreme Pizza", caloriesSmall: 260, caloriesMedium: 360, caloriesLarge: 470, healthLabel: "treat" },
  { name: "Hawaiian Pizza", caloriesSmall: 220, caloriesMedium: 310, caloriesLarge: 410, healthLabel: "treat" },
  { name: "Meat Lovers Pizza", caloriesSmall: 280, caloriesMedium: 390, caloriesLarge: 500, healthLabel: "treat" },
  { name: "BBQ Chicken Pizza", caloriesSmall: 250, caloriesMedium: 350, caloriesLarge: 450, healthLabel: "treat" },
  { name: "White Pizza", caloriesSmall: 250, caloriesMedium: 350, caloriesLarge: 450, healthLabel: "treat" },

  // ===============================
  // SALADS
  // ===============================
  { name: "Garden Salad", caloriesSmall: 50, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "healthy" },
  { name: "Caesar Salad", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Chicken Caesar Salad", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "healthy" },
  { name: "Greek Salad", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "healthy" },
  { name: "Chicken Salad", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 440, healthLabel: "healthy" },
  { name: "Cobb Salad", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "healthy" },
  { name: "Spinach Salad", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "healthy" },
  { name: "Kale Salad", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Wedge Salad", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Caprese Salad", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "healthy" },
  { name: "Tuna Salad", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "healthy" },
  { name: "Egg Salad", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Potato Salad", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Macaroni Salad", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "neutral" },
  { name: "Coleslaw", caloriesSmall: 100, caloriesMedium: 150, caloriesLarge: 200, healthLabel: "neutral" },

  // ===============================
  // SIDES & VEGETABLES
  // ===============================
  { name: "French Fries", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Sweet Potato Fries", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "neutral" },
  { name: "Curly Fries", caloriesSmall: 220, caloriesMedium: 380, caloriesLarge: 540, healthLabel: "treat" },
  { name: "Onion Rings", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Mashed Potatoes", caloriesSmall: 150, caloriesMedium: 240, caloriesLarge: 330, healthLabel: "neutral" },
  { name: "Baked Potato", caloriesSmall: 130, caloriesMedium: 180, caloriesLarge: 240, healthLabel: "healthy" },
  { name: "Loaded Baked Potato", caloriesSmall: 300, caloriesMedium: 450, caloriesLarge: 600, healthLabel: "treat" },
  { name: "Roasted Potatoes", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Scalloped Potatoes", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 440, healthLabel: "treat" },
  { name: "Steamed Vegetables", caloriesSmall: 40, caloriesMedium: 70, caloriesLarge: 100, healthLabel: "healthy" },
  { name: "Roasted Vegetables", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "healthy" },
  { name: "Grilled Vegetables", caloriesSmall: 70, caloriesMedium: 120, caloriesLarge: 180, healthLabel: "healthy" },
  { name: "Sauteed Vegetables", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "healthy" },
  { name: "Broccoli", caloriesSmall: 25, caloriesMedium: 50, caloriesLarge: 75, healthLabel: "healthy" },
  { name: "Steamed Broccoli", caloriesSmall: 25, caloriesMedium: 50, caloriesLarge: 75, healthLabel: "healthy" },
  { name: "Cauliflower", caloriesSmall: 20, caloriesMedium: 40, caloriesLarge: 60, healthLabel: "healthy" },
  { name: "Asparagus", caloriesSmall: 20, caloriesMedium: 40, caloriesLarge: 60, healthLabel: "healthy" },
  { name: "Green Beans", caloriesSmall: 30, caloriesMedium: 50, caloriesLarge: 70, healthLabel: "healthy" },
  { name: "Corn", caloriesSmall: 80, caloriesMedium: 120, caloriesLarge: 160, healthLabel: "healthy" },
  { name: "Corn on the Cob", caloriesSmall: 80, caloriesMedium: 130, caloriesLarge: 180, healthLabel: "healthy" },
  { name: "Peas", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "healthy" },
  { name: "Carrots", caloriesSmall: 25, caloriesMedium: 40, caloriesLarge: 55, healthLabel: "healthy" },
  { name: "Glazed Carrots", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 140, healthLabel: "neutral" },
  { name: "Spinach", caloriesSmall: 10, caloriesMedium: 20, caloriesLarge: 30, healthLabel: "healthy" },
  { name: "Sauteed Spinach", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "healthy" },
  { name: "Brussels Sprouts", caloriesSmall: 40, caloriesMedium: 70, caloriesLarge: 100, healthLabel: "healthy" },
  { name: "Roasted Brussels Sprouts", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "healthy" },
  { name: "Zucchini", caloriesSmall: 20, caloriesMedium: 35, caloriesLarge: 50, healthLabel: "healthy" },
  { name: "Bell Peppers", caloriesSmall: 20, caloriesMedium: 35, caloriesLarge: 50, healthLabel: "healthy" },
  { name: "Mushrooms", caloriesSmall: 15, caloriesMedium: 30, caloriesLarge: 45, healthLabel: "healthy" },
  { name: "Sauteed Mushrooms", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "healthy" },
  { name: "Edamame", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Sweet Potato", caloriesSmall: 90, caloriesMedium: 150, caloriesLarge: 210, healthLabel: "healthy" },
  { name: "Baked Sweet Potato", caloriesSmall: 90, caloriesMedium: 150, caloriesLarge: 210, healthLabel: "healthy" },

  // ===============================
  // SOUPS
  // ===============================
  { name: "Chicken Noodle Soup", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Tomato Soup", caloriesSmall: 90, caloriesMedium: 150, caloriesLarge: 210, healthLabel: "healthy" },
  { name: "Vegetable Soup", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "healthy" },
  { name: "Minestrone Soup", caloriesSmall: 90, caloriesMedium: 160, caloriesLarge: 230, healthLabel: "healthy" },
  { name: "Clam Chowder", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Broccoli Cheddar Soup", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "neutral" },
  { name: "French Onion Soup", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 440, healthLabel: "neutral" },
  { name: "Lentil Soup", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "healthy" },
  { name: "Split Pea Soup", caloriesSmall: 130, caloriesMedium: 220, caloriesLarge: 310, healthLabel: "healthy" },
  { name: "Chili", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Beef Chili", caloriesSmall: 220, caloriesMedium: 380, caloriesLarge: 540, healthLabel: "neutral" },
  { name: "Turkey Chili", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "healthy" },
  { name: "Chicken Tortilla Soup", caloriesSmall: 150, caloriesMedium: 260, caloriesLarge: 370, healthLabel: "healthy" },
  { name: "Potato Soup", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Butternut Squash Soup", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Gazpacho", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "healthy" },
  { name: "Beef Stew", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },

  // ===============================
  // FRUITS
  // ===============================
  { name: "Apple", caloriesSmall: 60, caloriesMedium: 95, caloriesLarge: 130, healthLabel: "healthy" },
  { name: "Banana", caloriesSmall: 90, caloriesMedium: 105, caloriesLarge: 120, healthLabel: "healthy" },
  { name: "Orange", caloriesSmall: 50, caloriesMedium: 70, caloriesLarge: 90, healthLabel: "healthy" },
  { name: "Grapes", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 140, healthLabel: "healthy" },
  { name: "Strawberries", caloriesSmall: 30, caloriesMedium: 50, caloriesLarge: 80, healthLabel: "healthy" },
  { name: "Blueberries", caloriesSmall: 40, caloriesMedium: 80, caloriesLarge: 120, healthLabel: "healthy" },
  { name: "Raspberries", caloriesSmall: 30, caloriesMedium: 60, caloriesLarge: 90, healthLabel: "healthy" },
  { name: "Blackberries", caloriesSmall: 30, caloriesMedium: 60, caloriesLarge: 90, healthLabel: "healthy" },
  { name: "Watermelon", caloriesSmall: 40, caloriesMedium: 80, caloriesLarge: 120, healthLabel: "healthy" },
  { name: "Cantaloupe", caloriesSmall: 35, caloriesMedium: 60, caloriesLarge: 90, healthLabel: "healthy" },
  { name: "Honeydew", caloriesSmall: 35, caloriesMedium: 60, caloriesLarge: 90, healthLabel: "healthy" },
  { name: "Pineapple", caloriesSmall: 50, caloriesMedium: 80, caloriesLarge: 120, healthLabel: "healthy" },
  { name: "Mango", caloriesSmall: 70, caloriesMedium: 100, caloriesLarge: 140, healthLabel: "healthy" },
  { name: "Peach", caloriesSmall: 40, caloriesMedium: 60, caloriesLarge: 85, healthLabel: "healthy" },
  { name: "Pear", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 140, healthLabel: "healthy" },
  { name: "Plum", caloriesSmall: 30, caloriesMedium: 45, caloriesLarge: 65, healthLabel: "healthy" },
  { name: "Kiwi", caloriesSmall: 30, caloriesMedium: 50, caloriesLarge: 75, healthLabel: "healthy" },
  { name: "Grapefruit", caloriesSmall: 40, caloriesMedium: 65, caloriesLarge: 95, healthLabel: "healthy" },
  { name: "Cherries", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "healthy" },
  { name: "Avocado", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "healthy" },
  { name: "Papaya", caloriesSmall: 40, caloriesMedium: 70, caloriesLarge: 100, healthLabel: "healthy" },
  { name: "Pomegranate", caloriesSmall: 70, caloriesMedium: 120, caloriesLarge: 170, healthLabel: "healthy" },
  { name: "Dried Fruit", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "neutral" },
  { name: "Raisins", caloriesSmall: 85, caloriesMedium: 150, caloriesLarge: 215, healthLabel: "neutral" },
  { name: "Dried Apricots", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "neutral" },

  // ===============================
  // SNACKS
  // ===============================
  { name: "Crackers", caloriesSmall: 80, caloriesMedium: 130, caloriesLarge: 180, healthLabel: "neutral" },
  { name: "Cheese and Crackers", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Chips", caloriesSmall: 150, caloriesMedium: 240, caloriesLarge: 330, healthLabel: "treat" },
  { name: "Potato Chips", caloriesSmall: 150, caloriesMedium: 240, caloriesLarge: 330, healthLabel: "treat" },
  { name: "Pretzels", caloriesSmall: 110, caloriesMedium: 180, caloriesLarge: 250, healthLabel: "neutral" },
  { name: "Soft Pretzel", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "neutral" },
  { name: "Nuts", caloriesSmall: 160, caloriesMedium: 240, caloriesLarge: 320, healthLabel: "healthy" },
  { name: "Almonds", caloriesSmall: 100, caloriesMedium: 170, caloriesLarge: 240, healthLabel: "healthy" },
  { name: "Cashews", caloriesSmall: 100, caloriesMedium: 170, caloriesLarge: 240, healthLabel: "healthy" },
  { name: "Peanuts", caloriesSmall: 100, caloriesMedium: 170, caloriesLarge: 240, healthLabel: "healthy" },
  { name: "Walnuts", caloriesSmall: 100, caloriesMedium: 185, caloriesLarge: 270, healthLabel: "healthy" },
  { name: "Mixed Nuts", caloriesSmall: 110, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Trail Mix", caloriesSmall: 140, caloriesMedium: 230, caloriesLarge: 320, healthLabel: "neutral" },
  { name: "Protein Bar", caloriesSmall: 150, caloriesMedium: 200, caloriesLarge: 250, healthLabel: "healthy" },
  { name: "Granola Bar", caloriesSmall: 100, caloriesMedium: 150, caloriesLarge: 200, healthLabel: "neutral" },
  { name: "Popcorn", caloriesSmall: 100, caloriesMedium: 150, caloriesLarge: 200, healthLabel: "neutral" },
  { name: "Buttered Popcorn", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "treat" },
  { name: "Movie Theater Popcorn", caloriesSmall: 300, caloriesMedium: 500, caloriesLarge: 700, healthLabel: "treat" },
  { name: "Hummus", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "healthy" },
  { name: "Hummus with Pita", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "healthy" },
  { name: "Celery with Peanut Butter", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "healthy" },
  { name: "Apple with Peanut Butter", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "healthy" },
  { name: "String Cheese", caloriesSmall: 50, caloriesMedium: 80, caloriesLarge: 120, healthLabel: "neutral" },
  { name: "Cheese Stick", caloriesSmall: 50, caloriesMedium: 80, caloriesLarge: 120, healthLabel: "neutral" },
  { name: "Rice Cakes", caloriesSmall: 35, caloriesMedium: 70, caloriesLarge: 105, healthLabel: "neutral" },
  { name: "Beef Jerky", caloriesSmall: 80, caloriesMedium: 130, caloriesLarge: 180, healthLabel: "neutral" },

  // ===============================
  // DESSERTS & SWEETS
  // ===============================
  { name: "Ice Cream", caloriesSmall: 140, caloriesMedium: 250, caloriesLarge: 380, healthLabel: "treat" },
  { name: "Vanilla Ice Cream", caloriesSmall: 140, caloriesMedium: 250, caloriesLarge: 380, healthLabel: "treat" },
  { name: "Chocolate Ice Cream", caloriesSmall: 150, caloriesMedium: 270, caloriesLarge: 400, healthLabel: "treat" },
  { name: "Ice Cream Sundae", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Ice Cream Cone", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "treat" },
  { name: "Frozen Yogurt", caloriesSmall: 110, caloriesMedium: 200, caloriesLarge: 300, healthLabel: "neutral" },
  { name: "Gelato", caloriesSmall: 130, caloriesMedium: 230, caloriesLarge: 350, healthLabel: "treat" },
  { name: "Sorbet", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "neutral" },
  { name: "Popsicle", caloriesSmall: 40, caloriesMedium: 70, caloriesLarge: 100, healthLabel: "neutral" },
  { name: "Cake", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Chocolate Cake", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Cheesecake", caloriesSmall: 280, caloriesMedium: 450, caloriesLarge: 620, healthLabel: "treat" },
  { name: "Carrot Cake", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Red Velvet Cake", caloriesSmall: 280, caloriesMedium: 430, caloriesLarge: 580, healthLabel: "treat" },
  { name: "Pound Cake", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "treat" },
  { name: "Cupcake", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "treat" },
  { name: "Cookies", caloriesSmall: 100, caloriesMedium: 200, caloriesLarge: 300, healthLabel: "treat" },
  { name: "Chocolate Chip Cookie", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "treat" },
  { name: "Oatmeal Cookie", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "treat" },
  { name: "Sugar Cookie", caloriesSmall: 70, caloriesMedium: 130, caloriesLarge: 190, healthLabel: "treat" },
  { name: "Brownie", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "treat" },
  { name: "Pie", caloriesSmall: 250, caloriesMedium: 350, caloriesLarge: 450, healthLabel: "treat" },
  { name: "Apple Pie", caloriesSmall: 250, caloriesMedium: 350, caloriesLarge: 450, healthLabel: "treat" },
  { name: "Pumpkin Pie", caloriesSmall: 200, caloriesMedium: 320, caloriesLarge: 440, healthLabel: "treat" },
  { name: "Pecan Pie", caloriesSmall: 300, caloriesMedium: 480, caloriesLarge: 650, healthLabel: "treat" },
  { name: "Cherry Pie", caloriesSmall: 250, caloriesMedium: 360, caloriesLarge: 470, healthLabel: "treat" },
  { name: "Key Lime Pie", caloriesSmall: 280, caloriesMedium: 420, caloriesLarge: 560, healthLabel: "treat" },
  { name: "Donut", caloriesSmall: 200, caloriesMedium: 280, caloriesLarge: 360, healthLabel: "treat" },
  { name: "Glazed Donut", caloriesSmall: 200, caloriesMedium: 280, caloriesLarge: 360, healthLabel: "treat" },
  { name: "Chocolate Donut", caloriesSmall: 250, caloriesMedium: 350, caloriesLarge: 450, healthLabel: "treat" },
  { name: "Jelly Donut", caloriesSmall: 220, caloriesMedium: 310, caloriesLarge: 400, healthLabel: "treat" },
  { name: "Jello", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "neutral" },
  { name: "Jello Cup", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "neutral" },
  { name: "Pudding", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "treat" },
  { name: "Chocolate Pudding", caloriesSmall: 110, caloriesMedium: 190, caloriesLarge: 280, healthLabel: "treat" },
  { name: "Rice Pudding", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "treat" },
  { name: "Banana Pudding", caloriesSmall: 150, caloriesMedium: 260, caloriesLarge: 370, healthLabel: "treat" },
  { name: "Tiramisu", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Creme Brulee", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Flan", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "treat" },
  { name: "Chocolate Mousse", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Banana Split", caloriesSmall: 400, caloriesMedium: 650, caloriesLarge: 900, healthLabel: "treat" },
  { name: "Chocolate", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "treat" },
  { name: "Chocolate Bar", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "treat" },
  { name: "Dark Chocolate", caloriesSmall: 90, caloriesMedium: 150, caloriesLarge: 210, healthLabel: "neutral" },
  { name: "Candy Bar", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "treat" },
  { name: "Candy", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "treat" },
  { name: "Gummy Bears", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "treat" },
  { name: "Hard Candy", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 140, healthLabel: "treat" },

  // ===============================
  // FAST FOOD
  // ===============================
  { name: "Cheeseburger", caloriesSmall: 350, caloriesMedium: 500, caloriesLarge: 650, healthLabel: "treat" },
  { name: "Double Cheeseburger", caloriesSmall: 450, caloriesMedium: 650, caloriesLarge: 850, healthLabel: "treat" },
  { name: "Bacon Cheeseburger", caloriesSmall: 450, caloriesMedium: 620, caloriesLarge: 800, healthLabel: "treat" },
  { name: "Chicken Nuggets", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Chicken Tenders", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Chicken Strips", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Fried Chicken", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Fried Chicken Breast", caloriesSmall: 280, caloriesMedium: 450, caloriesLarge: 620, healthLabel: "treat" },
  { name: "Fried Chicken Thigh", caloriesSmall: 250, caloriesMedium: 380, caloriesLarge: 510, healthLabel: "treat" },
  { name: "Fried Chicken Wing", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "treat" },
  { name: "Buffalo Wings", caloriesSmall: 250, caloriesMedium: 450, caloriesLarge: 650, healthLabel: "treat" },
  { name: "BBQ Wings", caloriesSmall: 280, caloriesMedium: 480, caloriesLarge: 680, healthLabel: "treat" },
  { name: "Fish and Chips", caloriesSmall: 400, caloriesMedium: 650, caloriesLarge: 900, healthLabel: "treat" },
  { name: "Corn Dog", caloriesSmall: 200, caloriesMedium: 330, caloriesLarge: 460, healthLabel: "treat" },
  { name: "Chicken Sandwich", caloriesSmall: 350, caloriesMedium: 500, caloriesLarge: 650, healthLabel: "neutral" },
  { name: "Crispy Chicken Sandwich", caloriesSmall: 400, caloriesMedium: 580, caloriesLarge: 760, healthLabel: "treat" },
  { name: "Grilled Chicken Sandwich", caloriesSmall: 300, caloriesMedium: 450, caloriesLarge: 600, healthLabel: "neutral" },
  { name: "Fish Sandwich", caloriesSmall: 350, caloriesMedium: 500, caloriesLarge: 650, healthLabel: "neutral" },

  // ===============================
  // BEVERAGES - COFFEE
  // ===============================
  { name: "Black Coffee", caloriesSmall: 2, caloriesMedium: 5, caloriesLarge: 10, healthLabel: "healthy" },
  { name: "Coffee", caloriesSmall: 2, caloriesMedium: 5, caloriesLarge: 10, healthLabel: "healthy" },
  { name: "Coffee with Cream", caloriesSmall: 50, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "neutral" },
  { name: "Coffee with Milk", caloriesSmall: 30, caloriesMedium: 60, caloriesLarge: 90, healthLabel: "neutral" },
  { name: "Coffee with Sugar", caloriesSmall: 35, caloriesMedium: 65, caloriesLarge: 95, healthLabel: "neutral" },
  { name: "Espresso", caloriesSmall: 3, caloriesMedium: 5, caloriesLarge: 10, healthLabel: "healthy" },
  { name: "Americano", caloriesSmall: 5, caloriesMedium: 10, caloriesLarge: 15, healthLabel: "healthy" },
  { name: "Latte", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 250, healthLabel: "neutral" },
  { name: "Vanilla Latte", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "treat" },
  { name: "Caramel Latte", caloriesSmall: 160, caloriesMedium: 270, caloriesLarge: 380, healthLabel: "treat" },
  { name: "Iced Latte", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 250, healthLabel: "neutral" },
  { name: "Cappuccino", caloriesSmall: 60, caloriesMedium: 120, caloriesLarge: 180, healthLabel: "neutral" },
  { name: "Mocha", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Iced Mocha", caloriesSmall: 220, caloriesMedium: 380, caloriesLarge: 540, healthLabel: "treat" },
  { name: "Macchiato", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "neutral" },
  { name: "Caramel Macchiato", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "treat" },
  { name: "Flat White", caloriesSmall: 90, caloriesMedium: 160, caloriesLarge: 230, healthLabel: "neutral" },
  { name: "Cold Brew", caloriesSmall: 5, caloriesMedium: 10, caloriesLarge: 15, healthLabel: "healthy" },
  { name: "Cold Brew with Cream", caloriesSmall: 60, caloriesMedium: 120, caloriesLarge: 180, healthLabel: "neutral" },
  { name: "Iced Coffee", caloriesSmall: 10, caloriesMedium: 25, caloriesLarge: 45, healthLabel: "healthy" },
  { name: "Iced Coffee with Milk", caloriesSmall: 40, caloriesMedium: 80, caloriesLarge: 120, healthLabel: "neutral" },
  { name: "Frappuccino", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Caramel Frappuccino", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Mocha Frappuccino", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Pumpkin Spice Latte", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Chai Latte", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "neutral" },
  { name: "Dirty Chai", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "neutral" },
  { name: "Matcha Latte", caloriesSmall: 140, caloriesMedium: 230, caloriesLarge: 320, healthLabel: "neutral" },
  { name: "Hot Chocolate", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "treat" },
  { name: "Hot Cocoa", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "treat" },

  // ===============================
  // BEVERAGES - TEA
  // ===============================
  { name: "Tea", caloriesSmall: 0, caloriesMedium: 2, caloriesLarge: 5, healthLabel: "healthy" },
  { name: "Green Tea", caloriesSmall: 0, caloriesMedium: 2, caloriesLarge: 5, healthLabel: "healthy" },
  { name: "Black Tea", caloriesSmall: 0, caloriesMedium: 2, caloriesLarge: 5, healthLabel: "healthy" },
  { name: "Herbal Tea", caloriesSmall: 0, caloriesMedium: 2, caloriesLarge: 5, healthLabel: "healthy" },
  { name: "Chamomile Tea", caloriesSmall: 0, caloriesMedium: 2, caloriesLarge: 5, healthLabel: "healthy" },
  { name: "Peppermint Tea", caloriesSmall: 0, caloriesMedium: 2, caloriesLarge: 5, healthLabel: "healthy" },
  { name: "Earl Grey Tea", caloriesSmall: 0, caloriesMedium: 2, caloriesLarge: 5, healthLabel: "healthy" },
  { name: "Iced Tea", caloriesSmall: 0, caloriesMedium: 5, caloriesLarge: 10, healthLabel: "healthy" },
  { name: "Sweet Tea", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "treat" },
  { name: "Sweet Iced Tea", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "treat" },
  { name: "Unsweet Tea", caloriesSmall: 0, caloriesMedium: 5, caloriesLarge: 10, healthLabel: "healthy" },
  { name: "Bubble Tea", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Boba Tea", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Thai Tea", caloriesSmall: 150, caloriesMedium: 260, caloriesLarge: 370, healthLabel: "treat" },

  // ===============================
  // BEVERAGES - OTHER DRINKS
  // ===============================
  { name: "Smoothie", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "healthy" },
  { name: "Green Smoothie", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "healthy" },
  { name: "Berry Smoothie", caloriesSmall: 150, caloriesMedium: 250, caloriesLarge: 350, healthLabel: "healthy" },
  { name: "Protein Smoothie", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "healthy" },
  { name: "Milkshake", caloriesSmall: 300, caloriesMedium: 500, caloriesLarge: 700, healthLabel: "treat" },
  { name: "Chocolate Milkshake", caloriesSmall: 350, caloriesMedium: 550, caloriesLarge: 750, healthLabel: "treat" },
  { name: "Vanilla Milkshake", caloriesSmall: 300, caloriesMedium: 500, caloriesLarge: 700, healthLabel: "treat" },
  { name: "Strawberry Milkshake", caloriesSmall: 320, caloriesMedium: 520, caloriesLarge: 720, healthLabel: "treat" },
  { name: "Orange Juice", caloriesSmall: 60, caloriesMedium: 110, caloriesLarge: 160, healthLabel: "healthy" },
  { name: "Apple Juice", caloriesSmall: 60, caloriesMedium: 110, caloriesLarge: 160, healthLabel: "neutral" },
  { name: "Cranberry Juice", caloriesSmall: 70, caloriesMedium: 120, caloriesLarge: 170, healthLabel: "neutral" },
  { name: "Grape Juice", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "neutral" },
  { name: "Grapefruit Juice", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "healthy" },
  { name: "Tomato Juice", caloriesSmall: 25, caloriesMedium: 45, caloriesLarge: 65, healthLabel: "healthy" },
  { name: "Vegetable Juice", caloriesSmall: 30, caloriesMedium: 55, caloriesLarge: 80, healthLabel: "healthy" },
  { name: "Lemonade", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "neutral" },
  { name: "Pink Lemonade", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "neutral" },
  { name: "Arnold Palmer", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "neutral" },
  { name: "Soda", caloriesSmall: 100, caloriesMedium: 150, caloriesLarge: 200, healthLabel: "treat" },
  { name: "Cola", caloriesSmall: 100, caloriesMedium: 150, caloriesLarge: 200, healthLabel: "treat" },
  { name: "Diet Soda", caloriesSmall: 0, caloriesMedium: 0, caloriesLarge: 0, healthLabel: "neutral" },
  { name: "Sprite", caloriesSmall: 90, caloriesMedium: 140, caloriesLarge: 190, healthLabel: "treat" },
  { name: "Ginger Ale", caloriesSmall: 80, caloriesMedium: 130, caloriesLarge: 180, healthLabel: "neutral" },
  { name: "Root Beer", caloriesSmall: 100, caloriesMedium: 160, caloriesLarge: 220, healthLabel: "treat" },
  { name: "Energy Drink", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "treat" },
  { name: "Sports Drink", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "neutral" },
  { name: "Gatorade", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "neutral" },
  { name: "Coconut Water", caloriesSmall: 30, caloriesMedium: 50, caloriesLarge: 70, healthLabel: "healthy" },
  { name: "Almond Milk", caloriesSmall: 20, caloriesMedium: 40, caloriesLarge: 60, healthLabel: "healthy" },
  { name: "Oat Milk", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 140, healthLabel: "neutral" },
  { name: "Soy Milk", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "healthy" },
  { name: "Chocolate Milk", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "neutral" },
  { name: "Whole Milk", caloriesSmall: 75, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "neutral" },
  { name: "Skim Milk", caloriesSmall: 45, caloriesMedium: 85, caloriesLarge: 125, healthLabel: "healthy" },
  { name: "2% Milk", caloriesSmall: 60, caloriesMedium: 120, caloriesLarge: 180, healthLabel: "neutral" },

  // ===============================
  // DAIRY & EGGS
  // ===============================
  { name: "Cottage Cheese", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "healthy" },
  { name: "Cream Cheese", caloriesSmall: 50, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "neutral" },
  { name: "Cheddar Cheese", caloriesSmall: 90, caloriesMedium: 160, caloriesLarge: 230, healthLabel: "neutral" },
  { name: "Mozzarella Cheese", caloriesSmall: 70, caloriesMedium: 130, caloriesLarge: 190, healthLabel: "neutral" },
  { name: "Swiss Cheese", caloriesSmall: 90, caloriesMedium: 150, caloriesLarge: 210, healthLabel: "neutral" },
  { name: "Parmesan Cheese", caloriesSmall: 60, caloriesMedium: 100, caloriesLarge: 140, healthLabel: "neutral" },
  { name: "Feta Cheese", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "neutral" },
  { name: "Brie Cheese", caloriesSmall: 60, caloriesMedium: 110, caloriesLarge: 160, healthLabel: "neutral" },
  { name: "Ricotta Cheese", caloriesSmall: 60, caloriesMedium: 110, caloriesLarge: 160, healthLabel: "neutral" },
  { name: "Butter", caloriesSmall: 35, caloriesMedium: 100, caloriesLarge: 200, healthLabel: "neutral" },
  { name: "Sour Cream", caloriesSmall: 30, caloriesMedium: 60, caloriesLarge: 90, healthLabel: "neutral" },
  { name: "Whipped Cream", caloriesSmall: 30, caloriesMedium: 60, caloriesLarge: 100, healthLabel: "treat" },
  { name: "Heavy Cream", caloriesSmall: 50, caloriesMedium: 100, caloriesLarge: 150, healthLabel: "neutral" },

  // ===============================
  // BREADS & BAKERY
  // ===============================
  { name: "White Bread", caloriesSmall: 70, caloriesMedium: 130, caloriesLarge: 190, healthLabel: "neutral" },
  { name: "Whole Wheat Bread", caloriesSmall: 70, caloriesMedium: 120, caloriesLarge: 170, healthLabel: "healthy" },
  { name: "Sourdough Bread", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "neutral" },
  { name: "Rye Bread", caloriesSmall: 70, caloriesMedium: 130, caloriesLarge: 190, healthLabel: "neutral" },
  { name: "Ciabatta Bread", caloriesSmall: 90, caloriesMedium: 160, caloriesLarge: 230, healthLabel: "neutral" },
  { name: "French Bread", caloriesSmall: 80, caloriesMedium: 150, caloriesLarge: 220, healthLabel: "neutral" },
  { name: "Baguette", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "neutral" },
  { name: "Focaccia", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "neutral" },
  { name: "Pita Bread", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "neutral" },
  { name: "Tortilla", caloriesSmall: 70, caloriesMedium: 120, caloriesLarge: 170, healthLabel: "neutral" },
  { name: "Flour Tortilla", caloriesSmall: 80, caloriesMedium: 140, caloriesLarge: 200, healthLabel: "neutral" },
  { name: "Corn Tortilla", caloriesSmall: 50, caloriesMedium: 90, caloriesLarge: 130, healthLabel: "neutral" },
  { name: "Dinner Roll", caloriesSmall: 80, caloriesMedium: 130, caloriesLarge: 180, healthLabel: "neutral" },
  { name: "Biscuit", caloriesSmall: 100, caloriesMedium: 180, caloriesLarge: 260, healthLabel: "neutral" },
  { name: "Cornbread", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "neutral" },
  { name: "Garlic Bread", caloriesSmall: 120, caloriesMedium: 200, caloriesLarge: 280, healthLabel: "treat" },
  { name: "Breadstick", caloriesSmall: 70, caloriesMedium: 120, caloriesLarge: 170, healthLabel: "neutral" },
  { name: "English Muffin", caloriesSmall: 70, caloriesMedium: 130, caloriesLarge: 190, healthLabel: "neutral" },
  { name: "Cinnamon Roll", caloriesSmall: 250, caloriesMedium: 400, caloriesLarge: 550, healthLabel: "treat" },
  { name: "Danish Pastry", caloriesSmall: 200, caloriesMedium: 350, caloriesLarge: 500, healthLabel: "treat" },
  { name: "Scone", caloriesSmall: 180, caloriesMedium: 300, caloriesLarge: 420, healthLabel: "treat" },
];

// Search for a food by name (case-insensitive, partial match)
export const searchFood = (query: string): CommonFood | undefined => {
  const normalizedQuery = query.toLowerCase().trim();
  // First try exact match
  const exactMatch = commonFoods.find(
    (food) => food.name.toLowerCase() === normalizedQuery
  );
  if (exactMatch) return exactMatch;

  // Then try starts-with match
  return commonFoods.find(
    (food) => food.name.toLowerCase().startsWith(normalizedQuery)
  );
};

// Search for foods matching a query (for autocomplete)
export const searchFoods = (query: string, limit: number = 15): CommonFood[] => {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  // Score and filter foods
  const scored = commonFoods
    .map((food) => {
      const name = food.name.toLowerCase();
      let score = 0;

      if (name === normalizedQuery) score = 100; // Exact match
      else if (name.startsWith(normalizedQuery)) score = 80; // Starts with
      else if (name.includes(normalizedQuery)) score = 60; // Contains
      else {
        // Check each word
        const words = name.split(" ");
        for (const word of words) {
          if (word.startsWith(normalizedQuery)) {
            score = 50;
            break;
          }
        }
      }

      return { food, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((item) => item.food);
};

// Get all food names for autocomplete
export const getAllFoodNames = (): string[] => {
  return commonFoods.map((food) => food.name).sort();
};

// Get calorie estimate for unknown foods based on user selection
export const getDefaultCalories = (calorieLevel: "light" | "medium" | "heavy"): number => {
  switch (calorieLevel) {
    case "light":
      return 150;
    case "medium":
      return 350;
    case "heavy":
      return 600;
    default:
      return 350;
  }
};

// Get default health label for unknown foods
export const getDefaultHealthLabel = (): HealthLabel => {
  return "neutral";
};

// Get food count
export const getFoodCount = (): number => {
  return commonFoods.length;
};
