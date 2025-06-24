const { default: mongoose } = require('mongoose');
const Case = require('../model/case')
const runPythonScript = require("../services/pythonService")

exports.generateSteps = async (req, res) => {
    try {
        const { device, model, user_query } = req.body
        console.log("Received Prompt:", user_query);

        //  save case to db
        const newCase = await Case.create({ device, model, user_query })

        // send prompt to AI Backend
        // const aiResponse = await axios.post('http://localhost:4000/generate-steps', { user_query: user_query })


        // ✅ Step 2: Run your local Python script
        const pythonOutput = await runPythonScript(newCase._id.toString(), device, model);

        // extract steps from response
        // const steps = aiResponse.data.steps

        // const steps = [
        //     "Power off the device.",
        //     "Remove the screws near the charging port.",
        //     "Use a suction tool to lift the screen.",
        //     "Disconnect the battery.",
        //     "Detach the display connectors.",
        //     "Replace with the new display and reassemble."
        // ];

        // save steps to the case
        // newCase.steps = steps;
        newCase.steps = pythonOutput.steps;
        await newCase.save()

        res.status(201).json(newCase)
    } catch (error) {
        console.log(`Error in Generation Steps:`, error);
        res.status(500).json({ message: 'Error Generating Steps' })
    }
}

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
exports.getCase = async (req, res) => {
    try {
        const { id } = req.params;
        const foundCase = await Case.findById(id);
        res.json(foundCase);
    } catch (err) {
        res.status(404).json({ error: 'Case not found' });
    }
};

// PUT: Edit a step
exports.editStep = async (req, res) => {
    console.log("🔁 Received PUT body:", req.body);
    const { id, stepIndex } = req.params;
    const { newStep } = req.body;

    console.log("🆔 Case ID:", id);
    console.log("🔢 Step Index (from URL):", stepIndex);


    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid case ID" });
    }

    // Validate stepIndex
    const stepIndexNum = parseInt(stepIndex);
    if (isNaN(stepIndexNum) || stepIndexNum < 0) {
        return res.status(400).json({ error: "Invalid step index" });
    }

    // Validate newStep
    if (!newStep || typeof newStep !== "string") {
        return res.status(400).json({ error: "Invalid step content" });
    }

    try {
        const caseDoc = await Case.findById(id);
        if (!caseDoc) {
            return res.status(404).json({ error: "Case not found" });
        }

        console.log("📄 Found case:", caseDoc);
        console.log("📋 Steps length:", caseDoc.steps.length);


        // Check if stepIndex is within bounds
        if (stepIndexNum >= caseDoc.steps.length) {
            console.log(`🚫 Step index ${stepIndexNum} out of bounds. Only ${caseDoc.steps.length} steps.`);
            return res.status(400).json({ error: "Step index out of range" });
        }

        caseDoc.steps[stepIndexNum] = newStep;
        await caseDoc.save();
        res.json(caseDoc);
    } catch (err) {
        console.error("Error updating step:", err);
        res.status(500).json({ error: "Step update failed" });
    }
};

exports.addStep = async (req, res) => {
    const { id } = req.params;
    const { newStep } = req.body;

    if (!newStep || typeof newStep !== 'string') {
        return res.status(400).json({ message: 'newStep must be a string' });
    }

    try {
        const existingCase = await Case.findById(id);
        if (!existingCase) {
            return res.status(404).json({ message: 'Case not found' });
        }

        existingCase.steps.push(newStep); // ✅ Push string, not object
        await existingCase.save();

        res.status(200).json({ message: 'Step added successfully', updatedCase: existingCase });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE: Delete a step
exports.deleteStep = async (req, res) => {
    const { id, stepIndex } = req.params;

    try {
        const caseDoc = await Case.findById(id);
        caseDoc.steps.splice(stepIndex, 1); // remove one element
        await caseDoc.save();
        res.json(caseDoc);
    } catch (err) {
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