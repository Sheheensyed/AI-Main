import { useStepContext } from "../context/StepContext";

function List() {
    const { steps } = useStepContext();

    return (
        <>
            <div className="container">
                <div className="row">
                    <div className="col-md-5 col-lg-4">
                        <ul>
                            {steps && steps.length > 0 ? (
                                steps.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))
                            ) : (
                                <li>No steps found</li>
                            )}
                        </ul>
                    </div>
                    <div className="col-md-7 col-lg-8">2</div>
                </div>
            </div>
        </>
    );
}

export default List;
