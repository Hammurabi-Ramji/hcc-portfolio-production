import { useState, useRef, useEffect } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { employeePortalNavigation } from "@/lib/portal-navigation";
import { toast } from "sonner";
import { 
  Camera, 
  CheckCircle, 
  XCircle,
  Loader2,
  UserCheck,
  UserX,
  Calendar
} from "lucide-react";

export default function TimeClock() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast.error("Failed to access camera. Please check permissions.");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handlePunchIn = async () => {
    if (!capturedImage) {
      toast.error("Please capture a photo first");
      return;
    }
    
    setIsProcessing(true);
    // Simulate facial recognition processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Welcome! You've been clocked in successfully.", {
        description: new Date().toLocaleTimeString(),
        icon: <UserCheck className="h-5 w-5 text-green-600" />,
      });
      setCapturedImage(null);
    }, 2000);
  };

  const handlePunchOut = async () => {
    if (!capturedImage) {
      toast.error("Please capture a photo first");
      return;
    }
    
    setIsProcessing(true);
    // Simulate facial recognition processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Goodbye! You've been clocked out successfully.", {
        description: new Date().toLocaleTimeString(),
        icon: <UserX className="h-5 w-5 text-blue-600" />,
      });
      setCapturedImage(null);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <PortalLayout title="Time Clock" navigation={employeePortalNavigation}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Facial Recognition Time Clock
          </h1>
          <p className="text-muted-foreground mt-2">
            Use facial recognition to clock in and out
          </p>
        </div>

        {/* Current Time */}
        <Card className="bg-linear-to-r from-purple-50 to-white border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <p className="text-lg font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <p className="text-4xl font-bold text-primary">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Camera Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Facial Recognition Camera
            </CardTitle>
            <CardDescription>
              Position your face in the camera frame and capture a photo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-gray-900">
              {!isCameraActive && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Camera not active</p>
                    <p className="text-sm opacity-75">Click "Start Camera" to begin</p>
                  </div>
                </div>
              )}
              
              {isCameraActive && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <track kind="captions" label="Employee camera preview" />
                </video>
              )}

              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Controls */}
            <div className="flex gap-3">
              {!isCameraActive && !capturedImage && (
                <Button onClick={startCamera} className="flex-1" size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Start Camera
                </Button>
              )}

              {isCameraActive && (
                <>
                  <Button onClick={capturePhoto} className="flex-1" size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Capture Photo
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="flex-1" size="lg">
                    Cancel
                  </Button>
                </>
              )}

              {capturedImage && !isProcessing && (
                <>
                  <Button onClick={handlePunchIn} className="flex-1 bg-green-600 hover:bg-green-700" size="lg">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Punch In
                  </Button>
                  <Button onClick={handlePunchOut} className="flex-1 bg-blue-600 hover:bg-blue-700" size="lg">
                    <XCircle className="h-5 w-5 mr-2" />
                    Punch Out
                  </Button>
                  <Button onClick={() => { setCapturedImage(null); startCamera(); }} variant="outline" size="lg">
                    Retake
                  </Button>
                </>
              )}

              {isProcessing && (
                <Button disabled className="flex-1" size="lg">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-linear-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Start Camera" to activate your device camera</li>
              <li>Position your face in the center of the frame</li>
              <li>Click "Capture Photo" when ready</li>
              <li>Review the captured image</li>
              <li>Click "Punch In" to clock in or "Punch Out" to clock out</li>
              <li>The system will verify your identity using facial recognition</li>
              <li>You'll receive a confirmation message with the timestamp</li>
            </ol>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="bg-linear-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              🔒 Your facial data is processed securely and used only for time tracking purposes. 
              Images are not stored permanently and comply with all privacy regulations.
            </p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
