import { databases, databaseId, sessionCollectionId, account } from './node_appwrite';
import { ID, Query } from 'appwrite';

// Session interface
export interface Session {
  $id: string;
  userId: string;
  token: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

// Session manager class
export class SessionManager {
  // Cache for session validation
  private static sessionCache: { [token: string]: { session: Session | null, timestamp: number } } = {};
  private static validationInProgress: { [token: string]: boolean } = {};
  private static CACHE_TTL = 30000; // 30 seconds cache TTL
  private static lastLogTime = 0;
  private static LOG_THROTTLE = 5000; // Only log cache hits every 5 seconds
  private static validationCount = 0;
  
  // Ensure there is an Appwrite session (anonymous) so Role.users() permissions apply
  private static async ensureAnonymousAuth(): Promise<void> {
    try {
      // If there's a current session, this will succeed
      await account.get();
    } catch {
      try {
        await account.createAnonymousSession();
      } catch (authError) {
        console.error('Erro ao criar sessão anônima do Appwrite:', authError);
        throw authError;
      }
    }
  }

  // Create a new session for a user
  static async createSession(userId: string): Promise<Session | null> {
    try {
      // Garantir sessão Appwrite (anônima) para poder escrever com Role.users()
      await this.ensureAnonymousAuth();

      // Generate a unique session token
      const token = this.generateSessionToken();
      
      // Create session expiration date (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Session data em snake_case para corresponder ao schema do Appwrite
      // Enviar somente atributos obrigatórios para evitar erros de schema desconhecido
      const sessionData: Record<string, unknown> = {
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      };
      
      // Tente adicionar userAgent se possível
      try {
        if (navigator && (navigator as any).userAgent) {
          // Limitar o tamanho para evitar problemas
          const userAgent = (navigator as any).userAgent.substring(0, 255);
          // Adicionar opcionalmente se o schema suportar; não é obrigatório
          Object.assign(sessionData, { user_agent: userAgent });
        }
      } catch (e) {
        console.log('Não foi possível adicionar userAgent, continuando sem ele');
      }
      
      // Create session in database
      const createdDoc = await databases.createDocument(
        databaseId,
        sessionCollectionId,
        ID.unique(),
        sessionData
      );
      
      // Store session token in local storage
      localStorage.setItem('sessionToken', token);
      
      // Mapear documento criado para interface Session
      const mapped: Session = {
        $id: (createdDoc as any).$id,
        userId: (createdDoc as any).user_id,
        token: (createdDoc as any).token,
        userAgent: (createdDoc as any).user_agent,
        createdAt: (createdDoc as any).created_at,
        expiresAt: (createdDoc as any).expires_at,
        isActive: (createdDoc as any).is_active,
      };

      // Update cache with the new session
      this.sessionCache[token] = { session: mapped, timestamp: Date.now() };
      
      return mapped;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }
  
  // Validate a session
  static async validateSession(token: string): Promise<Session | null> {
    try {
      // Garantir sessão Appwrite (anônima) para leituras se necessário
      await this.ensureAnonymousAuth();

      // Check if we already have a validation in progress for this token
      if (this.validationInProgress[token]) {
        // Silent return from cache without logging
        return this.sessionCache[token]?.session || null;
      }
      
      // Check if we have a valid cached session
      const cachedSession = this.sessionCache[token];
      if (cachedSession && (Date.now() - cachedSession.timestamp) < this.CACHE_TTL) {
        // Throttle logging to prevent console spam
        this.validationCount++;
        const now = Date.now();
        if (now - this.lastLogTime > this.LOG_THROTTLE) {
          console.log(`Usando sessão em cache (${this.validationCount} validações nos últimos ${this.LOG_THROTTLE/1000}s)`);
          this.validationCount = 0;
          this.lastLogTime = now;
        }
        return cachedSession.session;
      }
      
      // Set validation in progress flag
      this.validationInProgress[token] = true;
      
      console.log('Validando sessão com token:', token.substring(0, 10) + '...');
      
      // Tente obter o documento diretamente usando listDocuments
      const response = await databases.listDocuments(
        databaseId,
        sessionCollectionId,
        [
          Query.equal('token', token)
        ]
      );
      
      console.log('Resposta da consulta de sessão:', response.total, 'documentos encontrados');
      
      if (response.documents.length === 0) {
        console.log('Nenhuma sessão encontrada com este token');
        this.sessionCache[token] = { session: null, timestamp: Date.now() };
        this.validationInProgress[token] = false;
        return null;
      }
      
      const doc: any = response.documents[0];
      const session: Session = {
        $id: doc.$id,
        userId: doc.user_id,
        token: doc.token,
        userAgent: doc.user_agent,
        createdAt: doc.created_at,
        expiresAt: doc.expires_at,
        isActive: doc.is_active,
      };
      console.log('Sessão encontrada:', session.$id, 'para usuário:', session.userId);
      
      // Verificar se a sessão está ativa
      if (!session.isActive) {
        console.log('Sessão encontrada, mas está inativa');
        this.sessionCache[token] = { session: null, timestamp: Date.now() };
        this.validationInProgress[token] = false;
        return null;
      }
      
      // Check if session has expired
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      console.log('Sessão expira em:', expiresAt, 'Agora:', now);
      
      if (expiresAt < now) {
        // Session has expired, deactivate it
        console.log('Sessão expirada, desativando');
        await this.deactivateSession(session.$id);
        this.sessionCache[token] = { session: null, timestamp: Date.now() };
        this.validationInProgress[token] = false;
        return null;
      }
      
      console.log('Sessão válida e ativa');
      
      // Update cache
      this.sessionCache[token] = { session, timestamp: Date.now() };
      this.validationInProgress[token] = false;
      
      return session;
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      this.validationInProgress[token] = false;
      return null;
    }
  }
  
  // Deactivate a session
  static async deactivateSession(sessionId: string): Promise<void> {
    try {
      // Garantir sessão Appwrite (anônima) para poder atualizar com Role.users()
      await this.ensureAnonymousAuth();

      await databases.updateDocument(
        databaseId,
        sessionCollectionId,
        sessionId,
        { isActive: false }
      );
      
      // Remove session token from local storage
      localStorage.removeItem('sessionToken');
      
      // Clear cache
      this.sessionCache = {};
    } catch (error) {
      console.error('Error deactivating session:', error);
    }
  }
  
  // Deactivate all sessions for a user
  static async deactivateAllUserSessions(userId: string): Promise<void> {
    try {
      // Garantir sessão Appwrite (anônima)
      await this.ensureAnonymousAuth();

      // Find all active sessions for user
      const response = await databases.listDocuments(
        databaseId,
        sessionCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true)
        ]
      );
      
      // Deactivate each session
      for (const doc of response.documents) {
        await this.deactivateSession(doc.$id);
      }
      
      // Remove session token from local storage
      localStorage.removeItem('sessionToken');
      
      // Clear cache
      this.sessionCache = {};
    } catch (error) {
      console.error('Error deactivating user sessions:', error);
    }
  }
  
  // Get current session
  static async getCurrentSession(): Promise<Session | null> {
    const token = localStorage.getItem('sessionToken');
    
    if (!token) {
      return null;
    }
    
    return await this.validateSession(token);
  }
  
  // Generate a random session token
  private static generateSessionToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return token;
  }
} 