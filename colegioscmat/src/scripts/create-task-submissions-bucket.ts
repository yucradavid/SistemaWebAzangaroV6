/**
 * Script para crear el bucket task-submissions en Supabase Storage
 * 
 * Ejecución:
 * 1. Asegurarse de estar logueado en Supabase Dashboard
 * 2. Ir a Storage > Create Bucket
 * 3. Nombre: task-submissions
 * 4. Public: NO (privado con RLS)
 * 5. Luego ejecutar la migración SQL
 * 
 * O ejecutar este código directamente si tienes permisos de Service Role:
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = 'TU_SERVICE_ROLE_KEY_AQUI'; // NO COMMITEAR

async function createBucket() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Verificar si el bucket ya existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const exists = buckets?.some((b) => b.name === 'task-submissions');
    
    if (exists) {
      console.log('✅ Bucket task-submissions ya existe');
      return;
    }

    // Crear bucket
    const { data, error } = await supabase.storage.createBucket('task-submissions', {
      public: false,
      fileSizeLimit: 10485760, // 10 MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
      ],
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      return;
    }

    console.log('✅ Bucket task-submissions creado exitosamente');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

// Si ejecutas directamente con tsx/ts-node:
// createBucket();

export { createBucket };
