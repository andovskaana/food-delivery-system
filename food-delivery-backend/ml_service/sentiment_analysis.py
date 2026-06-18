import random
from typing import Dict

import psycopg2
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


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


class SentimentAnalyzer:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.analyzer = SentimentIntensityAnalyzer()

    def connect_db(self):
        if self.conn and not self.conn.closed:
            return
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()

    # -----------------------------
    # Sentiment scoring
    # -----------------------------
    def _review_sentiment(self, text: str) -> float:
        if not text:
            return 0.0
        scores = self.analyzer.polarity_scores(text)
        return scores.get("compound", 0.0)

    def calculate_sentiment_score(self, restaurant_id: int) -> float:
        """
        Compute restaurant sentiment score on a 0-100 scale.
        """
        self.connect_db()
        self.cursor.execute(
            "SELECT rating, comment FROM review WHERE restaurant_id = %s",
            (restaurant_id,),
        )
        rows = self.cursor.fetchall()

        ratings = [r for r, _ in rows if r is not None]
        comments = [c for _, c in rows if c]

        if not rows:
            return 50.0

        rating_score = (sum(ratings) / len(ratings)) * 20  # 1–5 → 20–100

        compounds = [self._review_sentiment(c) for c in comments]
        sentiment_score = (sum(compounds) / len(compounds) + 1) * 50

        # Ratings dominate, sentiment fine-tunes
        final_score = rating_score * 0.7 + sentiment_score * 0.3
        return min(final_score, 100.0)

    def get_all_sentiment_scores(self) -> Dict[int, float]:
        """
        Returns {restaurant_id: score_0_100}
        """
        self.connect_db()
        self.cursor.execute("SELECT id FROM restaurant")
        restaurant_ids = [row[0] for row in self.cursor.fetchall()]
        return {rid: self.calculate_sentiment_score(rid) for rid in restaurant_ids}
