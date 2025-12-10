const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// Option 1: Using service account key file (recommended for production)
// Option 2: Using environment variables (recommended for development)

let firebaseApp;

try {
  // Try to initialize with service account file first
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  const fs = require('fs');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase initialized with service account file');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Initialize with environment variables
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
    console.log('Firebase initialized with environment variables');
  } else {
    // Fallback: Try to use default credentials (for Firebase emulator or GCP)
    firebaseApp = admin.initializeApp();
    console.log('Firebase initialized with default credentials');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

const db = admin.firestore();

// Helper functions for Firestore operations
const firestoreHelpers = {
  // Users collection
  async getUsers() {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getUserByEmail(email) {
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },

  async getUserById(id) {
    const doc = await db.collection('users').doc(id.toString()).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async createUser(userData) {
    const docRef = await db.collection('users').add(userData);
    return { id: docRef.id, ...userData };
  },

  async updateUser(id, userData) {
    await db.collection('users').doc(id.toString()).update(userData);
    return { id, ...userData };
  },

  async deleteUser(id) {
    await db.collection('users').doc(id.toString()).delete();
  },

  // Projects collection
  async getProjects() {
    try {
      const snapshot = await db.collection('projects').orderBy('id', 'asc').get();
      return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
    } catch (error) {
      // If ordering fails (e.g., no index), get all and sort in memory
      const snapshot = await db.collection('projects').get();
      const projects = snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
      return projects.sort((a, b) => (a.id || 0) - (b.id || 0));
    }
  },

  async getProjectById(id) {
    const doc = await db.collection('projects').doc(id.toString()).get();
    if (!doc.exists) return null;
    return { id: parseInt(doc.id), ...doc.data() };
  },

  async createProject(projectData) {
    // Get the highest ID to auto-increment
    const projects = await this.getProjects();
    const maxId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) : 0;
    const newId = maxId + 1;
    
    const projectWithId = { ...projectData, id: newId };
    await db.collection('projects').doc(newId.toString()).set(projectWithId);
    return projectWithId;
  },

  async updateProject(id, projectData) {
    const docRef = db.collection('projects').doc(id.toString());
    await docRef.update(projectData);
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) return null;
    return { id: parseInt(updatedDoc.id), ...updatedDoc.data() };
  },

  async deleteProject(id) {
    await db.collection('projects').doc(id.toString()).delete();
  },

  // Contacts collection
  async getContacts() {
    const snapshot = await db.collection('contacts').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getContactById(id) {
    const doc = await db.collection('contacts').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async createContact(contactData) {
    const contactWithTimestamp = {
      ...contactData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    };
    const docRef = await db.collection('contacts').add(contactWithTimestamp);
    return { id: docRef.id, ...contactData, read: false };
  },

  async updateContact(id, contactData) {
    const docRef = db.collection('contacts').doc(id);
    await docRef.update(contactData);
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) return null;
    return { id: updatedDoc.id, ...updatedDoc.data() };
  },

  async deleteContact(id) {
    await db.collection('contacts').doc(id).delete();
  }
};

module.exports = { db, admin, firestoreHelpers };

