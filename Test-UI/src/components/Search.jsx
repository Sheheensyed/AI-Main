import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import DeviceContext from '../context/Temp';
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { addCase, addNewStep, deleteSingleSteps, editSingleSteps, getSingleCase, mapSteps, saveTemplateToDB } from '../services/allApi';
import { useMappedSteps } from '../context/MappedStepContext';
import { debounce } from 'lodash';
import { useStepContext } from '../context/StepContext';


function Search() {
    const { device, setDevice, model, setModel } = useContext(DeviceContext)
    const navigate = useNavigate()
    const [error, setError] = useState(false)
    const { steps, setSteps } = useStepContext();
    const [loading, setLoading] = useState(false)
    const [mapping, setMapping] = useState(false)
    const [editSteps, setEditSteps] = useState('')
    const [caseId, setCaseId] = useState('');
    const { setMappedSteps } = useMappedSteps();
    const [show, setShow] = useState(false);
    const [showSteps, setShowSteps] = useState(false);
    const textareaRef = useRef(null)
    const [userQuery, setUserQuery] = useState('')
    const [projectName, setProjectName] = useState('')
    const [createdProject, setCreatedProject] = useState('')
    const [isProjectCreated, setIsProjectCreated] = useState(false)
    // const [contents, setContents] = useState('')
    // const [text, setText] = useState('')

    // console.log(userQuery);

    const handleClear = () => {
        localStorage.removeItem('caseId')
    }

    const handleText = (ev) => {
        setUserQuery(ev);
    }

    const handleCreate = async () => {
        if (projectName.trim() !== '') {
            const trimmedProjectName = projectName.trim();

            try {
                // Step 1: Get the active template from backend
                const res = await fetch(VITE_ACTIVE_TEMPLATE);
                const content = await res.json();

                console.log("🎯 Active template fetched:", content);

                // Step 2: Send projectName + content to your backend
                const response = await saveTemplateToDB(trimmedProjectName, content);
                console.log("✅ Template saved to DB:", response.data);

                const templateId = response.data.id;  // ✅ Save this ID
                localStorage.setItem("templateId", templateId);  // ✅ Store it for later

                // Step 3: Proceed with local state update
                setCreatedProject(trimmedProjectName);
                localStorage.setItem("projectName", trimmedProjectName);
                setProjectName('');
                setIsProjectCreated(true);
            } catch (err) {
                console.error("❌ Error creating project:", err);
            }
        }
    };

    const [activeTemplate, setActiveTemplate] = useState(null);
    const VITE_ACTIVE_TEMPLATE = import.meta.env.VITE_ACTIVE_TEMPLATE;

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await fetch(VITE_ACTIVE_TEMPLATE);
                const data = await response.json(); // assumes the endpoint returns JSON
                console.log("✅ Active Template Data:", data);
                setActiveTemplate(data);
            } catch (error) {
                console.error("❌ Failed to fetch active template:", error);
            }
        };

        fetchTemplate();
    }, [VITE_ACTIVE_TEMPLATE]);


    const handleSaveChanges = async () => {
        try {
            const updatePromises = editSteps.map((step, index) => {
                if (step !== steps[index]) {
                    const payload = { newStep: step };
                    console.log(`📦 Sending update for step ${index}:`, payload);
                    return editSingleSteps(caseId, index, step); // Only send if edited
                }
                return null;
            });

            const results = await Promise.all(updatePromises.filter(Boolean));
            console.log("✅ Updated steps:", results);

            setSteps([...editSteps]); // Update UI after success
        } catch (error) {
            console.log("❌ Error updating step:", error);
        }

        setShow(false);
    };

    const handleClose = () => {
        setShow(false)
    };

    const handleShow = () => {
        setEditSteps([...steps])
        setShow(true)
    };




    const handleSubmit = async (e) => {
        // e.preventDefault()
        // if (!userQuery || !device) {
        //     alert('Please enter both prompt and device');
        //     return;
        // }
        setLoading(true)
        setMapping(true)
        setShowSteps(false)
        const templateId = localStorage.getItem("templateId");

        const add = {
            project_name: createdProject,
            device: device,
            model: model,
            user_query: userQuery,
             template_id: parseInt(templateId) 
        };

        if (!device) {
            setError(true)
            return;
        }
        try {
            console.log("Payload being sent:", add);

            const response = await addCase(add)
            if (response.status === 200) {
                console.log(`Case created :`, response.data);
                setSteps(response.data.steps)
                setEditSteps(response.data.steps)
                setCaseId(response.data._id)
                localStorage.setItem("caseId", response.data.id); // ✅ Save to localStorage
                localStorage.setItem("steps", JSON.stringify(response.data.steps));
            } else {
                console.log(`Unexpected Response : `, response);
            }
            setShowSteps(true)
        } catch (error) {
            console.log(`Error saving to backend :`, error);
        }
        finally {
            setLoading(false)
            setMapping(false)
        }
    }

    const handleDeviceChange = (e) => {
        setDevice(e.target.value);
        setSteps([]);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleDeleteStep = async (index) => {
        const caseId = localStorage.getItem('caseId')
        try {
            await deleteSingleSteps(caseId, index);
            const newSteps = [...editSteps];
            newSteps.splice(index, 1);
            setEditSteps(newSteps);
        } catch (error) {
            console.log("Error deleting step:", error);
        }
    };

    // const handleStepChange = (index, newValue) => {
    //     const updateSteps = [...editSteps]
    //     updateSteps[index] = newValue;
    //     setEditSteps(updateSteps)
    // }




    const handleStepChange = async (caseId, index, newStep) => {
        console.log("🔍 handleStepChange params:", { caseId, index, newStep });
        console.log("🔍 caseId type:", typeof caseId);
        console.log("🔍 caseId value:", caseId);

        const updatedSteps = [...editSteps];
        updatedSteps[index] = { ...updatedSteps[index], content: newStep };
        setEditSteps(updatedSteps);
        debouncedSave(caseId, index, newStep);
    };

    const debouncedSave = debounce(async (caseId, index, newStep) => {
        // Fallback to localStorage if caseId is not provided
        const finalCaseId = caseId || localStorage.getItem('caseId');

        if (!finalCaseId) {
            console.error("❌ caseId is missing from both arguments and localStorage");
            return;
        }

        console.log("🔍 Using caseId:", finalCaseId);

        try {
            await editSingleSteps(finalCaseId, index, newStep);
            console.log("✅ Step auto-saved");
        } catch (error) {
            console.error("❌ Error in editSingleSteps:", error);
        }
    }, 500);


    const handleAddStep = async () => {
        const caseId = localStorage.getItem("caseId");
        if (!caseId) {
            console.error("❌ caseId is undefined");
            return;
        }

        try {
            const response = await addNewStep(caseId, { content: "New Step" });

            const updatedSteps = response.data.steps;

            setEditSteps(
                updatedSteps.map((step, i) => {
                    // If step is just a string:
                    if (typeof step === "string") {
                        return { id: i + 1, content: step };
                    }
                    // If already an object:
                    return { id: step.id ?? i + 1, content: step.content };
                })
            );

            console.log("✅ Step added:", updatedSteps);
        } catch (error) {
            console.error("❌ Error adding step:", error);
        }
    };





    const handleReset = () => {
        setDevice('');
        setModel('');
        setUserQuery('');
        setSteps([]);
        setEditSteps([]);
        setCaseId('');
        setShowSteps(false);
        setError(false);
        setMappedSteps([]);
        setIsProjectCreated(false)
        localStorage.removeItem('caseId');
        localStorage.removeItem('steps');
        localStorage.removeItem('projectName');
        localStorage.removeItem('Device');
    };


    const handleExecute = async () => {
        try {
            setMapping(true)
            const id = caseId || localStorage.getItem("caseId");
            const cleanedSteps = steps.filter(step => step.trim() !== "");
            const response = await mapSteps(id, cleanedSteps);
            if (response.data && response.data.case_id) {
                const updatedCase = await getSingleCase(response.data.case_id); // 👈 fetch updated case
                setCaseId(updatedCase._id);
                setSteps(updatedCase.steps); // 👈 just in case steps changed
                console.log("Steps from backend:", Array.isArray(response.data.steps), response.data.steps);
                setMappedSteps(updatedCase.mapped_steps); // 👈 set mapped steps
                navigate(`/lists/${response.data.case_id}`); // ✅ Go to /list after successful mapping
            }
        } catch (error) {
            console.log(error);
        } finally {
            setMapping(false)
        }
    };


    useEffect(() => {
        setDevice('');
        setError(false)
        // localStorage.removeItem('caseId')
    }, []);

    // useEffect(()=>{
    //     const savedSteps=localStorage.getItem('steps')
    //     if(savedSteps){
    //         setSteps(JSON.parse(savedSteps))
    //     }
    // },[])
    useEffect(() => {
        const savedCaseId = localStorage.getItem('caseId');
        if (savedCaseId) {
            getSingleCase(savedCaseId)
                .then(res => {
                    setSteps(res.data.steps);
                    setCaseId(res.data._id);
                })
                .catch(console.error);
        }

    }, []);

    useEffect(() => {
        return () => {
            debouncedSave.cancel();
        };
    }, []);


    return (
        <>



            <div className='d-flex mt-5 vh-100 w-100 justify-content-center align-items-center flex-column'>

                {!isProjectCreated && (
                    <div className='border-info my-5 w-50 p-1 rounded-4' style={{
                        border: "0.5px solid transparent",
                        backgroundImage:
                            "linear-gradient(white, white), linear-gradient(-45deg,rgb(108, 110, 233),rgba(100, 93, 227, 0.75),rgb(0, 140, 255),rgb(0, 183, 255))",
                        backgroundClip: "content-box, border-box"
                    }} >
                        <h3
                            //  hidden={steps.length>0}
                            className="text-center fw-bold mt-2"
                            style={{
                                background:
                                    "linear-gradient(-25deg,rgb(108, 110, 233),rgba(100, 93, 227, 0.75),rgb(0, 140, 255),rgb(0, 183, 255))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}>
                            Quaco AI Project
                        </h3>
                        <div className='p-3'>

                            <input type="text" placeholder='Enter Project Name Here' value={projectName} onChange={(e) => setProjectName(e.target.value)} className='form-control' />
                            <div className='d-flex justify-content-center align-items-center my-2'>
                                <button onClick={handleCreate} className=' ms-2' style={{
                                    height: '35px',
                                    width: '30%',
                                    // display: 'inline-flex',
                                    boxSizing: 'border-box',
                                    letterSpacing: '0.05857em',
                                    boxShadow: 'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
                                    color: 'white',
                                    fontSize: '1em',
                                    outline: 0,
                                    border: 'none',
                                    // transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                                    background: 'linear-gradient(135deg, rgba(51, 191, 255) -26.55%, rgba(93, 92, 229) 93.75%)',
                                    cursor: 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    borderRadius: '8px',
                                }}>Create Project</button>
                            </div>
                        </div>
                    </div>
                )}

                {isProjectCreated && !loading && (
                    // {!loading && !steps.length && (
                    <>

                        <div
                            className="border border-1 m-0 p-1 w-50 rounded-4 shadow-sm"
                            style={{
                                border: "0.5px solid transparent",
                                backgroundImage:
                                    "linear-gradient(white, white), linear-gradient(-45deg,rgb(108, 110, 233),rgba(100, 93, 227, 0.75),rgb(0, 140, 255),rgb(0, 183, 255))",
                                backgroundClip: "content-box, border-box"
                            }}>
                            <h3
                                //  hidden={steps.length>0}
                                className="text-center fw-bold mt-2"
                                style={{
                                    background:
                                        "linear-gradient(-25deg,rgb(108, 110, 233),rgba(100, 93, 227, 0.75),rgb(0, 140, 255),rgb(0, 183, 255))",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}>
                                Quaco AI Project
                            </h3>

                            <p className='text-center'>Project Name : {createdProject}</p>

                            <h6 hidden={steps.length > 0} className="mt-4 text-center">
                                Select Device Under Test (DUT) <span className="text-danger">*</span>
                            </h6>

                            <div className='d-flex justify-content-center mx-5'>
                                <select className={`form-select ${error ? "border border-danger border-2" : device ? "border border-primary border-1" : ""
                                    }, my-3 w-50 ms-5 me-1  text-center m-auto`}
                                    value={device}
                                    onChange={handleDeviceChange}
                                    style={{
                                        // width: "100%",
                                        padding: "8px",
                                        borderRadius: "5px",
                                        border: "1px solid #ccc",
                                        appearance: "none", // removes default arrow in some browsers
                                    }}>
                                    <option value="" disabled>
                                        Choose DUT A
                                    </option>
                                    <option value="IPhone">Iphone</option>
                                    <option value="Nothing">Nothing</option>
                                    <option value="Moto">Moto</option>
                                    <option value="Samsung">Samsung</option>
                                </select>
                                <select
                                    className={`form-select ${error
                                        ? "border border-danger border-2"
                                        : device
                                            ? "border border-primary border-1"
                                            : ""
                                        }, my-3 w-50 me-5 ms-1 text-center m-auto`}
                                    value={device}
                                    onChange={handleDeviceChange}
                                    style={{
                                        // width: "100%",
                                        padding: "8px",
                                        borderRadius: "5px",
                                        border: "1px solid #ccc",
                                        appearance: "none", // removes default arrow in some browsers
                                    }}
                                >
                                    <option value="" disabled>
                                        Choose DUT B
                                    </option>
                                    <option value="IPhone">Iphone</option>
                                    <option value="Nothing">Nothing</option>
                                    <option value="Moto">Moto</option>
                                    <option value="Samsung">Samsung</option>
                                </select>

                            </div>

                            <form
                                className="w-100 text-center"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (device && userQuery.trim()) {
                                        handleSubmit();
                                    }
                                }}
                            >
                                <div className='d-flex justify-content-center'>
                                    <textarea
                                        ref={textareaRef}
                                        type="text"
                                        value={userQuery}
                                        rows={3}
                                        placeholder="Enter Your Prompt"
                                        className="form-control mb-3 w-75 border border-black rounded-3 shadow-sm"
                                        onChange={(e) => setUserQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                if (device && userQuery.trim()) {
                                                    handleSubmit();
                                                }
                                            }
                                        }}
                                    />

                                </div>
                                <div className='d-flex mb-3'>
                                    <input type="text" value='Find IOS Version' className='form-control ms-2' onFocus={(e) => { handleText(e.target.value) }} readOnly />
                                    <input type="text" value='Find Device Storage' className='form-control mx-2' onFocus={(e) => { handleText(e.target.value) }} readOnly />
                                    <input type="text" value='Find Model Name' className='form-control me-2' onFocus={(e) => { handleText(e.target.value) }} readOnly />
                                </div>
                                <button
                                    hidden={steps.length > 0}
                                    className={`mx-3 my-3 px-5`}
                                    disabled={!userQuery || !device || loading}
                                    type='submit' style={{
                                        height: '35px',
                                        // display: 'inline-flex',
                                        boxSizing: 'border-box',
                                        letterSpacing: '0.05857em',
                                        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
                                        color: 'white',
                                        fontSize: '1em',
                                        outline: 0,
                                        border: 'none',
                                        // transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: (!userQuery.trim() || !device)
                                            ? '#999' // Grey when disabled
                                            : 'linear-gradient(135deg, rgba(51, 191, 255) -26.55%, rgba(93, 92, 229) 93.75%)',
                                        cursor: (!userQuery.trim() || !device) ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1,
                                        borderRadius: '8px',
                                    }}
                                >
                                    Generate
                                </button>
                                {/* <button type='button'
                                    className={`btn ${steps.length > 0 ? "btn-danger" : "btn-secondary"
                                        } mx-3 my-3 px-5`}
                                    disabled={steps===0}
                                    onClick={handleReset}
                                >
                                    Reset
                                </button> */}

                                {/* <button type='button' className="btn btn-warning" onClick={handleClear}>
                                    Clear Id
                                </button> */}
                            </form>

                        </div>


                    </>
                )}



                {/* )} */}
                {(loading || mapping) ? (
                    <div className="d-flex justify-content-center align-items-center mt-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-2 text-primary">{loading ? 'Generating steps...' : "Mapping Steps"}</span>
                    </div>
                ) : steps?.length > 0 ? (
                    <div className=' w-50 mt-3 shadow-lg rounded-4' style={{ padding: '4px', border: '0.5px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(-45deg,rgb(108, 110, 233),rgba(100, 93, 227, 0.75),rgb(0, 140, 255),rgb(0, 183, 255))', backgroundClip: 'content-box, border-box' }}>
                        <h5 className='text-center my-2'>Generated Steps</h5>

                        <ol>
                            {/* {steps.map((item, index) => (
                                <li className='text-center' key={index}> {item} </li>
                            ))} */}

                            {
                                Array.isArray(editSteps) && editSteps?.map((step, index) => (
                                    <li className='text-center d-flex align-items-center my-3' key={index}>
                                        <span className='me-4'>{index + 1}</span> <input type="text" className='form-control' value={step?.content ?? ""} onChange={(e) => { handleStepChange(caseId, index, e.target.value) }} />
                                        <FontAwesomeIcon className='text-danger mx-4' onClick={(() => handleDeleteStep(index))} style={{ cursor: 'pointer' }} icon={faXmark} />
                                    </li>
                                ))

                            }


                        </ol>


                        <div className='d-flex justify-content-center align-items-center my-2'>
                            <button className='btn btn-warning' hidden onClick={handleShow}>Edit</button>
                            <button className='btn btn-outline-success px-4' onClick={handleAddStep}> Add Step</button>
                            <button type='button'
                                className='btn btn-outline-danger mx-3 px-5'
                                disabled={steps.length === 0}
                                onClick={handleReset}
                            >
                                Reset
                            </button>
                            <button className=' px-5' onClick={handleExecute} style={{
                                height: '35px',
                                // display: 'inline-flex',
                                boxSizing: 'border-box',
                                letterSpacing: '0.05857em',
                                boxShadow: 'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
                                color: 'white',
                                fontSize: '1em',
                                outline: 0,
                                border: 'none',
                                // transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                                background: 'linear-gradient(135deg, rgba(51, 191, 255) -26.55%, rgba(93, 92, 229) 93.75%)',
                                cursor: 'pointer',
                                opacity: loading ? 0.7 : 1,
                                borderRadius: '8px',
                            }} >Build</button>


                        </div>
                    </div>
                ) : null}

                {/* Edit */}
                {/* <Modal show={show} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Steps</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ul>
                            {
                                Array.isArray(editSteps) && editSteps?.map((item, index) => (
                                    <li className='text-center d-flex align-items-center my-3' key={index}>
                                        <input type="text" className='form-control' value={item} onChange={(e) => { handleStepChange(index, e.target.value) }} />
                                        <FontAwesomeIcon className='text-danger mx-2' onClick={(() => handleDeleteStep(index))} style={{ cursor: 'pointer' }} icon={faXmark} />
                                    </li>
                                ))

                            }

                        </ul>
                        <div className='d-flex justify-content-center'>
                            <button className='btn btn-primary' onClick={handleAddStep}>
                                Add Step
                            </button>


                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSaveChanges}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal> */}


            </div>
        </>
    )
}

export default Search