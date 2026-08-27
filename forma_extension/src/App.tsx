import { useState, useEffect } from 'react';
import { AgentCopilot } from './components/AgentCopilot';
import { getFormaCanvasBoundingBox } from './services/formaSdk';
import { FormaBoundingBox, MitigationResponse } from './types/forma';

export default function App() {
  const [bbox, setBbox] = useState<FormaBoundingBox>({
    min_x: 394200.0,
    min_y: 3701400.0,
    max_x: 394550.0,
    max_y: 3701750.0,
    elevation_min: 330.0,
    elevation_max: 375.0,
    crs: 'EPSG:32612 (UTM 12N)',
  });

  const refreshBbox = async () => {
    const updated = await getFormaCanvasBoundingBox();
    setBbox(updated);
  };

  useEffect(() => {
    refreshBbox();
  }, []);

  const handleGeometryCommitted = (response: MitigationResponse) => {
    console.log('[Forma Extension] Committed mitigation geometry payload:', response);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden">
      <AgentCopilot
        currentBbox={bbox}
        onRefreshBbox={refreshBbox}
        onGeometryCommitted={handleGeometryCommitted}
      />
    </div>
  );
}
