/**
 * Migration script to move data from JSON files to Firebase Firestore
 * Run this once to migrate existing data: node migrate-to-firebase.js
 */

const { firestoreHelpers } = require('./firebase');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

async function migrateData() {
  try {
    console.log('Starting migration to Firebase...\n');

    // Migrate Users
    try {
      const usersData = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
      console.log(`Migrating ${usersData.length} users...`);
      
      for (const user of usersData) {
        // Check if user already exists
        const existingUser = await firestoreHelpers.getUserByEmail(user.email);
        if (!existingUser) {
          await firestoreHelpers.createUser({
            username: user.username,
            email: user.email,
            password: user.password, // Already hashed
            role: user.role || 'user'
          });
          console.log(`  ✓ Migrated user: ${user.email}`);
        } else {
          console.log(`  - User already exists: ${user.email}`);
        }
      }
      console.log('Users migration completed!\n');
    } catch (error) {
      console.error('Error migrating users:', error.message);
    }

    // Migrate Projects
    try {
      const projectsData = JSON.parse(await fs.readFile(PROJECTS_FILE, 'utf8'));
      console.log(`Migrating ${projectsData.length} projects...`);
      
      for (const project of projectsData) {
        // Check if project already exists
        const existingProject = await firestoreHelpers.getProjectById(project.id);
        if (!existingProject) {
          await firestoreHelpers.createProject({
            title: project.title,
            description: project.description,
            shortDescription: project.shortDescription || project.description.substring(0, 150) + '...',
            image: project.image,
            images: project.images || [],
            category: project.category,
            location: project.location,
            year: project.year
          });
          console.log(`  ✓ Migrated project: ${project.title}`);
        } else {
          console.log(`  - Project already exists: ${project.title}`);
        }
      }
      console.log('Projects migration completed!\n');
    } catch (error) {
      console.error('Error migrating projects:', error.message);
    }

    // Migrate Contacts
    try {
      const contactsData = JSON.parse(await fs.readFile(CONTACTS_FILE, 'utf8'));
      console.log(`Migrating ${contactsData.length} contacts...`);
      
      for (const contact of contactsData) {
        await firestoreHelpers.createContact({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          message: contact.message,
          read: contact.read || false
        });
        console.log(`  ✓ Migrated contact: ${contact.name}`);
      }
      console.log('Contacts migration completed!\n');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error migrating contacts:', error.message);
      } else {
        console.log('No contacts file found, skipping...\n');
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nYou can now use Firebase Firestore as your database.');
    console.log('The JSON files are kept as backup but are no longer used by the server.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData().then(() => {
  console.log('\nMigration script finished.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

