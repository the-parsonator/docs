"use client";

import { useEffect, useRef } from "react";

type Props = {
  onScan: (barcode: string) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onScan, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);

  useEffect(() => {
    let stopped = false;

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (stopped || !containerRef.current) return;

      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
          },
          () => {}
        );
      } catch {
        onClose();
      }
    }

    start();

    return () => {
      stopped = true;
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) s.stop().catch(() => {});
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-end p-4">
        <button
          onClick={onClose}
          className="text-white min-w-[48px] min-h-[48px] text-2xl"
        >
          ×
        </button>
      </div>
      <div id="barcode-reader" ref={containerRef} className="flex-1" />
    </div>
  );
}
