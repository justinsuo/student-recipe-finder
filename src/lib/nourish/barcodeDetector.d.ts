// Minimal type declaration for the BarcodeDetector Web API.
// Not yet in TypeScript's built-in lib; this declaration covers our usage.

interface BarcodeDetectorOptions {
  formats?: string[];
}

interface DetectedBarcode {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  detect(source: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<DetectedBarcode[]>;
  static getSupportedFormats(): Promise<string[]>;
}
