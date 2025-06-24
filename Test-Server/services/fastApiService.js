const axios = require("axios");

async function sendToFastAPI(steps, caseId) {
    try {
        const response = await axios.post("http://127.0.0.1:8000/generate-mapped-steps", {
            steps: steps,
            case_id: caseId
        });
        console.log("Mapped Steps from FastAPI:", response.data.mapped_steps);
        return response.data;
    } catch (error) {
        console.error("Error calling FastAPI:", error.message);
        throw error; // this triggers 500 in mappingRoute.js
    }
}

module.exports = { sendToFastAPI };
