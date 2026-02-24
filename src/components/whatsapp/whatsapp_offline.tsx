import { memo, useMemo } from "react";
import type { ApiUrl } from "@/lib/prisma/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface WhatsAppOfflineProps {
    handleStart: () => void;
    loading: boolean;
    apiUrls: ApiUrl[];
}
const WhatsAppOffline = memo<WhatsAppOfflineProps>(
    ({ handleStart, loading, apiUrls }) => {
        const apiWaUrl = useMemo(
            () =>
                apiUrls.length > 0 ? apiUrls.find((api) => api.id === "wa")?.url : "",
            [apiUrls],
        );

        const doSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
            // "use server";
            e.preventDefault();
            const req = await fetch("/api/apiurl/wa", {
                method: "POST",
                body: new FormData(e.currentTarget),
            });
            const result = await req.json();
            if (result.success) {
                handleStart();
            }
        };

        return (
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
                        <p className="text-yellow-800 font-semibold">Menghubungkan...</p>
                    </div>
                    <p className="text-sm text-yellow-700 ml-11">
                        Pastikan WhatsApp service sudah berjalan di port 3001
                    </p>
                </div>
                <form className="grid gap-2" onSubmit={doSave}>
                    <div>
                        <Input type="text" name="url" defaultValue={apiWaUrl} />
                    </div>
                    <Button disabled={loading} className="w-full">
                        {loading ? "Memulai..." : "Start WhatsApp Connection"}
                    </Button>
                </form>
            </div>
        );
    },
);
WhatsAppOffline.displayName = "WhatsAppOffline";

export default WhatsAppOffline;
