const express = require('express');
const router = express.Router();
const caseController = require('../controller/case');
const { executeMappingController } = require('../controller/executeMapping');


router.post('/generate-steps', caseController.generateSteps);
router.get('/cases/:id', caseController.getCase);
router.put('/case/:id/step/:stepIndex', caseController.editStep);
router.delete('/case/:id/step/:stepIndex', caseController.deleteStep);
router.post('/case/:id/step', caseController.addStep);


router.post("/execute-mapping", executeMappingController);
router.patch('/case/:id/mapped-steps', caseController.updateMappedSteps);



module.exports = router;
