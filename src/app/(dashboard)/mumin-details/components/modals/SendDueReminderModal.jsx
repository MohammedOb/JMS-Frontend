'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { waTemplateService, whatsappService } from '@/services';
import { SendIcon } from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import { fmt } from '../../utils';
import { useSystemVars } from '@/context/SystemVarsContext';

// dueData shape:
//   { rows: [{ head, rem, yearRange }], total: number, isOverall: boolean }
export default function SendDueReminderModal({ open, onClose, member, dueData }) {
  const { vars } = useSystemVars();

  const [templates,   setTemplates]   = useState([]);
  const [selectedKey, setSelectedKey] = useState('due_reminder');
  const [mobile,      setMobile]      = useState('');
  const [message,     setMessage]     = useState('');
  const [sending,     setSending]     = useState(false);

  // Load templates + pre-fill mobile when modal opens
  useEffect(() => {
    if (!open) return;
    setMobile(member?.mobile || '');
    setMessage('');
    setSending(false);
    waTemplateService.getAll()
      .then(res => {
        const list = (res.data?.data || []).filter(t => t.is_active);
        setTemplates(list);
        const hasDue = list.some(t => t.template_key === 'due_reminder');
        setSelectedKey(hasDue ? 'due_reminder' : (list[0]?.template_key || ''));
      })
      .catch(() => {});
  }, [open, member]);

  // Rebuild message whenever template selection or due data changes
  useEffect(() => {
    if (!templates.length || !dueData || !selectedKey) return;
    const tpl = templates.find(t => t.template_key === selectedKey);
    if (!tpl) return;

    const vars = buildVars();
    let body = tpl.body;
    Object.entries(vars).forEach(([k, v]) => {
      body = body.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
    setMessage(body);
  }, [templates, selectedKey, dueData, member]); // eslint-disable-line

  function buildVars() {
    if (!dueData) return {};
    const { rows, total, isOverall } = dueData;
    const allYears = [...new Set(rows.flatMap(r => (r.yearRange || '').split(/[,–\s]+/).filter(Boolean)))].sort();
    return {
      FullName:   member?.name  || '—',
      AccNo:      member?.accno || '—',
      HubSubHead: isOverall ? 'Overall Due' : (rows[0]?.head || '—'),
      ForYear:    isOverall ? (allYears.join(', ') || '—') : (rows[0]?.yearRange || '—'),
      DueAmount:  fmt(isOverall ? total : rows[0]?.rem),
      OrgName:    vars.JAMAAT_NAME_FORMAL || 'Shia Dawoodi Bohra Jamaat, Sagwara',
    };
  }

  const handleSend = async () => {
    if (!mobile.trim())   { toast.error('Enter a mobile number'); return; }
    if (!message.trim())  { toast.error('Message cannot be empty'); return; }
    setSending(true);
    try {
      await whatsappService.sendDueReminder({
        mobile:  mobile.trim(),
        message: message.trim(),
      });
      toast.success('Due reminder sent via WhatsApp');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Due Reminder via WhatsApp"
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSend} disabled={sending || !selectedKey}>
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            {sending ? 'Sending…' : 'Send Reminder'}
          </button>
        </>
      }
    >
      <div className="space-y-4">

        {/* Due summary */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-2">Due Details</div>
          {dueData?.rows.map((row, i) => (
            <div key={i} className="flex justify-between items-center text-[12px] py-0.5">
              <span className="text-gray-700">
                <span className="font-semibold">{row.head}</span>
                {row.yearRange && <span className="text-gray-500 ml-1.5">({row.yearRange})</span>}
              </span>
              <span className="font-bold text-red-600">{fmt(row.rem)}</span>
            </div>
          ))}
          {dueData?.isOverall && dueData.rows.length > 1 && (
            <div className="flex justify-between items-center text-[12px] border-t border-amber-300 mt-2 pt-2">
              <span className="font-bold text-gray-900">Total Remaining</span>
              <span className="font-bold text-red-700">{fmt(dueData.total)}</span>
            </div>
          )}
        </div>

        {/* Mobile number */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">WhatsApp Mobile Number</label>
          <input
            type="text"
            className="input input-sm w-full"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            placeholder="e.g. 9876543210"
          />
        </div>

        {/* Template selector */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Message Template</label>
          {templates.length === 0 ? (
            <div className="text-[12px] text-gray-400">Loading templates…</div>
          ) : (
            <select
              className="select select-sm w-full"
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
            >
              {templates.map(t => (
                <option key={t.template_key} value={t.template_key}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Editable message */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-gray-600">Message</label>
            {selectedKey && templates.length > 0 && (
              <button
                type="button"
                className="text-[10px] text-blue-500 hover:underline"
                onClick={() => {
                  const tpl = templates.find(t => t.template_key === selectedKey);
                  if (!tpl) return;
                  const vars = buildVars();
                  let body = tpl.body;
                  Object.entries(vars).forEach(([k, v]) => {
                    body = body.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
                  });
                  setMessage(body);
                }}
              >
                Reset to template
              </button>
            )}
          </div>
          <textarea
            className="textarea textarea-sm w-full font-mono text-[11px] resize-y"
            rows={10}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type or edit the message…"
          />
          <div className="text-[10px] text-gray-400 mt-0.5 text-right">{message.length} chars</div>
        </div>
      </div>
    </Modal>
  );
}
