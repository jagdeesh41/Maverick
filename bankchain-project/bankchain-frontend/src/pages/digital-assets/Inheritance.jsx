import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { setInheritancePolicy, getInheritancePolicy } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';
import FileUpload from '../../components/FileUpload.jsx';
import ProofInput from '../../components/ProofInput.jsx';

const TRIGGERS = { AFTER_DEATH: 'After death', AFTER_AGE_70: 'After age 70', AFTER_MATURITY: 'After maturity' };
const RELATIONS = { SPOUSE: 'Spouse', CHILD: 'Child', PARENT: 'Parent', SIBLING: 'Sibling', OTHER: 'Other' };

function blankNominee() {
  return { name: '', relation: 'CHILD', allocationPercent: 0, proofType: 'ID_NUMBER', proofValue: '' };
}

export default function Inheritance() {
  const [searchParams] = useSearchParams();
  const [assetId, setAssetId] = useState(searchParams.get('assetId') || '');
  const [triggerCondition, setTriggerCondition] = useState('AFTER_DEATH');
  const [nominees, setNominees] = useState([blankNominee()]);
  const [proofDocumentBase64, setProofDocumentBase64] = useState('');
  const [disputeAction, setDisputeAction] = useState('Temporary freeze');
  const [policy, setPolicy] = useState(null);
  const [lookedUp, setLookedUp] = useState(false); // have we actually tried a lookup yet?
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (assetId) handleLookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAllocation = nominees.reduce((sum, n) => sum + (Number(n.allocationPercent) || 0), 0);
  const selfRetained = Math.max(0, 100 - totalAllocation);
  const overAllocated = totalAllocation > 100;

  function updateNominee(i, field, value) {
    setNominees((list) => list.map((n, idx) => (idx === i ? { ...n, [field]: value } : n)));
  }
  function addNominee() {
    setNominees((list) => [...list, blankNominee()]);
  }
  function removeNominee(i) {
    setNominees((list) => list.filter((_, idx) => idx !== i));
  }

  async function handleLookup() {
    setError('');
    setPolicy(null);
    setLookedUp(true);
    try {
      const found = await getInheritancePolicy(assetId);
      setPolicy(found);
      if (found.nominees?.length) {
        setNominees(found.nominees.map((n) => ({
          name: n.name, relation: n.relation, allocationPercent: n.allocationPercent,
          proofType: n.proofType || 'ID_NUMBER', proofValue: n.proofValue || '',
        })));
      }
      setTriggerCondition(found.triggerCondition || 'AFTER_DEATH');
    } catch {
      setPolicy(null); // no policy yet - the "no inheritance found" empty state below will show
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const saved = await setInheritancePolicy({
        assetId: Number(assetId),
        triggerCondition,
        nominees: nominees.filter((n) => n.name).map((n) => ({ ...n, allocationPercent: Number(n.allocationPercent) })),
        proofDocumentBase64,
        disputeAction,
      });
      setPolicy(saved);
      window.alert('Inheritance policy saved successfully.');
      setNominees([blankNominee()]);
      setProofDocumentBase64('');
      setTriggerCondition('AFTER_DEATH');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ marginTop: 0 }}>Inheritance policy (digital will)</h1>
      <InfoNote>
        Sets who inherits an asset, under what condition, and what you retain
        until then. Add as many nominees as you need — saved via{' '}
        <code>POST /customer/inheritance</code>.
      </InfoNote>

      <div className="lb-card" style={{ marginBottom: 16 }}>
        <label className="lb-label">Asset ID</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="lb-input" type="number" value={assetId} onChange={(e) => setAssetId(e.target.value)} />
          <button type="button" className="lb-btn outline" onClick={handleLookup}>Look up existing policy</button>
        </div>
      </div>

      {lookedUp && !policy && (
        <div className="lb-card" style={{ marginBottom: 16, background: '#fff4e0', borderColor: '#f0d9a3' }}>
          <strong>No inheritance policy found for this asset yet.</strong> Fill in the form below to create one.
        </div>
      )}

      <form onSubmit={handleSubmit} className="lb-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="lb-label">When should this trigger?</label>
          <select className="lb-input" value={triggerCondition} onChange={(e) => setTriggerCondition(e.target.value)}>
            {Object.entries(TRIGGERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div>
          <label className="lb-label" style={{ marginBottom: 10 }}>Nominees</label>
          {nominees.map((n, i) => (
            <div key={i} className="lb-card" style={{ marginBottom: 12, background: 'var(--lb-bg)' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <div style={{ flex: '1 1 180px' }}>
                  <label className="lb-label">Name</label>
                  <input className="lb-input" value={n.name} onChange={(e) => updateNominee(i, 'name', e.target.value)} />
                </div>
                <div style={{ width: 140 }}>
                  <label className="lb-label">Relation</label>
                  <select className="lb-input" value={n.relation} onChange={(e) => updateNominee(i, 'relation', e.target.value)}>
                    {Object.entries(RELATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={{ width: 110 }}>
                  <label className="lb-label">Allocation %</label>
                  <input className="lb-input" type="number" min="0" max="100"
                    value={n.allocationPercent} onChange={(e) => updateNominee(i, 'allocationPercent', e.target.value)} />
                </div>
              </div>
              <ProofInput
                label="Nominee's ID/account proof"
                typeValue={n.proofType} onTypeChange={(v) => updateNominee(i, 'proofType', v)}
                valueValue={n.proofValue} onValueChange={(v) => updateNominee(i, 'proofValue', v)}
              />
              {nominees.length > 1 && (
                <button type="button" className="lb-btn outline" style={{ marginTop: 10, padding: '4px 12px', fontSize: '0.8rem' }}
                  onClick={() => removeNominee(i)}>
                  Remove this nominee
                </button>
              )}
            </div>
          ))}
          <button type="button" className="lb-btn outline" onClick={addNominee}>+ Add another nominee</button>
        </div>

        <div style={{ background: overAllocated ? '#fdeceb' : 'var(--lb-green-50)', border: `1px solid ${overAllocated ? '#f0b8b3' : '#b6e2cc'}`, borderRadius: 8, padding: '12px 16px' }}>
          {overAllocated ? (
            <strong style={{ color: 'var(--lb-danger)' }}>Nominee allocations total {totalAllocation}% — reduce to 100% or less.</strong>
          ) : (
            <>You (the issuer) retain <strong>{selfRetained}%</strong> until "{TRIGGERS[triggerCondition]}" occurs — then the split above applies.</>
          )}
        </div>

        <FileUpload label="Supporting document (optional)" value={proofDocumentBase64} onChange={setProofDocumentBase64} />

        {error && <div className="lb-error-banner">{error}</div>}
        <button className="lb-btn" disabled={busy || !assetId || overAllocated}>{busy ? 'Saving…' : 'Save policy'}</button>
      </form>

      {policy && (
        <div className="lb-success-banner" style={{ marginTop: 16 }}>
          Policy status: <strong>{policy.status}</strong> — {policy.nominees?.length || 0} nominee(s),
          {' '}self retains {policy.selfRetainedPercent}% until {TRIGGERS[policy.triggerCondition] || policy.triggerCondition}.
        </div>
      )}
    </div>
  );
}
