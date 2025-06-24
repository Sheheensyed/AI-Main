const axios = require("axios");

const runMapping = async (req, res) => {
    try {
        const response = await axios.post("http://localhost:8000/map-steps");
        res.status(200).json(response.data);
    } catch (err) {
        console.error("Error calling FastAPI:", err.message);
        res.status(500).json({ error: "Failed to map steps" });
    }
};

module.exports = { runMapping };
