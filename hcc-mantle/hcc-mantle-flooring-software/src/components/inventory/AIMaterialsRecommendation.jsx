import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './AIMaterialsRecommendation.css';

const { FiBrain, FiTrendingUp, FiPackage, FiDollarSign, FiAlertTriangle, FiCheckCircle, FiShoppingCart } = FiIcons;

const AIMaterialsRecommendation = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockRecommendations = [
      {
        id: 'REC-001',
        type: 'cost-optimization',
        material: 'Premium Oak Hardwood Planks',
        currentSupplier: 'Forest Premium Woods',
        suggestedSupplier: 'Wholesale Flooring Direct',
        currentPrice: 8.50,
        suggestedPrice: 7.25,
        savings: 14.7,
        confidence: 94,
        reason: 'Alternative supplier offers same quality at 14.7% lower cost based on bulk ordering',
        action: 'Request Quote'
      },
      {
        id: 'REC-002',
        type: 'stock-alert',
        material: 'Luxury Vinyl Plank - Grey Oak',
        currentStock: 0,
        minThreshold: 100,
        predictedRunout: 'Already out of stock',
        confidence: 98,
        reason: 'Based on current project pipeline, you need 350 sq ft immediately',
        action: 'Reorder Now'
      },
      {
        id: 'REC-003',
        type: 'bulk-discount',
        material: 'Ceramic Subway Tiles 3x6',
        currentOrder: 500,
        suggestedOrder: 1000,
        discount: 18,
        confidence: 89,
        reason: 'Doubling order quantity qualifies for 18% bulk discount, saving $562.50',
        action: 'Update Order'
      },
      {
        id: 'REC-004',
        type: 'substitute',
        material: 'Adhesive - Multi-Surface',
        currentProduct: 'ProBond Premium',
        suggestedProduct: 'EcoBond Green',
        priceDifference: -12,
        confidence: 87,
        reason: 'Eco-friendly alternative with same performance, 12% cost savings',
        action: 'View Details'
      }
    ];
    setRecommendations(mockRecommendations);
    setLoading(false);
  }, []);

  const getTypeColor = (type) => {
    switch (type) {
      case 'cost-optimization': return 'var(--success)';
      case 'stock-alert': return 'var(--error)';
      case 'bulk-discount': return 'var(--accent-primary)';
      case 'substitute': return 'var(--warning)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cost-optimization': return FiTrendingUp;
      case 'stock-alert': return FiAlertTriangle;
      case 'bulk-discount': return FiDollarSign;
      case 'substitute': return FiPackage;
      default: return FiBrain;
    }
  };

  return (
    <motion.div className="ai-materials-recommendation fluent-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="recommendation-header">
        <div className="header-left">
          <div className="ai-badge">
            <SafeIcon icon={FiBrain} />
            <span>Venice.AI</span>
          </div>
          <div>
            <h2>AI Material Recommendations</h2>
            <p>Intelligent suggestions to optimize costs and inventory</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{recommendations.length}</span>
            <span className="stat-label">Active Recommendations</span>
          </div>
          <div className="stat">
            <span className="stat-value">$1,247</span>
            <span className="stat-label">Potential Savings</span>
          </div>
        </div>
      </div>

      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <motion.div key={rec.id} className="recommendation-item" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
            <div className="rec-icon" style={{ backgroundColor: `${getTypeColor(rec.type)}15` }}>
              <SafeIcon icon={getTypeIcon(rec.type)} style={{ color: getTypeColor(rec.type) }} />
            </div>
            <div className="rec-content">
              <div className="rec-header">
                <h3 className="rec-title">{rec.material}</h3>
                <span className="rec-type" style={{ backgroundColor: `${getTypeColor(rec.type)}15`, color: getTypeColor(rec.type) }}>
                  {rec.type.replace('-', ' ')}
                </span>
              </div>
              <p className="rec-reason">{rec.reason}</p>
              {rec.type === 'cost-optimization' && (
                <div className="rec-details">
                  <div className="detail-item">
                    <span className="label">Current Price:</span>
                    <span className="value">${rec.currentPrice}/sq ft</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Suggested Price:</span>
                    <span className="value savings">${rec.suggestedPrice}/sq ft</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Savings:</span>
                    <span className="value savings">{rec.savings}%</span>
                  </div>
                </div>
              )}
              {rec.type === 'stock-alert' && (
                <div className="rec-details">
                  <div className="detail-item">
                    <span className="label">Current Stock:</span>
                    <span className="value alert">{rec.currentStock} sq ft</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Minimum Required:</span>
                    <span className="value">{rec.minThreshold} sq ft</span>
                  </div>
                </div>
              )}
              <div className="rec-confidence">
                <span>AI Confidence:</span>
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${rec.confidence}%` }} />
                </div>
                <span className="confidence-value">{rec.confidence}%</span>
              </div>
            </div>
            <div className="rec-actions">
              <button className="action-btn primary">
                <SafeIcon icon={FiShoppingCart} /> {rec.action}
              </button>
              <button className="action-btn secondary">
                <SafeIcon icon={FiCheckCircle} /> Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AIMaterialsRecommendation;