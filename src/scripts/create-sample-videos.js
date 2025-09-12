/*
 * This script adds sample videos to the videos collection in Appwrite
 * You can run this in the Appwrite console or use the Node.js SDK
 * Now includes encryption for sensitive data
 */

const CryptoJS = require('crypto-js');

// Chave de criptografia (deve ser a mesma usada no CryptoService)
const SECRET_KEY = 'site-pro-encryption-key-2024';

// Funções de criptografia
function generateIV() {
  return CryptoJS.lib.WordArray.random(16).toString();
}

function encrypt(text) {
  try {
    const iv = generateIV();
    const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY, {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return {
      encrypted: encrypted.toString(),
      iv: iv
    };
  } catch (error) {
    console.error('Erro ao criptografar texto:', error);
    throw new Error('Falha na criptografia');
  }
}

function encryptVideoTitle(title) {
  const { encrypted, iv } = encrypt(title);
  return `${encrypted}:${iv}`;
}

function encryptVideoDescription(description) {
  const { encrypted, iv } = encrypt(description);
  return `${encrypted}:${iv}`;
}

function encryptProductLink(link) {
  if (!link || link.trim() === '') return link;
  const { encrypted, iv } = encrypt(link);
  return `${encrypted}:${iv}`;
}

function encryptFileId(fileId) {
  if (!fileId || fileId.trim() === '') return fileId;
  const { encrypted, iv } = encrypt(fileId);
  return `${encrypted}:${iv}`;
}

// Sample videos data (with encrypted sensitive fields)
const sampleVideos = [
  {
    title: encryptVideoTitle('Introduction to Web Development'),
    description: encryptVideoDescription('Learn the basics of HTML, CSS, and JavaScript in this comprehensive introduction to web development. Perfect for beginners who want to start their journey in web development.'),
    price: 9.99,
    duration: '1:45:30',
    video_id: '', // Add file ID after uploading to Appwrite Storage
    thumbnail_id: '', // Add file ID after uploading to Appwrite Storage
    product_link: encryptProductLink('https://example.com/product/intro-web-dev'),
    created_at: new Date().toISOString(),
    views: 0
  },
  {
    title: encryptVideoTitle('Advanced React Patterns'),
    description: encryptVideoDescription('Dive deep into advanced React patterns and techniques. This video covers context API, hooks, render props, HOCs, and performance optimization strategies for React applications.'),
    price: 14.99,
    duration: '2:20:15',
    video_id: '', // Add file ID after uploading to Appwrite Storage
    thumbnail_id: '', // Add file ID after uploading to Appwrite Storage
    product_link: encryptProductLink('https://example.com/product/advanced-react'),
    created_at: new Date().toISOString(),
    views: 0
  },
  {
    title: encryptVideoTitle('Node.js Backend Development'),
    description: encryptVideoDescription('Build scalable backend services with Node.js. Learn about Express, middleware, authentication, database integration, and deploying Node.js applications to production.'),
    price: 12.99,
    duration: '3:10:45',
    video_id: '', // Add file ID after uploading to Appwrite Storage
    thumbnail_id: '', // Add file ID after uploading to Appwrite Storage
    product_link: encryptProductLink('https://example.com/product/nodejs-backend'),
    created_at: new Date().toISOString(),
    views: 0
  },
  {
    title: encryptVideoTitle('TypeScript Fundamentals'),
    description: encryptVideoDescription('Master TypeScript from the ground up. This course covers types, interfaces, generics, decorators, and integrating TypeScript with popular frameworks like React and Node.js.'),
    price: 11.99,
    duration: '2:45:20',
    video_id: '', // Add file ID after uploading to Appwrite Storage
    thumbnail_id: '', // Add file ID after uploading to Appwrite Storage
    product_link: encryptProductLink('https://example.com/product/typescript-fundamentals'),
    created_at: new Date().toISOString(),
    views: 0
  },
  {
    title: encryptVideoTitle('CSS Animation Masterclass'),
    description: encryptVideoDescription('Create stunning web animations with CSS. Learn about transitions, keyframes, 3D transformations, and how to create performant animations for modern web applications.'),
    price: 8.99,
    duration: '1:30:00',
    video_id: '', // Add file ID after uploading to Appwrite Storage
    thumbnail_id: '', // Add file ID after uploading to Appwrite Storage
    product_link: encryptProductLink('https://example.com/product/css-animations'),
    created_at: new Date().toISOString(),
    views: 0
  }
];

// Example using the Appwrite SDK (Node.js)
/*
const { Client, Databases, ID } = require('node-appwrite');

// Appwrite configuration
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '681f80fb0002d0579432';
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || '681f818100229727cfc0';
const videoCollectionId = process.env.VITE_APPWRITE_VIDEO_COLLECTION_ID || '681f81a4001d1281896e';
const apiKey = process.env.VITE_APPWRITE_API_KEY || 'YOUR_API_KEY';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

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
      
      console.log(`Created video with encrypted data: ${video.$id}`, response);
    }
    
    console.log('All sample videos created successfully with encryption!');
  } catch (error) {
    console.error('Error creating sample videos:', error);
  }
}

createSampleVideos();
*/ 