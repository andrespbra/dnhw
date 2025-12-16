import { Client, Databases, Permission, Role } from 'node-appwrite';

/**
 * CONFIGURAÇÃO
 * Substitua as strings abaixo pelos seus dados REAIS do Appwrite Console
 * ou defina variáveis de ambiente.
 */
const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'SEU_PROJECT_ID_AQUI';
const API_KEY = process.env.APPWRITE_API_KEY || 'SUA_API_KEY_SECRET_AQUI'; // Crie em Overview > API Keys

const DATABASE_ID = 'tickets_db';
const COLLECTION_ID = 'tickets';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setup() {
    console.log('🚀 Iniciando configuração do Banco de Dados Appwrite...');

    // 1. Criar Banco de Dados
    try {
        await databases.get(DATABASE_ID);
        console.log(`✅ Banco de dados '${DATABASE_ID}' já existe.`);
    } catch (error) {
        console.log(`Creating database '${DATABASE_ID}'...`);
        await databases.create(DATABASE_ID, 'TicketsDB');
        console.log(`✅ Banco de dados criado.`);
    }

    // 2. Criar Collection
    try {
        await databases.getCollection(DATABASE_ID, COLLECTION_ID);
        console.log(`✅ Coleção '${COLLECTION_ID}' já existe.`);
    } catch (error) {
        console.log(`Criando coleção '${COLLECTION_ID}'...`);
        await databases.createCollection(
            DATABASE_ID, 
            COLLECTION_ID, 
            'Tickets',
            [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
            ]
        );
        console.log(`✅ Coleção criada.`);
    }

    // 3. Criar Atributos
    console.log('📦 Verificando/Criando atributos...');
    
    const attributes = [
        // Strings Obrigatórias
        { type: 'string', key: 'clientName', size: 128, required: true },
        { type: 'string', key: 'analystName', size: 128, required: true },
        { type: 'string', key: 'locationName', size: 128, required: true },
        { type: 'string', key: 'taskTicket', size: 64, required: true },
        { type: 'string', key: 'serviceRequest', size: 64, required: true },
        { type: 'string', key: 'subjectCode', size: 128, required: true },
        { type: 'string', key: 'priority', size: 32, required: true },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'supportStartTime', size: 64, required: true },
        { type: 'string', key: 'supportEndTime', size: 64, required: true },
        
        // Textos Longos
        { type: 'string', key: 'description', size: 5000, required: true },
        { type: 'string', key: 'analystAction', size: 5000, required: false },
        { type: 'string', key: 'aiAnalysis', size: 2000, required: false },

        // Campos Opcionais / Validação
        { type: 'string', key: 'customerWitnessName', size: 128, required: false },
        { type: 'string', key: 'customerWitnessID', size: 64, required: false },
        { type: 'string', key: 'pecaTrocada', size: 128, required: false },
        { type: 'string', key: 'validatedBy', size: 128, required: false },
        { type: 'string', key: 'validatedAt', size: 64, required: false },

        // Booleans
        { type: 'boolean', key: 'ligacaoDevida', required: false },
        { type: 'boolean', key: 'utilizouACFS', required: false },
        { type: 'boolean', key: 'ocorreuEntintamento', required: false },
        { type: 'boolean', key: 'trocouPeca', required: false },
        { type: 'boolean', key: 'tagVLDD', required: false },
        { type: 'boolean', key: 'tagNVLDD', required: false },
        
        // Datas
        { type: 'datetime', key: 'createdAt', required: true }
    ];

    for (const attr of attributes) {
        try {
            if (attr.type === 'string') {
                await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.size, attr.required);
            } else if (attr.type === 'boolean') {
                await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.required);
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.required);
            }
            console.log(`   + Atributo criado: ${attr.key}`);
            // Pequeno delay para evitar rate limits
            await sleep(200); 
        } catch (error) {
            // Ignora erro se atributo já existe
            if (error.code === 409) {
                console.log(`   = Atributo já existe: ${attr.key}`);
            } else {
                console.error(`   ❌ Erro ao criar ${attr.key}:`, error.message);
            }
        }
    }

    console.log('⏳ Aguardando Appwrite processar atributos antes de criar índices (5 segundos)...');
    await sleep(5000);

    // 4. Criar Índices
    console.log('📇 Criando Índices...');
    try {
        await databases.createIndex(
            DATABASE_ID, 
            COLLECTION_ID, 
            'idx_created_at', 
            'key', 
            ['createdAt'], 
            ['DESC']
        );
        console.log('✅ Índice de data criado.');
    } catch (error) {
        if (error.code === 409) {
            console.log('✅ Índice já existe.');
        } else {
            console.error('❌ Erro ao criar índice (talvez os atributos ainda estejam sendo processados):', error.message);
            console.log('👉 Dica: Tente criar o índice manualmente no console ou rode o script novamente em 1 minuto.');
        }
    }

    console.log('\n🎉 Configuração Concluída!');
}

setup();