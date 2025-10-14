// src/lib/session-manager.ts
// In-memory session storage for conversation context tracking

export interface BusinessData {
  name: string;
  category: string;
  address: string;
  phone: string;
  description: string;
  score: number;
  claimed?: boolean;
  verified?: boolean;
}

export interface LastEntityContext {
  entityType: 'business' | 'document' | 'topic';
  entityName: string;
  entityData: any;  // Flexible for different types
  timestamp: number;
  queryIntent?: string;  // What user wanted to know about this entity
}

export interface ConversationTurn {
  query: string;
  response: string;
  retrievedDocs: string[];
  aiAskedQuestion?: boolean;  // Track if AI ended with "?"
  pendingClarification?: string;  // What AI is waiting to know
  timestamp: number;
}

export interface SessionContext {
  lastEntityContext: LastEntityContext | null;  // Tracks ANY entity type (business, document, topic)
  conversationHistory: ConversationTurn[];
  sessionId: string;
  createdAt: number;
  lastAccessedAt: number;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, SessionContext>;
  private readonly SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly CONTEXT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes for business context
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.sessions = new Map();
    this.startCleanup();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public getSession(sessionId: string): SessionContext | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session expired
    const now = Date.now();
    if (now - session.lastAccessedAt > this.SESSION_TTL_MS) {
      console.log(`  ⏱️  Session ${sessionId.slice(0, 8)} expired, removing`);
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last accessed time
    session.lastAccessedAt = now;
    
    return session;
  }

  public createSession(sessionId: string): SessionContext {
    const now = Date.now();
    const newSession: SessionContext = {
      lastEntityContext: null,
      conversationHistory: [],
      sessionId,
      createdAt: now,
      lastAccessedAt: now,
    };

    this.sessions.set(sessionId, newSession);
    console.log(`  🆕 Created new session ${sessionId.slice(0, 8)}`);
    
    return newSession;
  }

  public updateSession(
    sessionId: string,
    updates: Partial<Omit<SessionContext, 'sessionId' | 'createdAt'>>
  ): void {
    let session = this.getSession(sessionId);
    
    if (!session) {
      session = this.createSession(sessionId);
    }

    // Apply updates
    if (updates.lastEntityContext !== undefined) {
      session.lastEntityContext = updates.lastEntityContext;
    }

    if (updates.conversationHistory !== undefined) {
      session.conversationHistory = updates.conversationHistory;
    }

    session.lastAccessedAt = Date.now();
    
    this.sessions.set(sessionId, session);
  }

  public updateLastEntity(
    sessionId: string,
    type: 'business' | 'document' | 'topic',
    name: string,
    data: any,
    intent?: string
  ): void {
    const entityContext: LastEntityContext = {
      entityType: type,
      entityName: name,
      entityData: data,
      timestamp: Date.now(),
      queryIntent: intent,
    };
    
    this.updateSession(sessionId, { lastEntityContext: entityContext });
    console.log(`  💾 Stored ${type} context: ${name}`);
  }

  public getLastEntity(sessionId: string): LastEntityContext | null {
    const session = this.getSession(sessionId);
    
    if (!session || !session.lastEntityContext) {
      return null;
    }

    const now = Date.now();
    const contextAge = now - session.lastEntityContext.timestamp;

    // Context expires after 5 minutes
    if (contextAge > this.CONTEXT_EXPIRY_MS) {
      console.log(`  ⏱️  Entity context expired (${Math.round(contextAge / 1000)}s old)`);
      return null;
    }

    return session.lastEntityContext;
  }

  public setPendingClarification(sessionId: string, question: string): void {
    const session = this.getSession(sessionId);
    if (!session || session.conversationHistory.length === 0) {
      return;
    }

    // Update the last conversation turn to mark it as a question
    const lastTurn = session.conversationHistory[session.conversationHistory.length - 1];
    lastTurn.aiAskedQuestion = true;
    lastTurn.pendingClarification = question;
    
    this.updateSession(sessionId, { conversationHistory: session.conversationHistory });
  }

  public getPendingClarification(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    
    if (!session || session.conversationHistory.length === 0) {
      return null;
    }

    const lastTurn = session.conversationHistory[session.conversationHistory.length - 1];
    return lastTurn.pendingClarification || null;
  }

  public clearPendingClarification(sessionId: string): void {
    const session = this.getSession(sessionId);
    
    if (!session || session.conversationHistory.length === 0) {
      return;
    }

    const lastTurn = session.conversationHistory[session.conversationHistory.length - 1];
    lastTurn.aiAskedQuestion = false;
    lastTurn.pendingClarification = undefined;
    
    this.updateSession(sessionId, { conversationHistory: session.conversationHistory });
  }

  public isEntityContextValid(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    
    if (!session || !session.lastEntityContext) {
      return false;
    }

    const now = Date.now();
    const contextAge = now - session.lastEntityContext.timestamp;

    // Context expires after 5 minutes
    if (contextAge > this.CONTEXT_EXPIRY_MS) {
      console.log(`  ⏱️  Entity context expired (${Math.round(contextAge / 1000)}s old)`);
      return false;
    }

    return true;
  }

  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`  🗑️  Cleared session ${sessionId.slice(0, 8)}`);
  }

  private startCleanup(): void {
    // Run cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    const sessionsArray = Array.from(this.sessions.entries());
    for (const [sessionId, session] of sessionsArray) {
      if (now - session.lastAccessedAt > this.SESSION_TTL_MS) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`  🧹 Cleaned up ${cleaned} expired sessions`);
    }
  }

  public getStats(): { totalSessions: number; activeWithContext: number } {
    let activeWithContext = 0;
    
    const sessionsArray = Array.from(this.sessions.values());
    for (const session of sessionsArray) {
      if (session.lastEntityContext && this.isEntityContextValid(session.sessionId)) {
        activeWithContext++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      activeWithContext,
    };
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }
}

