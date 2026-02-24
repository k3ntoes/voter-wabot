import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { BufferJSON, initAuthCreds } from "@whiskeysockets/baileys";
import prisma from "./db";

/**
 * Database-based auth state for WhatsApp Baileys
 * Stores session data in database instead of files for serverless deployment
 */
export async function useDatabaseAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  // Load credentials from database
  const loadCreds = async (): Promise<AuthenticationCreds> => {
    const session = await prisma.whatsAppSession.findUnique({
      where: { key: "creds" },
    });

    if (session?.value) {
      return JSON.parse(session.value, BufferJSON.reviver);
    }

    // Initialize new credentials if not found
    return initAuthCreds();
  };

  // Load keys from database
  const loadKey = async (
    type: keyof SignalDataTypeMap,
    ids: string[],
  ): Promise<Record<string, SignalDataTypeMap[typeof type]>> => {
    const keys: Record<string, SignalDataTypeMap[typeof type]> = {};

    for (const id of ids) {
      const key = `${type}-${id}`;
      const session = await prisma.whatsAppSession.findUnique({
        where: { key },
      });

      if (session?.value) {
        keys[id] = JSON.parse(session.value, BufferJSON.reviver);
      }
    }

    return keys;
  };

  // Initialize state
  const creds = await loadCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = await loadKey(type, ids);
          return result as Record<string, SignalDataTypeMap[typeof type]>;
        },
        set: async (data) => {
          // Save keys to database
          for (const category in data) {
            const categoryData = data[category as keyof typeof data];
            for (const id in categoryData) {
              const value = categoryData[id];
              const key = `${category}-${id}`;

              if (value === null) {
                // Delete key
                await prisma.whatsAppSession.deleteMany({ where: { key } });
              } else {
                // Upsert key
                await prisma.whatsAppSession.upsert({
                  where: { key },
                  create: {
                    key,
                    value: JSON.stringify(value, BufferJSON.replacer),
                  },
                  update: {
                    value: JSON.stringify(value, BufferJSON.replacer),
                  },
                });
              }
            }
          }
        },
      },
    },
    saveCreds: async () => {
      // Save credentials to database
      await prisma.whatsAppSession.upsert({
        where: { key: "creds" },
        create: {
          key: "creds",
          value: JSON.stringify(creds, BufferJSON.replacer),
        },
        update: {
          value: JSON.stringify(creds, BufferJSON.replacer),
        },
      });
    },
  };
}
