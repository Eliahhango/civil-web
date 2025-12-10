const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
let useFirebase = false;
let firestoreHelpers = null;

// Try to load Firebase helpers
try {
  const firebaseModule = require('./firebase');
  firestoreHelpers = firebaseModule.firestoreHelpers;
  useFirebase = true;
  console.log('Using Firebase for data storage');
} catch (error) {
  console.log('Firebase not available, using JSON file storage');
  useFirebase = false;
}

// JSON File Helpers
const jsonHelpers = {
  async readFile(fileName) {
    try {
      const filePath = path.join(DATA_DIR, fileName);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  },

  async writeFile(fileName, data) {
    try {
      const filePath = path.join(DATA_DIR, fileName);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing ${fileName}:`, error);
      return false;
    }
  },

  async getUsers() {
    const users = await this.readFile('users.json');
    return users.map(({ password, ...user }) => ({ ...user, password: '***' }));
  },

  async getUserByEmail(email) {
    const users = await this.readFile('users.json');
    const user = users.find(u => u.email === email);
    if (!user) return null;
    // Return user with password for authentication
    return user;
  },

  async getUserById(id) {
    const users = await this.readFile('users.json');
    return users.find(u => u.id === id || u.id === id.toString()) || null;
  },

  async createUser(userData) {
    const users = await this.readFile('users.json');
    const maxId = users.length > 0 ? Math.max(...users.map(u => parseInt(u.id) || 0)) : 0;
    const newUser = {
      id: (maxId + 1).toString(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    await this.writeFile('users.json', users);
    return newUser;
  },

  async updateUser(id, userData) {
    const users = await this.readFile('users.json');
    const index = users.findIndex(u => u.id === id || u.id === id.toString());
    if (index === -1) return null;
    users[index] = { ...users[index], ...userData };
    await this.writeFile('users.json', users);
    return users[index];
  },

  async deleteUser(id) {
    const users = await this.readFile('users.json');
    const filtered = users.filter(u => u.id !== id && u.id !== id.toString());
    await this.writeFile('users.json', filtered);
  },

  async getProjects() {
    return await this.readFile('projects.json');
  },

  async getProjectById(id) {
    const projects = await this.readFile('projects.json');
    return projects.find(p => p.id === parseInt(id)) || null;
  },

  async createProject(projectData) {
    const projects = await this.readFile('projects.json');
    const maxId = projects.length > 0 ? Math.max(...projects.map(p => p.id || 0)) : 0;
    const newProject = {
      ...projectData,
      id: maxId + 1
    };
    projects.push(newProject);
    await this.writeFile('projects.json', projects);
    return newProject;
  },

  async updateProject(id, projectData) {
    const projects = await this.readFile('projects.json');
    const index = projects.findIndex(p => p.id === parseInt(id));
    if (index === -1) return null;
    projects[index] = { ...projects[index], ...projectData };
    await this.writeFile('projects.json', projects);
    return projects[index];
  },

  async deleteProject(id) {
    const projects = await this.readFile('projects.json');
    const filtered = projects.filter(p => p.id !== parseInt(id));
    await this.writeFile('projects.json', filtered);
  },

  async getContacts() {
    const contacts = await this.readFile('contacts.json');
    return contacts.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  },

  async getContactById(id) {
    const contacts = await this.readFile('contacts.json');
    return contacts.find(c => c.id === id) || null;
  },

  async createContact(contactData) {
    const contacts = await this.readFile('contacts.json');
    const newContact = {
      id: Date.now().toString(),
      ...contactData,
      date: new Date().toISOString(),
      read: false
    };
    contacts.push(newContact);
    await this.writeFile('contacts.json', contacts);
    return newContact;
  },

  async updateContact(id, contactData) {
    const contacts = await this.readFile('contacts.json');
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) return null;
    contacts[index] = { ...contacts[index], ...contactData };
    await this.writeFile('contacts.json', contacts);
    return contacts[index];
  },

  async deleteContact(id) {
    const contacts = await this.readFile('contacts.json');
    const filtered = contacts.filter(c => c.id !== id);
    await this.writeFile('contacts.json', filtered);
  }
};

// Unified data helpers that use Firebase or JSON fallback
const dataHelpers = {
  async getUsers() {
    if (useFirebase && firestoreHelpers) {
      try {
        const users = await firestoreHelpers.getUsers();
        return users.map(({ password, ...user }) => user);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.getUsers();
      }
    }
    return await jsonHelpers.getUsers();
  },

  async getUserByEmail(email) {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.getUserByEmail(email);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.getUserByEmail(email);
      }
    }
    return await jsonHelpers.getUserByEmail(email);
  },

  async createUser(userData) {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.createUser(userData);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.createUser(userData);
      }
    }
    return await jsonHelpers.createUser(userData);
  },

  async getProjects() {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.getProjects();
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.getProjects();
      }
    }
    return await jsonHelpers.getProjects();
  },

  async getProjectById(id) {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.getProjectById(id);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.getProjectById(id);
      }
    }
    return await jsonHelpers.getProjectById(id);
  },

  async createProject(projectData) {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.createProject(projectData);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.createProject(projectData);
      }
    }
    return await jsonHelpers.createProject(projectData);
  },

  async updateProject(id, projectData) {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.updateProject(id, projectData);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.updateProject(id, projectData);
      }
    }
    return await jsonHelpers.updateProject(id, projectData);
  },

  async deleteProject(id) {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.deleteProject(id);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.deleteProject(id);
      }
    }
    return await jsonHelpers.deleteProject(id);
  },

  async getContacts() {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.getContacts();
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.getContacts();
      }
    }
    return await jsonHelpers.getContacts();
  },

  async createContact(contactData) {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.createContact(contactData);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.createContact(contactData);
      }
    }
    return await jsonHelpers.createContact(contactData);
  },

  async updateContact(id, contactData) {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.updateContact(id, contactData);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.updateContact(id, contactData);
      }
    }
    return await jsonHelpers.updateContact(id, contactData);
  },

  async deleteContact(id) {
    if (useFirebase && firestoreHelpers) {
      try {
        return await firestoreHelpers.deleteContact(id);
      } catch (error) {
        console.error('Firebase error, falling back to JSON:', error.message);
        return await jsonHelpers.deleteContact(id);
      }
    }
    return await jsonHelpers.deleteContact(id);
  }
};

module.exports = dataHelpers;

