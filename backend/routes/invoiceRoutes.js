const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/invoices/create', authenticate(['admin']), invoiceController.createInvoice);
router.get('/invoices/get-all', authenticate(['admin','patient']), invoiceController.getAllInvoices);
router.get('/invoices/get-by-id/:invoiceId', authenticate(['admin','patient']), invoiceController.getInvoiceById);
router.put('/invoices/update/:invoiceId', authenticate(['admin']), invoiceController.updateInvoice);
router.delete('/invoices/delete/:invoiceId', authenticate(['admin']), invoiceController.deleteInvoice);

module.exports = router;