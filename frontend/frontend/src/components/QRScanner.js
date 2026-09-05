import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    }, false);
    
    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScanSuccess(decodedText);
      },
      (err) => onScanError?.(err)
    );
    scannerRef.current = scanner;

    return () => scannerRef.current?.clear();
  }, [onScanSuccess, onScanError]);

  return <div id="qr-reader" className="w-full max-w-md mx-auto" />;
};

export default QRScanner;