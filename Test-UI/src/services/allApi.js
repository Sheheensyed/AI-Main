import { commonApi } from './commonApi';
import { serverUrl, serverUrlFastApi } from './serverURL';


// Node Backend
export const addCase = (body) => {
  return commonApi('POST', `${serverUrlFastApi}/generate-steps`, body);
};

export const addNewStep = (caseId, newStepObj) => {
  console.log("⬆️ Sending step to case ID:", caseId); // add this
  return commonApi('POST', `${serverUrlFastApi}/case/${caseId}/step`, newStepObj);
};

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
  return commonApi("GET", `${serverUrl}/cases/${id}`);
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