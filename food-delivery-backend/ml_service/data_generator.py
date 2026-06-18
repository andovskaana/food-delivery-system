import random
import psycopg2
from datetime import datetime, timedelta
from faker import Faker
import numpy as np

fake = Faker()

import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'FoodDelivery'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}


class SyntheticDataGenerator:
    """
    Generates synthetic order history data for the food delivery application.
    This data is used to train recommendation models.
    """

    def __init__(self):
        self.conn = None
        self.cursor = None

    def connect_db(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.conn.cursor()
            print("Database connection established!")
        except Exception as e:
            print(f"Database connection failed: {e}")
            raise

    def fetch_existing_data(self):
        """Fetch existing users, products, and restaurants from database"""

        # Fetch customer users
        self.cursor.execute("""
            SELECT username, name, surname
            FROM app_users
            WHERE role = 'ROLE_CUSTOMER'
        """)
        users = self.cursor.fetchall()
        print(f"Found {len(users)} customer users")

        # Fetch products with their prices and restaurants
        self.cursor.execute("""
            SELECT id, price, restaurant_id, name, category
            FROM product
            WHERE is_available = true
        """)
        products = self.cursor.fetchall()
        print(f"Found {len(products)} available products")

        # Fetch restaurants
        self.cursor.execute("SELECT id, name FROM restaurant")
        restaurants = self.cursor.fetchall()
        print(f"Found {len(restaurants)} restaurants")

        return users, products, restaurants

    def generate_realistic_time_distribution(self):
        """
        Generate realistic time distributions for orders.
        Returns hour of day based on meal time probabilities.
        """
        # Define meal time windows
        breakfast_hours = list(range(7, 11))    # 7 AM - 10 AM
        lunch_hours = list(range(11, 16))       # 11 AM - 4 PM
        dinner_hours = list(range(17, 23))      # 5 PM - 11 PM

        # Probability distribution (breakfast: 20%, lunch: 40%, dinner: 40%)
        meal_time = random.choices(
            ['breakfast', 'lunch', 'dinner'],
            weights=[0.20, 0.40, 0.40]
        )[0]

        if meal_time == 'breakfast':
            return random.choice(breakfast_hours)
        elif meal_time == 'lunch':
            return random.choice(lunch_hours)
        else:
            return random.choice(dinner_hours)

    def generate_order_history(self, num_records=2000):
        """
        Generate synthetic order history records.

        Args:
            num_records: Number of order history records to generate
        """

        print(f"\n Generating {num_records} synthetic order history records...")

        # Fetch existing data
        users, products, restaurants = self.fetch_existing_data()

        if not users:
            print(" No customer users found! Please create users first.")
            return

        if not products:
            print(" No products found! Please create products first.")
            return

        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday',
                       'Friday', 'Saturday', 'Sunday']

        records_inserted = 0

        for i in range(num_records):
            try:
                # Select random user
                user_username, user_name, user_surname = random.choice(users)

                # Select random product
                product_id, price, restaurant_id, product_name, category = random.choice(products)

                # Generate random date in last 6 months
                days_ago = random.randint(0, 180)
                order_date = datetime.now() - timedelta(days=days_ago)

                # Assign realistic hour based on meal time
                hour = self.generate_realistic_time_distribution()

                # Set the order datetime
                order_date = order_date.replace(
                    hour=hour,
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59)
                )

                # Get day of week
                day_of_week = days_of_week[order_date.weekday()]

                # Generate quantity (weighted towards 1-2 items)
                quantity = random.choices(
                    [1, 2, 3, 4, 5],
                    weights=[0.50, 0.30, 0.12, 0.05, 0.03]
                )[0]

                # Calculate order value
                order_value = round(price * quantity, 2)

                # Insert into database
                insert_query = """
                    INSERT INTO user_order_history
                    (user_username, product_id, restaurant_id, quantity, price,
                     order_date, hour_of_day, day_of_week, order_value)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

                self.cursor.execute(insert_query, (
                    user_username,
                    product_id,
                    restaurant_id,
                    quantity,
                    price,
                    order_date,
                    hour,
                    day_of_week,
                    order_value
                ))

                records_inserted += 1

                # Commit every 100 records
                if (i + 1) % 100 == 0:
                    self.conn.commit()
                    print(f" Generated {i + 1}/{num_records} records...")

            except Exception as e:
                print(f" Error inserting record {i + 1}: {e}")
                continue


        # Final commit
        self.conn.commit()
        print(f"\n Successfully generated {records_inserted} synthetic order history records!")

    def update_user_statistics(self):
        """
        Update user statistics based on generated order history.
        This calculates:
        - Total number of orders per user
        - Total amount spent per user
        - First order date
        - Last order date
        """

        print("\n Updating user statistics...")

        try:
            update_query = """
                UPDATE app_users u
                SET
                    total_orders = (
                        SELECT COUNT(*)
                        FROM user_order_history uoh
                        WHERE uoh.user_username = u.username
                    ),
                    total_spent = (
                        SELECT COALESCE(SUM(order_value), 0)
                        FROM user_order_history uoh
                        WHERE uoh.user_username = u.username
                    ),
                    last_order_date = (
                        SELECT MAX(order_date)
                        FROM user_order_history uoh
                        WHERE uoh.user_username = u.username
                    ),
                    first_order_date = (
                        SELECT MIN(order_date)
                        FROM user_order_history uoh
                        WHERE uoh.user_username = u.username
                    )
                WHERE u.role = 'ROLE_CUSTOMER'
            """

            self.cursor.execute(update_query)
            self.conn.commit()

            # Print statistics
            self.cursor.execute("""
                SELECT
                    COUNT(*) as user_count,
                    AVG(total_orders) as avg_orders,
                    AVG(total_spent) as avg_spent,
                    MAX(total_orders) as max_orders,
                    MAX(total_spent) as max_spent
                FROM app_users
                WHERE role = 'ROLE_CUSTOMER' AND total_orders > 0
            """)

            stats = self.cursor.fetchone()

            print(" User Statistics Summary:")
            print(f"   - Users with orders: {stats[0]}")
            print(f"   - Average orders per user: {stats[1]:.2f}")
            print(f"   - Average spent per user: ${stats[2]:.2f}")
            print(f"   - Max orders by a user: {stats[3]}")
            print(f"   - Max spent by a user: ${stats[4]:.2f}")
            print(" User statistics updated successfully!")

        except Exception as e:
            print(f" Error updating user statistics: {e}")
            self.conn.rollback()

    def generate_user_preferences(self):
        """
        Generate user preference profiles based on order history.
        This creates a separate table for quick lookup of user preferences.
        """

        print("\n Generating user preference profiles...")

        try:
            # Create user_preferences table if it doesn't exist
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_preferences (
                    id SERIAL PRIMARY KEY,
                    user_username VARCHAR(255) REFERENCES app_users(username),
                    preferred_categories TEXT[],
                    preferred_restaurants BIGINT[],
                    avg_order_value DECIMAL(10, 2),
                    preferred_times INTEGER[],
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_username)
                )
            """)
            self.conn.commit()
            print(" User preferences table created/verified")

            # Get all users with order history
            self.cursor.execute("""
                SELECT DISTINCT user_username
                FROM user_order_history
            """)
            users = [row[0] for row in self.cursor.fetchall()]

            print(f"Creating preferences for {len(users)} users...")

            for user in users:
                # Get preferred categories (top 3)
                self.cursor.execute("""
                    SELECT p.category, COUNT(*) as cnt
                    FROM user_order_history uoh
                    JOIN product p ON uoh.product_id = p.id
                    WHERE uoh.user_username = %s
                    GROUP BY p.category
                    ORDER BY cnt DESC
                    LIMIT 3
                """, (user,))
                preferred_categories = [row[0] for row in self.cursor.fetchall()]

                # Get preferred restaurants (top 3)
                self.cursor.execute("""
                    SELECT restaurant_id, COUNT(*) as cnt
                    FROM user_order_history
                    WHERE user_username = %s
                    GROUP BY restaurant_id
                    ORDER BY cnt DESC
                    LIMIT 3
                """, (user,))
                preferred_restaurants = [row[0] for row in self.cursor.fetchall()]

                # Get average order value
                self.cursor.execute("""
                    SELECT AVG(order_value)
                    FROM user_order_history
                    WHERE user_username = %s
                """, (user,))
                avg_order_value = self.cursor.fetchone()[0] or 0

                # Get preferred ordering times (top 3 hours)
                self.cursor.execute("""
                    SELECT hour_of_day, COUNT(*) as cnt
                    FROM user_order_history
                    WHERE user_username = %s
                    GROUP BY hour_of_day
                    ORDER BY cnt DESC
                    LIMIT 3
                """, (user,))
                preferred_times = [row[0] for row in self.cursor.fetchall()]

                # Insert or update preferences
                self.cursor.execute("""
                    INSERT INTO user_preferences
                    (user_username, preferred_categories, preferred_restaurants,
                     avg_order_value, preferred_times)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (user_username) DO UPDATE SET
                        preferred_categories = EXCLUDED.preferred_categories,
                        preferred_restaurants = EXCLUDED.preferred_restaurants,
                        avg_order_value = EXCLUDED.avg_order_value,
                        preferred_times = EXCLUDED.preferred_times,
                        created_at = CURRENT_TIMESTAMP
                """, (user, preferred_categories, preferred_restaurants,
                      avg_order_value, preferred_times))

            self.conn.commit()
            print(f" User preferences generated for {len(users)} users!")

        except Exception as e:
            print(f" Error generating user preferences: {e}")
            self.conn.rollback()

    def generate_reviews(self, reviews_per_restaurant=20):
        print(f"\n Generating synthetic reviews ({reviews_per_restaurant} per restaurant)...")

        # Fetch restaurant IDs
        self.cursor.execute("SELECT id FROM restaurant")
        restaurants = [row[0] for row in self.cursor.fetchall()]

        # Fetch customer usernames
        self.cursor.execute("""
                            SELECT username
                            FROM app_users
                            WHERE role = 'ROLE_CUSTOMER'
                            """)
        users = [row[0] for row in self.cursor.fetchall()]

        if not restaurants or not users:
            print(" No restaurants or users found. Skipping reviews.")
            return

        very_positive = [
            "Absolutely outstanding food, everything was perfect!",
            "Best restaurant experience I’ve had in a long time.",
            "Incredible taste, fast delivery, highly recommend!",
            "Five stars without hesitation. Amazing!",
            "Fantastic food and excellent service."
        ]

        positive = [
            "Very good food and friendly staff.",
            "Really enjoyed the meal.",
            "Tasty food and quick delivery.",
            "Good quality and well prepared.",
            "Would definitely order again."
        ]

        neutral = [
            "The food was okay.",
            "Decent meal for the price.",
            "Nothing special but acceptable."
        ]

        negative = [
            "The food was cold.",
            "Delivery took too long."
        ]

        insert_query = """
                       INSERT INTO review (restaurant_id, user_username, rating, comment, created_at)
                       VALUES (%s, %s, %s, %s, NOW()) \
                       """

        inserted = 0

        for restaurant_id in restaurants:
            for _ in range(reviews_per_restaurant):
                username = random.choice(users)

                sentiment_type = random.choices(
                    ["very_positive", "positive", "neutral", "negative"],
                    weights=[0.65, 0.25, 0.08, 0.02]  # 🔥 KEY CHANGE
                )[0]

                if sentiment_type == "very_positive":
                    comment = random.choice(very_positive)
                    rating = random.choices([5, 4], weights=[0.85, 0.15])[0]

                elif sentiment_type == "positive":
                    comment = random.choice(positive)
                    rating = random.choices([5, 4], weights=[0.4, 0.6])[0]

                elif sentiment_type == "neutral":
                    comment = random.choice(neutral)
                    rating = 3

                else:
                    comment = random.choice(negative)
                    rating = random.choice([1, 2])

                self.cursor.execute(
                    insert_query,
                    (restaurant_id, username, rating, comment)
                )
                inserted += 1

        self.conn.commit()
        print(f" Successfully inserted {inserted} reviews.")

    def print_sample_data(self):
        """Print sample of generated data for verification"""

        print("\n Sample Order History Data:")
        self.cursor.execute("""
            SELECT
                uoh.user_username,
                p.name as product_name,
                r.name as restaurant_name,
                uoh.quantity,
                uoh.order_value,
                uoh.order_date,
                uoh.hour_of_day,
                uoh.day_of_week
            FROM user_order_history uoh
            JOIN product p ON uoh.product_id = p.id
            JOIN restaurant r ON uoh.restaurant_id = r.id
            ORDER BY uoh.order_date DESC
            LIMIT 5
        """)

        rows = self.cursor.fetchall()
        for row in rows:
            print(f"   User: {row[0]}")
            print(f"   Product: {row[1]} from {row[2]}")
            print(f"   Quantity: {row[3]}, Value: ${row[4]:.2f}")
            print(f"   Date: {row[5]} ({row[7]}, {row[6]}:00)")
            print("   ---")

    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("\n Database connection closed")


def main():
    """Main execution function"""

    print("=" * 60)
    print("   FOOD DELIVERY - SYNTHETIC DATA GENERATOR")
    print("=" * 60)

    generator = SyntheticDataGenerator()

    try:
        # Connect to database
        generator.connect_db()

        # Generate synthetic order history
        # You can adjust the number of records here
        generator.generate_order_history(num_records=2000)

        # Update user statistics
        generator.update_user_statistics()

        # Generate user preferences
        generator.generate_user_preferences()

        #Generating reviews
        generator.generate_reviews(reviews_per_restaurant=10)

        # Print sample data
        generator.print_sample_data()

        print("\n" + "=" * 60)
        print("  DATA GENERATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)

    except Exception as e:
        print(f"\n Error: {e}")

    finally:
        generator.close()


if __name__ == "__main__":
    main()