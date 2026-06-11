import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './NewMaterialsAnnouncement.css';

const { FiStar, FiPackage, FiTrendingUp, FiTag, FiX, FiPlus, FiGift, FiCheckCircle } = FiIcons;

const NewMaterialsAnnouncement = ({ materials, onDismiss }) => {
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  const toggleMaterial = (materialId) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const addToInventory = () => {
    // Simulate adding selected materials to inventory
    console.log('Adding to inventory:', selectedMaterials);
    onDismiss();
  };

  return (
    <motion.div 
      className="materials-announcement"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="announcement-header">
        <div className="announcement-badge">
          <SafeIcon icon={FiGift} />
          <span>New Arrivals</span>
        </div>
        <button className="close-btn" onClick={onDismiss}>
          <SafeIcon icon={FiX} />
        </button>
      </div>

      <h2>Exciting New Materials Available!</h2>
      <p>We've added premium flooring materials to our catalog. Check them out:</p>

      <div className="materials-grid">
        {materials.map((material, index) => (
          <motion.div 
            key={material.id} 
            className="material-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="material-image">
              <SafeIcon icon={FiPackage} />
            </div>
            <div className="material-info">
              <h3>{material.name}</h3>
              <p>{material.description}</p>
              <div className="material-price">${material.price}/sq ft</div>
              <div className="material-features">
                {material.features.map((feature, i) => (
                  <span key={i} className="feature-tag">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            <button 
              className={`select-btn ${selectedMaterials.includes(material.id) ? 'selected' : ''}`}
              onClick={() => toggleMaterial(material.id)}
            >
              <SafeIcon icon={selectedMaterials.includes(material.id) ? FiCheckCircle : FiPlus} />
              {selectedMaterials.includes(material.id) ? 'Selected' : 'Select'}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="announcement-actions">
        <button className="fluent-button secondary" onClick={onDismiss}>
          Maybe Later
        </button>
        <button 
          className="fluent-button primary"
          onClick={addToInventory}
          disabled={selectedMaterials.length === 0}
        >
          <SafeIcon icon={FiPackage} />
          Add {selectedMaterials.length} to Inventory
        </button>
      </div>
    </motion.div>
  );
};

export default NewMaterialsAnnouncement;