import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './ARAugmentor.css';

const { 
  FiCamera, FiGrid, FiSave, FiTrash2, FiEye, FiUpload,
  FiSmartphone, FiCheckCircle, FiAlertCircle
} = FiIcons;

const ARAugmentor = () => {
  const [isARActive, setIsARActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionResults, setDetectionResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const floorTypes = [
    { id: 'hardwood', name: 'Hardwood', color: '#8B4513', pattern: 'wood' },
    { id: 'tile', name: 'Tile', color: '#E6E6E6', pattern: 'grid' },
    { id: 'laminate', name: 'Laminate', color: '#D2B48C', pattern: 'wood' },
    { id: 'vinyl', name: 'Vinyl', color: '#696969', pattern: 'stone' },
    { id: 'carpet', name: 'Carpet', color: '#4B0082', pattern: 'fiber' }
  ];

  const handleStartAR = () => {
    setIsARActive(true);
    // In production, this would activate the device camera
    // and initialize AR tracking
  };

  const handleStopAR = () => {
    setIsARActive(false);
    setCapturedImage(null);
    setDetectionResults([]);
  };

  const handleCapture = () => {
    // Simulate capturing an image from AR view
    setCapturedImage('ar-capture-placeholder');
    analyzeFloor();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCapturedImage(URL.createObjectURL(file));
      analyzeFloor();
    }
  };

  const analyzeFloor = () => {
    setIsProcessing(true);
    
    // Simulate AI analysis of the floor
    setTimeout(() => {
      const mockResults = [
        {
          type: 'floor_detection',
          confidence: 94,
          details: 'Hardwood floor detected',
          recommendations: 'Suitable for refinishing or replacement'
        },
        {
          type: 'condition_assessment',
          confidence: 87,
          details: 'Moderate wear and scratches',
          recommendations: 'Recommend sanding and refinishing'
        },
        {
          type: 'measurement',
          confidence: 92,
          details: 'Room dimensions: 12.5 × 10.2 ft',
          recommendations: 'Total area: 127.5 sq ft'
        },
        {
          type: 'moisture',
          confidence: 76,
          details: 'Slightly elevated moisture',
          recommendations: 'Address humidity before installation'
        }
      ];
      setDetectionResults(mockResults);
      setIsProcessing(false);
    }, 2000);
  };

  const applyFloorPreview = (floorType) => {
    // In production, this would overlay the selected flooring
    // onto the captured image using AI segmentation
    alert(`${floorType.name} preview applied!`);
  };

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      analysis: detectionResults,
      recommendations: [
        'Sand and refinish existing hardwood',
        'Address moisture issues in corner',
        'Consider underlayment for sound reduction'
      ],
      estimatedCost: '$2,450 - $3,200',
      timeline: '3-5 days'
    };
    console.log('AR Analysis Report:', report);
    alert('Report generated! Check console for details.');
  };

  return (
    <motion.div
      className="ar-augmentor"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="ar-header">
        <div>
          <h2>AR Floor Visualizer</h2>
          <p>See flooring in your space before installation</p>
        </div>
        <div className="ar-status">
          {isARActive ? (
            <div className="status-indicator success">
              <SafeIcon icon={FiSmartphone} />
              AR Active
            </div>
          ) : (
            <div className="status-indicator info">
              <SafeIcon icon={FiAlertCircle} />
              AR Ready
            </div>
          )}
        </div>
      </div>

      <div className="ar-layout">
        {/* Main AR Viewport */}
        <div className="ar-viewport">
          {!isARActive && !capturedImage && (
            <div className="ar-placeholder">
              <SafeIcon icon={FiCamera} />
              <h3>Start AR Visualization</h3>
              <p>Point your camera at the floor to see different flooring options in real-time</p>
              <button className="ar-button primary" onClick={handleStartAR}>
                <SafeIcon icon={FiEye} />
                Launch AR Camera
              </button>
              <div className="or-divider">OR</div>
              <button 
                className="ar-button secondary"
                onClick={() => fileInputRef.current.click()}
              >
                <SafeIcon icon={FiUpload} />
                Upload Room Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {isARActive && !capturedImage && (
            <div className="ar-active-view">
              <div className="ar-overlay">
                <div className="ar-instructions">
                  Point camera at the floor area
                </div>
                <div className="ar-grid"></div>
                <div className="ar-corners">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
              </div>
              <div className="ar-controls">
                <button className="ar-button" onClick={handleCapture}>
                  <SafeIcon icon={FiCamera} />
                  Capture
                </button>
                <button className="ar-button danger" onClick={handleStopAR}>
                  Stop AR
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="analysis-view">
              <div className="captured-image">
                <img src={capturedImage} alt="Captured floor" />
                <div className="image-overlay">
                  <div className="detection-box"></div>
                </div>
              </div>
              {!isProcessing && detectionResults.length > 0 && (
                <div className="overlay-results">
                  {detectionResults.map((result, idx) => (
                    <div key={idx} className="result-badge">
                      <span className="confidence">{result.confidence}%</span>
                      <span className="label">{result.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="processing-overlay">
              <div className="processing-spinner"></div>
              <p>Analyzing floor with AI...</p>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="ar-controls-panel">
          <div className="panel-section">
            <h3>Flooring Options</h3>
            <div className="floor-grid">
              {floorTypes.map((floor) => (
                <motion.button
                  key={floor.id}
                  className="floor-option"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyFloorPreview(floor)}
                >
                  <div 
                    className="floor-preview"
                    style={{ backgroundColor: floor.color }}
                  />
                  <span>{floor.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3>AI Analysis</h3>
            <div className="analysis-results">
              {detectionResults.length === 0 ? (
                <p className="no-results">No analysis yet. Capture an image to begin.</p>
              ) : (
                <div className="results-list">
                  {detectionResults.map((result, idx) => (
                    <div key={idx} className="result-item">
                      <div className="result-header">
                        <span className="result-type">{result.type.replace('_', ' ')}</span>
                        <span 
                          className="confidence-score"
                          style={{ 
                            backgroundColor: result.confidence > 80 ? '#10b981' : 
                                           result.confidence > 60 ? '#f59e0b' : '#ef4444'
                          }}
                        >
                          {result.confidence}%
                        </span>
                      </div>
                      <p className="result-details">{result.details}</p>
                      <small className="result-rec">{result.recommendations}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel-section">
            <h3>Actions</h3>
            <div className="action-buttons">
              <button 
                className="action-btn primary"
                onClick={generateReport}
                disabled={detectionResults.length === 0}
              >
                <SafeIcon icon={FiSave} />
                Generate Report
              </button>
              <button 
                className="action-btn"
                onClick={() => setDetectionResults([])}
                disabled={detectionResults.length === 0}
              >
                <SafeIcon icon={FiTrash2} />
                Clear Results
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => {
                  handleStopAR();
                  setCapturedImage(null);
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ARAugmentor;