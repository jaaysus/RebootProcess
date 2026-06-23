import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Station.css';
import { mockRows } from '../pages/EngineerSpace/Process/Projects' 

const colorMap = {
  BK: 'black', BU: 'blue', BN: 'brown', GN: 'green', GY: 'grey',
  OG: 'orange', PK: 'pink', RD: 'red', VT: 'violet', WH: 'white', YE: 'yellow',
};

function Station() {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Filter the steps for this station
  const stationSteps = useMemo(
    () => mockRows.filter((row) => row.STATION === stationId),
    [stationId]
  );

  const step = stationSteps[currentStep] || {};

  // Combine C1/C2/C3 for colors
  const colors = [step.C1, step.C2, step.C3].filter(Boolean);

  return (
    <div className={`station-page`} style={{
      height: '100vh', width: '100vw', padding: '1vw',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative'
    }}>
      {isComplete && (
        <div style={{
          position: 'fixed', top: 'calc(0% + 70px)',
          left: 0, right: 0, width: '100%', padding: '20px 0',
          textAlign: 'center', fontSize: '42px', fontWeight: 'bold',
          letterSpacing: '3px', color: '#fff', backgroundColor: 'green',
          zIndex: 99999
        }}>
          Process Complete
        </div>
      )}

      <div className="station-header" style={{
        display: 'flex', flexDirection: 'column',
        borderBottom: '1px solid #444', paddingBottom: '1vh', flexShrink: 0
      }}>
        <h3 style={{ margin: 0, color: '#666' }}>Line: {stationId}</h3>
        <h2 style={{ margin: 0 }}>{stationId}</h2>
        <h2>
          STEP {currentStep + 1} / {stationSteps.length || 1}
        </h2>
      </div>

      <div className="step-instruction" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center',
        minHeight: 0, overflow: 'hidden'
      }}>
        <h1>{step.Description || 'No data available'}</h1>
        <p>{step.Sortie || '-'}</p>

        <div className="main-connectors" style={{
          display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center'
        }}>
          <div><strong>Connector 1:</strong> {step.C1 || '-'}</div>
          <div><strong>Connector 2:</strong> {step.C2 || '-'}</div>
          <div><strong>Connector 3:</strong> {step.C3 || '-'}</div>
          <div><strong>Core:</strong> {step.Core || '-'}</div>
          <div><strong>Section:</strong> {step["SP Loc"] || '-'}</div>
          <div><strong>Module:</strong> {step.Module || '-'}</div>
          <div><strong>Wire Name:</strong> {step["Wire Name"] || '-'}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
          <strong>Colour:</strong>
          {colors.length === 0 && <span>-</span>}
          {colors.map((code, idx) => (
            <span key={idx} title={code} style={{
              width: '20px', height: '20px', display: 'inline-block',
              border: '1px solid #000',
              backgroundColor: colorMap[code] || 'transparent'
            }} />
          ))}
        </div>
      </div>

      <div className="navigation-buttons" style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '2vh 1vw', flexShrink: 0
      }}>
        <button type="button" onClick={() => {
          if (currentStep > 0) setCurrentStep(s => s - 1);
          else navigate('/');
        }}>BACK</button>

        <button type="button" onClick={() => {
          if (currentStep < stationSteps.length - 1) setCurrentStep(s => s + 1);
          else {
            setIsComplete(true);
            setTimeout(() => navigate('/'), 1200);
          }
        }}>
          {currentStep < stationSteps.length - 1 ? 'NEXT STEP' : 'FINISH'}
        </button>
      </div>
    </div>
  );
}

export default Station;