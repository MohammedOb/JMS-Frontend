'use client';

import VajebaatInfoSection     from './vajebaat/VajebaatInfoSection';
import VajebaatQuickEntry      from './vajebaat/VajebaatQuickEntry';
import VajebaatTakhmeenSection from './vajebaat/VajebaatTakhmeenSection';
import HimTakhmeenSection      from './vajebaat/HimTakhmeenSection';
import ShehrullahNiyazSection  from './vajebaat/ShehrullahNiyazSection';
import SilaFitraSection        from './vajebaat/SilaFitraSection';

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
  permissions,
  onSaveVajebaat, onAddHim, onHimForm, onEditHim, onDeleteHim, onAddSniyaz, onSniyazForm, onEditSniyaz, onDeleteSniyaz, onAddReceipt,
  onAddVaj, onVajForm, onEditVaj, onDeleteVaj, onPrintVaj,
  onEditVajInfo,
  onAddSf, onUpdateSf, onDeleteSf,
}) {
  return (
    <div className="p-4">

      {VAJ_SECTIONS.vajebaatInfo && (
        <VajebaatInfoSection member={member} onEdit={onEditVajInfo} />
      )}

      {VAJ_SECTIONS.quickEntry && permissions.MDSpeedVajebaatView && (
        <VajebaatQuickEntry
          vajForm={vajForm}
          setVajForm={setVajForm}
          permissions={permissions}
          onSave={onSaveVajebaat}
        />
      )}

      {VAJ_SECTIONS.takhmeenDetails && permissions.MDVajebaatDetailsView && (
        <VajebaatTakhmeenSection
          vajebaat={vajebaat}
          onAddVaj={onAddVaj}
          onVajForm={onVajForm}
          onEditVaj={onEditVaj}
          onDeleteVaj={onDeleteVaj}
          onPrintVaj={onPrintVaj}
        />
      )}

      {VAJ_SECTIONS.himTakhmeen && permissions.MDHIMView && (
        <HimTakhmeenSection
          himList={himList}
          onAddHim={onAddHim}
          onHimForm={onHimForm}
          onEditHim={onEditHim}
          onDeleteHim={onDeleteHim}
        />
      )}

      {VAJ_SECTIONS.shehrullahNiyaz && (
        <ShehrullahNiyazSection
          sniyazList={sniyazList}
          onAddSniyaz={onAddSniyaz}
          onSniyazForm={onSniyazForm}
          onEditSniyaz={onEditSniyaz}
          onDeleteSniyaz={onDeleteSniyaz}
        />
      )}

      {VAJ_SECTIONS.silaFitra && (
        <SilaFitraSection
          silaFitra={silaFitra}
          onAdd={onAddSf}
          onUpdate={onUpdateSf}
          onDelete={onDeleteSf}
        />
      )}

    </div>
  );
}
