"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ApiUrl } from "@/lib/prisma/client";
import { useWhatsAppSocket } from "@/lib/socket";
import WhatsAppOffline from "./whatsapp_offline";
import WhatsAppQR from "./whatsapp_qr";
import WhatsappStatusInfo from "./whatsapp_status";

interface WhatsAppComponentProps {
  apiUrls: ApiUrl[];
}
export default function WhatsAppComponent({ apiUrls }: WhatsAppComponentProps) {
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(false);
  const { status, qr, startWhatsApp, stopWhatsApp, resetWhatsApp } =
    useWhatsAppSocket();

  // Generate QR image when qr string changes
  useEffect(() => {
    if (qr) {
      QRCode.toDataURL(qr, { width: 256 }).then(setQrImage).catch(console.error);
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
          <WhatsappStatusInfo
            status={status}
            handleStop={handleStop}
            handleReset={handleReset}
            loading={loading}
          />
        ) : qrImage ? (
          <WhatsAppQR qrImage={qrImage} />
        ) : (
          <WhatsAppOffline handleStart={handleStart} loading={loading} apiUrls={apiUrls} />
        )}
      </CardContent>
    </Card>
  );
}
