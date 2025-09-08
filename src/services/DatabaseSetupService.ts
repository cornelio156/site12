import { databaseId, videoCollectionId, userCollectionId, siteConfigCollectionId, sessionCollectionId, videosBucketId, thumbnailsBucketId } from './node_appwrite';
import { AppwriteCredentialsManager } from './AppwriteCredentialsManager';

export interface SetupProgress {
  stage: string;
  progress: number;
  message: string;
  isError?: boolean;
}

export interface SetupResult {
  success: boolean;
  message: string;
  details: string[];
  errors: string[];
}

export class DatabaseSetupService {
  private projectId: string;
  private apiKey: string;
  private onProgress?: (progress: SetupProgress) => void;

  constructor(projectId: string, apiKey: string, onProgress?: (progress: SetupProgress) => void) {
    this.projectId = projectId;
    this.apiKey = apiKey;
    this.onProgress = onProgress;
  }

  private reportProgress(stage: string, progress: number, message: string, isError = false) {
    if (this.onProgress) {
      this.onProgress({ stage, progress, message, isError });
    }
  }

  private async callSetupAPI(action: string, data: any): Promise<any> {
    const response = await fetch('/api/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: this.projectId,
        apiKey: this.apiKey,
        action,
        ...data
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async setupDatabase(): Promise<SetupResult> {
    const details: string[] = [];
    const errors: string[] = [];

    try {
      this.reportProgress('init', 0, 'Inicializando setup da base de dados...');

      // 1. Verificar/criar database
      try {
        const dbResult = await this.callSetupAPI('create-database', {});
        details.push(dbResult.message || 'Database verificada/criada');
      } catch (error) {
        const message = `Erro ao configurar database: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        errors.push(message);
      }
      this.reportProgress('database', 20, 'Database configurada');

      // 2. Configurar collections
      const collections = [
        { id: videoCollectionId, name: 'Videos', type: 'video' },
        { id: userCollectionId, name: 'Users', type: 'user' },
        { id: siteConfigCollectionId, name: 'Site Config', type: 'config' },
        { id: sessionCollectionId, name: 'Sessions', type: 'session' }
      ];

      for (const collection of collections) {
        try {
          const result = await this.callSetupAPI('create-collection', { 
            collectionId: collection.id,
            collectionName: collection.name,
            collectionType: collection.type
          });
          details.push(result.message || `Collection '${collection.name}' configurada`);
        } catch (error) {
          const message = `Erro ao configurar collection '${collection.name}': ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          errors.push(message);
        }
      }
      this.reportProgress('collections', 60, 'Collections configuradas');

      // 3. Configurar storage buckets
      const buckets = [
        { id: videosBucketId, name: 'Videos' },
        { id: thumbnailsBucketId, name: 'Thumbnails' }
      ];

      for (const bucket of buckets) {
        try {
          const result = await this.callSetupAPI('create-bucket', { 
            bucketId: bucket.id,
            bucketName: bucket.name
          });
          details.push(result.message || `Bucket '${bucket.name}' configurado`);
        } catch (error) {
          const message = `Erro ao configurar bucket '${bucket.name}': ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          errors.push(message);
        }
      }
      this.reportProgress('storage', 80, 'Storage buckets configurados');

      // 4. Criar dados iniciais
      try {
        const result = await this.callSetupAPI('create-initial-data', {});
        details.push(result.message || 'Dados iniciais criados');
      } catch (error) {
        const message = `Erro ao criar dados iniciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        errors.push(message);
      }
      this.reportProgress('complete', 100, 'Setup completo com sucesso!');

      // Se o setup foi bem-sucedido, salvar as credenciais automaticamente
      if (errors.length === 0) {
        AppwriteCredentialsManager.saveCredentials(this.projectId, this.apiKey);
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 ? 'Base de dados configurada com sucesso!' : 'Setup completado com alguns erros',
        details,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.reportProgress('error', 0, `Erro durante setup: ${errorMessage}`, true);
      
      return {
        success: false,
        message: 'Falha no setup da base de dados',
        details,
        errors: [...errors, errorMessage]
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Testar conexão usando a API backend
      const result = await this.callSetupAPI('test-connection', {});
      return { 
        success: true, 
        message: result.message || 'Conexão estabelecida com sucesso' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  }
}
