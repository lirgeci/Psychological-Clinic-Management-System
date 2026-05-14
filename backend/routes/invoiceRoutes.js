const express = require('express');
const invoiceController = require('../controllers/invoiceController');

const router = express.Router();

router.post('/invoices/create', invoiceController.createInvoice);
router.get('/invoices/get-all', invoiceController.getAllInvoices);
router.get('/invoices/get-by-id/:invoiceId', invoiceController.getInvoiceById);
router.put('/invoices/update/:invoiceId', invoiceController.updateInvoice);
router.delete('/invoices/delete/:invoiceId', invoiceController.deleteInvoice);

module.exports = router;