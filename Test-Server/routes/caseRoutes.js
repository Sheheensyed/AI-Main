const express = require('express');
const router = express.Router();
const caseController = require('../controller/case');
const { executeMappingController } = require('../controller/executeMapping');




// router.get('/cases/:id', caseController.getCase);




router.post("/execute-mapping", executeMappingController);
router.patch('/case/:id/mapped-steps', caseController.updateMappedSteps);



module.exports = router;
