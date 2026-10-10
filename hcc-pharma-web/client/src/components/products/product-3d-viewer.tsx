import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";

interface Product3DViewerProps {
  productId: number;
  productName: string;
}

const Product3DViewer = ({ productId, productName }: Product3DViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewAngle, setViewAngle] = useState(0);

  // Simulating 3D model loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      renderScene();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Render a basic 3D representation using canvas
  const renderScene = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size based on container
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = Math.min(canvas.width, canvas.height) * 0.4 * zoom;
    
    // Draw product representation based on product type
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation + viewAngle) * Math.PI / 180);
    
    // Determine what to draw based on productId
    switch(productId) {
      case 1: // Ammoral
        drawBottle(ctx, size, '#FFA500');
        break;
      case 2: // Burn Relief
        drawBottle(ctx, size, '#87CEEB');
        break;
      case 3: // Caprotec
        drawBottle(ctx, size, '#90EE90');
        break;
      case 4: // Calcium Gluconate
        drawBottle(ctx, size, '#FFFFE0');
        break;
      case 5: // Amber Bottle
      case 6: // Clear Bottle
      case 7: // Blue Bottle
        drawSupplyBottle(ctx, size, getBottleColor(productId));
        break;
      default:
        drawGenericProduct(ctx, size);
    }
    
    ctx.restore();
  };
  
  const getBottleColor = (id: number) => {
    switch(id) {
      case 5: return '#D2691E'; // Amber
      case 6: return '#E0FFFF'; // Clear
      case 7: return '#1E90FF'; // Blue
      default: return '#FFFFFF';
    }
  };
  
  const drawBottle = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
    // Draw bottle neck
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(-size * 0.15, -size * 0.9, size * 0.3, size * 0.3);
    ctx.fill();
    
    // Draw bottle cap
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.rect(-size * 0.18, -size * 1.0, size * 0.36, size * 0.1);
    ctx.fill();
    
    // Draw bottle body with perspective
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.6);
    ctx.lineTo(size * 0.3, -size * 0.6);
    ctx.lineTo(size * 0.35, size * 0.6);
    ctx.lineTo(-size * 0.35, size * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Add label
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.rect(-size * 0.25, -size * 0.4, size * 0.5, size * 0.6);
    ctx.fill();
    
    // Add label text
    ctx.fillStyle = '#000000';
    ctx.font = `${size * 0.1}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(productName, 0, -size * 0.1);
    
    // Add shading
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.6);
    ctx.lineTo(size * 0.3, -size * 0.6);
    ctx.lineTo(size * 0.35, size * 0.6);
    ctx.lineTo(-size * 0.35, size * 0.6);
    ctx.closePath();
    ctx.stroke();
  };
  
  const drawSupplyBottle = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
    // Draw bottle body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw bottle neck
    ctx.beginPath();
    ctx.rect(-size * 0.15, -size * 0.8, size * 0.3, size * 0.2);
    ctx.fill();
    
    // Draw bottle mouth
    ctx.beginPath();
    ctx.arc(0, -size * 0.8, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Add shading
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.3);
    ctx.quadraticCurveTo(-size * 0.1, 0, -size * 0.15, size * 0.3);
    ctx.stroke();
  };
  
  const drawGenericProduct = (ctx: CanvasRenderingContext2D, size: number) => {
    // Draw a simple box
    ctx.fillStyle = '#DDDDDD';
    ctx.beginPath();
    ctx.rect(-size * 0.4, -size * 0.3, size * 0.8, size * 0.6);
    ctx.fill();
    
    // Add shadow
    ctx.fillStyle = '#BBBBBB';
    ctx.beginPath();
    ctx.moveTo(size * 0.4, -size * 0.3);
    ctx.lineTo(size * 0.5, -size * 0.2);
    ctx.lineTo(size * 0.5, size * 0.7);
    ctx.lineTo(size * 0.4, size * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Top face
    ctx.fillStyle = '#EEEEEE';
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, -size * 0.3);
    ctx.lineTo(size * 0.4, -size * 0.3);
    ctx.lineTo(size * 0.5, -size * 0.2);
    ctx.lineTo(-size * 0.3, -size * 0.2);
    ctx.closePath();
    ctx.fill();
  };

  // Handle rotation via animation
  useEffect(() => {
    const animate = () => {
      setRotation(prev => (prev + 0.2) % 360);
    };
    
    const animationId = setInterval(animate, 50);
    return () => clearInterval(animationId);
  }, []);
  
  // Re-render when properties change
  useEffect(() => {
    if (!loading) {
      renderScene();
    }
  }, [rotation, zoom, viewAngle, fullscreen, loading]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!loading) {
        renderScene();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loading]);
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  // Adjust zoom level
  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };
  
  // Change view angle
  const changeViewAngle = (delta: number) => {
    setViewAngle(prev => prev + delta);
  };
  
  // Reset view
  const resetView = () => {
    setZoom(1);
    setViewAngle(0);
  };

  return (
    <Card 
      className={`relative overflow-hidden border transition-all duration-300 ${
        fullscreen ? 
        'fixed inset-0 z-50 rounded-none' : 
        'h-[300px] w-full rounded-md'
      }`}
      ref={containerRef}
    >
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A5F7A]" />
          <span className="ml-2 text-lg">Loading 3D model...</span>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            className="h-full w-full"
          />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={resetView}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => adjustZoom(-0.1)}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => adjustZoom(0.1)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => changeViewAngle(-45)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => changeViewAngle(45)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={toggleFullscreen}
            >
              {fullscreen ? 
                <Minimize2 className="h-4 w-4" /> : 
                <Maximize2 className="h-4 w-4" />
              }
            </Button>
          </div>
          
          <div className="absolute left-4 top-4 bg-black/50 px-3 py-1 text-sm text-white rounded-md">
            Interactive 3D View
          </div>
        </>
      )}
    </Card>
  );
};

export default Product3DViewer;