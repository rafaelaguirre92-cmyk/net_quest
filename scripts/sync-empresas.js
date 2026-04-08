import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuración
const SPREADSHEET_ID = '1YMfIOiLlW9P65E3plfGMyTXDgpTLTMrjzoayRYIARHY';
const SERVICE_ACCOUNT_PATH = join(__dirname, '../service-account.json');

async function sync() {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('Error: No se encontró el archivo service-account.json en la raíz del proyecto.');
    console.log('Por favor, descárgalo desde el Firebase Console (Project Settings > Service Accounts).');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

  // Autenticación con Google Sheets
  const serviceAccountAuth = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  
  try {
    console.log('Conectando con Google Sheets...');
    await doc.loadInfo();
    console.log('Título del Sheet:', doc.title);
  } catch (err) {
    console.error('Error al conectar con Google Sheets. Asegúrate de que el email de la Service Account tenga permisos de edición en el Sheet.');
    console.log('Email a compartir:', serviceAccount.client_email);
    throw err;
  }

  // Inicializar Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  const db = admin.firestore();

  // 1. Procesar Empresas (Pestaña: contacto_empresas)
  const sheetEmpresas = doc.sheetsByTitle['contacto_empresas'];
  if (!sheetEmpresas) throw new Error('No se encontró la pestaña "contacto_empresas"');
  
  // Establecer que los encabezados están en la fila 2
  await sheetEmpresas.loadHeaderRow(2);
  
  const rowsEmpresas = await sheetEmpresas.getRows();
  const companyMap = new Map();

  console.log(`Sincronizando ${rowsEmpresas.length} empresas...`);
  for (const row of rowsEmpresas) {
    const id = row.get('id');
    const name = row.get('companyName');
    if (!id || !name) continue;

    companyMap.set(name, id);

    await db.collection('empresas').doc(String(id)).set({
      nombre: name,
      contactName: row.get('contactName') || '',
      contactEmail: row.get('contactEmail') || '',
      website: row.get('website') || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  // 2. Procesar Vacantes (Pestaña: Hoja 1)
  const sheetJobs = doc.sheetsByTitle['Hoja 1'];
  if (!sheetJobs) throw new Error('No se encontró la pestaña "Hoja 1"');
  
  const rowsJobs = await sheetJobs.getRows();
  console.log(`Sincronizando ${rowsJobs.length} vacantes...`);

  // Agrupar vacantes por empresa para limpiar subcolecciones antes de re-importar
  const jobsByCompany = {};
  for (const row of rowsJobs) {
    const companyName = row.get('companyName');
    const employerId = companyMap.get(companyName);
    if (!employerId) continue;
    
    if (!jobsByCompany[employerId]) jobsByCompany[employerId] = [];
    jobsByCompany[employerId].push({
      title: row.get('title') || '',
      area: row.get('area') || '',
      description: row.get('description') || '',
      location: row.get('location') || '',
      modality: row.get('modality') || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Actualizar subcolecciones
  for (const employerId of Object.keys(jobsByCompany)) {
    const jobColRef = db.collection('empresas').doc(employerId).collection('jobOpenings');
    
    // Limpiar vacantes viejas (opcional, pero recomendado para evitar duplicados en sync completo)
    const oldJobs = await jobColRef.get();
    const batch = db.batch();
    oldJobs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Agregar las nuevas
    for (const job of jobsByCompany[employerId]) {
      await jobColRef.add(job);
    }
  }

  console.log('¡Sincronización completada con éxito!');
}

sync().catch(console.error);
