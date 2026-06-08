'use client';

import VajebaatInfoSection     from './vajebaat/VajebaatInfoSection';
import VajebaatQuickEntry      from './vajebaat/VajebaatQuickEntry';
import VajebaatTakhmeenSection from './vajebaat/VajebaatTakhmeenSection';
import HimTakhmeenSection      from './vajebaat/HimTakhmeenSection';
import ShehrullahNiyazSection  from './vajebaat/ShehrullahNiyazSection';
import SilaFitraSection        from './vajebaat/SilaFitraSection';
import { useAuth }             from '@/context/AuthContext';

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
            />
          </div>
        </>
      )}

    </div>
  );
}
