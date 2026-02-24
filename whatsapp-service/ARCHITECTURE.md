# WhatsApp Service - Modular Architecture

## File Structure

```
whatsapp-service/
├── server.ts              # Main entry point (minimal, clean)
├── connection.ts          # WhatsApp connection logic
├── routes.ts              # REST API endpoints
├── socket-handlers.ts     # Socket.IO event handlers
├── message-handlers.ts    # Message routing & handlers
├── registration-handler.ts # Voter registration logic
├── message-queue.ts       # Message queue system
├── helpers.ts             # Utility functions
├── auth-state.ts          # Database auth state
└── db.ts                  # Prisma database client
```

## Module Responsibilities

### 1. `server.ts` (Main Entry)
- Express & Socket.IO setup
- State management (sock, qrCode)
- Queue processor lifecycle
- Minimal orchestration only

**Exports:** None (entry point)

### 2. `connection.ts` (WhatsApp Connection)
- Baileys socket initialization
- Connection state handling
- QR code generation
- Auto-reconnection logic
- Message event subscription

**Exports:**
- `createWhatsAppConnection(getState, setState, emitStatus, emitQR, startQueueProcessor)`

### 3. `routes.ts` (REST API)
- Express route handlers
- Backward compatibility with Next.js app
- Direct message sending (bypass queue)

**Endpoints:**
- `GET /api/qr` - Get QR code
- `GET /api/status` - Connection status
- `POST /api/send-message` - Send direct message
- `POST /api/start` - Start connection
- `POST /api/stop` - Stop connection
- `POST /api/reset` - Reset & reconnect
- `GET /api/queue/stats` - Queue statistics
- `GET /health` - Health check

**Exports:**
- `setupRoutes(app, getState, setState, connectToWhatsApp, stopQueueProcessor, emitStatus, emitQR)`

### 4. `socket-handlers.ts` (Socket.IO)
- Real-time communication with Next.js
- Socket event handlers
- Client-server synchronization

**Events:**
- `connection` - New client connected
- `request:status` - Request current status
- `request:qr` - Request QR code
- `action:start` - Start WhatsApp
- `action:stop` - Stop WhatsApp
- `action:reset` - Reset WhatsApp
- `disconnect` - Client disconnected

**Exports:**
- `setupSocketHandlers(io, getState, setState, connectToWhatsApp, stopQueueProcessor, emitStatus, emitQR)`

### 5. `message-handlers.ts` (Message Processing)
- Incoming message router
- Command detection
- Handler delegation

**Handlers:**
- Greeting (halo/hallo/hi/hai)
- Ping test
- Registration detection
- Default help message

**Exports:**
- `extractMessageText(msg)` - Extract text from various message types
- `processIncomingMessage(sock, msg)` - Main message processor

### 6. `registration-handler.ts` (Voter Registration)
- Registration data parsing
- Voter validation
- Database operations
- Response generation

**Features:**
- Multi-line format: `Nama: John\nOrganisasi: ABC`
- Single-line format: `John - ABC`
- Duplicate detection
- Format validation

**Exports:**
- `parseRegistrationData(text)` - Parse registration from message
- `extractPhoneNumber(jid)` - Extract phone from JID
- `handleRegistration(sock, jid, text)` - Process registration
- `isRegistrationMessage(text)` - Detect registration attempt

### 7. `message-queue.ts` (Queue System)
- Persistent message queue (database)
- Batch processing
- Retry logic (max 3 attempts)
- Anti-spam delays (3-7 seconds)
- Typing simulation
- Auto cleanup (7 days)

**Exports:**
- `queueMessage(phone, message)` - Add to queue
- `processMessageQueue(sock)` - Process pending messages
- `getQueueStats()` - Get queue statistics
- `cleanupOldMessages()` - Remove old messages

### 8. `helpers.ts` (Utilities)
- Common helper functions
- Time-based greetings
- Delays & randomization
- Typing simulation

**Exports:**
- `delay(ms)` - Promise-based delay
- `randomDelay(min, max)` - Random delay
- `getGreeting()` - Time-based greeting
- `simulateTyping(sock, jid, duration)` - Typing indicator

### 9. `auth-state.ts` (Auth State)
- Database-based session storage
- Credential management

**Exports:**
- `useDatabaseAuthState()` - Auth state handler

### 10. `db.ts` (Database)
- Prisma client configuration
- SQLite/LibSQL adapter

**Exports:**
- `default` - Prisma client instance

## Message Flow

```
Incoming Message
    ↓
processIncomingMessage() [message-handlers.ts]
    ↓
Route to handler:
    ├─ handleGreeting() → queueMessage()
    ├─ handlePing() → queueMessage()
    ├─ handleRegistration() → parseData → validate → save → queueMessage()
    └─ Default help → queueMessage()
    ↓
Message Queue [message-queue.ts]
    ↓
processMessageQueue() (every 10s)
    ├─ Get pending messages (limit 5)
    ├─ Simulate typing (2-4s)
    ├─ Send message
    ├─ Mark sent/failed
    └─ Delay 3-7s between messages
```

## Registration Flow

```
User sends message
    ↓
isRegistrationMessage() checks format
    ↓
parseRegistrationData() extracts name & org
    ↓
isVoterRegistered() checks database
    ↓
saveVoter() creates record (status: pending)
    ↓
queueMessage() sends confirmation
```

## Queue Processor

- **Interval:** Every 10 seconds
- **Batch Size:** 5 messages per cycle
- **Delay:** 3-7 seconds between messages
- **Retry:** Max 3 attempts
- **Cleanup:** Auto-delete after 7 days

## Benefits of Modular Structure

✅ **Separation of Concerns** - Each module has clear responsibility  
✅ **Easy Testing** - Modules can be tested independently  
✅ **Maintainability** - Changes isolated to specific modules  
✅ **Reusability** - Functions can be imported elsewhere  
✅ **Scalability** - Easy to add new handlers/routes  
✅ **Clean Main File** - server.ts is now < 130 lines  

## Development

```bash
# Run development server
bun run dev

# Start production server
bun run start
```

## Environment Variables

```env
WHATSAPP_SERVICE_PORT=3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
