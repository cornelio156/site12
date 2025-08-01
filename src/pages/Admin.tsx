import { useState, useEffect, useRef, ChangeEvent } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/Auth';
import { VideoService } from '../services/VideoService';
import { AppwriteSchemaManager } from '../services/AppwriteSchemaManager';
import { ID } from 'appwrite';
import { useSiteConfig } from '../context/SiteConfigContext';
import { databases, databaseId, storage, videoCollectionId, siteConfigCollectionId, userCollectionId, videosBucketId, thumbnailsBucketId } from '../services/node_appwrite';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import SendIcon from '@mui/icons-material/Send';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import React from 'react';
import SecurityIcon from '@mui/icons-material/Security';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Styled components for file upload
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Custom Alert component
const CustomAlert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Video interface
interface Video {
  $id: string;
  title: string;
  description: string;
  price: number;
  product_link?: string;
  video_id?: string;
  thumbnail_id?: string;
  created_at: string;
  is_active: boolean;
  duration?: number;
}

// User interface
interface User {
  $id: string;
  email: string;
  name: string;
  password: string;
  created_at: string;
}

// Site config interface
interface SiteConfig {
  $id: string;
  site_name: string;
  paypal_client_id: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  telegram_username: string;
  video_list_title?: string;
  crypto?: string[];
}

// Admin page component
const Admin: FC = () => {
  const { user } = useAuth();
  const { refreshConfig } = useSiteConfig();
  const [tabValue, setTabValue] = useState(0);
  
  // Videos state
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  
  // Video form state
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoPrice, setVideoPrice] = useState('');
  const [productLink, setProductLink] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  
  // Site config state
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [siteName, setSiteName] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [videoListTitle, setVideoListTitle] = useState('');
  const [cryptoWallets, setCryptoWallets] = useState<string[]>([]);
  const [newCryptoWallet, setNewCryptoWallet] = useState('');
  
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [editingConfig, setEditingConfig] = useState(false);
  
  // Available cryptocurrencies
  const cryptoCurrencies = [
    { code: 'BTC', name: 'Bitcoin' },
    { code: 'ETH', name: 'Ethereum' },
    { code: 'USDT', name: 'Tether USD' },
    { code: 'BNB', name: 'Binance Coin' },
    { code: 'SOL', name: 'Solana' },
    { code: 'XRP', name: 'Ripple' },
    { code: 'ADA', name: 'Cardano' },
    { code: 'DOGE', name: 'Dogecoin' },
    { code: 'AVAX', name: 'Avalanche' },
    { code: 'DOT', name: 'Polkadot' },
    { code: 'MATIC', name: 'Polygon' },
    { code: 'SHIB', name: 'Shiba Inu' }
  ];
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'video' | 'user', id: string } | null>(null);
  
  // Feedback snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Video element ref for getting duration
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Schema initialization state
  const [initializingSchema, setInitializingSchema] = useState(false);
  
  // Event listener for show-feedback events
  useEffect(() => {
    const handleShowFeedback = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string, severity: 'success' | 'error' }>;
      setSnackbarMessage(customEvent.detail.message);
      setSnackbarSeverity(customEvent.detail.severity);
      setSnackbarOpen(true);
    };
    
    document.addEventListener('show-feedback', handleShowFeedback);
    
    return () => {
      document.removeEventListener('show-feedback', handleShowFeedback);
    };
  }, []);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Load videos on mount and tab change
  useEffect(() => {
    if (tabValue === 0) {
      fetchVideos();
    } else if (tabValue === 1) {
      fetchUsers();
      fetchSiteConfig();
    }
  }, [tabValue]);
  
  // Fetch videos from database
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use VideoService instead of direct database call to get all videos with pagination
      const allVideos = await VideoService.getAllVideos();
      console.log(`Admin: Fetched ${allVideos.length} videos using VideoService`);
      
      // Convert VideoService format to Admin format
      const adminVideos = allVideos.map(video => ({
        $id: video.$id,
        title: video.title,
        description: video.description,
        price: video.price,
        product_link: video.product_link || '',
        video_id: video.video_id || video.videoFileId,
        thumbnail_id: video.thumbnail_id || video.thumbnailFileId,
        created_at: video.createdAt,
        is_active: true,
        duration: typeof video.duration === 'string' ? 
          // Convert duration string (MM:SS or HH:MM:SS) to seconds
          video.duration.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0) : 
          undefined
      })) as unknown as Video[];
      
      setVideos(adminVideos);
      setFilteredVideos(adminVideos);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch users from database
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await databases.listDocuments(
        databaseId,
        userCollectionId
      );
      
      setUsers(response.documents as unknown as User[]);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch site configuration
  const fetchSiteConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await databases.listDocuments(
        databaseId,
        siteConfigCollectionId
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0] as unknown as SiteConfig;
        setSiteConfig(config);
        setSiteName(config.site_name);
        setPaypalClientId(config.paypal_client_id);
        setStripePublishableKey(config.stripe_publishable_key || '');
        setStripeSecretKey(config.stripe_secret_key || '');
        setTelegramUsername(config.telegram_username);
        setVideoListTitle(config.video_list_title || 'Available Videos');
        
        // Check if crypto wallets are available in the database
        if (config.crypto && config.crypto.length > 0) {
          setCryptoWallets(config.crypto);
        } else {
          // Try to load from localStorage if not available in the database
          const storedWallets = localStorage.getItem('cryptoWallets');
          if (storedWallets) {
            try {
              const parsedWallets = JSON.parse(storedWallets);
              setCryptoWallets(parsedWallets);
              console.log('Loaded crypto wallets from localStorage:', parsedWallets);
            } catch (err) {
              console.error('Error parsing stored crypto wallets:', err);
              setCryptoWallets([]);
            }
          } else {
            setCryptoWallets([]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching site config:', err);
      setError('Failed to load site configuration');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle video file selection and extract duration
  const handleVideoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setVideoFile(file);
      
      // Create a URL for the video to get its duration
      const videoUrl = URL.createObjectURL(file);
      
      // Create a video element to get duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Get duration in seconds and round to nearest integer
        const duration = Math.round(video.duration);
        setVideoDuration(duration);
        URL.revokeObjectURL(videoUrl);
      };
      
      video.src = videoUrl;
    }
  };
  
  // Handle thumbnail file selection
  const handleThumbnailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setThumbnailFile(event.target.files[0]);
    }
  };
  
  // Edit video
  const handleEditVideo = (video: Video) => {
    setVideoTitle(video.title);
    setVideoDescription(video.description);
    setVideoPrice(video.price.toString());
    setProductLink(video.product_link || '');
    setVideoDuration(video.duration || null);
    setEditingVideo(video.$id);
    setShowVideoForm(true);
  };
  
  // Reset video form
  const resetVideoForm = () => {
    setVideoTitle('');
    setVideoDescription('');
    setVideoPrice('');
    setProductLink('');
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoDuration(null);
    setEditingVideo(null);
  };
  
  // Upload video and thumbnail
  const handleVideoUpload = async () => {
    if (!videoTitle || !videoDescription || !videoPrice || !productLink) {
      setError('Please fill all required fields');
      return;
    }
    
    // For new videos, require files
    if (!editingVideo && (!videoFile || !thumbnailFile || !videoDuration)) {
      setError('Please select both video and thumbnail files');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      let videoId = '';
      let thumbnailId = '';
      
      // If editing, only upload new files if provided
      if (editingVideo) {
        // Get current video data
        const existingVideo = await databases.getDocument(
          databaseId,
          videoCollectionId,
          editingVideo
        ) as unknown as Video;
        
        videoId = existingVideo.video_id || '';
        thumbnailId = existingVideo.thumbnail_id || '';
        
        // Upload new thumbnail if provided
        if (thumbnailFile) {
          // Delete old thumbnail if exists
          if (thumbnailId) {
            try {
              await storage.deleteFile(thumbnailsBucketId, thumbnailId);
            } catch (err) {
              console.error('Error deleting old thumbnail:', err);
            }
          }
          
          // Upload new thumbnail
          const thumbnailUpload = await storage.createFile(
            thumbnailsBucketId,
            ID.unique(),
            thumbnailFile
          );
          thumbnailId = thumbnailUpload.$id;
        }
        
        // Upload new video if provided
        if (videoFile) {
          // Delete old video if exists
          if (videoId) {
            try {
              await storage.deleteFile(videosBucketId, videoId);
            } catch (err) {
              console.error('Error deleting old video:', err);
            }
          }
          
          // Upload new video
          const videoUpload = await storage.createFile(
            videosBucketId,
            ID.unique(),
            videoFile
          );
          videoId = videoUpload.$id;
        }
        
        try {
          // Primeiro tente com todos os campos obrigatórios
          // Para edição, vamos preservar valores existentes quando não fornecidos
          const requiredFields = {
            title: videoTitle,
            description: videoDescription,
            price: parseFloat(videoPrice),
            product_link: productLink,
            video_id: videoId || existingVideo.video_id,
            thumbnail_id: thumbnailId || existingVideo.thumbnail_id
          };
          
          await databases.updateDocument(
            databaseId,
            videoCollectionId,
            editingVideo,
            requiredFields
          );
          
          // Se deu certo, tente atualizar os campos adicionais
          try {
            const optionalFields = {
              ...(videoDuration ? { duration: videoDuration } : {})
            };
            
            if (Object.keys(optionalFields).length > 0) {
              await databases.updateDocument(
                databaseId,
                videoCollectionId,
                editingVideo,
                optionalFields
              );
            }
          } catch (err: any) {
            console.error('Erro ao atualizar campos adicionais do vídeo:', err);
            showFeedback('Alguns campos adicionais do vídeo não puderam ser atualizados porque os atributos não existem.', 'error');
          }
          
          // Show success message
          setSnackbarMessage('Video successfully updated!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } catch (err: any) {
          // Se houve erro nos campos obrigatórios
          console.error('Error updating video:', err);
          
          if (err.message && err.message.includes('Attribute')) {
            setError(`Erro ao salvar vídeo: Atributo não encontrado. Execute "Initialize Schema" primeiro e crie o atributo manualmente: ${err.message}`);
          } else {
            setError(`Erro ao salvar vídeo: ${err.message}`);
          }
          
          // Show error message
          setSnackbarMessage('Failed to update video. Please check if all required attributes exist.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
      } else {
        // Upload thumbnail
        const thumbnailUpload = await storage.createFile(
          thumbnailsBucketId,
          ID.unique(),
          thumbnailFile!
        );
        
        // Upload video
        const videoUpload = await storage.createFile(
          videosBucketId,
          ID.unique(),
          videoFile!
        );
        
        try {
          // Criar documento de vídeo com TODOS os campos obrigatórios
          // Aqui vemos na captura de tela que title, description, price, product_link, video_id e thumbnail_id são required
          const videoDoc = await databases.createDocument(
            databaseId,
            videoCollectionId,
            ID.unique(),
            {
              title: videoTitle,
              description: videoDescription,
              price: parseFloat(videoPrice),
              product_link: productLink,
              video_id: videoUpload.$id,        // Campo obrigatório
              thumbnail_id: thumbnailUpload.$id, // Campo obrigatório
              created_at: new Date().toISOString(), // Campo obrigatório
              is_active: true                    // Campo obrigatório
            }
          );
          
          // Adicionar campos opcionais se os atributos existirem
          try {
            await databases.updateDocument(
              databaseId,
              videoCollectionId,
              videoDoc.$id,
              {
                duration: videoDuration ? parseInt(videoDuration.toString()) : 0,
                views: 0
              }
            );
          } catch (err: any) {
            console.error('Erro ao adicionar campos adicionais ao vídeo:', err);
            showFeedback('O vídeo foi criado, mas alguns campos adicionais não puderam ser salvos porque os atributos não existem.', 'error');
          }
          
          // Show success message
          setSnackbarMessage('Video successfully uploaded!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } catch (err: any) {
          // Se houve erro nos campos obrigatórios
          console.error('Error creating video:', err);
          
          // Limpar os arquivos enviados em caso de erro
          try {
            await storage.deleteFile(thumbnailsBucketId, thumbnailUpload.$id);
            await storage.deleteFile(videosBucketId, videoUpload.$id);
          } catch (deleteErr) {
            console.error('Error cleaning up uploaded files after error:', deleteErr);
          }
          
          if (err.message && err.message.includes('Attribute')) {
            setError(`Erro ao criar vídeo: Atributo não encontrado. Execute "Initialize Schema" primeiro e crie o atributo manualmente: ${err.message}`);
          } else {
            setError(`Erro ao criar vídeo: ${err.message}`);
          }
          
          // Show error message
          setSnackbarMessage('Failed to create video. Please check if all required attributes exist.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
      }
      
      // Reset form
      resetVideoForm();
      
      // Hide the form
      setShowVideoForm(false);
      
      // Refresh videos list
      fetchVideos();
      
    } catch (err: any) {
      console.error('Error uploading video:', err);
      
      if (err.message && err.message.includes('Attribute')) {
        setError(`Erro ao salvar vídeo: Atributo não encontrado. Execute "Initialize Schema" primeiro e crie o atributo manualmente: ${err.message}`);
      } else {
        setError(`Erro ao salvar vídeo: ${err.message}`);
      }
      
      // Show error message
      setSnackbarMessage('Failed to save video. Please check if all required attributes exist.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Delete video
  const handleDeleteVideo = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get video document to get file IDs
      const video = await databases.getDocument(
        databaseId,
        videoCollectionId,
        id
      ) as unknown as Video;
      
      // Delete video and thumbnail files if they exist
      if (video.video_id) {
        await storage.deleteFile(videosBucketId, video.video_id);
      }
      
      if (video.thumbnail_id) {
        await storage.deleteFile(thumbnailsBucketId, video.thumbnail_id);
      }
      
      // Delete video document
      await databases.deleteDocument(
        databaseId,
        videoCollectionId,
        id
      );
      
      // Show success message
      setSnackbarMessage('Video successfully deleted!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh videos list
      fetchVideos();
      
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('Failed to delete video. Please try again.');
      
      // Show error message
      setSnackbarMessage('Failed to delete video. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  // Save or update user
  const handleSaveUser = async () => {
    if (!userName || !userEmail || (!editingUser && !userPassword)) {
      setError('Please fill all required user fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const userData = {
        name: userName,
        email: userEmail,
        ...(userPassword ? { password: userPassword } : {})
      };
      
      if (editingUser) {
        // Update existing user
        await databases.updateDocument(
          databaseId,
          userCollectionId,
          editingUser,
          userData
        );
        
        // Show success message
        setSnackbarMessage('User successfully updated!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Create new user
        await databases.createDocument(
          databaseId,
          userCollectionId,
          ID.unique(),
          {
            ...userData,
            created_at: new Date().toISOString()
          }
        );
        
        // Show success message
        setSnackbarMessage('User successfully created!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
      
      // Reset form
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setEditingUser(null);
      setNewUser(false);
      
      // Refresh users list
      fetchUsers();
      
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user. Please try again.');
      
      // Show error message
      setSnackbarMessage('Failed to save user. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete user
  const handleDeleteUser = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Delete user document
      await databases.deleteDocument(
        databaseId,
        userCollectionId,
        id
      );
      
      // Show success message
      setSnackbarMessage('User successfully deleted!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh users list
      fetchUsers();
      
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
      
      // Show error message
      setSnackbarMessage('Failed to delete user. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  // Edit user
  const handleEditUser = (user: User) => {
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword(''); // Don't populate password for security
    setEditingUser(user.$id);
    setNewUser(true);
  };
  
  // Save site configuration
  const handleSaveSiteConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Primeiro, vamos verificar quais campos existem na coleção
      try {
        // Se não existe configuração, vamos tentar criar com o mínimo possível
        if (!siteConfig) {
          // Aqui assumimos que pelo menos o atributo site_name existe
          const newConfig = await databases.createDocument(
            databaseId,
            siteConfigCollectionId,
            ID.unique(),
            { site_name: siteName || 'Site' }
          );
          
          // Atualize o ID para usar nas próximas operações
          await fetchSiteConfig();
        }
        
        // Agora vamos tentar salvar cada campo separadamente
        // para identificar quais atributos existem
        const fieldsToTry = [
          { name: 'site_name', value: siteName },
          { name: 'paypal_client_id', value: paypalClientId },
          { name: 'stripe_publishable_key', value: stripePublishableKey },
          { name: 'stripe_secret_key', value: stripeSecretKey },
          { name: 'telegram_username', value: telegramUsername },
          { name: 'video_list_title', value: videoListTitle },
        ];
        
        let successCount = 0;
        let errorCount = 0;
        let successFields: string[] = [];
        let errorFields: string[] = [];
        
        // Para cada campo, tenta atualizar individualmente
        for (const field of fieldsToTry) {
          if (field.value !== undefined && field.value !== null) {
            try {
              const updateData = { [field.name]: field.value };
              const configId = siteConfig ? siteConfig.$id : '';
              await databases.updateDocument(
                databaseId,
                siteConfigCollectionId,
                configId,
                updateData
              );
              successCount++;
              successFields.push(field.name);
              console.log(`Campo ${field.name} salvo com sucesso.`);
            } catch (err) {
              errorCount++;
              errorFields.push(field.name);
              console.log(`Campo ${field.name} não pôde ser salvo. Atributo provavelmente não existe.`);
              // Continue sem quebrar o processo
            }
          }
        }
        
        // Tenta salvar crypto se houver valores
        if (cryptoWallets && cryptoWallets.length > 0) {
          try {
            const configId = siteConfig ? siteConfig.$id : '';
            await databases.updateDocument(
              databaseId,
              siteConfigCollectionId,
              configId,
              { crypto: cryptoWallets }
            );
            successCount++;
            successFields.push('crypto');
          } catch (err) {
            console.log(`Campo crypto não pôde ser salvo. Atributo provavelmente não existe.`);
            errorCount++;
            errorFields.push('crypto');
          }
        }
        
        if (successCount > 0) {
          if (errorCount > 0) {
            showFeedback(`${successCount} campos salvos com sucesso. ${errorCount} campos não puderam ser salvos.`, 'success');
            console.log('Campos salvos:', successFields.join(', '));
            console.log('Campos não salvos:', errorFields.join(', '));
            // Mostrar mensagem informativa
            setError(`Alguns campos não puderam ser salvos porque os atributos não existem na coleção: ${errorFields.join(', ')}`);
          } else {
            showFeedback('Todas as configurações foram salvas com sucesso!', 'success');
          }
          refreshConfig(); // Update the context with new config
          setEditingConfig(false);
        } else {
          setError("Nenhum campo foi salvo. Verifique se os atributos necessários existem na coleção.");
          showFeedback('Falha ao salvar configurações', 'error');
        }
      } catch (err: any) {
        console.error('Erro ao verificar/salvar configurações:', err);
        
        if (err.message && err.message.includes('Attribute')) {
          setError(`Certifique-se de que pelo menos o atributo 'site_name' existe na coleção. Erro: ${err.message}`);
        } else {
          setError(`Erro ao salvar: ${err.message}`);
        }
        
        showFeedback('Falha ao salvar configurações', 'error');
      }
    } catch (err: any) {
      console.error('Erro ao salvar configurações do site:', err);
      setError(`Erro ao salvar: ${err.message}`);
      showFeedback('Falha ao salvar configurações do site', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (type: 'video' | 'user', id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };
  
  // Format video duration from seconds to MM:SS
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle test email config
  const handleTestEmailConfig = async () => {
    if (!testEmailAddress) return;
    
    setTestingEmail(true);
    setTestEmailResult(null);
    
    try {
      // Determine API base URL based on environment
      const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : (import.meta.env.VITE_API_URL || '');
      
      const response = await fetch(`${API_BASE_URL}/api/test-email-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail: testEmailAddress
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setTestEmailResult({
          success: true,
          message: `Email de teste enviado com sucesso para ${testEmailAddress}!`
        });
      } else {
        setTestEmailResult({
          success: false,
          message: `Erro ao enviar email: ${result.error || 'Erro desconhecido'}`
        });
      }
    } catch (error) {
      console.error('Error testing email config:', error);
      setTestEmailResult({
        success: false,
        message: `Falha ao testar configuração de email: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setTestingEmail(false);
    }
  };
  
  // Add crypto wallet
  const handleAddCryptoWallet = () => {
    if (!newCryptoWallet || !selectedCrypto) return;
    
    // Format: "BTC - Bitcoin: wallet_address"
    const cryptoName = cryptoCurrencies.find(c => c.code === selectedCrypto)?.name || selectedCrypto;
    const walletEntry = `${selectedCrypto} - ${cryptoName}\n${newCryptoWallet}`;
    
    // Check if we already have 5 wallets
    if (cryptoWallets.length >= 5) {
      showFeedback('Maximum of 5 crypto wallets allowed', 'error');
      return;
    }
    
    // Check if this currency already exists
    const existingWallet = cryptoWallets.find(wallet => wallet.startsWith(selectedCrypto));
    if (existingWallet) {
      showFeedback(`A wallet for ${selectedCrypto} already exists`, 'error');
      return;
    }
    
    setCryptoWallets([...cryptoWallets, walletEntry]);
    setNewCryptoWallet('');
  };
  
  // Crypto wallet variables
  const walletsFromDb = siteConfig?.crypto && Array.isArray(siteConfig.crypto) ? siteConfig.crypto : [];
  const walletsToShow = walletsFromDb.length > 0 ? walletsFromDb : cryptoWallets;
  const hasWallets = walletsToShow.length > 0;
  
  // Remove crypto wallet
  const handleRemoveCryptoWallet = (index: number) => {
    // Se estamos exibindo carteiras do banco de dados, atualize as carteiras do banco de dados
    if (walletsFromDb.length > 0) {
      const updatedWallets = [...walletsFromDb];
      updatedWallets.splice(index, 1);
      setCryptoWallets(updatedWallets);
      
      // Se não estamos no modo de edição, salve imediatamente
      if (!editingConfig) {
        // Salvar no banco de dados
        if (siteConfig) {
          databases.updateDocument(
            databaseId,
            siteConfigCollectionId,
            siteConfig.$id,
            { crypto: updatedWallets }
          )
          .then(() => {
            showFeedback('Crypto wallet removed successfully', 'success');
            refreshConfig(); // Atualizar o contexto
            fetchSiteConfig(); // Recarregar as configurações
          })
          .catch((err: Error) => {
            console.error('Error removing crypto wallet:', err);
            showFeedback('Failed to remove crypto wallet', 'error');
          });
        }
      }
    } else {
      // Se estamos exibindo carteiras locais, atualize apenas o estado local
      const updatedWallets = [...cryptoWallets];
      updatedWallets.splice(index, 1);
      setCryptoWallets(updatedWallets);
      
      // Atualizar localStorage
      localStorage.setItem('cryptoWallets', JSON.stringify(updatedWallets));
    }
  };
  
  // Filter videos when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVideos(videos);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = videos.filter(
        video => 
          video.title.toLowerCase().includes(term) || 
          video.description.toLowerCase().includes(term)
      );
      setFilteredVideos(filtered);
    }
  }, [searchTerm, videos]);
  
  // Initialize Appwrite schema
  const handleInitializeSchema = async () => {
    try {
      setInitializingSchema(true);
      setError(null);
      
      await AppwriteSchemaManager.initializeSchema();
      
      showFeedback('Schema documentation generated. Please check the console for required attributes.', 'success');
      
      // Mostrar instruções mais detalhadas
      setError('Importante: Devido a limitações do SDK Web, os atributos devem ser criados manualmente no Console do Appwrite.\n\n' +
        'Instruções:\n' +
        '1. Acesse o Console do Appwrite\n' +
        '2. Vá para Database > Collections\n' +
        '3. Para cada coleção (videos, users, site_config, sessions), adicione os atributos listados no console do navegador\n' +
        '4. Depois de criar os atributos, você poderá salvar os dados normalmente\n\n' +
        'Se você estiver vendo erros sobre atributos não encontrados ao salvar, significa que alguns atributos necessários ainda não foram criados.');
      
      // Refresh data
      await Promise.all([
        fetchVideos(),
        fetchUsers(),
        fetchSiteConfig()
      ]);
    } catch (err) {
      console.error('Error generating schema documentation:', err);
      setError('Failed to generate schema documentation. Please check the console for details.');
      showFeedback('Failed to generate schema documentation', 'error');
    } finally {
      setInitializingSchema(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab icon={<VideoLibraryIcon />} label="Manage Videos" />
            <Tab icon={<SettingsIcon />} label="Site Configuration & Users" />
          </Tabs>
        </Box>
        
        {/* Videos Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
              <Grid item>
                <Typography variant="h5" component="h2" gutterBottom>
                  Manage Videos
                </Typography>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={editingVideo ? <CancelIcon /> : showVideoForm ? <AddIcon /> : <AddIcon />}
                  onClick={() => {
                    if (editingVideo) {
                      resetVideoForm();
                      setShowVideoForm(false);
                    } else {
                      setShowVideoForm(!showVideoForm);
                    }
                  }}
                >
                  {editingVideo ? 'Cancel Edit' : showVideoForm ? 'Hide Form' : 'Upload New Video'}
                </Button>
              </Grid>
            </Grid>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <Collapse in={showVideoForm}>
              <Card sx={{ mt: 2, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {editingVideo ? 'Edit Video' : 'Upload New Video'}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box component="form">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Title"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Price"
                          type="number"
                          value={videoPrice}
                          onChange={(e) => setVideoPrice(e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          multiline
                          rows={3}
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Product Link"
                          placeholder="https://example.com/product"
                          value={productLink}
                          onChange={(e) => setProductLink(e.target.value)}
                          required
                          helperText="Link to the product or payment page"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                        >
                          {editingVideo ? 'Replace Video' : 'Upload Video'}
                          <VisuallyHiddenInput 
                            type="file" 
                            accept="video/*" 
                            onChange={handleVideoFileChange}
                          />
                        </Button>
                        {videoFile && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Video: {videoFile.name} {videoDuration ? `(Duration: ${formatDuration(videoDuration)})` : ''}
                          </Typography>
                        )}
                        {editingVideo && !videoFile && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Leave empty to keep the current video
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                        >
                          {editingVideo ? 'Replace Thumbnail' : 'Upload Thumbnail'}
                          <VisuallyHiddenInput 
                            type="file" 
                            accept="image/*" 
                            onChange={handleThumbnailFileChange}
                          />
                        </Button>
                        {thumbnailFile && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Thumbnail: {thumbnailFile.name}
                          </Typography>
                        )}
                        {editingVideo && !thumbnailFile && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Leave empty to keep the current thumbnail
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleVideoUpload}
                          disabled={
                            (!editingVideo && (!videoFile || !thumbnailFile || !videoTitle || !videoDescription || !videoPrice || !videoDuration || !productLink)) ||
                            (editingVideo && (!videoTitle || !videoDescription || !videoPrice || !productLink)) ||
                            uploading
                          }
                          startIcon={uploading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                        >
                          {uploading ? 'Saving...' : editingVideo ? 'Update Video' : 'Upload Video'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Collapse>
          </Box>
          
          {loading && !error ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Search box */}
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  placeholder="Pesquisar vídeos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                  }}
                />
              </Box>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVideos.map((video) => (
                      <TableRow key={video.$id}>
                        <TableCell>{video.title}</TableCell>
                        <TableCell>${video.price}</TableCell>
                        <TableCell>{formatDuration(video.duration)}</TableCell>
                        <TableCell>{video.is_active ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleEditVideo(video)}
                            aria-label="edit video"
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => openDeleteDialog('video', video.$id)}
                            aria-label="delete video"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredVideos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          {searchTerm.trim() ? 'No videos found matching your search' : 'No videos found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </TabPanel>
        
        {/* Site Configuration & Users Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Grid item>
                <Typography variant="h5" component="h2">
                  Site Configuration
                </Typography>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Botão para inicializar o schema do banco de dados */}
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleInitializeSchema}
                    disabled={initializingSchema}
                    startIcon={initializingSchema ? <CircularProgress size={20} color="inherit" /> : <SettingsIcon />}
                  >
                    {initializingSchema ? 'Initializing...' : 'Initialize Schema'}
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setEditingConfig(!editingConfig)}
                    startIcon={editingConfig ? <CancelIcon /> : <EditIcon />}
                  >
                    {editingConfig ? 'Cancel Edit' : 'Edit Config'}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Site Configuration Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              {editingConfig ? (
                <Box component="form">
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Site Name"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Video List Title"
                    value={videoListTitle}
                    onChange={(e) => setVideoListTitle(e.target.value)}
                    helperText="Title shown on the video listing page"
                  />
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="PayPal Client ID"
                    value={paypalClientId}
                    onChange={(e) => setPaypalClientId(e.target.value)}
                  />
                  
                  <TextField
                    fullWidth
                    label="Stripe Publishable Key"
                    value={stripePublishableKey}
                    onChange={(e) => setStripePublishableKey(e.target.value)}
                    margin="normal"
                    disabled={!editingConfig}
                  />
                  
                  <TextField
                    fullWidth
                    label="Stripe Secret Key"
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    margin="normal"
                    disabled={!editingConfig}
                    type="password"
                  />
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Telegram Username (without @)"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                  />
                  
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Crypto Wallets
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Add up to 5 cryptocurrency wallets for payment
                    </Typography>
                    <Alert severity="info" sx={{ mt: 1, mb: 1 }} variant="outlined">
                      <Typography variant="caption">
                        Note: If you're seeing errors about the "crypto" attribute, please make sure it's correctly 
                        configured in your Appwrite database. Your wallets will be saved locally in the meantime.
                      </Typography>
                    </Alert>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    {cryptoWallets.map((wallet, index) => {
                      const [header, address] = wallet.split('\n');
                      return (
                        <Paper key={index} variant="outlined" sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2">{header}</Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{address}</Typography>
                          </Box>
                          <IconButton 
                            color="error" 
                            onClick={() => {
                              // Se as carteiras estão vindo do banco de dados, precisamos atualizar o estado local primeiro
                              if (walletsFromDb.length > 0) {
                                const updatedWallets = [...walletsFromDb];
                                updatedWallets.splice(index, 1);
                                setCryptoWallets(updatedWallets);
                                
                                // Salvar imediatamente no banco de dados
                                handleSaveSiteConfig();
                              } else {
                                // Se são carteiras locais, apenas remover do estado
                                handleRemoveCryptoWallet(index);
                              }
                            }}
                            size="small"
                            aria-label="remove wallet"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      );
                    })}
                    
                    {cryptoWallets.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No crypto wallets added yet
                      </Typography>
                    )}
                  </Box>
                  
                  {cryptoWallets.length < 5 && (
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel id="crypto-select-label">Cryptocurrency</InputLabel>
                          <Select
                            labelId="crypto-select-label"
                            value={selectedCrypto}
                            label="Cryptocurrency"
                            onChange={(e) => setSelectedCrypto(e.target.value)}
                          >
                            {cryptoCurrencies.map((crypto) => (
                              <MenuItem key={crypto.code} value={crypto.code}>
                                {crypto.code} - {crypto.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Wallet Address"
                          value={newCryptoWallet}
                          onChange={(e) => setNewCryptoWallet(e.target.value)}
                          placeholder="Enter wallet address"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleAddCryptoWallet}
                          fullWidth
                        >
                          Add
                        </Button>
                      </Grid>
                    </Grid>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveSiteConfig}
                      disabled={loading}
                      startIcon={<SaveIcon />}
                    >
                      Save
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingConfig(false);
                        if (siteConfig) {
                          setSiteName(siteConfig.site_name);
                          setPaypalClientId(siteConfig.paypal_client_id);
                          setStripePublishableKey(siteConfig.stripe_publishable_key || '');
                          setStripeSecretKey(siteConfig.stripe_secret_key || '');
                          setTelegramUsername(siteConfig.telegram_username);
                          setVideoListTitle(siteConfig.video_list_title || 'Available Videos');
                        }
                      }}
                      startIcon={<CancelIcon />}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Site Name:</strong> {siteConfig?.site_name || 'Not set'}
                    </Typography>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>PayPal Client ID:</strong> {siteConfig?.paypal_client_id || 'Not set'}
                    </Typography>
                    
                    <Typography variant="subtitle1">
                      <strong>Stripe Publishable Key:</strong> {siteConfig?.stripe_publishable_key || 'Not set'}
                    </Typography>
                    
                    <Typography variant="subtitle1">
                      <strong>Stripe Secret Key:</strong> {siteConfig?.stripe_secret_key ? '•••••••••••••••••••••' : 'Not set'}
                    </Typography>
                    
                    <Typography variant="subtitle1">
                      <strong>Telegram Username:</strong> {siteConfig?.telegram_username ? `@${siteConfig.telegram_username}` : 'Not set'}
                    </Typography>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Video List Title:</strong> {siteConfig?.video_list_title || 'Not set'}
                    </Typography>
                    
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      <strong>Crypto Wallets:</strong>
                    </Typography>
                    
                    {hasWallets ? (
                      <Box sx={{ mt: 1 }}>
                        {walletsToShow.map((wallet, index) => {
                          const [header, address] = wallet.split('\n');
                          return (
                            <Paper key={index} variant="outlined" sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2">{header}</Typography>
                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{address}</Typography>
                              </Box>
                              <IconButton 
                                color="error" 
                                onClick={() => handleRemoveCryptoWallet(index)}
                                size="small"
                                aria-label="remove wallet"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Paper>
                          );
                        })}
                        {walletsFromDb.length === 0 && cryptoWallets.length > 0 && (
                          <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                            <Typography variant="caption">
                              These wallets are currently stored in your browser only.
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No crypto wallets configured
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}
            </Paper>

            {/* New User Management Section */}
            <Box sx={{ mt: 6, mb: 4 }}>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Grid item>
                  <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon /> User Management
                  </Typography>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={newUser ? <CancelIcon /> : <AddIcon />}
                    onClick={() => {
                      if (newUser) {
                        setNewUser(false);
                        setUserName('');
                        setUserEmail('');
                        setUserPassword('');
                        setEditingUser(null);
                      } else {
                        setNewUser(true);
                      }
                    }}
                  >
                    {newUser ? 'Cancel' : 'Add Admin User'}
                  </Button>
                </Grid>
              </Grid>

              {/* User form for creating/editing admin users */}
              <Collapse in={newUser}>
                <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {editingUser ? 'Edit Admin User' : 'Create Admin User'}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={editingUser ? "New Password (leave empty to keep current)" : "Password"}
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        required={!editingUser}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveUser}
                        disabled={loading || (!userEmail) || (!userName) || (!userPassword && !editingUser)}
                        startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                      >
                        {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Collapse>

              {/* User List */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No users found</TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.$id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Tooltip title="Edit User">
                              <IconButton
                                color="primary"
                                onClick={() => handleEditUser(user)}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reset Password">
                              <IconButton
                                color="secondary"
                                onClick={() => {
                                  setUserEmail(user.email);
                                  setUserName(user.name);
                                  setUserPassword('');
                                  setEditingUser(user.$id);
                                  setNewUser(true);
                                }}
                                size="small"
                              >
                                <SecurityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton
                                color="error"
                                onClick={() => openDeleteDialog('user', user.$id)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (itemToDelete) {
                if (itemToDelete.type === 'video') {
                  handleDeleteVideo(itemToDelete.id);
                } else {
                  handleDeleteUser(itemToDelete.id);
                }
              }
            }} 
            color="error" 
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <CustomAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </CustomAlert>
      </Snackbar>
    </Container>
  );
};

export default Admin;

// Helper function to show feedback via snackbar
function showFeedback(message: string, severity: 'success' | 'error') {
  // Access snackbar state from component scope
  // This is a workaround since the function is defined outside the component
  const event = new CustomEvent('show-feedback', {
    detail: { message, severity }
  });
  document.dispatchEvent(event);
}

