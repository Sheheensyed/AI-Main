// // const { sendToFastAPI } = require("../services/fastApiService");

// // const executeMappingController = async (req, res) => {
// //   try {
// //     const { steps, case_id } = req.body;

// //     if (!steps || !case_id) {
// //       return res.status(400).json({ message: "Steps and case_id are required" });
// //     }

// //     const result = await sendToFastAPI(steps, case_id);

// //     return res.status(200).json({
// //       message: "Execution successful",
// //       mapped_steps: result.mapped_steps
// //     });

// //   } catch (error) {
// //     console.error("❌ Execution error:", error.message);
// //     return res.status(500).json({ message: "Execution failed", error: error.message });
// //   }
// // };

// // module.exports = { executeMappingController };


// // // // const { sendToFastAPI } = require("../services/fastApiService");
// // // // const Case = require("../model/case"); // ✅ Import your model

// // // // const executeMappingController = async (req, res) => {
// // // //   try {
// // // //     const { steps, case_id } = req.body;

// // // //     if (!steps || !case_id) {
// // // //       return res.status(400).json({ message: "Steps and case_id are required" });
// // // //     }

// // // //     // Send steps to FastAPI
// // // //     const result = await sendToFastAPI(steps, case_id);

// // // //     if (!result || !result.mapped_steps) {
// // // //       return res.status(500).json({ message: "FastAPI did not return mapped steps" });
// // // //     }

// // // //     // ✅ Save mapped_steps to MongoDB
// // // //     await Case.findByIdAndUpdate(case_id, {
// // // //       $set: { mapped_steps: result.mapped_steps }
// // // //     });

// // // //     return res.status(200).json({
// // // //       message: "Execution successful",
// // // //       mapped_steps: result.mapped_steps
// // // //     });

// // // //   } catch (error) {
// // // //     console.error("❌ Execution error:", error.message);
// // // //     return res.status(500).json({ message: "Execution failed", error: error.message });
// // // //   }
// // // // };

// // // // module.exports = { executeMappingController };
// // // const { sendToFastAPI } = require("../services/fastApiService");
// // // const Case = require("../models/case"); // ✅ match your model file name here

// // // const executeMappingController = async (req, res) => {
// // //   try {
// // //     const { steps, case_id } = req.body;

// // //     if (!steps || !case_id) {
// // //       return res.status(400).json({ message: "Steps and case_id are required" });
// // //     }

// // //     // Get mapped_steps from FastAPI
// // //     const result = await sendToFastAPI(steps, case_id);

// // //     if (!result || !result.mapped_steps) {
// // //       return res.status(500).json({ message: "FastAPI didn't return mapped steps" });
// // //     }

// // //     // ✅ Save mapped_steps to MongoDB
// // //     const updatedCase = await Case.findByIdAndUpdate(
// // //       case_id,
// // //       { $set: { mapped_steps: result.mapped_steps } },
// // //       { new: true } // Return updated document
// // //     );

// // //     return res.status(200).json({
// // //       message: "Execution successful",
// // //       mapped_steps: updatedCase.mapped_steps
// // //     });

// // //   } catch (error) {
// // //     console.error("❌ Execution error:", error.message);
// // //     return res.status(500).json({ message: "Execution failed", error: error.message });
// // //   }
// // // };

// // // module.exports = { executeMappingController };
// // // const axios = require("axios");
// // // const Case = require("../model/case");

// // // exports.executeMappingController = async (req, res) => {
// // //     try {
// // //         const { case_id, steps } = req.body;

// // //         // ✅ Send steps to FastAPI for mapping
// // //         const response = await axios.post("http://localhost:8000/map-steps", {
// // //             steps: steps
// // //         });

// // //         const result = response.data;
// // //         console.log("✅ FastAPI Response:", result); // <-- Debug log

// // //         // ✅ Save mapped_steps to MongoDB
// // //         await Case.findByIdAndUpdate(
// // //             case_id,
// // //             { $set: { mapped_steps: result.mapped_steps } },
// // //             { new: true }
// // //         );

// // //         res.status(200).json({ message: "Mapping successful", mapped_steps: result.mapped_steps });

// // //     } catch (error) {
// // //         console.error("❌ Error in executeMappingController:", error.message);
// // //         res.status(500).json({ error: "Failed to execute mapping" });
// // //     }
// // // };
// const { sendToFastAPI } = require("../services/fastApiService");
// const Case = require("../model/case"); // ✅ Make sure the path is correct

// const executeMappingController = async (req, res) => {
//   try {
//     const { steps, case_id } = req.body;

//     if (!steps || !case_id) {
//       return res.status(400).json({ message: "Steps and case_id are required" });
//     }

//     const result = await sendToFastAPI(steps, case_id); // 👈 Call to FastAPI

//     // ✅ Save mapped_steps to the Case in MongoDB
//     await Case.findByIdAndUpdate(
//       case_id,
//       { $set: { mapped_steps: result.mapped_steps, updatedAt: Date.now() } },
//       { new: true }
//     );

//     return res.status(200).json({
//       message: "Execution successful",
//       mapped_steps: result.mapped_steps
//     });

//   } catch (error) {
//     console.error("❌ Execution error:", error.message);
//     return res.status(500).json({ message: "Execution failed", error: error.message });
//   }
// };

// module.exports = { executeMappingController };
const { sendToFastAPI } = require("../services/fastApiService");
const Case = require("../model/case");

const executeMappingController = async (req, res) => {
  try {
    const { steps, case_id } = req.body;

    // ✅ Validate inputs
    if (!steps || !case_id) {
      return res.status(400).json({ message: "Steps and case_id are required" });
    }

    // ✅ Validate case exists before processing
    const existingCase = await Case.findById(case_id);
    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    console.log(`📤 Sending to FastAPI - Case ID: ${case_id}`);
    
    // ✅ Call FastAPI
    const result = await sendToFastAPI(steps, case_id);
    
    console.log(`📥 FastAPI Response:`, result);

    // ✅ Validate FastAPI response
    if (!result || !result.mapped_steps) {
      return res.status(500).json({ 
        message: "Invalid response from FastAPI service",
        received: result 
      });
    }

    // ✅ Update case with mapped steps
    const updatedCase = await Case.findByIdAndUpdate(
      case_id,
      { 
        $set: { 
          mapped_steps: result.mapped_steps, 
          updatedAt: new Date() // ✅ Use new Date() instead of Date.now()
        } 
      },
      { new: true } // ✅ Return the updated document
    );

    console.log(`✅ Case updated successfully:`, updatedCase._id);

    return res.status(200).json({
      message: "Execution successful",
      case_id: case_id,
      mapped_steps: result.mapped_steps,
      updated_case: updatedCase // ✅ Optional: return the updated case
    });

  } catch (error) {
    console.error("❌ Execution error:", error);
    
    // ✅ Better error handling
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid case_id format", 
        error: error.message 
      });
    }
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: "FastAPI service unavailable", 
        error: error.message 
      });
    }

    return res.status(500).json({ 
      message: "Execution failed", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = { executeMappingController };