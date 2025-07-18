// const { default: mongoose } = require('mongoose');
const Case = require('../model/case')
const runPythonScript = require("../services/pythonService")
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();




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
// exports.getCase = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const foundCase = await prisma.case.findUnique({
//             where: { id: parseInt(req.params.id) },
//             include: { steps: true, mapped_steps: true }
//         });
//         res.json(foundCase);
//         console.log("Fetched Case:", foundCase);
//     } catch (err) {
//         res.status(404).json({ error: 'Case not found' });
//     }
// };



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