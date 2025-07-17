// const { default: mongoose } = require('mongoose');
const Case = require('../model/case')
const runPythonScript = require("../services/pythonService")
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// exports.generateSteps = async (req, res) => {
//     try {
//         const { device, model, user_query } = req.body
//         console.log("Received Prompt:", user_query);

//         //  save case to db
//         const newCase = await Case.create({ device, model, user_query })

//         // send prompt to AI Backend
//         // const aiResponse = await axios.post('http://localhost:4000/generate-steps', { user_query: user_query })


//         // ✅ Step 2: Run your local Python script
//         const pythonOutput = await runPythonScript(newCase._id.toString(), device, model);

//         // extract steps from response
//         // const steps = aiResponse.data.steps

//         // const steps = [
//         //     "Power off the device.",
//         //     "Remove the screws near the charging port.",
//         //     "Use a suction tool to lift the screen.",
//         //     "Disconnect the battery.",
//         //     "Detach the display connectors.",
//         //     "Replace with the new display and reassemble."
//         // ];

//         // save steps to the case
//         // newCase.steps = steps;
//         newCase.steps = pythonOutput.steps;
//         await newCase.save()

//         res.status(201).json(newCase)
//     } catch (error) {
//         console.log(`Error in Generation Steps:`, error);
//         res.status(500).json({ message: 'Error Generating Steps' })
//     }
// }
exports.generateSteps = async (req, res) => {
  try {
    const { device, model, user_query,project_name } = req.body;
    console.log("Received Prompt:", user_query);

    // ✅ Step 1: Create Case in DB
    const newCase = await prisma.case.create({
      data: {
        project_name,
        device,
        model,
        user_query,
        createdAtFormatted: new Date().toLocaleString()
      }
    });

    // ✅ Step 2: Call Python Script
    const pythonOutput = await runPythonScript(newCase.id.toString(), device, model);

    // ✅ Step 3: Store Generated Steps
    await Promise.all(
      pythonOutput.steps.map(step =>
        prisma.step.create({
          data: {
            content: step,
            caseId: newCase.id
          }
        })
      )
    );

    // ✅ Step 4: Return Case with Steps
    const fullCase = await prisma.case.findUnique({
      where: { id: newCase.id },
      include: { steps: true }
    });

    res.status(201).json({...fullCase,steps:fullCase.steps.map(step=>step.content)});
  } catch (error) {
    console.error("❌ Error in generateSteps:", error);
    res.status(500).json({ message: "Error generating steps", error: error.message });
  }
};

// exports.addStep = async (req, res) => {
//     const { id } = req.params;
//     const { newStep } = req.body;

//     if (!newStep || typeof newStep !== 'string') {
//         return res.status(400).json({ message: 'newStep must be a string' });
//     }

//     try {
//         const existingCase = await Case.findById(id);
//         if (!existingCase) {
//             return res.status(404).json({ message: 'Case not found' });
//         }

//         existingCase.steps.push(newStep); // ✅ Push string, not object
//         await existingCase.save();

//         res.status(200).json({ message: 'Step added successfully', updatedCase: existingCase });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };
exports.addStep = async (req, res) => {
  const { id } = req.params; // id = caseId
  const { newStep } = req.body;

  if (!newStep || typeof newStep !== 'string') {
    return res.status(400).json({ message: 'newStep must be a string' });
  }

  try {
    // Check if the case exists first
    const foundCase = await prisma.case.findUnique({
      where: { id: parseInt(id) }
    });

    if (!foundCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Create the new step
    const createdStep = await prisma.step.create({
      data: {
        content: newStep,
        caseId: parseInt(id)
      }
    });

    // Return updated case with all steps
    const updatedCase = await prisma.case.findUnique({
      where: { id: parseInt(id) },
      include: { steps: true }
    });

    res.status(200).json({
      message: 'Step added successfully',
      updatedCase
    });
  } catch (err) {
    console.error("Error adding step:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



exports.createCase = async (req, res) => {
    try {
        const { device, model, user_query } = req.body

        // save to db
        const newCase = await Case.create({ device, model, user_query })

        // call python with objectId
        const result = await runPythonScript(newCase._id, device, model)

        // fetch updated case with steps
        const updatedCase = await Case.findById(newCase._id)

        res.status(201).json(updatedCase)
    } catch (error) {
        console.log(err);
        res.status(500).json({ error: 'Error creating case or running Python' })
    }
}

// GET: Fetch case with steps
// exports.getCase = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const foundCase = await Case.findById(id);
//         res.json(foundCase);
//         console.log("Fetched Case:", foundCase);
//     } catch (err) {
//         res.status(404).json({ error: 'Case not found' });
//     }
// };
exports.getCase = async (req, res) => {
    try {
        const { id } = req.params;
        const foundCase = await prisma.case.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { steps: true, mapped_steps: true }
        });
        res.json(foundCase);
        console.log("Fetched Case:", foundCase);
    } catch (err) {
        res.status(404).json({ error: 'Case not found' });
    }
};

// PUT: Edit a step
// exports.editStep = async (req, res) => {
//     console.log("🔁 Received PUT body:", req.body);
//     const { id, stepIndex } = req.params;
//     const { newStep } = req.body;

//     console.log("🆔 Case ID:", id);
//     console.log("🔢 Step Index (from URL):", stepIndex);


//     // Validate ObjectId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ error: "Invalid case ID" });
//     }

//     // Validate stepIndex
//     const stepIndexNum = parseInt(stepIndex);
//     if (isNaN(stepIndexNum) || stepIndexNum < 0) {
//         return res.status(400).json({ error: "Invalid step index" });
//     }

//     // Validate newStep
//     if (!newStep || typeof newStep !== "string") {
//         return res.status(400).json({ error: "Invalid step content" });
//     }

//     try {
//         const caseDoc = await Case.findById(id);
//         if (!caseDoc) {
//             return res.status(404).json({ error: "Case not found" });
//         }

//         console.log("📄 Found case:", caseDoc);
//         console.log("📋 Steps length:", caseDoc.steps.length);


//         // Check if stepIndex is within bounds
//         if (stepIndexNum >= caseDoc.steps.length) {
//             console.log(`🚫 Step index ${stepIndexNum} out of bounds. Only ${caseDoc.steps.length} steps.`);
//             return res.status(400).json({ error: "Step index out of range" });
//         }

//         caseDoc.steps[stepIndexNum] = newStep;
//         await caseDoc.save();
//         res.json(caseDoc);
//     } catch (err) {
//         console.error("Error updating step:", err);
//         res.status(500).json({ error: "Step update failed" });
//     }
// };
exports.editStep = async (req, res) => {
  const { caseId, stepIndex } = req.params;
  const { newStep } = req.body;

  const caseIdInt = parseInt(caseId);
  const stepIdx = parseInt(stepIndex);

  if (isNaN(caseIdInt) || isNaN(stepIdx)) {
    return res.status(400).json({ message: 'Invalid caseId or stepIndex' });
  }

  if (!newStep || typeof newStep !== 'string') {
    return res.status(400).json({ message: 'newStep must be a string' });
  }

  try {
    // 📝 Log for debugging
    console.log("🛠️ Editing step", stepIdx, "for caseId", caseIdInt);

    const steps = await prisma.step.findMany({
      where: { caseId: caseIdInt },
      orderBy: { id: 'asc' }
    });

    if (stepIdx < 0 || stepIdx >= steps.length) {
      return res.status(404).json({ message: 'Step index out of range' });
    }

    const stepToUpdate = steps[stepIdx];

    const updatedStep = await prisma.step.update({
      where: { id: stepToUpdate.id },
      data: { content: newStep }
    });

    const updatedSteps = await prisma.step.findMany({
      where: { caseId: caseIdInt },
      orderBy: { id: 'asc' }
    });

    const stepStrings = updatedSteps.map(step => step.content);

    res.status(200).json({
      message: 'Step updated successfully',
      steps: stepStrings
    });

  } catch (error) {
    console.error("❌ Error in editStep:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};





// DELETE: Delete a step
// exports.deleteStep = async (req, res) => {
//     const { id, stepIndex } = req.params;

//     try {
//         const caseDoc = await Case.findById(id);
//         caseDoc.steps.splice(stepIndex, 1); // remove one element
//         await caseDoc.save();
//         res.json(caseDoc);
//     } catch (err) {
//         res.status(500).json({ error: 'Step deletion failed' });
//     }
// };
exports.deleteStep = async (req, res) => {
    const { id, stepIndex } = req.params;
    const caseId = parseInt(id);
    const stepIdx = parseInt(stepIndex);

    if (isNaN(caseId) || isNaN(stepIdx)) {
        return res.status(400).json({ message: 'Invalid caseId or stepIndex' });
    }

    try {
        // 🔍 Get all steps of the case
        const steps = await prisma.step.findMany({
            where: { caseId },
            orderBy: { id: 'asc' }
        });

        if (stepIdx < 0 || stepIdx >= steps.length) {
            return res.status(404).json({ message: 'Step index out of range' });
        }

        const stepToDelete = steps[stepIdx];

        // 🗑️ Delete the step
        await prisma.step.delete({
            where: { id: stepToDelete.id }
        });

        // ✅ Return updated list of steps
        const updatedSteps = await prisma.step.findMany({
            where: { caseId },
            orderBy: { id: 'asc' }
        });

        const stepStrings = updatedSteps.map(step => step.content);

        res.status(200).json({
            message: 'Step deleted successfully',
            steps: stepStrings
        });

    } catch (err) {
        console.error("❌ Error deleting step:", err);
        res.status(500).json({ error: 'Step deletion failed' });
    }
};


exports.updateMappedSteps = async (req, res) => {
    try {
        const { id } = req.params;
        const { mapped_steps } = req.body;

        const updatedCase = await Case.findByIdAndUpdate(
            id,
            { mapped_steps, updatedAt: Date.now() },
            { new: true }
        );

        if (!updatedCase) {
            return res.status(404).json({ message: "Case not found" });
        }

        res.status(200).json(updatedCase);
    } catch (err) {
        console.error("❌ Error updating mapped steps:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};