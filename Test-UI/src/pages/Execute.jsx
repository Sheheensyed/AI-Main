import React, { useEffect, useState } from 'react';
import { getSingleCase } from '../services/allApi';
import { useParams } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import SplitPane from 'react-split-pane';
import '../styles/split-pane.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsUpDownLeftRight, faCamera, faCrosshairs, faHand, faLightbulb, faMobile, faMobileScreenButton } from '@fortawesome/free-solid-svg-icons';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import logo from '../assets/logo-3.png.webp'
import { CaseContext } from '../context/CaseContext';
import Left_Panel from '../components/Left_Panel';
import Center_Panel from '../components/Center_Panel';
import Right_Panel from '../components/Right_Panel';

function Execute() {
    const { id: caseId } = useParams();
    const [steps, setSteps] = useState([]);
    const [mappedSteps, setMappedSteps] = useState([]);
    const [query, setQuery] = useState('');
    const [count, setCount] = useState(0);
    const [consoleLog, setConsoleLog] = useState([])
    const [active,setActive]=useState(null)



    useEffect(() => {
        const fetchCase = async () => {
            try {
                const res = await getSingleCase(caseId);
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
            <Navbar className="bg-body-tertiary" fixed='top' style={{ zIndex: '1' }}>
                <Container>
                    <Navbar.Brand className='d-flex justify-content-between w-100'>
                        <img alt="" src={logo} width="100" height="30" className="d-inline-block align-top" />
                        <div className='d-flex justify-content-between align-items-center border border-2 rounded-3 px-1' id='toolbar'>
                            {/* <div className='mx-3'><FontAwesomeIcon className='text-primary' icon={faMobileScreenButton} /></div> */}
                            {/* <div className='mx-3'><FontAwesomeIcon className='text-primary' icon={faCamera} /></div> */}
                            <div className='mx-3'><i className="bi bi-phone text-primary" ></i></div>
                            <div className='mx-3'><i className="bi bi-camera text-primary" ></i></div>
                            <div className='mx-3'><i className="bi bi-webcam text-primary" ></i></div>
                        </div>

                        <div>
                            <button className='btn btn-outline-primary'>Home</button>
                        </div>
                    </Navbar.Brand>
                </Container>
            </Navbar>


            <CaseContext.Provider value={{ steps, query, count, mappedSteps, consoleLog, setConsoleLog,active,setActive }}>
                <div style={{ height: '100vh' }} className='mt-5'>
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
