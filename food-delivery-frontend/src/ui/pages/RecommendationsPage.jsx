import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Recommendations Page
 * Production-ready recommendations component
 */
const RecommendationsPage = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE = 'http://localhost:8080';

    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // Fetch recommendations on component mount
    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = getAuthToken();

            // Call advanced ML recommendations
            const response = await axios.get(
                `${API_BASE}/api/recommendations/advanced`,
                {
                    params: {
                        limit: 12,
                        applyRules: true
                    },
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setRecommendations(response.data);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError('Failed to load recommendations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (productId) => {
        try {
            const token = getAuthToken();

            await axios.post(
                `${API_BASE}/api/products/add-to-order/${productId}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            alert('✅ Product added to cart!');
        } catch (err) {
            console.error('Error adding to cart:', err);
            alert('❌ Failed to add product to cart');
        }
    };

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>Recommended for You</h1>
                <p style={styles.subtitle}>
                    Personalized suggestions based on your preferences
                </p>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Finding the best recommendations...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div style={styles.errorContainer}>
                    <div style={styles.errorIcon}>😕</div>
                    <p style={styles.errorText}>{error}</p>
                    <button onClick={fetchRecommendations} style={styles.retryButton}>
                        Try Again
                    </button>
                </div>
            )}

            {/* Recommendations Grid */}
            {!loading && !error && recommendations.length > 0 && (
                <div style={styles.grid}>
                    {recommendations.map((product) => (
                        <div key={product.id} style={styles.card}>
                            {/* Product Image */}
                            <div style={styles.imageContainer}>
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        style={styles.image}
                                    />
                                ) : (
                                    <div style={styles.imagePlaceholder}>
                                        {getEmojiForCategory(product.category)}
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div style={styles.cardContent}>
                                <div style={styles.categoryBadge}>
                                    {product.category}
                                </div>

                                <h3 style={styles.productName}>{product.name}</h3>

                                <div style={styles.descriptionContainer}>
                                    {product.description && (
                                        <p style={styles.description}>
                                            {product.description.substring(0, 100)}
                                            {product.description.length > 100 ? '...' : ''}
                                        </p>
                                    )}
                                </div>

                                <div style={styles.footer}>
                                    <div style={styles.priceSection}>
                                        <span style={styles.price}>${product.price.toFixed(2)}</span>
                                        {product.quantity > 0 ? (
                                            <span style={styles.available}>Available</span>
                                        ) : (
                                            <span style={styles.unavailable}>Out of stock</span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleAddToCart(product.id)}
                                        disabled={product.quantity === 0}
                                        style={{
                                            ...styles.addButton,
                                            ...(product.quantity === 0 ? styles.addButtonDisabled : {})
                                        }}
                                    >
                                        {product.quantity === 0 ? 'Unavailable' : 'Add to Cart'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && recommendations.length === 0 && (
                <div style={styles.emptyContainer}>
                    <div style={styles.emptyIcon}>🍽️</div>
                    <h3 style={styles.emptyTitle}>No recommendations yet</h3>
                    <p style={styles.emptyText}>
                        Start ordering to get personalized recommendations!
                    </p>
                </div>
            )}
        </div>
    );
};

// Helper function
const getEmojiForCategory = (category) => {
    const emojiMap = {
        'Pizza': '🍕',
        'Burger': '🍔',
        'Pasta': '🍝',
        'Salad': '🥗',
        'Sushi': '🍣',
        'Dessert': '🍰',
        'Drink': '🥤',
    };
    return emojiMap[category] || '🍽️';
};

// Styles
const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '40px 20px',
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px',
    },
    title: {
        fontSize: '36px',
        fontWeight: '700',
        color: '#1a1a1a',
        margin: '0 0 12px 0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    subtitle: {
        fontSize: '18px',
        color: '#6c757d',
        margin: 0,
    },
    loadingContainer: {
        textAlign: 'center',
        padding: '80px 20px',
    },
    spinner: {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #f97316',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 24px',
    },
    loadingText: {
        fontSize: '16px',
        color: '#6c757d',
    },
    errorContainer: {
        textAlign: 'center',
        padding: '80px 20px',
        maxWidth: '500px',
        margin: '0 auto',
    },
    errorIcon: {
        fontSize: '64px',
        marginBottom: '20px',
    },
    errorText: {
        fontSize: '18px',
        color: '#6c757d',
        marginBottom: '24px',
    },
    retryButton: {
        padding: '12px 32px',
        fontSize: '16px',
        fontWeight: '600',
        color: 'white',
        backgroundColor: '#f97316',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
    grid: {
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        padding: '0 20px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    imageContainer: {
        width: '100%',
        height: '240px',
        overflow: 'hidden',
        backgroundColor: '#f8f9fa',
        flexShrink: 0,
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.3s',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '80px',
        backgroundColor: '#f8f9fa',
    },
    cardContent: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
    },
    categoryBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#f97316',
        backgroundColor: '#d4edda',
        borderRadius: '12px',
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        alignSelf: 'flex-start',
    },
    productName: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#1a1a1a',
        margin: '0 0 12px 0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        lineHeight: '1.4',
    },
    descriptionContainer: {
        minHeight: '60px',
        marginBottom: '16px',
        flexGrow: 1,
    },
    description: {
        fontSize: '14px',
        color: '#6c757d',
        lineHeight: '1.6',
        margin: 0,
    },
    footer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: 'auto',
    },
    priceSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#f97316',
    },
    available: {
        fontSize: '13px',
        color: '#f97316',
        fontWeight: '500',
    },
    unavailable: {
        fontSize: '13px',
        color: '#dc3545',
        fontWeight: '500',
    },
    addButton: {
        width: '100%',
        padding: '14px',
        fontSize: '16px',
        fontWeight: '600',
        color: 'white',
        backgroundColor: '#f97316',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
    addButtonDisabled: {
        backgroundColor: '#6c757d',
        cursor: 'not-allowed',
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '100px 20px',
    },
    emptyIcon: {
        fontSize: '72px',
        marginBottom: '24px',
    },
    emptyTitle: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '12px',
    },
    emptyText: {
        fontSize: '16px',
        color: '#6c757d',
    },
};

// Add spinner animation
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @media (hover: hover) {
      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.12);
      }
      
      .card:hover img {
        transform: scale(1.05);
      }

    }
  `;
    document.head.appendChild(styleSheet);
}

export default RecommendationsPage;