"use client";

import { MessageCircle, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWhatsAppSocket } from "@/lib/socket";

export function BotStatusPanel() {
  const { status, isConnected } = useWhatsAppSocket();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              WhatsApp Bot Status
            </CardTitle>
            <CardDescription>
              Monitor WhatsApp connection status
            </CardDescription>
          </div>
          {!isConnected ? (
            <Badge variant="secondary">Checking...</Badge>
          ) : status.online ? (
            <Badge variant="default" className="gap-1">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Disconnected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Socket Connection:</span>
            <span className={isConnected ? "text-green-600" : "text-red-600"}>
              {isConnected ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">WhatsApp Connected:</span>
            <span
              className={status.connected ? "text-green-600" : "text-red-600"}
            >
              {status.connected ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">WhatsApp Online:</span>
            <span className={status.online ? "text-green-600" : "text-red-600"}>
              {status.online ? "Yes" : "No"}
            </span>
          </div>
          {status.user && (
            <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm">
              <p className="font-medium text-green-800">User Info:</p>
              <p className="text-green-700">ID: {status.user.id}</p>
              {status.user.name && (
                <p className="text-green-700">Name: {status.user.name}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
