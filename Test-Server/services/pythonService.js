const { spawn } = require("child_process")

const runPythonScript = (objectId, device, model) => {
    return new Promise((res, rej) => {
        const process = spawn('python', ['python/generate-steps.py', objectId, device, model])

        let result = '';
        let error = '';

        process.stdout.on('data', (data) => {
            result += data.toString()
        });
        process.stderr.on('data', (data) => {
            error += data.toString()
        });
        process.on('close', (code) => {
            if (code !== 0 || error) {
                return rej(new Error(error || `Python exited with code ${code}`));
            }

            try {
                const parsed = JSON.parse(result);
                res(parsed);
            } catch (err) {
                rej(new Error("Invalid JSON from Python script: " + err.message));
            }
        });

    })
}
module.exports = runPythonScript