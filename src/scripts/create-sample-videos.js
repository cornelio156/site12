/*
 * This script adds sample videos to the videos collection in Appwrite
 * You can run this in the Appwrite console or use the Node.js SDK
 */

// Sample videos data
const sampleVideos = [
  {
    title: 'Introduction to Web Development',
    description: 'Learn the basics of HTML, CSS, and JavaScript in this comprehensive introduction to web development. Perfect for beginners who want to start their journey in web development.',
    price: 9.99,
    duration: '1:45:30',
    videoFileId: '', // Add file ID after uploading to Appwrite Storage
    thumbnailFileId: '', // Add file ID after uploading to Appwrite Storage
    createdAt: new Date().toISOString()
  },
  {
    title: 'Advanced React Patterns',
    description: 'Dive deep into advanced React patterns and techniques. This video covers context API, hooks, render props, HOCs, and performance optimization strategies for React applications.',
    price: 14.99,
    duration: '2:20:15',
    videoFileId: '', // Add file ID after uploading to Appwrite Storage
    thumbnailFileId: '', // Add file ID after uploading to Appwrite Storage
    createdAt: new Date().toISOString()
  },
  {
    title: 'Node.js Backend Development',
    description: 'Build scalable backend services with Node.js. Learn about Express, middleware, authentication, database integration, and deploying Node.js applications to production.',
    price: 12.99,
    duration: '3:10:45',
    videoFileId: '', // Add file ID after uploading to Appwrite Storage
    thumbnailFileId: '', // Add file ID after uploading to Appwrite Storage
    createdAt: new Date().toISOString()
  },
  {
    title: 'TypeScript Fundamentals',
    description: 'Master TypeScript from the ground up. This course covers types, interfaces, generics, decorators, and integrating TypeScript with popular frameworks like React and Node.js.',
    price: 11.99,
    duration: '2:45:20',
    videoFileId: '', // Add file ID after uploading to Appwrite Storage
    thumbnailFileId: '', // Add file ID after uploading to Appwrite Storage
    createdAt: new Date().toISOString()
  },
  {
    title: 'CSS Animation Masterclass',
    description: 'Create stunning web animations with CSS. Learn about transitions, keyframes, 3D transformations, and how to create performant animations for modern web applications.',
    price: 8.99,
    duration: '1:30:00',
    videoFileId: '', // Add file ID after uploading to Appwrite Storage
    thumbnailFileId: '', // Add file ID after uploading to Appwrite Storage
    createdAt: new Date().toISOString()
  }
];

// Example using the Appwrite SDK (Node.js)
/*
const { Client, Databases, ID } = require('node-appwrite');

// Appwrite configuration
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '681f80fb0002d0579432';
const databaseId = '681f818100229727cfc0';
const videoCollectionId = '681f81a4001d1281896e';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey('YOUR_API_KEY');

const databases = new Databases(client);

// Create sample videos
async function createSampleVideos() {
  try {
    for (const video of sampleVideos) {
      const response = await databases.createDocument(
        databaseId,
        videoCollectionId,
        ID.unique(),
        video
      );
      
      console.log(`Created video: ${video.title}`, response);
    }
    
    console.log('All sample videos created successfully!');
  } catch (error) {
    console.error('Error creating sample videos:', error);
  }
}

createSampleVideos();
*/ 