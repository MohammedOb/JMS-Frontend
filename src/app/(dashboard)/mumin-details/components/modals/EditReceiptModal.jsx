'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

export default function EditReceiptModal({
  open, onClose, member,
  rcForm, setRcForm,
  onSave,
}) {
  return (
    <Modal
      open={open} onClose={onClose}
      title={`Edit Receipt — ${member?.name} (Acc# ${member?.accno})`}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Update Receipt
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Receipt No</label>
            <input type="text" className="form-input bg-gray-50" value={rcForm?.receiptNo || ''} readOnly />
          </div>
          <div>
            <label className="form-label">Received Date</label>
            <input type="date" className="form-input" value={rcForm?.receivedDate ? rcForm.receivedDate.split('T')[0] : ''}
              onChange={e => setRcForm(p => ({ ...p, receivedDate: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Payment Mode</label>
            <select className="form-select" value={rcForm?.mode || ''}
              onChange={e => setRcForm(p => ({ ...p, mode: e.target.value }))}>
              {['Cash','Online','Cheque','UPI'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">For Year</label>
            <input type="text" className="form-input" value={rcForm?.forYear || ''}
              onChange={e => setRcForm(p => ({ ...p, forYear: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Main Head</label>
            <input type="text" className="form-input bg-gray-50" value={rcForm?.mainHead || ''} readOnly />
          </div>
          <div>
            <label className="form-label">Sub Head</label>
            <input type="text" className="form-input bg-gray-50" value={rcForm?.subHead || ''} readOnly />
          </div>
           <div>
            <label className="form-label">Amount (₹)</label>
            <input type="number" className="form-input" value={rcForm?.amount || ''}
              onChange={e => setRcForm(p => ({ ...p, amount: Number(e.target.value) }))} />
          </div>
           <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={rcForm?.status || ''}
              onChange={e => setRcForm(p => ({ ...p, status: e.target.value }))}>
              {['Clear', 'Pending', 'Bounce', 'Cancel Receipt', 'Cancelled'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}