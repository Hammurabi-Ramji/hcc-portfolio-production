import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './RoomAnalyzer.css';

const { FiBox, FiRuler, FiGrid, FiEye, FiSave, FiUpload, FiRotateCw, FiCheckCircle } = FiIcons;

const RoomAnalyzer = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const [dimensions, setDimensions] = useState({ length: 12, width: 10, height: 8 });
  const [floorType, setFloorType] = useState('hardwood');
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurements, setMeasurements] = useState([]);

  useEffect(() => {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 6, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Create room
    createRoom(scene, dimensions);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      // Clear existing room
      const objectsToRemove = [];
      sceneRef.current.traverse((child) => {
        if (child.userData.isRoomElement) {
          objectsToRemove.push(child);
        }
      });
      objectsToRemove.forEach(obj => sceneRef.current.remove(obj));

      // Recreate room with new dimensions
      createRoom(sceneRef.current, dimensions);
    }
  }, [dimensions]);

  const createRoom = (scene, dims) => {
    const { length, width, height } = dims;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(length, width);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      color: getFloorColor(floorType),
      transparent: true,
      opacity: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.isRoomElement = true;
    floor.userData.type = 'floor';
    scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.3 
    });

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(length, height),
      wallMaterial
    );
    backWall.position.set(0, height / 2, -width / 2);
    backWall.userData.isRoomElement = true;
    scene.add(backWall);

    // Side walls
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-length / 2, height / 2, 0);
    leftWall.userData.isRoomElement = true;
    scene.add(leftWall);

    // Grid helper
    const gridHelper = new THREE.GridHelper(Math.max(length, width), 20, 0x888888, 0x888888);
    gridHelper.position.y = 0.01;
    gridHelper.userData.isRoomElement = true;
    scene.add(gridHelper);
  };

  const getFloorColor = (type) => {
    const colors = {
      hardwood: 0x8B4513,
      tile: 0xE6E6E6,
      laminate: 0xD2B48C,
      vinyl: 0x696969,
      carpet: 0x4B0082
    };
    return colors[type] || 0xcccccc;
  };

  const handleMeasurement = (event) => {
    if (!isMeasuring) return;

    const rect = mountRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Convert to world coordinates (simplified)
    const worldX = x * dimensions.length / 2;
    const worldZ = y * dimensions.width / 2;

    setMeasurements(prev => [...prev, { x: worldX, z: worldZ }]);
  };

  const calculateArea = () => {
    return (dimensions.length * dimensions.width).toFixed(2);
  };

  const calculateMaterials = () => {
    const area = dimensions.length * dimensions.width;
    const wasteFactor = 1.1; // 10% waste
    return (area * wasteFactor).toFixed(2);
  };

  return (
    <motion.div
      className="room-analyzer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="analyzer-header">
        <div>
          <h2>3D Room Visualizer</h2>
          <p>Preview flooring installations in real-time 3D</p>
        </div>
        <div className="analyzer-controls">
          <button 
            className={`control-btn ${isMeasuring ? 'active' : ''}`}
            onClick={() => setIsMeasuring(!isMeasuring)}
          >
            <SafeIcon icon={FiRuler} />
            Measure
          </button>
          <button className="control-btn">
            <SafeIcon icon={FiRotateCw} />
            Reset View
          </button>
          <button className="control-btn">
            <SafeIcon icon={FiSave} />
            Save Scene
          </button>
        </div>
      </div>

      <div className="analyzer-layout">
        {/* 3D Viewport */}
        <div className="viewport-container">
          <div 
            ref={mountRef} 
            className="three-container"
            onClick={handleMeasurement}
          />
          <div className="viewport-overlay">
            <div className="dimension-display">
              {dimensions.length} × {dimensions.width} ft
            </div>
            <div className="measurement-mode">
              {isMeasuring ? 'Click to measure' : '3D View Mode'}
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="controls-panel">
          <div className="panel-section">
            <h3>Room Dimensions</h3>
            <div className="dimension-inputs">
              <div className="input-group">
                <label>Length (ft)</label>
                <input
                  type="number"
                  value={dimensions.length}
                  onChange={(e) => setDimensions({...dimensions, length: parseFloat(e.target.value)})}
                  className="dimension-input"
                />
              </div>
              <div className="input-group">
                <label>Width (ft)</label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => setDimensions({...dimensions, width: parseFloat(e.target.value)})}
                  className="dimension-input"
                />
              </div>
              <div className="input-group">
                <label>Height (ft)</label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => setDimensions({...dimensions, height: parseFloat(e.target.value)})}
                  className="dimension-input"
                />
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3>Flooring Material</h3>
            <select 
              value={floorType} 
              onChange={(e) => setFloorType(e.target.value)}
              className="material-select"
            >
              <option value="hardwood">Hardwood</option>
              <option value="tile">Tile</option>
              <option value="laminate">Laminate</option>
              <option value="vinyl">Vinyl</option>
              <option value="carpet">Carpet</option>
            </select>
          </div>

          <div className="panel-section">
            <h3>Measurements</h3>
            <div className="measurement-list">
              <div className="measurement-item">
                <span>Area:</span>
                <strong>{calculateArea()} sq ft</strong>
              </div>
              <div className="measurement-item">
                <span>Materials Needed:</span>
                <strong>{calculateMaterials()} sq ft</strong>
              </div>
              <div className="measurement-item">
                <span>Est. Cost:</span>
                <strong>${(calculateArea() * 8.5).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn primary">
                <SafeIcon icon={FiUpload} />
                Upload Floor Plan
              </button>
              <button className="action-btn">
                <SafeIcon icon={FiEye} />
                AR Preview
              </button>
              <button className="action-btn success">
                <SafeIcon icon={FiCheckCircle} />
                Generate Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {measurements.length > 0 && (
        <div className="measurements-hud">
          <h4>Measurements Taken: {measurements.length}</h4>
          <button onClick={() => setMeasurements([])} className="clear-btn">
            Clear All
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default RoomAnalyzer;