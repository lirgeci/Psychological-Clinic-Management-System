const express = require('express');
const treatmentPlanController = require('../controllers/treatmentPlanController');

const router = express.Router();

router.post('/treatment-plans/create', treatmentPlanController.createTreatmentPlan);
router.get('/treatment-plans/get-all', treatmentPlanController.getAllTreatmentPlans);
router.get('/treatment-plans/get-by-id/:treatmentPlanId', treatmentPlanController.getTreatmentPlanById);
router.put('/treatment-plans/update/:treatmentPlanId', treatmentPlanController.updateTreatmentPlan);
router.delete('/treatment-plans/delete/:treatmentPlanId', treatmentPlanController.deleteTreatmentPlan);

module.exports = router;
