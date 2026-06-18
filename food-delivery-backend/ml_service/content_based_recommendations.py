import psycopg2
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
import json
import pickle
import os

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


class AdvancedContentBasedRecommender:
    """
    Advanced Content-Based Recommendation System with:
    - Feature vectorization (One-Hot Encoding + Normalized features)
    - TF-IDF for text descriptions
    - Weighted user profiles from interactions
    - Cosine similarity scoring
    - Business rules and filters
    """

    def __init__(self, cache_dir='./recommendation_cache'):
        self.conn = None
        self.cursor = None
        self.cache_dir = cache_dir

        # Feature encoders
        self.category_encoder = {}
        self.tfidf_vectorizer = None
        self.price_scaler = MinMaxScaler()

        # Cached vectors
        self.product_vectors = {}
        self.product_metadata = {}
        self.user_profiles = {}

        # Interaction weights
        self.INTERACTION_WEIGHTS = {
            'order': 3.0,
            'add_to_cart': 2.0,
            'view': 1.0,
            'rate': 4.0
        }

        # Create cache directory
        os.makedirs(cache_dir, exist_ok=True)

    def connect_db(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.conn.cursor()
            print("✓ Database connection established")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            raise

    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✓ Database connection closed")

    def fetch_all_products(self) -> pd.DataFrame:
        """
        Fetch all products with their features from database.
        Returns DataFrame with: id, name, description, category, price, restaurant_id, etc.
        """
        print("\n Fetching all products from database...")

        self.cursor.execute("""
            SELECT
                p.id,
                p.name,
                p.description,
                p.category,
                p.price,
                p.restaurant_id,
                p.is_available,
                p.quantity,
                r.name as restaurant_name,
                r.category as restaurant_category
            FROM product p
            LEFT JOIN restaurant r ON p.restaurant_id = r.id
            WHERE p.is_available = true
            AND p.quantity > 0
        """)

        columns = ['id', 'name', 'description', 'category', 'price',
                   'restaurant_id', 'is_available', 'quantity',
                   'restaurant_name', 'restaurant_category']

        data = self.cursor.fetchall()
        df = pd.DataFrame(data, columns=columns)

        print(f"   ✓ Fetched {len(df)} products")
        return df

    def build_category_encoding(self, df: pd.DataFrame) -> Dict:
        """
        Build one-hot encoding for categorical features.
        Returns mapping: {category_name: [unique_values]}
        """
        print("\n Building category encodings...")

        # Get unique values for each categorical column
        categorical_columns = ['category', 'restaurant_category']

        encoding = {}
        for col in categorical_columns:
            unique_values = df[col].unique()
            encoding[col] = {val: idx for idx, val in enumerate(unique_values)}
            print(f"   {col}: {len(unique_values)} unique values")

        self.category_encoder = encoding
        return encoding

    def build_tfidf_vectors(self, df: pd.DataFrame):
        """
        Build TF-IDF vectors from product descriptions.
        This captures semantic similarity in text.
        """
        print("\n Building TF-IDF vectors from descriptions...")

        # Combine name and description for richer features
        df['text_features'] = df['name'].fillna('') + ' ' + df['description'].fillna('')

        # Create TF-IDF vectorizer
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=100,  # Limit to top 100 terms
            stop_words='english',
            ngram_range=(1, 2),  # Unigrams and bigrams
            min_df=2  # Must appear in at least 2 documents
        )

        # Fit and transform
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(df['text_features'])

        print(f"   ✓ Created TF-IDF matrix: {tfidf_matrix.shape}")
        print(f"   ✓ Vocabulary size: {len(self.tfidf_vectorizer.vocabulary_)}")

        return tfidf_matrix.toarray()

    def normalize_numeric_features(self, df: pd.DataFrame) -> np.ndarray:
        """
        Normalize numeric features (price) to [0, 1] range.
        """
        print("\n Normalizing numeric features...")

        # Extract price column
        prices = df[['price']].fillna(0).values

        # Fit and transform
        normalized = self.price_scaler.fit_transform(prices)

        print(f"   ✓ Normalized price: min={prices.min():.2f}, max={prices.max():.2f}")

        return normalized

    def create_product_vectors(self, df: pd.DataFrame):
        """
        Create comprehensive feature vectors for all products.
        Combines: One-Hot Encoding + TF-IDF + Normalized Numeric
        """
        print("\n" + "="*70)
        print("CREATING PRODUCT FEATURE VECTORS")
        print("="*70)

        # 1. Build encodings
        self.build_category_encoding(df)

        # 2. One-Hot Encoding for categories
        category_vectors = []
        for idx, row in df.iterrows():
            vector = []

            # Product category one-hot
            for cat in self.category_encoder['category'].keys():
                vector.append(1.0 if row['category'] == cat else 0.0)

            # Restaurant category one-hot
            for cat in self.category_encoder['restaurant_category'].keys():
                vector.append(1.0 if row['restaurant_category'] == cat else 0.0)

            category_vectors.append(vector)

        category_matrix = np.array(category_vectors)
        print(f"   ✓ Category features: {category_matrix.shape}")

        # 3. TF-IDF vectors
        tfidf_matrix = self.build_tfidf_vectors(df)

        # 4. Normalized numeric features
        numeric_matrix = self.normalize_numeric_features(df)

        # 5. Combine all features
        combined_vectors = np.hstack([
            category_matrix,
            tfidf_matrix,
            numeric_matrix
        ])

        print(f"\n   ✓ FINAL FEATURE VECTORS: {combined_vectors.shape}")
        print(f"     - Category features: {category_matrix.shape[1]}")
        print(f"     - TF-IDF features: {tfidf_matrix.shape[1]}")
        print(f"     - Numeric features: {numeric_matrix.shape[1]}")
        print(f"     - TOTAL: {combined_vectors.shape[1]} dimensions")

        # 6. Store vectors and metadata
        for idx, row in df.iterrows():
            product_id = row['id']
            self.product_vectors[product_id] = combined_vectors[idx]
            self.product_metadata[product_id] = {
                'name': row['name'],
                'category': row['category'],
                'price': row['price'],
                'restaurant_id': row['restaurant_id'],
                'restaurant_name': row['restaurant_name']
            }

        print(f"\n   ✓ Cached {len(self.product_vectors)} product vectors")

    def build_user_profile(self, username: str, use_cache: bool = True) -> np.ndarray:
        """
        Build user profile vector from interaction history.
        Profile = Weighted sum of product vectors user interacted with.

        Interaction weights:
        - Order: 3.0
        - Add to cart: 2.0
        - View: 1.0
        - Rate: 4.0
        """
        # Check cache
        if use_cache and username in self.user_profiles:
            return self.user_profiles[username]

        print(f"\n Building user profile for: {username}")

        # Fetch user interactions from order history
        self.cursor.execute("""
            SELECT
                product_id,
                quantity,
                order_date
            FROM user_order_history
            WHERE user_username = %s
            ORDER BY order_date DESC
        """, (username,))

        interactions = self.cursor.fetchall()

        if not interactions:
            print(f"   ✗ No interactions found for {username}")
            return None

        # Initialize profile vector
        vector_dim = len(next(iter(self.product_vectors.values())))
        user_vector = np.zeros(vector_dim)
        total_weight = 0.0

        # Aggregate weighted product vectors
        interaction_count = defaultdict(int)

        for product_id, quantity, order_date in interactions:
            if product_id not in self.product_vectors:
                continue

            # Weight: order (3.0) * quantity
            weight = self.INTERACTION_WEIGHTS['order'] * quantity

            # Add weighted product vector
            user_vector += self.product_vectors[product_id] * weight
            total_weight += weight

            interaction_count[product_id] += quantity

        # Normalize by total weight
        if total_weight > 0:
            user_vector = user_vector / total_weight

        # Cache profile
        self.user_profiles[username] = user_vector

        print(f"   ✓ Profile built from {len(interactions)} orders")
        print(f"   ✓ Unique products: {len(interaction_count)}")
        print(f"   ✓ Profile vector dimensions: {len(user_vector)}")

        return user_vector

    def calculate_similarity(self, user_vector: np.ndarray, product_id: int) -> float:
        """
        Calculate cosine similarity between user profile and product.
        Returns score in range [0, 1] where 1 = perfect match.
        """
        if product_id not in self.product_vectors:
            return 0.0

        product_vector = self.product_vectors[product_id]

        # Reshape for sklearn
        user_v = user_vector.reshape(1, -1)
        prod_v = product_vector.reshape(1, -1)

        # Cosine similarity
        similarity = cosine_similarity(user_v, prod_v)[0][0]

        # Ensure in [0, 1] range
        return max(0.0, min(1.0, similarity))

    def apply_business_rules(self,
                            recommendations: List[Dict],
                            username: str,
                            boost_popular: bool = True,
                            penalize_repeated: bool = True) -> List[Dict]:
        """
        Apply business rules to adjust recommendation scores:
        1. Boost popular products
        2. Penalize recently ordered products
        3. Boost nearby restaurants (placeholder)
        4. Time-based boosts (breakfast/lunch/dinner)
        """
        print("\n Applying business rules...")

        if penalize_repeated:
            # Get recently ordered products (last 30 days)
            self.cursor.execute("""
                SELECT DISTINCT product_id
                FROM user_order_history
                WHERE user_username = %s
                AND order_date >= NOW() - INTERVAL '30 days'
            """, (username,))

            recent_orders = set(row[0] for row in self.cursor.fetchall())

            # Penalize repeated orders (multiply by 0.7)
            for rec in recommendations:
                if rec['product_id'] in recent_orders:
                    rec['final_score'] = rec['similarity_score'] * 0.7
                    rec['repeated'] = True
                else:
                    rec['final_score'] = rec['similarity_score']
                    rec['repeated'] = False

        if boost_popular:
            # Calculate global popularity (simple count)
            self.cursor.execute("""
                SELECT product_id, COUNT(*) as order_count
                FROM user_order_history
                WHERE order_date >= NOW() - INTERVAL '90 days'
                GROUP BY product_id
            """)

            popularity = {row[0]: row[1] for row in self.cursor.fetchall()}
            max_popularity = max(popularity.values()) if popularity else 1

            # Boost popular items (add up to 0.2 to score)
            for rec in recommendations:
                pop_score = popularity.get(rec['product_id'], 0) / max_popularity
                boost = pop_score * 0.2
                rec['final_score'] = rec.get('final_score', rec['similarity_score']) + boost
                rec['popularity_boost'] = boost

        # Sort by final score
        recommendations.sort(key=lambda x: x['final_score'], reverse=True)

        print(f"   ✓ Business rules applied")

        return recommendations

    def get_recommendations(self,
                          username: str,
                          n: int = 10,
                          apply_rules: bool = True) -> List[Dict]:
        """
        Get top-N content-based recommendations for user.

        Pipeline:
        1. Build/load user profile
        2. Calculate similarity for all products
        3. Rank by similarity
        4. Apply business rules
        5. Return top-N
        """
        print("\n" + "="*70)
        print(f"GENERATING RECOMMENDATIONS FOR: {username}")
        print("="*70)

        # Step 1: Get user profile
        user_vector = self.build_user_profile(username)

        if user_vector is None:
            print("   ✗ Cannot generate recommendations - no user profile")
            return []

        # Step 2: Calculate similarity for all products
        print("\n Calculating similarity scores...")
        recommendations = []

        for product_id in self.product_vectors.keys():
            similarity = self.calculate_similarity(user_vector, product_id)

            if similarity > 0:
                metadata = self.product_metadata[product_id]
                recommendations.append({
                    'product_id': product_id,
                    'name': metadata['name'],
                    'category': metadata['category'],
                    'price': metadata['price'],
                    'restaurant_id': metadata['restaurant_id'],
                    'restaurant_name': metadata['restaurant_name'],
                    'similarity_score': similarity
                })

        print(f"   ✓ Calculated similarity for {len(recommendations)} products")

        # Step 3: Sort by similarity
        recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)

        # Step 4: Apply business rules
        if apply_rules:
            recommendations = self.apply_business_rules(recommendations, username)

        # Step 5: Get top-N
        top_recommendations = recommendations[:n]

        # Display results
        print(f"\n TOP {n} RECOMMENDATIONS:")
        print(f" {'Rank':<6} {'Product':<30} {'Category':<15} {'Sim':<6} {'Final':<6} {'Flags'}")
        print(f" {'-'*6} {'-'*30} {'-'*15} {'-'*6} {'-'*6} {'-'*20}")

        for i, rec in enumerate(top_recommendations, 1):
            flags = []
            if rec.get('repeated'):
                flags.append('🔁')
            if rec.get('popularity_boost', 0) > 0.1:
                flags.append('🔥')

            print(f" {i:<6} {rec['name'][:28]:<30} {rec['category'][:13]:<15} "
                  f"{rec['similarity_score']:<6.3f} {rec.get('final_score', rec['similarity_score']):<6.3f} "
                  f"{' '.join(flags)}")

        return top_recommendations

    def cold_start_recommendations(self,
                                  n: int = 10,
                                  category: str = None) -> List[Dict]:
        """
        Cold-start recommendations for new users.
        Returns trending/popular products.
        """
        print("\n COLD-START RECOMMENDATIONS")

        # Get most popular products
        self.cursor.execute("""
            SELECT
                p.id,
                p.name,
                p.category,
                p.price,
                p.restaurant_id,
                r.name as restaurant_name,
                COUNT(*) as order_count
            FROM user_order_history uoh
            JOIN product p ON uoh.product_id = p.id
            JOIN restaurant r ON p.restaurant_id = r.id
            WHERE p.is_available = true
            AND p.quantity > 0
            AND uoh.order_date >= NOW() - INTERVAL '30 days'
            {}
            GROUP BY p.id, p.name, p.category, p.price, p.restaurant_id, r.name
            ORDER BY order_count DESC
            LIMIT %s
        """.format("AND p.category = %s" if category else ""),
        (category, n) if category else (n,))

        results = self.cursor.fetchall()

        recommendations = []
        for row in results:
            recommendations.append({
                'product_id': row[0],
                'name': row[1],
                'category': row[2],
                'price': row[3],
                'restaurant_id': row[4],
                'restaurant_name': row[5],
                'order_count': row[6],
                'recommendation_type': 'cold_start_popular'
            })

        print(f"   ✓ Generated {len(recommendations)} cold-start recommendations")

        return recommendations

    def save_cache(self):
        """Save computed vectors and models to disk"""
        print("\n Saving cache to disk...")

        cache_data = {
            'product_vectors': self.product_vectors,
            'product_metadata': self.product_metadata,
            'category_encoder': self.category_encoder,
            'user_profiles': self.user_profiles
        }

        cache_file = os.path.join(self.cache_dir, 'vectors_cache.pkl')
        with open(cache_file, 'wb') as f:
            pickle.dump(cache_data, f)

        # Save TF-IDF vectorizer separately
        tfidf_file = os.path.join(self.cache_dir, 'tfidf_vectorizer.pkl')
        with open(tfidf_file, 'wb') as f:
            pickle.dump(self.tfidf_vectorizer, f)

        # Save price scaler
        scaler_file = os.path.join(self.cache_dir, 'price_scaler.pkl')
        with open(scaler_file, 'wb') as f:
            pickle.dump(self.price_scaler, f)

        print(f"   ✓ Cache saved to {self.cache_dir}")

    def load_cache(self) -> bool:
        """Load cached vectors and models from disk"""
        cache_file = os.path.join(self.cache_dir, 'vectors_cache.pkl')
        tfidf_file = os.path.join(self.cache_dir, 'tfidf_vectorizer.pkl')
        scaler_file = os.path.join(self.cache_dir, 'price_scaler.pkl')

        if not os.path.exists(cache_file):
            return False

        print("\n Loading cache from disk...")

        try:
            with open(cache_file, 'rb') as f:
                cache_data = pickle.load(f)

            self.product_vectors = cache_data['product_vectors']
            self.product_metadata = cache_data['product_metadata']
            self.category_encoder = cache_data['category_encoder']
            self.user_profiles = cache_data['user_profiles']

            with open(tfidf_file, 'rb') as f:
                self.tfidf_vectorizer = pickle.load(f)

            with open(scaler_file, 'rb') as f:
                self.price_scaler = pickle.load(f)

            print(f"   ✓ Loaded {len(self.product_vectors)} product vectors from cache")
            return True

        except Exception as e:
            print(f"   ✗ Failed to load cache: {e}")
            return False

    def initialize(self, force_rebuild: bool = False):
        """
        Initialize recommender system.
        Loads cache or rebuilds from database.
        """
        if not force_rebuild and self.load_cache():
            print("   ✓ Using cached vectors")
            return

        print("\n Building vectors from database...")

        # Fetch all products
        df = self.fetch_all_products()

        if len(df) == 0:
            print("   ✗ No products found in database!")
            return

        # Create product vectors
        self.create_product_vectors(df)

        # Save cache
        self.save_cache()


def main():
    """Main execution"""
    print("="*70)
    print("   ADVANCED CONTENT-BASED RECOMMENDATION SYSTEM")
    print("="*70)

    recommender = AdvancedContentBasedRecommender()

    try:
        # Connect to database
        recommender.connect_db()

        # Initialize (build or load vectors)
        recommender.initialize(force_rebuild=True)  # Set False to use cache

        # Test recommendations for a user
        test_username = "customer"  # Change to actual username
        recommendations = recommender.get_recommendations(test_username, n=10)

        # Test cold-start
        print("\n\n" + "="*70)
        cold_start = recommender.cold_start_recommendations(n=5)

        print("\n" + "="*70)
        print("  SYSTEM READY")
        print("="*70)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

    finally:
        recommender.close()


if __name__ == "__main__":
    main()