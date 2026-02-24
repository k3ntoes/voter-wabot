import { memo } from "react";
import type { WhatsAppStatus } from "@/lib/socket";
import { Button } from "../ui/button";

interface WhatsappStatusInfoProps {
    status: WhatsAppStatus;
    loading: boolean;
    handleStop: () => void;
    handleReset: () => void;
}

const WhatsappStatusInfo = memo<WhatsappStatusInfoProps>(
    ({ status, loading, handleStop, handleReset }) => {
        return (
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
                            <span className="font-medium">User ID:</span> {status.user?.id}
                        </p>
                        {status.user?.name && (
                            <p className="text-sm text-green-700">
                                <span className="font-medium">Nama:</span> {status.user.name}
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
        );
    },
);
WhatsappStatusInfo.displayName = "WhatsappStatusInfo";

export default WhatsappStatusInfo;
