const { sendToFastAPI } = require("../services/fastApiService");

const executeMappingController = async (req, res) => {
  try {
    const { steps, case_id } = req.body;

    if (!steps || !case_id) {
      return res.status(400).json({ message: "Steps and case_id are required" });
    }

    const result = await sendToFastAPI(steps, case_id);

    return res.status(200).json({
      message: "Execution successful",
      mapped_steps: result.mapped_steps
    });

  } catch (error) {
    console.error("❌ Execution error:", error.message);
    return res.status(500).json({ message: "Execution failed", error: error.message });
  }
};

module.exports = { executeMappingController };