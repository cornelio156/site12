import { databases, databaseId, videoCollectionId, storage, videosBucketId, thumbnailsBucketId } from './node_appwrite';
import { Query, ID } from 'appwrite';

// Video interface
export interface Video {
  $id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  videoFileId?: string; // Keep for backward compatibility
  video_id?: string; // Correct attribute name from CONTEXT.md
  thumbnailFileId?: string;
  thumbnail_id?: string; // Support both naming conventions
  thumbnailUrl?: string;
  isPurchased?: boolean;
  createdAt: string;
  views: number;
  product_link?: string; // Link to the full product after purchase
}

// Sort options
export enum SortOption {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  VIEWS_DESC = 'views_desc',
  DURATION_DESC = 'duration_desc'
}

export class VideoService {
  // Método para normalizar os objetos de vídeo
  private static normalizeVideo(video: any): Video {
    // Converter duration (inteiro em segundos) para formato string (MM:SS ou HH:MM:SS)
    let formattedDuration = '00:00';
    if (typeof video.duration === 'number') {
      const totalSeconds = video.duration;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      if (minutes < 60) {
        formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        formattedDuration = `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    
    // Garantir consistência nos campos - mapeando do esquema do banco para o formato esperado pelo frontend
    return {
      $id: video.$id,
      title: video.title || 'Untitled',
      description: video.description || '',
      price: typeof video.price === 'number' ? video.price : parseFloat(video.price || '0'),
      duration: video.duration ? formattedDuration : '00:00', // Converter de inteiro para string formatada
      videoFileId: video.video_id || null, // Mapear video_id para videoFileId no frontend
      video_id: video.video_id || null, // Manter video_id para compatibilidade interna
      thumbnailFileId: video.thumbnail_id || null, // Mapear thumbnail_id para thumbnailFileId no frontend
      thumbnail_id: video.thumbnail_id || null, // Manter thumbnail_id para compatibilidade interna
      thumbnailUrl: video.thumbnailUrl || null,
      isPurchased: video.isPurchased || false,
      createdAt: video.created_at || new Date().toISOString(), // Mapear created_at para createdAt no frontend
      views: typeof video.views === 'number' ? video.views : 0,
      product_link: video.product_link || ''
    };
  }

  // Get all videos with sorting options
  static async getAllVideos(sortOption: SortOption = SortOption.NEWEST, searchQuery: string = ''): Promise<Video[]> {
    try {
      console.log('Buscando todos os vídeos da coleção com paginação');
      
      // Array para armazenar todos os vídeos
      let allVideos: any[] = [];
      
      // No Appwrite, usamos Query para paginação
      let currentPage = 1;
      let hasMorePages = true;
      const limit = 100; // Aumentar o tamanho da página para reduzir o número de chamadas
      
      while (hasMorePages) {
        console.log(`Buscando página ${currentPage} de vídeos (limit: ${limit})`);
        
        // Use Query.limit() e Query.offset() para paginação
        const queries = [
          Query.limit(limit),
          Query.offset((currentPage - 1) * limit)
        ];
        
        const response = await databases.listDocuments(
          databaseId,
          videoCollectionId,
          queries
        );
        
        // Adicionar documentos da página atual ao array de todos os vídeos
        allVideos = [...allVideos, ...response.documents];
        
        console.log(`Encontrados ${response.documents.length} vídeos na página ${currentPage}`);
        console.log(`Total acumulado: ${allVideos.length} vídeos`);
        
        // Verificar se há mais páginas
        hasMorePages = response.documents.length === limit;
        currentPage++;
      }
      
      console.log(`Total final: ${allVideos.length} vídeos encontrados no banco de dados`);
      
      // Normalizar todos os vídeos
      let videos = allVideos.map(doc => this.normalizeVideo(doc));
      
      // Aplicar pesquisa do lado do cliente se a consulta for fornecida
      if (searchQuery && searchQuery.trim() !== '') {
        const trimmedQuery = searchQuery.trim().toLowerCase();
        videos = videos.filter(video => 
          video.title.toLowerCase().includes(trimmedQuery) || 
          video.description.toLowerCase().includes(trimmedQuery)
        );
      }
      
      // Obter URLs de miniaturas para cada vídeo
      for (const video of videos) {
        // Verificar ambas as convenções de nomenclatura
        const thumbnailId = video.thumbnailFileId || video.thumbnail_id;
        
        // Registrar detalhes do vídeo para depuração
        console.log(`Processando vídeo ${video.$id}: título=${video.title}, video_id=${video.video_id}, videoFileId=${video.videoFileId}, thumbnail_id=${video.thumbnail_id}, thumbnailFileId=${video.thumbnailFileId}`);
        
        if (thumbnailId) {
          try {
            const thumbnailUrl = await storage.getFileView(thumbnailsBucketId, thumbnailId);
            video.thumbnailUrl = thumbnailUrl.href;
          } catch (error) {
            console.error(`Erro ao obter miniatura para o vídeo ${video.$id}:`, error);
            // Usar placeholder se a miniatura não estiver disponível
            video.thumbnailUrl = 'https://via.placeholder.com/300x180?text=Video+Thumbnail';
          }
        } else {
          // Usar placeholder se não houver ID de miniatura
          video.thumbnailUrl = 'https://via.placeholder.com/300x180?text=Video+Thumbnail';
        }
      }
      
      // Ordenar vídeos com base na opção
      switch (sortOption) {
        case SortOption.NEWEST:
          videos = videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case SortOption.PRICE_ASC:
          videos = videos.sort((a, b) => a.price - b.price);
          break;
        case SortOption.PRICE_DESC:
          videos = videos.sort((a, b) => b.price - a.price);
          break;
        case SortOption.VIEWS_DESC:
          videos = videos.sort((a, b) => (b.views || 0) - (a.views || 0));
          break;
        case SortOption.DURATION_DESC:
          videos = videos.sort((a, b) => {
            const getDurationInSeconds = (duration: string) => {
              try {
                const parts = duration.split(':').map(Number);
                if (parts.length === 2) {
                  return parts[0] * 60 + parts[1]; // formato MM:SS
                } else if (parts.length === 3) {
                  return parts[0] * 3600 + parts[1] * 60 + parts[2]; // formato HH:MM:SS
                }
              } catch (error) {
                console.error('Erro ao analisar duração:', error);
              }
              return 0;
            };
            return getDurationInSeconds(b.duration) - getDurationInSeconds(a.duration);
          });
          break;
      }
      
      return videos;
    } catch (error) {
      console.error('Erro ao obter vídeos:', error);
      throw error;
    }
  }
  
  // Get a single video by ID
  static async getVideo(videoId: string): Promise<Video | null> {
    try {
      const videoDoc = await databases.getDocument(
        databaseId,
        videoCollectionId,
        videoId
      );
      
      const video = this.normalizeVideo(videoDoc);
      
      // Log video details for debugging
      console.log(`Getting video ${videoId}: title=${video.title}, video_id=${video.video_id}, videoFileId=${video.videoFileId}, thumbnail_id=${video.thumbnail_id}, thumbnailFileId=${video.thumbnailFileId}`);
      
      // Get thumbnail URL
      // Check for both naming conventions
      const thumbnailId = video.thumbnailFileId || video.thumbnail_id;
      
      if (thumbnailId) {
        try {
          const thumbnailUrl = await storage.getFileView(thumbnailsBucketId, thumbnailId);
          video.thumbnailUrl = thumbnailUrl.href;
        } catch (error) {
          console.error(`Error getting thumbnail for video ${video.$id}:`, error);
          // Use placeholder if thumbnail not available
          video.thumbnailUrl = 'https://via.placeholder.com/300x180?text=Video+Thumbnail';
        }
      } else {
        // Use placeholder if no thumbnail ID
        video.thumbnailUrl = 'https://via.placeholder.com/300x180?text=Video+Thumbnail';
      }
      
      return video;
    } catch (error) {
      console.error(`Error getting video ${videoId}:`, error);
      return null;
    }
  }
  
  
  // Increment view count for a video
  static async incrementViews(videoId: string): Promise<void> {
    try {
      // Get current video
      const video = await databases.getDocument(
        databaseId,
        videoCollectionId,
        videoId
      ) as unknown as Video;
      
      // Increment views
      const currentViews = video.views || 0;
      
      // Update video document
      await databases.updateDocument(
        databaseId,
        videoCollectionId,
        videoId,
        {
          views: currentViews + 1
        }
      );
    } catch (error) {
      console.error(`Error incrementing views for video ${videoId}:`, error);
    }
  }
  
  // Get videos with pagination
  static async getVideosWithPagination(
    page: number = 1, 
    perPage: number = 12, 
    sortOption: SortOption = SortOption.NEWEST,
    searchQuery: string = ''
  ): Promise<{videos: Video[], totalPages: number}> {
    try {
      // Get all videos first (with sorting and filtering)
      const allVideos = await this.getAllVideos(sortOption, searchQuery);
      
      // Calculate total pages
      const totalPages = Math.ceil(allVideos.length / perPage);
      
      // Get videos for the requested page
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedVideos = allVideos.slice(startIndex, endIndex);
      
      return {
        videos: paginatedVideos,
        totalPages
      };
    } catch (error) {
      console.error('Error getting paginated videos:', error);
      throw error;
    }
  }
  
  // Get video file URL for streaming
  static async getVideoFileUrl(videoId: string): Promise<string | null> {
    try {
      console.log(`Getting video file URL for video ${videoId}`);
      
      // Get video details first
      const video = await this.getVideo(videoId);
      if (!video) {
        console.error(`Video ${videoId} not found`);
        return null;
      }
      
      // Verificando todos os possíveis campos onde o ID do vídeo pode estar
      const videoFileId = video.video_id || video.videoFileId;
      
      if (!videoFileId) {
        console.error(`Video ${videoId} has no video file ID (checked both video_id and videoFileId)`);
        return null;
      }
      
      console.log(`Attempting to get file URL for video ID: ${videoFileId} from bucket: ${videosBucketId}`);
      
      // Get video file URL - não verificamos mais o status de compra
      try {
        const fileUrl = await storage.getFileView(videosBucketId, videoFileId);
        console.log(`Video URL obtained: ${fileUrl.href}`);
        return fileUrl.href;
      } catch (error) {
        console.error(`Error getting file URL:`, error);
        console.error(`Bucket ID: ${videosBucketId}, Video File ID: ${videoFileId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error getting video file URL for ${videoId}:`, error);
      return null;
    }
  }
} 