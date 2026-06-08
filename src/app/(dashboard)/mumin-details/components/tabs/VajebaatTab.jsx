'use client';

import VajebaatInfoSection     from './vajebaat/VajebaatInfoSection';
import VajebaatQuickEntry      from './vajebaat/VajebaatQuickEntry';
import VajebaatTakhmeenSection from './vajebaat/VajebaatTakhmeenSection';
import HimTakhmeenSection      from './vajebaat/HimTakhmeenSection';
import ShehrullahNiyazSection  from './vajebaat/ShehrullahNiyazSection';
import SilaFitraSection        from './vajebaat/SilaFitraSection';
import { useAuth }             from '@/context/AuthContext';
import PrintConfigButton       from '@/components/shared/PrintConfigButton';

// ── Section visibility — set false to hide any section ───────────────────────
const VAJ_SECTIONS = {
  vajebaatInfo:    true,
  quickEntry:      true,
  takhmeenDetails: true,
  himTakhmeen:     true,
  shehrullahNiyaz: true,
  silaFitra:       true,
};

export default function VajebaatTab({
  member,
  vajebaat, himList, sniyazList, silaFitra,
  vajForm, setVajForm,
  onSaveVajebaat, onAddHim, onHimForm, onEditHim, onDeleteHim, onAddSniyaz, onSniyazForm, onEditSniyaz, onDeleteSniyaz, onAddReceipt,
  onAddVaj, onVajForm, onEditVaj, onDeleteVaj, onPrintVaj,
  onEditVajInfo,
  onAddSf, onUpdateSf, onDeleteSf, onSfForm,
}) {
  const { can } = useAuth();
  const accno = member?.accno;

  return (
    <div className="p-4 flex flex-col gap-6">

      {VAJ_SECTIONS.vajebaatInfo && (
        <div>
          <VajebaatInfoSection member={member} onEdit={onEditVajInfo} />
        </div>
      )}

      {VAJ_SECTIONS.quickEntry && can('members.quick_entry') && (
        <>
          <hr className="border-border" />
          <div>
            <VajebaatQuickEntry
              vajForm={vajForm}
              setVajForm={setVajForm}
              onSave={onSaveVajebaat}
            />
          </div>
        </>
      )}

      {VAJ_SECTIONS.takhmeenDetails && can('members.view_vajebaat_details') && (
        <>
          <hr className="border-border" />
          <div>
            <VajebaatTakhmeenSection
              vajebaat={vajebaat}
              onAddVaj={onAddVaj}
              onVajForm={onVajForm}
              onEditVaj={onEditVaj}
              onDeleteVaj={onDeleteVaj}
              onPrintVaj={onPrintVaj}
              vajFormButton={
                <PrintConfigButton buttonId="vajebaat-print" accno={accno} defaultSubhead="Vajebaat"
                  label="Vajebaat Takhmeen Form" className="btn btn-secondary btn-sm" />
              }
              printVajButton={
                <PrintConfigButton buttonId="vajebaat-row-print" accno={accno} defaultSubhead="Vajebaat"
                  label="" className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                  }
                />
              }
            />
          </div>
        </>
      )}

      {VAJ_SECTIONS.himTakhmeen && can('members.view_him') && (
        <>
          <hr className="border-border" />
          <div>
            <HimTakhmeenSection
              himList={himList}
              onAddHim={onAddHim}
              onHimForm={onHimForm}
              onEditHim={onEditHim}
              onDeleteHim={onDeleteHim}
              himFormButton={
                <PrintConfigButton buttonId="him-print" accno={accno} defaultSubhead="HIM"
                  label="HIM Takhmeen Form" className="btn btn-secondary btn-sm" />
              }
            />
          </div>
        </>
      )}

      {VAJ_SECTIONS.shehrullahNiyaz && (
        <>
          <hr className="border-border" />
          <div>
            <ShehrullahNiyazSection
              sniyazList={sniyazList}
              onAddSniyaz={onAddSniyaz}
              onSniyazForm={onSniyazForm}
              onEditSniyaz={onEditSniyaz}
              onDeleteSniyaz={onDeleteSniyaz}
              sniyazFormButton={
                <PrintConfigButton buttonId="sniyaz-print" accno={accno} defaultSubhead="Shehrullah Niyaz"
                  label="S. Niyaz Takhmeen Form" className="btn btn-secondary btn-sm" />
              }
            />
          </div>
        </>
      )}

      {VAJ_SECTIONS.silaFitra && (
        <>
          <hr className="border-border" />
          <div>
            <SilaFitraSection
              silaFitra={silaFitra}
              onAdd={onAddSf}
              onUpdate={onUpdateSf}
              onDelete={onDeleteSf}
              onSfForm={onSfForm}
              sfFormButton={
                <PrintConfigButton buttonId="sila-fitra-print" accno={accno} defaultSubhead="Sila Fitra"
                  label="Sila Fitra Form" className="btn btn-secondary btn-sm" />
              }
            />
          </div>
        </>
      )}

    </div>
  );
}
