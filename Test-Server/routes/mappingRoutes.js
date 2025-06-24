const express = require("express");
const { sendToFastAPI } = require("../services/fastApiService");
const router = express.Router();

router.post("/execute-mapping", async (req, res) => {
  const { steps, case_id } = req.body;

  try {
    const result = await sendToFastAPI(steps, case_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "AI mapping failed" });
  }
});

module.exports = router;