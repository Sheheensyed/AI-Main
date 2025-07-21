import { faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import {
    deleteCase,
    deleteStep,
    deleteTemplate,
    getAllCases,
    getAllSteps,
    getAllTemplates
} from '../services/allApi';

function Db() {
    const [cases, setCases] = useState([]);
    const [steps, setSteps] = useState([]);
    const [templates, setTemplates] = useState([]);

    // Fetch all data
    const fetchData = async () => {
        try {
            const [caseRes, stepRes, templateRes] = await Promise.all([
                getAllCases(),
                getAllSteps(),
                getAllTemplates(),
            ]);
            setCases(caseRes.data);
            setSteps(stepRes.data);
            setTemplates(templateRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Delete Case
    const handleDeleteCase = async (caseId) => {
        const confirmed = window.confirm("Are you sure you want to delete this case?");
        if (!confirmed) return;

        try {
            await deleteCase(caseId);
            alert(`Case ${caseId} deleted successfully`);
            fetchData();
        } catch (err) {
            console.error("Error deleting case:", err);
            alert("Failed to delete case");
        }
    };


    // Delete Step
    const handleDeleteStep = async (stepId) => {
        const confirmed = window.confirm("Are you sure you want to delete this step?");
        if (!confirmed) return;

        try {
            await deleteStep(stepId);
            alert(`Step ${stepId} deleted successfully`);
            fetchData();
        } catch (err) {
            console.error("Error deleting step:", err);
            alert("Failed to delete step");
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        const confirmed = window.confirm("Are you sure you want to delete this template?");
        if (!confirmed) return;

        try {
            await deleteTemplate(templateId);
            alert(`Template ${templateId} deleted successfully`);
            fetchData();
        } catch (err) {
            console.error("Error deleting template:", err);
            alert("Failed to delete template");
        }
    };


    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className='mt-5 p-2'>
            <div className="container mt-5 bg-light">
                <div className="row text-center">

                    {/* === CASE TABLE === */}
                    <div className="col-md-6 col-lg-12 mb-5">
                        <h4 className='text-center'>Case</h4>
                        <table className='table table-bordered table-responsive'>
                            <thead>
                                <tr>
                                    <th>Id#</th>
                                    <th>Project Name</th>
                                    <th>Device</th>
                                    <th>Model</th>
                                    <th>User_Query</th>
                                    <th>CreatedAt</th>
                                    <th>CreatedAtFormatted</th>
                                    <th>Template_Id</th>
                                    <th>Dut_1</th>
                                    <th>Dut_2</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.project_name}</td>
                                        <td>{item.device}</td>
                                        <td>{item.model}</td>
                                        <td>{item.user_query}</td>
                                        <td>{item.createdAt}</td>
                                        <td>{item.createdAtFormatted}</td>
                                        <td>{item.template_id}</td>
                                        <td>{item.dut_1}</td>
                                        <td>{item.dut_2}</td>
                                        <td>
                                            <FontAwesomeIcon
                                                icon={faX}
                                                className='text-danger'
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleDeleteCase(item.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* === STEP TABLE === */}
                    <div className="col-md-6 col-lg-12 mb-5">
                        <h4 className='text-center'>Step</h4>
                        <table className='table table-bordered table-responsive'>
                            <thead>
                                <tr>
                                    <th>Id#</th>
                                    <th>Content</th>
                                    <th>Case_Id</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {steps.map((step) => (
                                    <tr key={step.id}>
                                        <td>{step.id}</td>
                                        <td>{step.content}</td>
                                        <td>{step.caseId}</td>
                                        <td>
                                            <FontAwesomeIcon
                                                icon={faX}
                                                className='text-danger'
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleDeleteStep(step.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* === TEMPLATE TABLE === */}
                    <div className="col-md-6 col-lg-12 mb-5">
                        <h4 className='text-center'>Templates</h4>
                        <table className='table table-bordered table-responsive'>
                            <thead>
                                <tr>
                                    <th>Id#</th>
                                    <th>Content</th>
                                    <th>CreatedAt</th>
                                    <th>ProjectName</th>
                                    <th>Duts</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((tpl) => (
                                    <tr key={tpl.id}>
                                        <td>{tpl.id}</td>
                                        <td>{tpl.content}</td>
                                        <td>{tpl.createdAt}</td>
                                        <td>{tpl.projectName}</td>
                                        <td>{tpl.duts}</td>
                                        <td>
                                            <FontAwesomeIcon
                                                icon={faX}
                                                className='text-danger'
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleDeleteTemplate(tpl.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Db;
