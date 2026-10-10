import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './InventoryMaterials.css';

const { 
  FiPlus, FiSearch, FiFilter, FiPackage, FiTrendingDown,
  FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiBarChart3,
  FiShoppingCart, FiEdit3, FiMoreVertical, FiDownload
} = FiIcons;

const InventoryMaterials = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const materials = [
    {
      id: 'MAT-001',
      name: 'Premium Oak Hardwood Planks',
      category: 'Hardwood',
      sku: 'OAK-PREM-001',
      currentStock: 45,
      minThreshold: 50,
      maxStock: 200,
      unit: 'sq ft',
      unitCost: 8.50,
      totalValue: 382.50,
      supplier: 'Forest Premium Woods',
      lastOrdered: '2024-01-10',
      status: 'low-stock',
      location: 'Warehouse A-12'
    },
    {
      id: 'MAT-002',
      name: 'Ceramic Subway Tiles 3x6',
      category: 'Tile',
      sku: 'CER-SUB-3X6',
      currentStock: 2400,
      minThreshold: 500,
      maxStock: 3000,
      unit: 'pieces',
      unitCost: 2.25,
      totalValue: 5400,
      supplier: 'Metro Tile Supply',
      lastOrdered: '2024-01-08',
      status: 'in-stock',
      location: 'Warehouse B-05'
    },
    {
      id: 'MAT-003',
      name: 'Luxury Vinyl Plank - Grey Oak',
      category: 'Vinyl',
      sku: 'LVP-GREY-001',
      currentStock: 0,
      minThreshold: 100,
      maxStock: 500,
      unit: 'sq ft',
      unitCost: 4.75,
      totalValue: 0,
      supplier: 'FloorTech Solutions',
      lastOrdered: '2024-01-05',
      status: 'out-of-stock',
      location: 'Warehouse C-08'
    },
    {
      id: 'MAT-004',
      name: 'Laminate Flooring - Walnut',
      category: 'Laminate',
      sku: 'LAM-WAL-001',
      currentStock: 850,
      minThreshold: 200,
      maxStock: 1000,
      unit: 'sq ft',
      unitCost: 3.25,
      totalValue: 2762.50,
      supplier: 'Budget Floors Inc',
      lastOrdered: '2024-01-12',
      status: 'in-stock',
      location: 'Warehouse A-08'
    },
    {
      id: 'MAT-005',
      name: 'Carpet Padding - Premium',
      category: 'Carpet',
      sku: 'PAD-PREM-001',
      currentStock: 180,
      minThreshold: 150,
      maxStock: 400,
      unit: 'sq yd',
      unitCost: 1.85,
      totalValue: 333,
      supplier: 'Comfort Underlay Co',
      lastOrdered: '2024-01-09',
      status: 'in-stock',
      location: 'Warehouse D-03'
    },
    {
      id: 'MAT-006',
      name: 'Adhesive - Multi-Surface',
      category: 'Supplies',
      sku: 'ADH-MULTI-001',
      currentStock: 12,
      minThreshold: 25,
      maxStock: 100,
      unit: 'gallons',
      unitCost: 28.50,
      totalValue: 342,
      supplier: 'Pro Install Supply',
      lastOrdered: '2024-01-07',
      status: 'low-stock',
      location: 'Warehouse E-01'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock': return 'var(--success)';
      case 'low-stock': return 'var(--warning)';
      case 'out-of-stock': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in-stock': return FiCheckCircle;
      case 'low-stock': return FiAlertTriangle;
      case 'out-of-stock': return FiTrendingDown;
      default: return FiPackage;
    }
  };

  const getStockPercentage = (current, max) => {
    return Math.round((current / max) * 100);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || material.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['all', ...new Set(materials.map(m => m.category))];
  const totalValue = materials.reduce((sum, m) => sum + m.totalValue, 0);
  const lowStockItems = materials.filter(m => m.status === 'low-stock' || m.status === 'out-of-stock').length;

  return (
    <motion.div
      className="inventory-materials"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory & Materials</h1>
          <p className="page-subtitle">Manage your flooring materials and supplies inventory</p>
        </div>
        <div className="header-actions">
          <button className="fluent-button secondary">
            <SafeIcon icon={FiDownload} />
            Export
          </button>
          <button className="fluent-button">
            <SafeIcon icon={FiPlus} />
            Add Material
          </button>
        </div>
      </div>

      {/* Inventory Overview */}
      <motion.div 
        className="inventory-overview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="overview-card">
          <div className="overview-icon total">
            <SafeIcon icon={FiPackage} />
          </div>
          <div className="overview-content">
            <div className="overview-value">{materials.length}</div>
            <div className="overview-label">Total Items</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon value">
            <SafeIcon icon={FiBarChart3} />
          </div>
          <div className="overview-content">
            <div className="overview-value">${totalValue.toLocaleString()}</div>
            <div className="overview-label">Total Value</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon warning">
            <SafeIcon icon={FiAlertTriangle} />
          </div>
          <div className="overview-content">
            <div className="overview-value">{lowStockItems}</div>
            <div className="overview-label">Low Stock Alerts</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon orders">
            <SafeIcon icon={FiShoppingCart} />
          </div>
          <div className="overview-content">
            <div className="overview-value">3</div>
            <div className="overview-label">Pending Orders</div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div 
        className="inventory-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="search-section">
          <div className="search-input-container">
            <SafeIcon icon={FiSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search materials or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="fluent-input search-input"
            />
          </div>
          
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="fluent-input category-filter"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="fluent-input status-filter"
          >
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          
          <button className="fluent-button secondary">
            <SafeIcon icon={FiFilter} />
            Advanced Filters
          </button>
        </div>
      </motion.div>

      {/* Materials Grid */}
      <motion.div 
        className="materials-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {filteredMaterials.map((material, index) => (
          <motion.div
            key={material.id}
            className="material-card fluent-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -4 }}
          >
            <div className="material-header">
              <div className="material-category">{material.category}</div>
              <div className="material-actions">
                <button className="action-btn">
                  <SafeIcon icon={FiEdit3} />
                </button>
                <button className="action-btn">
                  <SafeIcon icon={FiMoreVertical} />
                </button>
              </div>
            </div>

            <div className="material-info">
              <h3 className="material-name">{material.name}</h3>
              <div className="material-sku">SKU: {material.sku}</div>
              <div className="material-supplier">
                <span>Supplier: {material.supplier}</span>
              </div>
            </div>

            <div className="stock-info">
              <div className="stock-header">
                <span>Stock Level</span>
                <span className="stock-percentage">
                  {getStockPercentage(material.currentStock, material.maxStock)}%
                </span>
              </div>
              <div className="stock-bar">
                <div 
                  className="stock-fill"
                  style={{ 
                    width: `${getStockPercentage(material.currentStock, material.maxStock)}%`,
                    backgroundColor: getStatusColor(material.status)
                  }}
                />
              </div>
              <div className="stock-details">
                <span>{material.currentStock} {material.unit}</span>
                <span>Min: {material.minThreshold}</span>
              </div>
            </div>

            <div className="material-value">
              <div className="value-item">
                <span className="value-label">Unit Cost:</span>
                <span className="value-amount">${material.unitCost}</span>
              </div>
              <div className="value-item">
                <span className="value-label">Total Value:</span>
                <span className="value-amount">${material.totalValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="material-footer">
              <div 
                className="status-badge"
                style={{ 
                  backgroundColor: `${getStatusColor(material.status)}15`, 
                  color: getStatusColor(material.status) 
                }}
              >
                <SafeIcon icon={getStatusIcon(material.status)} />
                <span>{material.status.replace('-', ' ')}</span>
              </div>
              
              <div className="material-location">
                <span>📍 {material.location}</span>
              </div>
            </div>

            {(material.status === 'low-stock' || material.status === 'out-of-stock') && (
              <div className="reorder-section">
                <button className="reorder-btn">
                  <SafeIcon icon={FiShoppingCart} />
                  Reorder Now
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* AI Insights for Inventory */}
      <motion.div 
        className="inventory-insights fluent-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="insights-header">
          <h3>AI Inventory Insights</h3>
          <div className="ai-badge">
            <SafeIcon icon={FiTrendingUp} />
            Venice.AI
          </div>
        </div>
        
        <div className="insights-content">
          <div className="insight-item">
            <div className="insight-icon warning">
              <SafeIcon icon={FiAlertTriangle} />
            </div>
            <div className="insight-text">
              <h4>Reorder Alert</h4>
              <p>Premium Oak Hardwood will run out in 8 days based on current project demand. Recommend ordering 150 sq ft.</p>
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-icon success">
              <SafeIcon icon={FiTrendingUp} />
            </div>
            <div className="insight-text">
              <h4>Cost Optimization</h4>
              <p>Switch to bulk ordering for Ceramic Tiles could save 12% on material costs for next quarter.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InventoryMaterials;