import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './AdvancedInventoryAlerts.css';

const { FiAlertTriangle, FiTrendingDown, FiPackage, FiClock, FiBell, FiSettings, FiX, FiCheckCircle } = FiIcons;

const AdvancedInventoryAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [alertSettings, setAlertSettings] = useState({
    lowStockThreshold: 20,
    expiryWarningDays: 30,
    priceChangeAlert: true,
    supplierDelayAlert: true
  });

  useEffect(() => {
    // Simulate AI-generated alerts
    const mockAlerts = [
      {
        id: 'ALT-001',
        type: 'low-stock',
        severity: 'high',
        material: 'Premium Oak Hardwood Planks',
        currentStock: 45,
        minThreshold: 50,
        predictedRunout: '8 days',
        recommendation: 'Order 150 sq ft immediately'
      },
      {
        id: 'ALT-002',
        type: 'price-change',
        severity: 'medium',
        material: 'Ceramic Subway Tiles',
        oldPrice: 2.25,
        newPrice: 2.50,
        change: '+11.1%',
        supplier: 'Metro Tile Supply'
      },
      {
        id: 'ALT-003',
        type: 'supplier-delay',
        severity: 'medium',
        material: 'Luxury Vinyl Plank',
        expectedDate: '2024-01-25',
        actualDate: '2024-01-30',
        delay: '5 days',
        supplier: 'FloorTech Solutions'
      }
    ];
    setAlerts(mockAlerts);
  }, []);

  const getAlertIcon = (type) => {
    const icons = {
      'low-stock': FiAlertTriangle,
      'price-change': FiTrendingDown,
      'supplier-delay': FiClock,
      'expiry': FiPackage
    };
    return icons[type] || FiBell;
  };

  const getAlertColor = (severity) => {
    const colors = {
      high: 'var(--error)',
      medium: 'var(--warning)',
      low: 'var(--success)'
    };
    return colors[severity] || 'var(--text-tertiary)';
  };

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <motion.div 
      className="inventory-alerts"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="alerts-header">
        <div>
          <h2>AI Inventory Alerts</h2>
          <p>Smart notifications for inventory management</p>
        </div>
        <button className="settings-btn">
          <SafeIcon icon={FiSettings} />
        </button>
      </div>

      <div className="alerts-list">
        {alerts.map((alert, index) => (
          <motion.div 
            key={alert.id} 
            className="alert-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{ borderLeftColor: getAlertColor(alert.severity) }}
          >
            <div className="alert-icon">
              <SafeIcon icon={getAlertIcon(alert.type)} style={{ color: getAlertColor(alert.severity) }} />
            </div>
            <div className="alert-content">
              <div className="alert-header">
                <h4>{alert.material}</h4>
                <span className="alert-type" style={{ backgroundColor: `${getAlertColor(alert.severity)}15`, color: getAlertColor(alert.severity) }}>
                  {alert.type.replace('-', ' ')}
                </span>
              </div>
              <div className="alert-details">
                {alert.type === 'low-stock' && (
                  <>
                    <p>Current: {alert.currentStock} units (Min: {alert.minThreshold})</p>
                    <p>Runout prediction: {alert.predictedRunout}</p>
                    <p className="recommendation">💡 {alert.recommendation}</p>
                  </>
                )}
                {alert.type === 'price-change' && (
                  <>
                    <p>Price change: {alert.change} (${alert.oldPrice} → ${alert.newPrice})</p>
                    <p>Supplier: {alert.supplier}</p>
                  </>
                )}
                {alert.type === 'supplier-delay' && (
                  <>
                    <p>Expected: {alert.expectedDate}</p>
                    <p>Actual: {alert.actualDate} ({alert.delay} delay)</p>
                  </>
                )}
              </div>
            </div>
            <button className="dismiss-btn" onClick={() => dismissAlert(alert.id)}>
              <SafeIcon icon={FiX} />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="alerts-insights">
        <h3>AI Recommendations</h3>
        <div className="insight-item">
          <SafeIcon icon={FiCheckCircle} />
          <span>Consider bulk ordering Oak Hardwood to save 12%</span>
        </div>
        <div className="insight-item">
          <SafeIcon icon={FiCheckCircle} />
          <span>Alternative supplier available for Vinyl Plank</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AdvancedInventoryAlerts;