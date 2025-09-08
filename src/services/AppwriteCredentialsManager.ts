// Gerenciador de credenciais do Appwrite
export class AppwriteCredentialsManager {
  private static readonly PROJECT_ID_KEY = 'appwrite_project_id';
  private static readonly API_KEY_KEY = 'appwrite_api_key';

  // Salvar credenciais no localStorage
  static saveCredentials(projectId: string, apiKey: string): void {
    localStorage.setItem(this.PROJECT_ID_KEY, projectId);
    localStorage.setItem(this.API_KEY_KEY, apiKey);
    
    // Notificar que as credenciais mudaram
    this.reloadClient();
  }

  // Carregar credenciais do localStorage
  static loadCredentials(): { projectId: string; apiKey: string } {
    const projectId = localStorage.getItem(this.PROJECT_ID_KEY) || '';
    const apiKey = localStorage.getItem(this.API_KEY_KEY) || '';
    return { projectId, apiKey };
  }

  // Verificar se as credenciais estão salvas
  static hasCredentials(): boolean {
    const { projectId, apiKey } = this.loadCredentials();
    return !!(projectId && apiKey);
  }

  // Limpar credenciais
  static clearCredentials(): void {
    localStorage.removeItem(this.PROJECT_ID_KEY);
    localStorage.removeItem(this.API_KEY_KEY);
    
    // Notificar que as credenciais foram limpas
    this.reloadClient();
  }

  // Obter Project ID (localStorage primeiro, depois env)
  static getProjectId(): string {
    const saved = localStorage.getItem(this.PROJECT_ID_KEY);
    const envProjectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    
    // Se não há project ID salvo, usar o do ambiente
    if (!saved && envProjectId) {
      // Salvar automaticamente o project ID do ambiente
      localStorage.setItem(this.PROJECT_ID_KEY, envProjectId);
      return envProjectId;
    }
    
    return saved || envProjectId || '';
  }

  // Obter API Key (localStorage primeiro, depois env)
  static getApiKey(): string {
    const saved = localStorage.getItem(this.API_KEY_KEY);
    const envApiKey = import.meta.env.VITE_APPWRITE_API_KEY;
    
    // Se não há API key salva, usar a do ambiente
    if (!saved && envApiKey) {
      // Salvar automaticamente a API key do ambiente
      localStorage.setItem(this.API_KEY_KEY, envApiKey);
      return envApiKey;
    }
    
    return saved || envApiKey || '';
  }

  // Função para recarregar o cliente quando as credenciais mudarem
  static reloadClient(): void {
    // Disparar evento customizado para notificar que as credenciais mudaram
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appwriteCredentialsChanged'));
    }
  }

  // Verificar se as credenciais do ambiente estão disponíveis
  static hasEnvironmentCredentials(): boolean {
    return !!(import.meta.env.VITE_APPWRITE_PROJECT_ID && import.meta.env.VITE_APPWRITE_API_KEY);
  }

  // Obter credenciais do ambiente
  static getEnvironmentCredentials(): { projectId: string; apiKey: string } {
    return {
      projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
      apiKey: import.meta.env.VITE_APPWRITE_API_KEY || ''
    };
  }
}
