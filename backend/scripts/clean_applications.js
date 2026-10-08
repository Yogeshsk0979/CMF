import { query, closePool } from '../src/config/db.js';
import fs from 'fs';
import path from 'path';

async function cleanAllApplicationsAndLoans() {
  console.log('🧹 Starting complete cleanup of existing loan applications, loans, and related transactions...');

  try {
    // List dependent tables to delete in cascade order
    const tablesToClean = [
      'npa_classifications',
      'trust_scores',
      'referrals',
      'payment_receipts',
      'emi_payments',
      'emi_schedules',
      'disbursement_charges',
      'disbursements',
      'penalties',
      'loans',
      'verification_tasks',
      'approval_history',
      'stage_transitions',
      'application_notes',
      'application_documents',
      'application_stages',
      'application_topics',
      'applications'
    ];

    for (const table of tablesToClean) {
      try {
        const res = await query(`DELETE FROM ${table} RETURNING id`);
        console.log(`✅ Cleared ${res.rowCount} row(s) from '${table}'.`);
      } catch (err) {
        console.warn(`⚠️ Note on table '${table}':`, err.message);
      }
    }

    // Also clean up uploaded document files from local disk
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedFiles = 0;
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          deletedFiles++;
        }
      }
      console.log(`✅ Deleted ${deletedFiles} file(s) from uploads/documents directory.`);
    }

    console.log('🎉 Successfully deleted all existing loan applications, loans, and related data!');
  } catch (err) {
    console.error('❌ Error during applications cleanup:', err.message);
  } finally {
    await closePool();
    process.exit(0);
  }
}

cleanAllApplicationsAndLoans();
