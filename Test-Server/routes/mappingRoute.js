const express = require("express");
const { runMapping } = require("../controller/mappingController");
const router = express.Router();

router.post("/run-mapping", runMapping);

module.exports = router;
