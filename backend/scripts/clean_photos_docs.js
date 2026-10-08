import fs from 'fs';
import path from 'path';
import { query, closePool } from '../src/config/db.js';

async function cleanApplicationPhotosAndDocs() {
  console.log('🧹 Starting cleanup of application photos, documents, and upload files...');

  try {
    // 1. Delete all rows from application_documents table
    const deleteDocsRes = await query('DELETE FROM application_documents RETURNING id');
    console.log(`✅ Deleted ${deleteDocsRes.rowCount} record(s) from application_documents table.`);

    // 2. Clear photo and document keys from application_topics JSONB column
    const photoAndDocKeys = [
      'live_selfie_url', 'photo_url', 'profile_photo', 'visit_photo_url',
      'aadhaar_doc', 'pan_doc', 'voter_doc', 'other_doc', 'education_doc',
      'residence_proof', 'address_proof_doc', 'property_documents', 'property_doc',
      'employment_proof_doc', 'income_proof', 'salary_slip_doc',
      'bank_statement_doc', 'bank_statement', 'passbook_doc', 'cheque_doc', 'bank_passbook'
    ];

    const topicsRes = await query('SELECT id, topic_code, topic_data FROM application_topics');
    let updatedCount = 0;

    for (const row of topicsRes.rows) {
      let data = row.topic_data || {};
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = {}; }
      }

      let modified = false;
      for (const key of photoAndDocKeys) {
        if (data[key] !== undefined) {
          delete data[key];
          modified = true;
        }
      }

      if (modified) {
        await query('UPDATE application_topics SET topic_data = $1::jsonb WHERE id = $2', [JSON.stringify(data), row.id]);
        updatedCount++;
      }
    }
    console.log(`✅ Cleaned photo & document references in ${updatedCount} application_topics record(s).`);

    // 3. Remove physical files in backend/uploads/documents/
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedFilesCount = 0;
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          deletedFilesCount++;
        }
      }
      console.log(`✅ Deleted ${deletedFilesCount} file(s) from uploads/documents directory.`);
    } else {
      console.log('ℹ️ Uploads directory does not exist or is empty.');
    }

    console.log('🎉 Successfully cleared all application photos and document files!');
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  } finally {
    await closePool();
    process.exit(0);
  }
}

cleanApplicationPhotosAndDocs();
