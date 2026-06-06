'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { waTemplateService, whatsappService } from '@/services';
import { SendIcon, RefreshIcon } from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import { rowVars, interpolate, PLACEHOLDERS } from './waUtils';
import { useSystemVars } from '@/context/SystemVarsContext';

const DEFAULT_KEY = 'takhmeen_reminder';

export default function WAReminderModal({ open, onClose, row }) {
  const { vars } = useSystemVars();
  const orgName = vars.JAMAAT_NAME_FORMAL || 'Shia Dawoodi Bohra Jamaat, Sagwara';

  const [templates,   setTemplates]   = useState([]);
  const [selectedKey, setSelectedKey] = useState(DEFAULT_KEY);
  const [mobile,      setMobile]      = useState('');
  const [message,     setMessage]     = useState('');
  const [sending,     setSending]     = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setMobile(row.mobile || '');
    setMessage('');
    setSending(false);
    waTemplateService.getAll()
      .then(res => {
        const list = (res.data?.data || []).filter(t => t.is_active);
        setTemplates(list);
        const key = list.some(t => t.template_key === DEFAULT_KEY)
          ? DEFAULT_KEY
          : (list[0]?.template_key || '');
        setSelectedKey(key);
      })
      .catch(() => {});
  }, [open, row]);

  useEffect(() => {
    if (!templates.length || !row || !selectedKey) return;
    const tpl = templates.find(t => t.template_key === selectedKey);
    if (tpl) setMessage(interpolate(tpl.body, rowVars(row, orgName)));
  }, [templates, selectedKey, row, orgName]);

  function resetToTemplate() {
    const tpl = templates.find(t => t.template_key === selectedKey);
    if (tpl && row) setMessage(interpolate(tpl.body, rowVars(row, orgName)));
  }

  async function handleSend() {
    if (!mobile.trim())  { toast.error('Enter a mobile number');   return; }
    if (!message.trim()) { toast.error('Message cannot be empty'); return; }
    setSending(true);
    try {
      const res = await whatsappService.sendDueReminder({
        mobile:  mobile.trim(),
        message: message.trim(),
      });
      if (res.data?.success) {
        toast.success('Reminder sent');
        onClose();
      } else {
        toast.error(res.data?.message || 'Send failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  if (!row) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send WhatsApp Reminder"
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending || !message.trim()}
          >
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </>
      }
    >
      <div className="space-y-3">

        <div className="grid grid-cols-2 gap-2">
          {[
            ['Name',        row.fullName    || '—'],
            ['Acc No',      row.accno       || '—'],
            ['For Year',    row.forYear     || '—'],
            ['Hub Sub Head',row.hubSubHead  || '—'],
          ].map(([k, v]) => (
            <div key={k} className="bg-gray-50 border border-gray-100 rounded px-2.5 py-1.5">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{k}</div>
              <div className="text-[12px] font-semibold text-gray-800 truncate">{v}</div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            WhatsApp Mobile Number
          </label>
          <input
            type="text"
            className="input input-sm w-full"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            placeholder="e.g. 9876543210"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Template</label>
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-gray-600">Message</label>
            <button
              type="button"
              className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
              onClick={resetToTemplate}
            >
              <RefreshIcon className="w-2.5 h-2.5" />Reset to template
            </button>
          </div>
          <textarea
            className="textarea textarea-sm w-full font-mono text-[11px] resize-y"
            rows={9}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type or edit the message…"
          />
          <div className="text-[10px] text-gray-400 mt-0.5 text-right">{message.length} chars</div>
        </div>

        <div>
          <div className="text-[10px] text-gray-400 mb-1">Click to append placeholder:</div>
          <div className="flex flex-wrap gap-1">
            {PLACEHOLDERS.map(p => (
              <button
                key={p.key}
                type="button"
                title={p.label}
                className="text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-1.5 py-0.5 rounded font-mono transition-colors"
                onClick={() => setMessage(prev => prev + p.key)}
              >
                {p.key}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  );
}
