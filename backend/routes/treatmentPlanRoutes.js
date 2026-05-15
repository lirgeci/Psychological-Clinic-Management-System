const express = require('express');
const treatmentPlanController = require('../controllers/treatmentPlanController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/treatment-plans/create', authenticate(['admin','therapist']), treatmentPlanController.createTreatmentPlan);
router.get('/treatment-plans/get-all', authenticate(['admin','patient','therapist']), treatmentPlanController.getAllTreatmentPlans);
router.get('/treatment-plans/get-by-id/:treatmentPlanId', authenticate(['admin','therapist','patient']), treatmentPlanController.getTreatmentPlanById);
router.put('/treatment-plans/update/:treatmentPlanId', authenticate(['admin','therapist']), treatmentPlanController.updateTreatmentPlan);
router.delete('/treatment-plans/delete/:treatmentPlanId', authenticate(['admin','therapist']), treatmentPlanController.deleteTreatmentPlan);

module.exports = router;
