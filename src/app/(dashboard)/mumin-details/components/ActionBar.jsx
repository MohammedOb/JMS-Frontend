'use client';

import { ReceiptIcon, PrintIcon, ClipboardListIcon, PlusIcon, ZapIcon, MailIcon, NoteIcon } from '@/components/shared/Icons';

export default function ActionBar({ features = {}, onAddReceipt, onAddTakhmeen, onVajebaatEntry, onSabeelDue, onAddSafai, onAddFollowup, onTakPreview }) {
  return (
    <div className="flex gap-2 flex-wrap mb-3">
      {features.addReceipt      !== false && <button className="btn btn-primary"   onClick={onAddReceipt}><ReceiptIcon      className="w-3.5 h-3.5 mr-1.5" />Add Receipt</button>}
      {features.addTakhmeen     !== false && <button className="btn btn-secondary" onClick={onAddTakhmeen}><PlusIcon         className="w-3.5 h-3.5 mr-1.5" />Add Takhmeen</button>}
      {features.vajebaatEntry   !== false && <button className="btn btn-secondary" onClick={onVajebaatEntry}><ZapIcon        className="w-3.5 h-3.5 mr-1.5" />Vajebaat Entry</button>}
      {features.sabeelDue       !== false && <button className="btn btn-secondary" onClick={onSabeelDue}><ClipboardListIcon className="w-3.5 h-3.5 mr-1.5" />Sabeel Due</button>}
      {features.addSafai        !== false && <button className="btn btn-secondary" onClick={onAddSafai}><MailIcon           className="w-3.5 h-3.5 mr-1.5" />New Safai Chitthi</button>}
      {features.followup        !== false && <button className="btn btn-secondary" onClick={onAddFollowup}><NoteIcon        className="w-3.5 h-3.5 mr-1.5" />Add Follow-up</button>}
      {features.takhmeenPreview !== false && <button className="btn btn-secondary" onClick={onTakPreview}><PrintIcon        className="w-3.5 h-3.5 mr-1.5" />Takhmeen Preview</button>}
    </div>
  );
}
