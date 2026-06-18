import psycopg2
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Tuple

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


class RfmAnalyzer:
    """
    RFM (Recency, Frequency, Monetary) Analysis for Customer Segmentation.

    Segments customers based on:
    - Recency (R): Days since last purchase (lower = better)
    - Frequency (F): Total number of purchases
    - Monetary (M): Total amount spent

    Each metric is scored 1-5 using quintiles, with 5 being the best.
    """

    # Customer segment definitions based on RFM scores
    SEGMENT_RULES = {
        'Champions': {
            'r_range': (4, 5),
            'f_range': (4, 5),
            'm_range': (4, 5),
            'description': 'Best customers who bought recently, buy often, and spend the most'
        },
        'Loyal Customers': {
            'r_range': (3, 5),
            'f_range': (3, 5),
            'm_range': (3, 5),
            'description': 'Customers who buy regularly and spend good amounts'
        },
        'Potential Loyalists': {
            'r_range': (3, 5),
            'f_range': (1, 3),
            'm_range': (1, 3),
            'description': 'Recent customers with average frequency and monetary values'
        },
        'New Customers': {
            'r_range': (4, 5),
            'f_range': (1, 1),
            'm_range': (1, 5),
            'description': 'Customers who just made their first purchase'
        },
        'Promising': {
            'r_range': (3, 4),
            'f_range': (1, 2),
            'm_range': (1, 2),
            'description': 'Recent shoppers with below average frequency'
        },
        'Need Attention': {
            'r_range': (2, 3),
            'f_range': (2, 3),
            'm_range': (2, 3),
            'description': 'Above average customers who haven\'t purchased recently'
        },
        'About to Sleep': {
            'r_range': (2, 3),
            'f_range': (1, 2),
            'm_range': (1, 2),
            'description': 'Below average customers who haven\'t purchased recently'
        },
        'At Risk': {
            'r_range': (1, 2),
            'f_range': (3, 5),
            'm_range': (3, 5),
            'description': 'Customers who used to purchase often but haven\'t recently'
        },
        'Can\'t Lose Them': {
            'r_range': (1, 2),
            'f_range': (4, 5),
            'm_range': (4, 5),
            'description': 'High-value customers who haven\'t purchased in a while'
        },
        'Hibernating': {
            'r_range': (1, 2),
            'f_range': (1, 2),
            'm_range': (1, 2),
            'description': 'Low-value customers who haven\'t purchased in a while'
        },
        'Lost Customers': {
            'r_range': (1, 1),
            'f_range': (1, 2),
            'm_range': (1, 2),
            'description': 'Customers who haven\'t purchased for a very long time'
        }
    }

    def __init__(self):
        self.conn = None
        self.cursor = None
        self.rfm_data = None

    def connect_db(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.conn.cursor()
            print("RFM Analyzer: Database connection established")
        except Exception as e:
            print(f"RFM Analyzer: Database connection failed: {e}")
            raise

    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("RFM Analyzer: Database connection closed")

    def fetch_customer_data(self, days_back: int = 365) -> pd.DataFrame:
        """
        Fetch customer transaction data for RFM calculation.

        Args:
            days_back: Number of days to look back for transactions (default: 365)

        Returns:
            DataFrame with columns: username, order_date, order_value
        """
        print(f"\nFetching customer data for the last {days_back} days...")

        # Query user_order_history for aggregated order data
        self.cursor.execute("""
            SELECT
                user_username,
                order_date,
                order_value
            FROM user_order_history
            WHERE order_date >= NOW() - INTERVAL '%s days'
            ORDER BY user_username, order_date
        """, (days_back,))

        columns = ['username', 'order_date', 'order_value']
        data = self.cursor.fetchall()

        if not data:
            print("No transaction data found")
            return pd.DataFrame(columns=columns)

        df = pd.DataFrame(data, columns=columns)
        print(f"Fetched {len(df)} transactions from {df['username'].nunique()} customers")

        return df

    def calculate_rfm_metrics(self, df: pd.DataFrame, analysis_date: datetime = None) -> pd.DataFrame:
        """
        Calculate raw RFM metrics for each customer.

        Args:
            df: Transaction DataFrame with columns: username, order_date, order_value
            analysis_date: Reference date for recency calculation (default: now)

        Returns:
            DataFrame with columns: username, recency, frequency, monetary
        """
        if df.empty:
            return pd.DataFrame(columns=['username', 'recency', 'frequency', 'monetary'])

        if analysis_date is None:
            analysis_date = datetime.now()

        print(f"\nCalculating RFM metrics (reference date: {analysis_date.date()})...")

        # Ensure order_date is datetime
        df['order_date'] = pd.to_datetime(df['order_date'])

        # Calculate RFM metrics per customer
        rfm = df.groupby('username').agg({
            'order_date': lambda x: (analysis_date - x.max()).days,  # Recency: days since last order
            'order_value': ['count', 'sum']  # Frequency and Monetary
        }).reset_index()

        # Flatten column names
        rfm.columns = ['username', 'recency', 'frequency', 'monetary']

        # Round monetary to 2 decimal places
        rfm['monetary'] = rfm['monetary'].round(2)

        print(f"Calculated RFM for {len(rfm)} customers")
        print(f"  Recency range: {rfm['recency'].min()} - {rfm['recency'].max()} days")
        print(f"  Frequency range: {rfm['frequency'].min()} - {rfm['frequency'].max()} orders")
        print(f"  Monetary range: ${rfm['monetary'].min():.2f} - ${rfm['monetary'].max():.2f}")

        return rfm

    def calculate_rfm_scores(self, rfm: pd.DataFrame) -> pd.DataFrame:
        """
        Score each RFM metric on a 1-5 scale using quintiles.

        For Recency: Lower days = Higher score (5 = most recent)
        For Frequency: Higher count = Higher score (5 = most frequent)
        For Monetary: Higher amount = Higher score (5 = highest spender)

        Args:
            rfm: DataFrame with raw RFM metrics

        Returns:
            DataFrame with additional score columns: r_score, f_score, m_score, rfm_score
        """
        if rfm.empty:
            return rfm

        print("\nCalculating RFM scores using quintiles...")

        # Score Recency (reverse - lower recency = higher score)
        rfm['r_score'] = pd.qcut(
            rfm['recency'].rank(method='first'),
            q=5,
            labels=[5, 4, 3, 2, 1]
        ).astype(int)

        # Score Frequency (higher = better)
        rfm['f_score'] = pd.qcut(
            rfm['frequency'].rank(method='first'),
            q=5,
            labels=[1, 2, 3, 4, 5]
        ).astype(int)

        # Score Monetary (higher = better)
        rfm['m_score'] = pd.qcut(
            rfm['monetary'].rank(method='first'),
            q=5,
            labels=[1, 2, 3, 4, 5]
        ).astype(int)

        # Calculate combined RFM score (sum of R, F, M scores)
        rfm['rfm_score'] = rfm['r_score'] + rfm['f_score'] + rfm['m_score']

        # Create RFM segment string (e.g., "555" for best customers)
        rfm['rfm_segment'] = (
            rfm['r_score'].astype(str) +
            rfm['f_score'].astype(str) +
            rfm['m_score'].astype(str)
        )

        print(f"Score distribution:")
        print(f"  R-Score: {dict(rfm['r_score'].value_counts().sort_index())}")
        print(f"  F-Score: {dict(rfm['f_score'].value_counts().sort_index())}")
        print(f"  M-Score: {dict(rfm['m_score'].value_counts().sort_index())}")
        print(f"  RFM Total Score range: {rfm['rfm_score'].min()} - {rfm['rfm_score'].max()}")

        return rfm

    def assign_customer_segment(self, row: pd.Series) -> str:
        """
        Assign a customer segment based on RFM scores.

        Args:
            row: Series with r_score, f_score, m_score

        Returns:
            Segment name string
        """
        r, f, m = row['r_score'], row['f_score'], row['m_score']

        for segment, rules in self.SEGMENT_RULES.items():
            r_min, r_max = rules['r_range']
            f_min, f_max = rules['f_range']
            m_min, m_max = rules['m_range']

            if (r_min <= r <= r_max and
                f_min <= f <= f_max and
                m_min <= m <= m_max):
                return segment

        # Default segment for edge cases
        return 'Other'

    def segment_customers(self, rfm: pd.DataFrame) -> pd.DataFrame:
        """
        Assign customer segments based on RFM scores.

        Args:
            rfm: DataFrame with RFM scores

        Returns:
            DataFrame with customer_segment column added
        """
        if rfm.empty:
            return rfm

        print("\nAssigning customer segments...")

        rfm['customer_segment'] = rfm.apply(self.assign_customer_segment, axis=1)

        # Add segment description
        rfm['segment_description'] = rfm['customer_segment'].apply(
            lambda x: self.SEGMENT_RULES.get(x, {}).get('description', 'Uncategorized customer')
        )

        # Print segment distribution
        segment_counts = rfm['customer_segment'].value_counts()
        print("\nCustomer Segment Distribution:")
        for segment, count in segment_counts.items():
            pct = (count / len(rfm)) * 100
            print(f"  {segment}: {count} customers ({pct:.1f}%)")

        return rfm

    def run_rfm_analysis(self, days_back: int = 365) -> pd.DataFrame:
        """
        Run complete RFM analysis pipeline.

        Args:
            days_back: Number of days to look back for transactions

        Returns:
            DataFrame with complete RFM analysis results
        """
        print("\n" + "="*70)
        print("RUNNING RFM ANALYSIS")
        print("="*70)

        # Step 1: Fetch data
        df = self.fetch_customer_data(days_back)

        if df.empty:
            print("No data available for RFM analysis")
            return pd.DataFrame()

        # Step 2: Calculate raw metrics
        rfm = self.calculate_rfm_metrics(df)

        # Step 3: Calculate scores
        rfm = self.calculate_rfm_scores(rfm)

        # Step 4: Assign segments
        rfm = self.segment_customers(rfm)

        # Store results
        self.rfm_data = rfm

        print("\n" + "="*70)
        print("RFM ANALYSIS COMPLETE")
        print(f"Analyzed {len(rfm)} customers")
        print("="*70)

        return rfm

    def get_customer_rfm(self, username: str) -> Optional[Dict]:
        """
        Get RFM analysis for a specific customer.

        Args:
            username: Customer username

        Returns:
            Dictionary with customer's RFM data or None if not found
        """
        if self.rfm_data is None or self.rfm_data.empty:
            self.run_rfm_analysis()

        if self.rfm_data is None or self.rfm_data.empty:
            return None

        customer = self.rfm_data[self.rfm_data['username'] == username]

        if customer.empty:
            return None

        row = customer.iloc[0]
        return {
            'username': row['username'],
            'recency': int(row['recency']),
            'frequency': int(row['frequency']),
            'monetary': float(row['monetary']),
            'r_score': int(row['r_score']),
            'f_score': int(row['f_score']),
            'm_score': int(row['m_score']),
            'rfm_score': int(row['rfm_score']),
            'rfm_segment': row['rfm_segment'],
            'customer_segment': row['customer_segment'],
            'segment_description': row['segment_description']
        }

    def get_all_customers_rfm(self) -> List[Dict]:
        """
        Get RFM analysis for all customers.

        Returns:
            List of dictionaries with RFM data for each customer
        """
        if self.rfm_data is None or self.rfm_data.empty:
            self.run_rfm_analysis()

        if self.rfm_data is None or self.rfm_data.empty:
            return []

        results = []
        for _, row in self.rfm_data.iterrows():
            results.append({
                'username': row['username'],
                'recency': int(row['recency']),
                'frequency': int(row['frequency']),
                'monetary': float(row['monetary']),
                'r_score': int(row['r_score']),
                'f_score': int(row['f_score']),
                'm_score': int(row['m_score']),
                'rfm_score': int(row['rfm_score']),
                'rfm_segment': row['rfm_segment'],
                'customer_segment': row['customer_segment'],
                'segment_description': row['segment_description']
            })

        return results

    def get_segment_summary(self) -> List[Dict]:
        """
        Get summary statistics for each customer segment.

        Returns:
            List of dictionaries with segment statistics
        """
        if self.rfm_data is None or self.rfm_data.empty:
            self.run_rfm_analysis()

        if self.rfm_data is None or self.rfm_data.empty:
            return []

        summary = []
        for segment in self.rfm_data['customer_segment'].unique():
            segment_data = self.rfm_data[self.rfm_data['customer_segment'] == segment]

            summary.append({
                'segment': segment,
                'customer_count': len(segment_data),
                'percentage': round((len(segment_data) / len(self.rfm_data)) * 100, 2),
                'avg_recency': round(segment_data['recency'].mean(), 1),
                'avg_frequency': round(segment_data['frequency'].mean(), 1),
                'avg_monetary': round(segment_data['monetary'].mean(), 2),
                'total_revenue': round(segment_data['monetary'].sum(), 2),
                'description': self.SEGMENT_RULES.get(segment, {}).get('description', '')
            })

        # Sort by total revenue descending
        summary.sort(key=lambda x: x['total_revenue'], reverse=True)

        return summary

    def get_customers_by_segment(self, segment: str) -> List[Dict]:
        """
        Get all customers in a specific segment.

        Args:
            segment: Segment name

        Returns:
            List of customer RFM data dictionaries
        """
        if self.rfm_data is None or self.rfm_data.empty:
            self.run_rfm_analysis()

        if self.rfm_data is None or self.rfm_data.empty:
            return []

        segment_data = self.rfm_data[self.rfm_data['customer_segment'] == segment]

        results = []
        for _, row in segment_data.iterrows():
            results.append({
                'username': row['username'],
                'recency': int(row['recency']),
                'frequency': int(row['frequency']),
                'monetary': float(row['monetary']),
                'r_score': int(row['r_score']),
                'f_score': int(row['f_score']),
                'm_score': int(row['m_score']),
                'rfm_score': int(row['rfm_score']),
                'rfm_segment': row['rfm_segment']
            })

        return results


def main():
    """Test RFM analysis"""
    print("="*70)
    print("   RFM CUSTOMER SEGMENTATION ANALYSIS")
    print("="*70)

    analyzer = RfmAnalyzer()

    try:
        analyzer.connect_db()

        # Run full analysis
        rfm_data = analyzer.run_rfm_analysis(days_back=365)

        if not rfm_data.empty:
            # Print segment summary
            print("\n" + "="*70)
            print("SEGMENT SUMMARY")
            print("="*70)

            summary = analyzer.get_segment_summary()
            for seg in summary:
                print(f"\n{seg['segment']}:")
                print(f"  Customers: {seg['customer_count']} ({seg['percentage']}%)")
                print(f"  Avg Recency: {seg['avg_recency']} days")
                print(f"  Avg Frequency: {seg['avg_frequency']} orders")
                print(f"  Avg Monetary: ${seg['avg_monetary']:.2f}")
                print(f"  Total Revenue: ${seg['total_revenue']:.2f}")

            # Test individual customer lookup
            if len(rfm_data) > 0:
                test_user = rfm_data.iloc[0]['username']
                print(f"\n\nSample Customer RFM ({test_user}):")
                customer_rfm = analyzer.get_customer_rfm(test_user)
                if customer_rfm:
                    for key, value in customer_rfm.items():
                        print(f"  {key}: {value}")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

    finally:
        analyzer.close()


if __name__ == "__main__":
    main()
