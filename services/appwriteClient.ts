import { Client, Databases } from 'appwrite';

const env = (import.meta as any).env || {};

// Use default Appwrite Cloud endpoint if not specified in env
const endpoint = env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = env.VITE_APPWRITE_PROJECT_ID;

export const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID || 'tickets_db';
export const COLLECTION_ID = env.VITE_APPWRITE_COLLECTION_ID || 'tickets';

if (!projectId) {
  console.warn("ATENÇÃO: VITE_APPWRITE_PROJECT_ID não encontrado. A conexão com o Appwrite falhará.");
}

const client = new Client();

// Always set endpoint (defaults to cloud)
client.setEndpoint(endpoint);

// Set Project ID if available
if (projectId) {
    client.setProject(projectId);
}

export const databases = new Databases(client);
export { client };