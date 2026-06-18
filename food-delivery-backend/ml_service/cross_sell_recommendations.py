from __future__ import annotations

import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Iterable, List

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


class CrossSellRecommender:
    """
    Cross-sell recommender based on user co-occurrence.
    Works with user_order_history schema (NO order_id).
    """

    def __init__(self):
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)

    def get_cross_sell_recommendations(
        self,
        product_ids: Iterable[int],
        limit: int = 5
    ) -> List[int]:

        product_ids = [int(pid) for pid in product_ids]
        if not product_ids:
            return []

        cur = self.cursor

        # 1. Get categories of selected products
        cur.execute(
            "SELECT DISTINCT category FROM product WHERE id = ANY(%s)",
            (product_ids,)
        )
        categories = {row["category"] for row in cur.fetchall()}
        if not categories:
            return []

        # 2. Users who bought selected products
        cur.execute(
            """
            SELECT DISTINCT user_username
            FROM user_order_history
            WHERE product_id = ANY(%s)
            """,
            (product_ids,)
        )
        users = [row["user_username"] for row in cur.fetchall()]
        if not users:
            return []

        # 3. Count other products bought by those users
        cur.execute(
            """
            SELECT product_id, COUNT(*) AS freq
            FROM user_order_history
            WHERE user_username = ANY(%s)
              AND product_id <> ALL(%s)
            GROUP BY product_id
            ORDER BY freq DESC
            """,
            (users, product_ids)
        )

        candidates = cur.fetchall()

        # 4. Filter by category
        recommendations = []
        for row in candidates:
            pid = row["product_id"]

            cur.execute(
                "SELECT category FROM product WHERE id = %s",
                (pid,)
            )
            cat = cur.fetchone()

            if cat and cat["category"] in categories:
                recommendations.append(pid)

            if len(recommendations) >= limit:
                break

        return recommendations

    def close(self):
        self.cursor.close()
        self.conn.close()
