import { query } from '../config/db.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kwkdpkewxldxcekeaaoh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
function getClient() {
  if (!supabase && SUPABASE_SERVICE_KEY) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
    } catch (e) {
      console.warn('Supabase client init failed:', e.message);
    }
  }
  return supabase;
}

export async function uploadDocument(fileInput, metadata) {
  const fileUuid = crypto.randomUUID();
  const ext = metadata.ext || (metadata.fileName?.includes('.') ? metadata.fileName.split('.').pop() : 'png');
  const uuidFilename = `${fileUuid}.${ext}`;

  let buffer;
  if (typeof fileInput === 'string' && fileInput.startsWith('data:')) {
    const base64Data = fileInput.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
  } else if (typeof fileInput === 'string') {
    buffer = Buffer.from(fileInput, 'base64');
  } else if (fileInput instanceof Buffer) {
    buffer = fileInput;
  } else {
    buffer = Buffer.from(fileInput || '');
  }

  const client = getClient();
  let fileUrl = '';

  if (client) {
    try {
      const { data, error } = await client.storage
        .from('cmf-documents')
        .upload(uuidFilename, buffer, {
          contentType: metadata.mime_type || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false
        });

      if (!error) {
        const { data: publicUrl } = client.storage.from('cmf-documents').getPublicUrl(uuidFilename);
        fileUrl = publicUrl.publicUrl;
      }
    } catch (err) {
      console.warn('Supabase upload failed, falling back to local file storage:', err.message);
    }
  }

  if (!fileUrl) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, uuidFilename);
    fs.writeFileSync(localFilePath, buffer);

    fileUrl = `/uploads/documents/${uuidFilename}`;
  }

  const docResult = await query(
    `INSERT INTO application_documents (id, application_id, document_type, document_name, file_path, file_size, mime_type, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET file_path = EXCLUDED.file_path
     RETURNING *`,
    [
      fileUuid,
      metadata.application_id || null,
      metadata.document_type || 'general',
      metadata.fileName || `${metadata.document_type || 'doc'}_${fileUuid.slice(0, 8)}.${ext}`,
      fileUrl,
      buffer.length,
      metadata.mime_type || 'image/png',
      metadata.uploaded_by || null
    ]
  );

  return {
    success: true,
    document: docResult.rows[0],
    id: fileUuid,
    fileName: metadata.fileName,
    file_path: fileUrl,
    fileUrl: fileUrl
  };
}

export async function deleteDocument(documentId) {
  const doc = await query('SELECT file_path FROM application_documents WHERE id = $1', [documentId]);
  const url = doc.rows[0]?.file_path;
  if (url) {
    if (url.startsWith('/uploads/')) {
      const localFilePath = path.join(process.cwd(), url);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } else {
      const client = getClient();
      if (client) {
        const filename = url.split('/').pop();
        try {
          await client.storage.from('cmf-documents').remove([filename]);
        } catch (e) {
          console.warn('Storage delete failed:', e.message);
        }
      }
    }
  }
  await query('DELETE FROM application_documents WHERE id = $1', [documentId]);
  return { success: true };
}

export async function getDocuments(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;
  if (filters.application_id) { where += ` AND application_id = $${idx++}`; params.push(filters.application_id); }
  if (filters.customer_id) { where += ` AND application_id IN (SELECT id FROM applications WHERE customer_id = $${idx++})`; params.push(filters.customer_id); }
  if (filters.document_type) { where += ` AND document_type = $${idx++}`; params.push(filters.document_type); }
  const result = await query(`SELECT * FROM application_documents ${where} ORDER BY created_at DESC`, params);
  return result.rows;
}