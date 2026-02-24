"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWhatsAppSocket } from "@/lib/socket";

export default function WhatsAppQR() {
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(false);
  const { status, qr, startWhatsApp, stopWhatsApp, resetWhatsApp } =
    useWhatsAppSocket();

  // Generate QR image when qr string changes
  useEffect(() => {
    if (qr) {
      QRCode.toDataURL(qr).then(setQrImage).catch(console.error);
    } else {
      setQrImage("");
    }
  }, [qr]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const result = await startWhatsApp();
      console.log(result);
    } catch (error) {
      console.error("Error starting WhatsApp:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const result = await stopWhatsApp();
      console.log(result);
    } catch (error) {
      console.error("Error stopping WhatsApp:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Reset koneksi WhatsApp? Semua data autentikasi akan dihapus dan Anda perlu scan QR code ulang.",
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await resetWhatsApp();
      console.log(result);
      setQrImage("");
    } catch (error) {
      console.error("Error resetting WhatsApp:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          WhatsApp Bot Status
          {status.connected ? (
            <Badge variant="default" className="bg-green-500">
              Terkoneksi
            </Badge>
          ) : (
            <Badge variant="secondary">Tidak Terkoneksi</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {status.connected && status.user
            ? `Terhubung sebagai: ${status.user.name || status.user.id}`
            : "Belum terhubung ke WhatsApp"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status.connected ? (
          <div className="space-y-4">
            <div className="p-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Success Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-green-800 font-semibold text-lg">
                  WhatsApp Terkoneksi
                </p>
              </div>
              <div className="ml-11 space-y-1">
                <p className="text-sm text-green-700">
                  <span className="font-medium">User ID:</span>{" "}
                  {status.user?.id}
                </p>
                {status.user?.name && (
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Nama:</span>{" "}
                    {status.user.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleStop}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? "Memutuskan..." : "Disconnect"}
              </Button>
              <Button
                onClick={handleReset}
                disabled={loading}
                variant="outline"
                className="flex-1 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              >
                {loading ? "Mereset..." : "Reset Koneksi"}
              </Button>
            </div>
          </div>
        ) : qrImage ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-3">📱 Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-6 px-4">
                Buka WhatsApp di ponsel Anda, pilih{" "}
                <strong>Menu → Perangkat Tertaut → Tautkan Perangkat</strong>
              </p>
              <div className="flex justify-center p-6 bg-linear-to-br from-green-50 to-blue-50 rounded-xl">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <Image
                    src={qrImage}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 object-contain"
                    width={256}
                    height={256}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                QR Code akan diperbarui otomatis setiap beberapa detik
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 bg-linear-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-500 rounded-full animate-pulse">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Loading Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-yellow-800 font-semibold">
                  Menghubungkan...
                </p>
              </div>
              <p className="text-sm text-yellow-700 ml-11">
                Pastikan WhatsApp service sudah berjalan di port 3001
              </p>
            </div>
            <Button onClick={handleStart} disabled={loading} className="w-full">
              {loading ? "Memulai..." : "Start WhatsApp Connection"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
