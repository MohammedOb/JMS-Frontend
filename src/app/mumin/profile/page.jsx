'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import muminApi from '@/lib/muminApi';

function Field({ label, value }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-[14px] text-gray-900">{value || '—'}</div>
    </div>
  );
}

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const forceChange  = searchParams.get('changePassword') === 'true';

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showPwdForm, setShowPwdForm] = useState(forceChange);
  const [pwd, setPwd]               = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError]     = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const [editMobile, setEditMobile]   = useState(false);
  const [mobileVal, setMobileVal]     = useState('');
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [mobileSuccess, setMobileSuccess] = useState('');

  useEffect(() => {
    muminApi.get('/mumin/profile')
      .then(res => setProfile(res.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMobileSave = async () => {
    setMobileError('');
    setMobileSuccess('');
    if (!/^[6-9]\d{9}$/.test(mobileVal.trim())) {
      setMobileError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setMobileLoading(true);
    try {
      await muminApi.patch('/mumin/profile/mobile', { mobile: mobileVal.trim() });
      setProfile(p => ({ ...p, Mobile: mobileVal.trim() }));
      setMobileSuccess('Mobile number updated.');
      setEditMobile(false);
    } catch (err) {
      setMobileError(err.response?.data?.message || 'Failed to update mobile number.');
    } finally {
      setMobileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (pwd.newPwd !== pwd.confirm) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (pwd.newPwd.length < 6) {
      setPwdError('Password must be at least 6 characters.');
      return;
    }

    setPwdLoading(true);
    try {
      await muminApi.post('/mumin/change-password', {
        currentPassword: pwd.current,
        newPassword:     pwd.newPwd,
      });
      setPwdSuccess('Password changed successfully.');
      setPwd({ current: '', newPwd: '', confirm: '' });
      setShowPwdForm(false);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[22px] font-bold text-blue-600">
            {(profile?.FullName || '?').charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-[15px] font-bold text-gray-900">{profile?.FullName}</div>
          <div className="text-[12px] text-gray-500">Acc No: {profile?.AccNo}</div>
          <div className={`text-[11px] mt-0.5 font-medium ${profile?.AccountStatus === 'Active' ? 'text-green-600' : 'text-red-500'}`}>
            {profile?.AccountStatus}
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="bg-white border border-gray-200 rounded-2xl px-4">
        <Field label="ITS Number"  value={profile?.ITSNo} />

        {/* Mobile — editable */}
        <div className="py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-0.5">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Mobile</div>
            {!editMobile && (
              <button
                onClick={() => { setMobileVal(profile?.Mobile || ''); setEditMobile(true); setMobileError(''); setMobileSuccess(''); }}
                className="text-[11px] text-blue-600 font-medium hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {editMobile ? (
            <div className="space-y-2 mt-1">
              <input
                type="tel"
                value={mobileVal}
                onChange={e => setMobileVal(e.target.value)}
                maxLength={10}
                placeholder="10-digit mobile number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mobileError && <div className="text-[11px] text-red-600">{mobileError}</div>}
              <div className="flex gap-2">
                <button
                  onClick={handleMobileSave}
                  disabled={mobileLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[12px] font-semibold rounded-lg py-2 transition-colors"
                >
                  {mobileLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditMobile(false); setMobileError(''); }}
                  className="flex-1 border border-gray-200 text-[12px] font-medium text-gray-600 rounded-lg py-2 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[14px] text-gray-900">{profile?.Mobile || '—'}</div>
          )}
          {mobileSuccess && <div className="text-[11px] text-green-600 mt-1">{mobileSuccess}</div>}
        </div>

        <Field label="Sector"      value={profile?.Sector} />
        <Field label="Subsector"   value={profile?.Subsector} />
        <Field label="Mohallah"    value={profile?.MohallaDescription} />
        <Field label="Sabeel Type" value={profile?.SabeelType} />
        <Field label="Thaali"      value={profile?.ThaaliStatus} />
      </div>

      {/* Password section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-gray-800">Password</div>
            <div className="text-[11px] text-gray-400">Change your login password</div>
          </div>
          <button
            onClick={() => { setShowPwdForm(v => !v); setPwdError(''); setPwdSuccess(''); }}
            className="text-[12px] text-blue-600 font-medium hover:underline"
          >
            {showPwdForm ? 'Cancel' : 'Change'}
          </button>
        </div>

        {forceChange && !pwdSuccess && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[12px] rounded-lg px-3 py-2">
            Please set a new password. Your default password is your ITS Number.
          </div>
        )}

        {pwdSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-[12px] rounded-lg px-3 py-2">
            {pwdSuccess}
          </div>
        )}

        {showPwdForm && (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {pwdError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-[12px] rounded-lg px-3 py-2">
                {pwdError}
              </div>
            )}
            {[
              { label: 'Current Password', key: 'current',  placeholder: 'Your current password (default: ITS No)' },
              { label: 'New Password',     key: 'newPwd',   placeholder: 'Min 6 characters' },
              { label: 'Confirm New',      key: 'confirm',  placeholder: 'Repeat new password' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">{f.label}</label>
                <input
                  type="password"
                  placeholder={f.placeholder}
                  value={pwd[f.key]}
                  onChange={e => setPwd(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-[13px] transition-colors"
            >
              {pwdLoading ? 'Saving...' : 'Save Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
