/*
 * This script shows how to create the sessions collection in Appwrite
 * You can run this in the Appwrite console or use the Node.js SDK
 * 
 * Steps:
 * 1. Create a collection named 'user_sessions'
 * 2. Add the following attributes:
 *    - userId (string, required)
 *    - token (string, required)
 *    - userAgent (string, required)
 *    - ipAddress (string, optional)
 *    - createdAt (datetime, required)
 *    - expiresAt (datetime, required)
 *    - isActive (boolean, required)
 * 3. Create an index on the token field for faster lookups
 */

// Collection structure
const sessionsCollection = {
  databaseId: '681f818100229727cfc0',
  collectionId: 'user_sessions',
  name: 'User Sessions',
  attributes: [
    {
      key: 'userId',
      type: 'string',
      size: 255,
      required: true
    },
    {
      key: 'token',
      type: 'string',
      size: 255,
      required: true
    },
    {
      key: 'userAgent',
      type: 'string',
      size: 1000,
      required: true
    },
    {
      key: 'ipAddress',
      type: 'string',
      size: 45,
      required: false
    },
    {
      key: 'createdAt',
      type: 'datetime',
      required: true
    },
    {
      key: 'expiresAt',
      type: 'datetime',
      required: true
    },
    {
      key: 'isActive',
      type: 'boolean',
      required: true
    }
  ],
  indexes: [
    {
      key: 'token_index',
      type: 'key',
      attributes: ['token']
    },
    {
      key: 'userId_isActive_index',
      type: 'key',
      attributes: ['userId', 'isActive']
    }
  ]
};

// Example using the Appwrite SDK (Node.js)
/*
const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('681f80fb0002d0579432')
  .setKey('YOUR_API_KEY');

const databases = new Databases(client);

// Create the collection
async function createSessionsCollection() {
  try {
    // Create collection
    const collection = await databases.createCollection(
      sessionsCollection.databaseId,
      sessionsCollection.collectionId,
      sessionsCollection.name
    );
    
    console.log('Collection created:', collection);
    
    // Create attributes
    for (const attr of sessionsCollection.attributes) {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          sessionsCollection.databaseId,
          sessionsCollection.collectionId,
          attr.key,
          attr.size,
          attr.required
        );
      } else if (attr.type === 'datetime') {
        await databases.createDatetimeAttribute(
          sessionsCollection.databaseId,
          sessionsCollection.collectionId,
          attr.key,
          attr.required
        );
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          sessionsCollection.databaseId,
          sessionsCollection.collectionId,
          attr.key,
          attr.required
        );
      }
      
      console.log(`Attribute ${attr.key} created`);
    }
    
    // Create indexes
    for (const index of sessionsCollection.indexes) {
      await databases.createIndex(
        sessionsCollection.databaseId,
        sessionsCollection.collectionId,
        index.key,
        index.type,
        index.attributes
      );
      
      console.log(`Index ${index.key} created`);
    }
    
    console.log('Sessions collection setup complete!');
  } catch (error) {
    console.error('Error creating sessions collection:', error);
  }
}

createSessionsCollection();
*/ 