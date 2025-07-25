import { commonApi } from './commonApi';
import { serverUrl, serverUrlFastApi } from './serverURL';


export const addCase = (body) => {
  console.log("⬆️ Adding case:", body);
  return commonApi('POST', `${serverUrlFastApi}/generate-steps`, body);
};

export const addNewStep = (caseId, data) => {
  console.log("⬆️ Sending step to case ID:", caseId); // add this
  return commonApi('POST', `${serverUrlFastApi}/case/${caseId}/operation`, data);
};

// ✅ GET: Fetch all operations for a given case ID
export const getOperationsByCaseId = (caseId) => {
  console.log("📥 Fetching operations for case ID:", caseId);
  return commonApi('GET', `${serverUrlFastApi}/case/${caseId}/operation`);
};

// dlt oprtion
export const deleteOperation = (operationId) => {
  return commonApi("DELETE", `${serverUrlFastApi}/operation/${operationId}`);
};

export const addStepToOperation = (operationId, content) => {
  return commonApi('POST', `${serverUrlFastApi}/operation/${operationId}/step`, { content });
};

// To edit step under operations
export const updateStep = (stepId, content) => {
  return commonApi('PATCH', `${serverUrlFastApi}/step/${stepId}`, { content });
};

// To delete step under operatoins
export const deleteStepFromOperation = (operationId, stepId) => {
  console.log(`❌ Step deleted from operation : ${operationId} step : ${stepId}`,);
  return commonApi('DELETE', `${serverUrlFastApi}/operation/${operationId}/step/${stepId}`)
}




export const editSingleSteps = (caseId, stepIndex, updateStep) => {
  console.log("➡️ editSingleSteps() called with:", { caseId, stepIndex, updateStep });
  return commonApi('PUT', `${serverUrlFastApi}/case/${caseId}/step/${stepIndex}`, { newStep: updateStep })
}

export const deleteSingleSteps = (id, stepIndex) => {
  console.log("➡️ deleteSingleSteps() Deleted with:", { id, stepIndex });
  return commonApi('DELETE', `${serverUrlFastApi}/case/${id}/step/${stepIndex}`)
}

export const saveTemplateToDB = (projectName, content) => {
  return commonApi('POST', `${serverUrlFastApi}/active_template`, {
    projectName,
    content
  });
};

export const getAllTemplates = () => {
  return commonApi('GET', `${serverUrlFastApi}/templates`);
};


export const getDutsById = (templateId) => {
  return commonApi('GET', `${serverUrlFastApi}/duts/${templateId}`);
};


export const getAllCases = () => {
  return commonApi('GET', `${serverUrlFastApi}/cases`);
};

export const getAllSteps = () => {
  return commonApi('GET', `${serverUrlFastApi}/steps`);
};

export const deleteCase = (caseId) => {
  return commonApi("DELETE", `${serverUrlFastApi}/cases/${caseId}`);
};

export const deleteStep = (stepId) => {
  return commonApi("DELETE", `${serverUrlFastApi}/steps/${stepId}`);
};

export const deleteTemplate = (templateId) => {
  return commonApi("DELETE", `${serverUrlFastApi}/templates/${templateId}`);
};


// export const executeSteps = (data) => {
//   return commonApi('POST', `${serverUrl}/api/execute-mapping`, data);
// };

// export const updateMappedStepsInDB = (id, data) => {
//   return commonApi("PATCH", `${serverUrl}/case/${id}/mapped-steps`, data);
// };

// export const getCaseById = (caseId) => {
//   return commonApi('GET', `${serverUrl}/case/${caseId}`)
// }

export const getSingleCase = (id) => {
  console.log("getSingleCase :", id)
  return commonApi("GET", `${serverUrlFastApi}/cases/${id}/mapped-steps`);
};



// FastApi Backend
export const mapSteps = (caseId, steps) => {
  const body = {
    case_id: caseId,
    steps: steps
  };
  return commonApi('POST', `${serverUrlFastApi}/generate-mapped-steps`, body)
}

export const captureScreen = (body) => {
  return commonApi('POST', `${serverUrlFastApi}/execute_with_gemini`, body)
}

export const fallbackProcessStep = (step) => {
  const body = {
    step: step
  }
  return commonApi('POST', `${serverUrlFastApi}/fallback-ai-process`, body)
}