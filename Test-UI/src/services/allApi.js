import { commonApi } from './commonApi';
import { serverUrl, serverUrlFastApi } from './serverURL';

export const addCase = (body) => {
  return commonApi('POST', `${serverUrl}/generate-steps`, body);
};

export const editSingleSteps = (caseId, stepIndex, updateStep) => {
  return commonApi('PUT', `${serverUrl}/case/${caseId}/step/${stepIndex}`, { newStep: updateStep })
}

export const deleteSingleSteps = (id, stepIndex) => {
  return commonApi('DELETE', `${serverUrl}/case/${id}/step/${stepIndex}`)
}

export const addNewStep = (caseId, newStepObj) => {
  return commonApi('POST', `${serverUrl}/case/${caseId}/step`, newStepObj);
};

export const executeSteps = (data) => {
  return commonApi('POST', `${serverUrl}/api/execute-mapping`, data);
};

export const updateMappedStepsInDB = (id, data) => {
  return commonApi("PATCH", `${serverUrl}/case/${id}/mapped-steps`, data);
};

export const getCaseById = (caseId) => {
  return commonApi('GET', `${serverUrl}/case/${caseId}`)
}

export const mapSteps = (caseId, steps) => {
  const body = {
    case_id: caseId,
    steps: steps
  };
  return commonApi('POST', `${serverUrlFastApi}/generate-mapped-steps`, body)
}

export const getSingleCase = (id) => {
  return commonApi("GET", `${serverUrl}/cases/${id}`);
};
