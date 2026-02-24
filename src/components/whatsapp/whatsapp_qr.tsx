import Image from "next/image";
import { memo } from "react";

interface WhatsAppQRProps {
    qrImage: string;
}
const WhatsAppQR = memo<WhatsAppQRProps>(({ qrImage }) => {
    return (
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
    );
});
WhatsAppQR.displayName = "WhatsAppQR";

export default WhatsAppQR;
