import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { uploadDocument, deleteDocument, getDocuments } from '../services/uploadService.js';

const router = express.Router();

// Upload document
router.post('/upload', authenticate, asyncHandler(async (req, res) => {
  // In production: req.file from multer middleware
  const file = req.file || req.body.file;
  if (!file) return res.status(400).json({ error: 'No file provided' });

  const result = await uploadDocument(file, {
    application_id: req.body.application_id,
    document_type: req.body.document_type,
    customer_code: req.body.customer_code,
    fileName: req.file?.originalname || req.body.file_name,
    mime_type: req.file?.mimetype || req.body.mime_type,
    file_size: req.file?.size || 0,
    ext: req.file?.originalname?.split('.').pop() || 'pdf',
    uploaded_by: req.user.id,
  });
  res.status(201).json(result);
}));

// Get documents for an application
router.get('/application/:appId', authenticate, asyncHandler(async (req, res) => {
  const docs = await getDocuments({ application_id: req.params.appId });
  res.json(docs);
}));

// Get documents for a customer
router.get('/customer/:customerId', authenticate, asyncHandler(async (req, res) => {
  const docs = await getDocuments({ customer_id: req.params.customerId });
  res.json(docs);
}));

// Delete document
router.delete('/:documentId', authenticate, asyncHandler(async (req, res) => {
  const result = await deleteDocument(req.params.documentId);
  res.json(result);
}));

export default router;
