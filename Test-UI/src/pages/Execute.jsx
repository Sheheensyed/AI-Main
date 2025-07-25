import React, { useEffect, useState } from 'react';
import { addCase, getSingleCase } from '../services/allApi';
import { Link, useParams } from 'react-router-dom';
import SplitPane from 'react-split-pane';
import '../styles/split-pane.css';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import logo from '../assets/logo-3.png.webp'
import QAi from '../assets/Quaco AI Studio Gradiant Black Logo.png'
import QAi_White from '../assets/Quaco AI Studio Gradiant White Logo.png'
import { CaseContext } from '../context/CaseContext';
import Left_Panel from '../components/Left_Panel';
import Center_Panel from '../components/Center_Panel';
import Right_Panel from '../components/Right_Panel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faMobileScreenButton } from '@fortawesome/free-solid-svg-icons';

function Execute() {
    const { id: caseId } = useParams();
    const [steps, setSteps] = useState([]);
    const [mappedSteps, setMappedSteps] = useState([]);
    const [query, setQuery] = useState('');
    const [count, setCount] = useState(0);
    const [consoleLog, setConsoleLog] = useState([])
    const [active, setActive] = useState(null)
    const [executeSteps, setExecuteSteps] = useState([])
    const [activeStepIndex, setActiveStepIndex] = useState(null)



    useEffect(() => {
        const fetchCase = async () => {
            try {
                const res = await getSingleCase(caseId);
                console.log(res.data);
                
                
                
                setSteps(res.data.steps || []);
                setCount(res.data.steps?.length || 0);
                setMappedSteps(res.data.mapped_steps || []);
                setQuery(res.data.user_query);
            } catch (error) {
                console.error('Failed to fetch case:', error);
            }
        };

        if (caseId) fetchCase();
    }, [caseId]);

    return (
        <>
            {/* <Navbar className="bg-body-tertiary" fixed="top" style={{ zIndex: 1 }}>
                <Container fluid className=" d-flex align-items-center justify-content-between">
                    {/* Logo Left */}
                    {/* <Navbar.Brand className="ms-3">
                        <Link to="/">
                            <img
                                alt=""
                                src={QAi}
                                width="170"
                                height="50"
                                className=""
                            />
                        </Link> */}
                    {/* </Navbar.Brand> */}

                    {/* Toolbar Center */}
                    {/* <div
                        className="position-absolute start-50 translate-middle-x d-flex justify-content-between align-items-center rounded-2"
                        id="toolbar"
                        style={{height:"45px",
                            // border: '2px solid transparent',
                            // padding: '3px 1px',
                            // backgroundImage:
                            //     'linear-gradient(white, white), linear-gradient(-45deg, rgb(108, 110, 233), rgba(100, 93, 227, 0.75), rgb(0, 140, 255), rgb(0, 183, 255))',
                            // backgroundOrigin: 'border-box',
                            // backgroundClip: 'content-box, border-box',
                            // animation: 'anime 5s ease infinite alternate',
                            // backgroundSize: '200% 200%',
                             boxShadow: "#8CC9FF 0px 0px 0.15em, #8CC9FF 0px 0.15em 0.5em"
                        }}
                    > */}
                        {/* <div hidden className="mx-3">
                            <i className="bi bi-phone fs-4"></i>
                        </div>
                        <div hidden className="mx-3">
                            <i className="bi bi-camera fs-4"></i>
                        </div>
                        <div hidden className="mx-3">
                            <i className="bi bi-webcam fs-4"></i>
                        </div>
                    </div> */}

                    {/* Home Right */}
                    {/* <Link to="/" className="me-3">
                        <button className="btn btn-outline-primary">Home</button>
                    </Link> */}
                {/* </Container> */}
            {/* </Navbar> */} 



            <CaseContext.Provider value={{ steps, query, count, mappedSteps, consoleLog, setConsoleLog, active, setActive, executeSteps, setExecuteSteps, activeStepIndex, setActiveStepIndex }}>
                <div style={{
                    // height: '100vh'
                    height: ''
                }} className='mt-5' onContextMenu={(e) => e.preventDefault()}>
                    <SplitPane split="vertical" defaultSize="25%" minSize={200} style={{ zIndex: '0' }}>
                        {/* Left Panel: Generated Steps */}
                        <Left_Panel />

                        {/* Center and Right Split */}
                        <SplitPane split="vertical" defaultSize="70%" minSize={300}>
                            {/* CENTER PANEL + CONSOLE */}
                            <Center_Panel />

                            {/* Right Panel: Robot Framework */}
                            <Right_Panel />
                        </SplitPane>
                    </SplitPane>
                </div>
            </CaseContext.Provider>

        </>
    );
}

export default Execute;
