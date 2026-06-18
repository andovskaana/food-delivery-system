from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from content_based_recommendations import AdvancedContentBasedRecommender
import threading
from cross_sell_recommendations import CrossSellRecommender
from sentiment_analysis import SentimentAnalyzer
from rfm_analysis import RfmAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global recommender instance
recommender = AdvancedContentBasedRecommender()
cross_sell_recommender = CrossSellRecommender()
recommender_lock = threading.Lock()
initialized = False
sentiment_analyzer = SentimentAnalyzer()
sentiment_initialized = False
rfm_analyzer = RfmAnalyzer()
rfm_initialized = False


def initialize_recommender():
    """Initialize recommender on first request"""
    global initialized

    if not initialized:
        with recommender_lock:
            if not initialized:  # Double-check locking
                logger.info("Initializing recommender system...")
                recommender.connect_db()
                recommender.initialize(force_rebuild=False)  # Use cache if available
                initialized = True
                logger.info("Recommender system initialized successfully")

def initialize_sentiment():
    global sentiment_initialized
    if not sentiment_initialized:
        logger.info("Initializing sentiment analyzer...")
        sentiment_analyzer.connect_db()
        sentiment_initialized = True
        logger.info("Sentiment analyzer initialized successfully")


def initialize_rfm():
    global rfm_initialized
    if not rfm_initialized:
        logger.info("Initializing RFM analyzer...")
        rfm_analyzer.connect_db()

        # Auto-run RFM analysis on startup to ensure segment data is available
        logger.info("Running initial RFM analysis (this may take a few seconds)...")
        try:
            rfm_data = rfm_analyzer.run_rfm_analysis(days_back=365)
            if rfm_data is not None and not rfm_data.empty:
                logger.info(f"RFM analysis complete: {len(rfm_data)} customers segmented")
            else:
                logger.warning("RFM analysis complete but no customer data found (user_order_history may be empty)")
        except Exception as e:
            logger.error(f"RFM analysis failed: {str(e)}")

        rfm_initialized = True
        logger.info("RFM analyzer initialized successfully")


@app.before_request
def before_request():
    """Ensure recommender is initialized before handling requests"""
    initialize_recommender()
    initialize_sentiment()
    initialize_rfm()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'advanced-content-based-recommender',
        'version': '2.0.0',
        'initialized': initialized,
        'cached_products': len(recommender.product_vectors),
        'cached_user_profiles': len(recommender.user_profiles)
    }), 200


@app.route('/api/recommendations/advanced/<username>', methods=['GET'])
def get_advanced_recommendations(username):
    """
    Get advanced content-based recommendations with vectorization and TF-IDF.

    Query parameters:
    - n: Number of recommendations (default: 10)
    - apply_rules: Apply business rules (default: true)

    Returns:
        JSON array of recommended products with similarity scores
    """
    try:
        n = request.args.get('n', default=10, type=int)
        apply_rules = request.args.get('apply_rules', default='true', type=str).lower() == 'true'

        if n < 1 or n > 50:
            return jsonify({
                'error': 'Invalid parameter',
                'message': 'n must be between 1 and 50'
            }), 400

        logger.info(f"Getting advanced recommendations for: {username}, n={n}, rules={apply_rules}")

        # Ensure database connection
        if not recommender.conn or recommender.conn.closed:
            recommender.connect_db()

        # Get recommendations
        recommendations = recommender.get_recommendations(
            username,
            n=n,
            apply_rules=apply_rules
        )

        if not recommendations:
            return jsonify({
                'username': username,
                'recommendations': [],
                'message': 'No recommendations available. User may not have order history.',
                'recommendation_type': 'empty'
            }), 200

        # Format response
        response = {
            'username': username,
            'count': len(recommendations),
            'recommendation_type': 'personalized',
            'features_used': {
                'category_encoding': True,
                'tfidf_text': True,
                'normalized_price': True,
                'business_rules': apply_rules
            },
            'recommendations': recommendations
        }

        logger.info(f"Successfully generated {len(recommendations)} recommendations for {username}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error generating recommendations for {username}: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/recommendations/cold-start', methods=['GET'])
def get_cold_start_recommendations():
    """
    Get cold-start recommendations for new users.
    Returns trending/popular products.

    Query parameters:
    - n: Number of recommendations (default: 10)
    - category: Optional category filter

    Returns:
        JSON array of popular products
    """
    try:
        n = request.args.get('n', default=10, type=int)
        category = request.args.get('category', default=None, type=str)

        if n < 1 or n > 50:
            return jsonify({
                'error': 'Invalid parameter',
                'message': 'n must be between 1 and 50'
            }), 400

        logger.info(f"Getting cold-start recommendations: n={n}, category={category}")

        # Ensure database connection
        if not recommender.conn or recommender.conn.closed:
            recommender.connect_db()

        # Get cold-start recommendations
        recommendations = recommender.cold_start_recommendations(n=n, category=category)

        response = {
            'count': len(recommendations),
            'recommendation_type': 'cold_start',
            'category_filter': category,
            'recommendations': recommendations
        }

        logger.info(f"Successfully generated {len(recommendations)} cold-start recommendations")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error generating cold-start recommendations: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/recommendations/user-vector/<username>', methods=['GET'])
def get_user_vector_info(username):
    """
    Get user profile vector information.
    Shows dimensionality and statistics about the user's feature vector.

    Returns:
        JSON object with user vector metadata
    """
    try:
        logger.info(f"Getting user vector info for: {username}")

        # Ensure database connection
        if not recommender.conn or recommender.conn.closed:
            recommender.connect_db()

        # Build user profile
        user_vector = recommender.build_user_profile(username, use_cache=False)

        if user_vector is None:
            return jsonify({
                'username': username,
                'has_profile': False,
                'message': 'User has no order history'
            }), 200

        # Calculate statistics
        import numpy as np

        response = {
            'username': username,
            'has_profile': True,
            'vector_dimensions': len(user_vector),
            'statistics': {
                'mean': float(np.mean(user_vector)),
                'std': float(np.std(user_vector)),
                'min': float(np.min(user_vector)),
                'max': float(np.max(user_vector)),
                'non_zero_features': int(np.count_nonzero(user_vector))
            },
            'feature_breakdown': {
                'total_features': len(user_vector),
                'category_features': len(recommender.category_encoder.get('category', {})) +
                                   len(recommender.category_encoder.get('restaurant_category', {})),
                'tfidf_features': 100,  # Max features set in TF-IDF
                'numeric_features': 1  # Price
            }
        }

        logger.info(f"Successfully retrieved user vector info for {username}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error getting user vector for {username}: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/recommendations/rebuild-cache', methods=['POST'])
def rebuild_cache():
    """
    Rebuild product vectors cache from database.
    This should be called when:
    - New products are added
    - Product information is updated
    - Categories change

    Returns:
        JSON object with rebuild status
    """
    try:
        logger.info("Rebuilding cache...")

        # Ensure database connection
        if not recommender.conn or recommender.conn.closed:
            recommender.connect_db()

        # Force rebuild
        recommender.initialize(force_rebuild=True)

        response = {
            'status': 'success',
            'message': 'Cache rebuilt successfully',
            'cached_products': len(recommender.product_vectors),
            'vector_dimensions': len(next(iter(recommender.product_vectors.values())))
                                if recommender.product_vectors else 0
        }

        logger.info("Cache rebuilt successfully")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error rebuilding cache: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/recommendations/similarity/<int:product_id>', methods=['GET'])
def get_product_similarity(product_id):
    """
    Calculate similarity between a product and a user's profile.

    Query parameters:
    - username: Username to compare against

    Returns:
        JSON object with similarity score
    """
    try:
        username = request.args.get('username', type=str)

        if not username:
            return jsonify({
                'error': 'Missing parameter',
                'message': 'username is required'
            }), 400

        logger.info(f"Calculating similarity for product {product_id} and user {username}")

        # Ensure database connection
        if not recommender.conn or recommender.conn.closed:
            recommender.connect_db()

        # Get user profile
        user_vector = recommender.build_user_profile(username)

        if user_vector is None:
            return jsonify({
                'error': 'User has no profile',
                'message': 'User has no order history'
            }), 400

        # Calculate similarity
        similarity = recommender.calculate_similarity(user_vector, product_id)

        # Get product metadata
        metadata = recommender.product_metadata.get(product_id)

        response = {
            'product_id': product_id,
            'username': username,
            'similarity_score': float(similarity),
            'product_info': metadata if metadata else None
        }

        logger.info(f"Similarity score: {similarity:.4f}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error calculating similarity: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route("/api/recommendations/cross-sell", methods=["GET"])
def get_cross_sell():
    """
    Return cross‑sell recommendations based on items currently in the cart.
    Accepts `productIds` or `product_ids` as a comma‑separated list and an optional `limit`.
    """
    product_ids_param = request.args.get("productIds") or request.args.get("product_ids")
    if not product_ids_param:
        return jsonify({"error": "productIds parameter is required"}), 400
    try:
        product_ids = [int(p) for p in product_ids_param.split(",") if p]
        limit = int(request.args.get("limit", 5))
    except ValueError:
        return jsonify({"error": "productIds must be comma‑separated integers and limit an integer"}), 400
    try:
        ids = cross_sell_recommender.get_cross_sell_recommendations(product_ids, limit)
        return jsonify({"recommendedProductIds": ids})
    except Exception as exc:
        logger.exception("Error generating cross‑sell recommendations")
        return jsonify({"error": str(exc)}), 500


# -----------------------------------------------------------------------------
# Sentiment analysis endpoints
# -----------------------------------------------------------------------------

@app.route('/api/sentiment/<int:restaurant_id>', methods=['GET'])
def get_restaurant_sentiment(restaurant_id):
    """
    Returns:
      { "restaurant_id": X, "sentiment_score": Y }  where Y is 0-100
    """
    try:
        if not sentiment_analyzer.conn or sentiment_analyzer.conn.closed:
            sentiment_analyzer.connect_db()

        score = sentiment_analyzer.calculate_sentiment_score(restaurant_id)
        return jsonify({
            "restaurant_id": restaurant_id,
            "sentiment_score": score
        }), 200

    except Exception as e:
        logger.error(f"Error computing sentiment for restaurant {restaurant_id}: {str(e)}")
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route('/api/sentiment', methods=['GET'])
def get_all_restaurant_sentiments():
    """
    Returns a list:
      [
        { "restaurant_id": 1, "sentiment_score": 72.4 },
        ...
      ]
    """
    try:
        if not sentiment_analyzer.conn or sentiment_analyzer.conn.closed:
            sentiment_analyzer.connect_db()

        scores = sentiment_analyzer.get_all_sentiment_scores()
        result = [{"restaurant_id": rid, "sentiment_score": score} for rid, score in scores.items()]
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error computing sentiment scores: {str(e)}")
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# -----------------------------------------------------------------------------
# RFM Analysis endpoints
# -----------------------------------------------------------------------------

@app.route('/api/rfm/analyze', methods=['POST'])
def run_rfm_analysis():
    """
    Run RFM analysis on all customers.

    Query parameters:
    - days_back: Number of days to look back for transactions (default: 365)

    Returns:
        JSON object with analysis status and summary
    """
    try:
        days_back = request.args.get('days_back', default=365, type=int)

        if days_back < 1 or days_back > 3650:
            return jsonify({
                'error': 'Invalid parameter',
                'message': 'days_back must be between 1 and 3650'
            }), 400

        logger.info(f"Running RFM analysis for last {days_back} days...")

        if not rfm_analyzer.conn or rfm_analyzer.conn.closed:
            rfm_analyzer.connect_db()

        rfm_data = rfm_analyzer.run_rfm_analysis(days_back=days_back)

        if rfm_data.empty:
            return jsonify({
                'status': 'completed',
                'message': 'No customer data available for analysis',
                'customer_count': 0,
                'segments': []
            }), 200

        summary = rfm_analyzer.get_segment_summary()

        response = {
            'status': 'completed',
            'message': 'RFM analysis completed successfully',
            'days_analyzed': days_back,
            'customer_count': len(rfm_data),
            'segment_count': len(summary),
            'segments': summary
        }

        logger.info(f"RFM analysis completed: {len(rfm_data)} customers analyzed")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error running RFM analysis: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/rfm/customer/<username>', methods=['GET'])
def get_customer_rfm(username):
    """
    Get RFM analysis for a specific customer.

    Returns:
        JSON object with customer's RFM data and segment
    """
    try:
        logger.info(f"Getting RFM data for customer: {username}")

        if not rfm_analyzer.conn or rfm_analyzer.conn.closed:
            rfm_analyzer.connect_db()

        customer_rfm = rfm_analyzer.get_customer_rfm(username)

        if customer_rfm is None:
            return jsonify({
                'error': 'Customer not found',
                'message': f'No RFM data available for customer: {username}'
            }), 404

        logger.info(f"Retrieved RFM data for {username}: segment={customer_rfm['customer_segment']}")

        return jsonify(customer_rfm), 200

    except Exception as e:
        logger.error(f"Error getting customer RFM for {username}: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/rfm/customers', methods=['GET'])
def get_all_customers_rfm():
    """
    Get RFM analysis for all customers.

    Returns:
        JSON array of all customers with their RFM data
    """
    try:
        logger.info("Getting RFM data for all customers")

        if not rfm_analyzer.conn or rfm_analyzer.conn.closed:
            rfm_analyzer.connect_db()

        customers = rfm_analyzer.get_all_customers_rfm()

        response = {
            'count': len(customers),
            'customers': customers
        }

        logger.info(f"Retrieved RFM data for {len(customers)} customers")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error getting all customers RFM: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/rfm/segments', methods=['GET'])
def get_rfm_segment_summary():
    """
    Get summary statistics for all customer segments.

    Returns:
        JSON array of segment summaries
    """
    try:
        logger.info("Getting RFM segment summary")

        if not rfm_analyzer.conn or rfm_analyzer.conn.closed:
            rfm_analyzer.connect_db()

        summary = rfm_analyzer.get_segment_summary()

        response = {
            'segment_count': len(summary),
            'segments': summary
        }

        logger.info(f"Retrieved {len(summary)} segment summaries")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error getting segment summary: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/rfm/segment/<segment_name>', methods=['GET'])
def get_customers_by_segment(segment_name):
    """
    Get all customers in a specific segment.

    Path parameters:
    - segment_name: Name of the segment (e.g., "Champions", "At Risk")

    Returns:
        JSON array of customers in the segment
    """
    try:
        # URL decode segment name (replace %20 with space, etc.)
        segment_name = segment_name.replace('%20', ' ')

        logger.info(f"Getting customers in segment: {segment_name}")

        if not rfm_analyzer.conn or rfm_analyzer.conn.closed:
            rfm_analyzer.connect_db()

        customers = rfm_analyzer.get_customers_by_segment(segment_name)

        response = {
            'segment': segment_name,
            'customer_count': len(customers),
            'customers': customers
        }

        logger.info(f"Retrieved {len(customers)} customers in segment '{segment_name}'")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error getting customers by segment: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Not found',
        'message': 'The requested endpoint does not exist'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500


if __name__ == '__main__':
    logger.info("Starting Advanced Content-Based Recommendation Service")
    logger.info("Service will be available at http://localhost:5002")
    logger.info("\nEndpoints:")
    logger.info("  GET  /health")
    logger.info("  GET  /api/recommendations/advanced/<username>")
    logger.info("  GET  /api/recommendations/cold-start")
    logger.info("  GET  /api/recommendations/user-vector/<username>")
    logger.info("  POST /api/recommendations/rebuild-cache")
    logger.info("  GET  /api/recommendations/similarity/<product_id>")
    logger.info("  GET  /api/recommendations/cross-sell")
    logger.info("  GET  /api/sentiment/<restaurant_id>")
    logger.info("  GET  /api/sentiment")
    logger.info("  POST /api/rfm/analyze")
    logger.info("  GET  /api/rfm/customer/<username>")
    logger.info("  GET  /api/rfm/customers")
    logger.info("  GET  /api/rfm/segments")
    logger.info("  GET  /api/rfm/segment/<segment_name>")

    # Run Flask app on different port (5002) to avoid conflict
    app.run(
        host='0.0.0.0',
        port=5002,
        debug=True
    )