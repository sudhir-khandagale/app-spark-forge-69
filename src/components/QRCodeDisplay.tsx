import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface QRCodeDisplayProps {
  qrCode: string;
  productName?: string;
  storeName?: string;
  expiresAt?: string;
}

export const QRCodeDisplay = ({ qrCode, productName, storeName, expiresAt }: QRCodeDisplayProps) => {
  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-code-${qrCode.slice(-8)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast({
        title: "QR Code Downloaded",
        description: "Saved to your device"
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Reservation QR Code",
          text: `Show this QR code at ${storeName} to complete your purchase`,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      toast({
        title: "Share not available",
        description: "Download the QR code instead"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Your QR Code</CardTitle>
        {productName && (
          <p className="text-sm text-muted-foreground text-center">
            {productName}
          </p>
        )}
        {storeName && (
          <p className="text-sm text-muted-foreground text-center">
            at {storeName}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG
            id="qr-code-svg"
            value={qrCode}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>
        
        {expiresAt && (
          <p className="text-xs text-muted-foreground text-center">
            Expires: {new Date(expiresAt).toLocaleString()}
          </p>
        )}

        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Show this QR code to the vendor to complete your purchase
        </p>
      </CardContent>
    </Card>
  );
};
