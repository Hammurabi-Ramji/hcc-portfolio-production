import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, X, CheckCircle, Scan } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function BarcodeScanner({ onScan, onClose, title, description }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "barcode-scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          setLastScanned(decodedText);
          onScan(decodedText);
          toast.success("Barcode scanned successfully!", {
            description: decodedText,
            icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          });
          
          // Auto-close scanner after successful scan
          setTimeout(() => {
            scanner.clear();
            setIsScanning(false);
          }, 1000);
        },
        (error) => {
          // Silently handle scanning errors (they occur frequently during scanning)
          console.debug("Scan error:", error);
        }
      );

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [isScanning, onScan]);

  const handleStartScan = () => {
    setIsScanning(true);
    setLastScanned(null);
  };

  const handleStopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-primary" />
                {title || "Barcode Scanner"}
              </CardTitle>
              <CardDescription>
                {description || "Scan barcodes or QR codes for inventory management"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Click the button below to activate your camera and start scanning
              </p>
              <Button onClick={handleStartScan} size="lg" className="min-w-[200px]">
                <Camera className="h-5 w-5 mr-2" />
                Start Scanning
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                id="barcode-scanner-container" 
                className="rounded-lg overflow-hidden border-2 border-primary"
              />
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-sm">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                  Scanner Active
                </Badge>
                <Button onClick={handleStopScan} variant="outline">
                  Stop Scanning
                </Button>
              </div>
            </div>
          )}

          {lastScanned && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Last Scanned</p>
                    <p className="text-xs text-green-700 font-mono">{lastScanned}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Scanning Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Hold the barcode 6-8 inches from the camera</li>
              <li>• Ensure good lighting for best results</li>
              <li>• Keep the barcode flat and steady</li>
              <li>• Works with both 1D barcodes and QR codes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
