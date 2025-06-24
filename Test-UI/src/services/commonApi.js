import axios from "axios"

export const commonApi = async (httpRequest, url, reqBody, reqHeader) => {
    const reqConfig = {
        method: httpRequest,
        url,
        data: reqBody,
        headers: reqHeader ? reqHeader : { 'Content-Type': 'application/json' }
    };

    console.log("⬇️ Axios Request Config:");
    console.log(JSON.stringify(reqConfig, null, 2)); // This helps you see the exact data

    return await axios(reqConfig).then((result) => {
        return result
    }).catch((err) => {
         console.error("❌ Axios Error:", err);
        return err
    })
}