import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { VideoService, Video } from '../services/VideoService';
import Chip from '@mui/material/Chip';

interface FeaturedBannerProps {
  onError?: (error: string) => void;
}

const FeaturedBanner = ({ onError }: FeaturedBannerProps) => {
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we already have a featured video stored in session
    const storedFeaturedVideo = sessionStorage.getItem('featuredVideo');
    
    if (storedFeaturedVideo) {
      try {
        // If we already have a stored video, use it
        setFeaturedVideo(JSON.parse(storedFeaturedVideo));
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing stored featured video:', error);
        // If there's an error parsing the stored video, fetch a new one
      }
    }

    // If we don't have a stored video, fetch a new one
    const fetchRandomVideo = async () => {
      try {
        setLoading(true);
        // Fetch all videos
        const videos = await VideoService.getAllVideos();
        
        if (videos.length > 0) {
          // Select a random video
          const randomIndex = Math.floor(Math.random() * videos.length);
          const selectedVideo = videos[randomIndex];
          
          // Store the selected video in session for future use
          sessionStorage.setItem('featuredVideo', JSON.stringify(selectedVideo));
          
          setFeaturedVideo(selectedVideo);
        }
      } catch (error) {
        console.error('Error fetching featured video:', error);
        if (onError) {
          onError('Failed to load featured content');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRandomVideo();
  }, [onError]);

  if (loading || !featuredVideo) {
    return null; // Or a skeleton loader
  }

  // Extract only what we need from the description (first 150 characters)
  const truncatedDescription = featuredVideo.description.length > 150 
    ? `${featuredVideo.description.substring(0, 150)}...` 
    : featuredVideo.description;

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: '70vh', md: '80vh' },
        width: '100%',
        overflow: 'hidden',
        mb: 4,
      }}
    >
      {/* Age verification banner */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 16px',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <WarningIcon sx={{ color: '#FF0F50' }} />
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          18+ ADULT CONTENT • By continuing, you confirm you are at least 18 years old
        </Typography>
      </Box>

      {/* Background image (thumbnail) with gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${featuredVideo.thumbnailUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.85)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(255,15,80,0.15) 0%, rgba(0,0,0,0) 100%)',
            zIndex: 1,
          }
        }}
      />

      {/* Banner content */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: 0,
          width: '100%',
          padding: { xs: '0 5%', md: '0 10%' },
          zIndex: 2,
        }}
      >
        <Chip 
          label="FEATURED EXCLUSIVE" 
          color="primary"
          sx={{ 
            mb: 2, 
            fontWeight: 'bold', 
            backgroundColor: '#FF0F50',
            '& .MuiChip-label': { px: 1, py: 0.5 }
          }} 
        />

        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            color: 'white',
            fontWeight: 'bold',
            fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
            textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
            mb: 2,
          }}
        >
          {featuredVideo.title}
        </Typography>

        <Typography 
          variant="body1" 
          sx={{ 
            color: 'white', 
            maxWidth: { xs: '100%', md: '50%' },
            mb: 3,
            textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
            fontSize: '1.1rem',
          }}
        >
          {truncatedDescription}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={Link}
            to={`/video/${featuredVideo.$id}`}
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            sx={{
              bgcolor: '#FF0F50',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#D10D42',
                transform: 'scale(1.03)',
              },
              px: 4,
              py: 1.2,
              borderRadius: '8px',
            }}
          >
            Watch Now
          </Button>
          
          <Button
            component={Link}
            to={`/video/${featuredVideo.$id}`}
            variant="contained"
            size="large"
            startIcon={<InfoIcon />}
            sx={{
              bgcolor: 'rgba(25, 25, 25, 0.8)',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'rgba(25, 25, 25, 0.95)',
                transform: 'scale(1.03)',
              },
              px: 4,
              py: 1.2,
              borderRadius: '8px',
            }}
          >
            More Info
          </Button>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              display: 'inline-block',
              border: '1px solid #FF0F50',
              bgcolor: 'rgba(255, 15, 80, 0.2)',
              px: 1.5,
              py: 0.5,
              borderRadius: '4px',
            }}
          >
            18+ ADULTS ONLY
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#FF69B4',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            ${featuredVideo.price.toFixed(2)}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(25, 25, 25, 0.7)',
              px: 1,
              py: 0.5,
              borderRadius: '4px',
            }}
          >
            {featuredVideo.duration}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default FeaturedBanner; 