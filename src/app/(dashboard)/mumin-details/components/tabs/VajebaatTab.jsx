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
    <div className="p-4 flex flex-col gap-6">

      {VAJ_SECTIONS.vajebaatInfo && (
        <div>
          <VajebaatInfoSection member={member} onEdit={onEditVajInfo} />
        </div>
      )}

      {VAJ_SECTIONS.quickEntry && permissions.MDSpeedVajebaatView && (
        <>
          <hr className="border-border" />
          <div>
            <VajebaatQuickEntry
              vajForm={vajForm}
              setVajForm={setVajForm}
              permissions={permissions}
              onSave={onSaveVajebaat}
            />
          </div>
        </>
      )}

      {VAJ_SECTIONS.takhmeenDetails && permissions.MDVajebaatDetailsView && (
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

      {VAJ_SECTIONS.himTakhmeen && permissions.MDHIMView && (
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
            />
          </div>
        </>
      )}

    </div>
  );
}
