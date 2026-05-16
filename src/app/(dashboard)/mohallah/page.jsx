'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { mohallahService, memberService } from '@/services';
import MohallahSelectionPanel from './components/MohallahSelectionPanel';
import CoordinatorTable from './components/CoordinatorTable';
import PrintOptionsBar from './components/PrintOptionsBar';
import MemberListSection from './components/MemberListSection';
import EditMohallahMemberModal from './components/EditMohallahMemberModal';
import EditMohallahModal from './components/EditMohallahModal';

const str = (value) => String(value ?? '');

const normalizeRow = (member = {}) => ({
  accno: str(member.AccNo ?? member.accno ?? ''),
  name: str(member.FullName ?? member.fullName ?? ''),
  itsNo: str(member.ITSNo ?? member.itsNo ?? ''),
  mobile: str(member.Mobile ?? member.mobile ?? ''),
  mobile1: str(member.Mobile1 ?? member.mobile1 ?? ''),
  localHofIts: str(member.LocalHOFITS ?? member.LocalHOFITSNo ?? member.localHofIts ?? ''),
  sector: str(member.Sector ?? member.sector ?? ''),
  subsector: str(member.Subsector ?? member.subsector ?? ''),
  stayingIn: str(member.StayingIn ?? member.stayingIn ?? ''),
  sabeelType: str(member.SabeelType ?? member.sabeelType ?? ''),
  sabeelAmount: str(member.SabeelAmt ?? member.sabeelAmount ?? ''),
  thaliSize: str(member.ThaliSize ?? member.ThaaliSize ?? member.thaliSize ?? ''),
  thaliStatus: str(member.ThaaliStatus ?? member.FMBStatus ?? member.fmbStatus ?? ''),
  membersCount: member.FamilyMembersCount ?? member.familyMembersCount ?? null,
});

const rawToArr = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (data.recordsets) return data.recordsets[0] ?? [];
  if (data.recordset) return data.recordset;
  return [];
};

export default function MohallahPage() {
  const router = useRouter();

  const [mohallaRows, setMohallaRows] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [selectedSector, setSelectedSector] = useState('');
  const [selectedSubsector, setSelectedSubsector] = useState('');
  const [selectedSabeelType, setSelectedSabeelType] = useState('All');
  const [selectedStayingIn, setSelectedStayingIn] = useState('');
  const [eventName, setEventName] = useState('');

  const [coordinators, setCoordinators] = useState([]);
  const [coordLoading, setCoordLoading] = useState(false);
  const [addRow, setAddRow] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [editMemberSaving, setEditMemberSaving] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({
    sector: '',
    subsector: '',
    mohallahDescription: '',
  });
  const [mohallahModalOpen, setMohallahModalOpen] = useState(false);
  const [mohallahModalMode, setMohallahModalMode] = useState('add');
  const [mohallahSaving, setMohallahSaving] = useState(false);
  const [mohallahForm, setMohallahForm] = useState({
    ID: null,
    Sector: '',
    Subsector: '',
    MohallaDescription: '',
  });

  const [printOpts, setPrintOpts] = useState({
    showThaliStatus: false,
    showThaliSize: false,
    showAmount: true,
  });

  const reloadMohallahs = async () => {
    try {
      const res = await mohallahService.LoadMohallaDetails({});
      setMohallaRows(rawToArr(res.data));
    } catch {
      toast.error('Failed to load mohallah details');
    }
  };

  useEffect(() => {
    mohallahService
      .LoadMohallaDetails({})
      .then((res) => setMohallaRows(rawToArr(res.data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingMembers(true);
    memberService
      .loadMuminDetails({ Search: '' })
      .then((res) => {
        setAllMembers(rawToArr(res.data).map(normalizeRow));
        setMembersLoaded(true);
      })
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoadingMembers(false));
  }, []);

  useEffect(() => {
    if (!selectedSubsector) {
      setCoordinators([]);
      return;
    }

    setCoordLoading(true);
    mohallahService
      .LoadMohallaCordinatorsDetails({ SubSector: selectedSubsector })
      .then((res) => setCoordinators(rawToArr(res.data)))
      .catch(() => setCoordinators([]))
      .finally(() => setCoordLoading(false));
  }, [selectedSubsector]);

  const sectors = useMemo(
    () =>
      [...new Set(mohallaRows.map((row) => str(row.Sector ?? row.sector)).filter(Boolean))].sort(),
    [mohallaRows]
  );

  const subsectorOptions = useMemo(() => {
    const seen = new Set();

    return mohallaRows
      .filter((row) => !selectedSector || str(row.Sector ?? row.sector) === selectedSector)
      .reduce((acc, row) => {
        const code = str(row.Subsector ?? row.subsector);
        const name = str(row.MohallaDescription ?? row.mohallaDescription ?? '');

        if (code && !seen.has(code)) {
          seen.add(code);
          acc.push({ code, name: name || code });
        }

        return acc;
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [mohallaRows, selectedSector]);

  const getSubsectorOptions = (sector) =>
    mohallaRows
      .filter((row) => !sector || str(row.Sector ?? row.sector) === sector)
      .map((row) => ({
        value: str(row.Subsector ?? row.subsector),
        label: `${str(row.Subsector ?? row.subsector)} - ${str(
          row.MohallaDescription ?? row.mohallaDescription ?? ''
        )}`,
        sector: str(row.Sector ?? row.sector),
        mohallahDescription: str(row.MohallaDescription ?? row.mohallaDescription ?? ''),
      }))
      .filter((option, index, arr) => arr.findIndex((item) => item.value === option.value) === index)
      .sort((a, b) => a.label.localeCompare(b.label));

  const selectedMohalla = useMemo(
    () => mohallaRows.find((row) => str(row.Subsector ?? row.subsector) === selectedSubsector),
    [mohallaRows, selectedSubsector]
  );

  const stayingInOptions = useMemo(() => {
    const values = allMembers
      .filter((member) => {
        if (!selectedSubsector) return true;
        if (member.subsector !== selectedSubsector) return false;
        if (selectedSabeelType === 'All') return true;
        return member.sabeelType === selectedSabeelType;
      })
      .map((member) => member.stayingIn)
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [allMembers, selectedSubsector, selectedSabeelType]);

  const mohallaCode = selectedMohalla
    ? str(selectedMohalla.Subsector ?? selectedMohalla.subsector)
    : '-';
  const mohallaName = selectedMohalla
    ? str(selectedMohalla.MohallaDescription ?? selectedMohalla.mohallaDescription ?? '-')
    : '-';

  const filteredMembers = useMemo(() => {
    if (!selectedSubsector) return [];
    return allMembers.filter((member) => {
      if (member.subsector !== selectedSubsector) return false;
      if (selectedSabeelType !== 'All' && member.sabeelType !== selectedSabeelType) return false;
      if (
        selectedStayingIn &&
        !member.stayingIn.toLowerCase().includes(selectedStayingIn.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [allMembers, selectedSubsector, selectedSabeelType, selectedStayingIn]);

  const totalHouses = useMemo(() => filteredMembers.length, [filteredMembers]);

  const totalMembers = useMemo(
    () =>
      filteredMembers.reduce((sum, member) => {
        const count = Number(member.membersCount ?? 0);
        return sum + (Number.isNaN(count) ? 0 : count);
      }, 0),
    [filteredMembers]
  );

  const reloadMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await memberService.loadMuminDetails({ Search: '' });
      setAllMembers(rawToArr(res.data).map(normalizeRow));
      setMembersLoaded(true);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const reloadCoords = () => {
    if (!selectedSubsector) return;

    setCoordLoading(true);
    mohallahService
      .LoadMohallaCordinatorsDetails({ SubSector: selectedSubsector })
      .then((res) => setCoordinators(rawToArr(res.data)))
      .catch(() => {})
      .finally(() => setCoordLoading(false));
  };

  const saveAdd = async () => {
    if (!addRow?.Designation) {
      toast.error('Designation is required');
      return;
    }

    try {
      await mohallahService.AddMohallaCordinatorsDetails({
        ...addRow,
        SubSector: selectedSubsector,
      });
      toast.success('Coordinator added');
      setAddRow(null);
      reloadCoords();
    } catch {
      toast.error('Failed to add coordinator');
    }
  };

  const saveEdit = async () => {
    try {
      await mohallahService.UpdateMohallaCordinatorsDetails(editData);
      toast.success('Coordinator updated');
      setEditId(null);
      reloadCoords();
    } catch {
      toast.error('Failed to update coordinator');
    }
  };

  const deleteCoord = async (id) => {
    if (!window.confirm('Delete this coordinator?')) return;

    try {
      await mohallahService.DeleteMohallaCordinatorsDetails({ ID: id });
      toast.success('Coordinator deleted');
      reloadCoords();
    } catch {
      toast.error('Failed to delete coordinator');
    }
  };

  const openEditMemberModal = (member) => {
    const matchedMohallah = mohallaRows.find(
      (row) => str(row.Subsector ?? row.subsector) === str(member.subsector)
    );

    setEditingMember(member);
    setEditMemberForm({
      sector: member.sector || '',
      subsector: member.subsector || '',
      mohallahDescription: str(
        matchedMohallah?.MohallaDescription ?? matchedMohallah?.mohallaDescription ?? ''
      ),
    });
    setEditMemberModalOpen(true);
  };

  const saveMemberMohallah = async () => {
    if (!editingMember?.accno) return;
    if (!editMemberForm.sector || !editMemberForm.subsector) {
      toast.error('Sector and Subsector are required');
      return;
    }

    setEditMemberSaving(true);
    try {
      await memberService.updateMuminDetails({
        AccNo: editingMember.accno,
        Sector: editMemberForm.sector,
        Subsector: editMemberForm.subsector,
        MohallaDescription: editMemberForm.mohallahDescription,
      });

      toast.success('Mohallah details updated');
      setEditMemberModalOpen(false);
      setEditingMember(null);
      await reloadMembers();
    } catch {
      toast.error('Failed to update mohallah details');
    } finally {
      setEditMemberSaving(false);
    }
  };

  const handlePrintAllCoordinators = async () => {
    try {
      const res = await mohallahService.LoadMohallaCordinatorsDetails({});
      const allCoordinators = rawToArr(res.data);

      if (!Array.isArray(allCoordinators)) {
        throw new Error('Coordinator print data is not an array');
      }

      const rows = allCoordinators.map((coordinator) => {
        const subsector = str(
          coordinator?.SubSector ??
            coordinator?.Subsector ??
            coordinator?.subsector ??
            coordinator?.subSector ??
            ''
        ).trim();

        const matchedMohallah = mohallaRows.find(
          (row) => str(row?.Subsector ?? row?.subsector ?? '').trim() === subsector
        );

        return {
          sector: str(
            coordinator?.Sector ??
              coordinator?.sector ??
              matchedMohallah?.Sector ??
              matchedMohallah?.sector ??
              '-'
          ).trim() || '-',
          subsector: subsector || '-',
          mohallahDescription: str(
            coordinator?.MohallaDescription ??
              coordinator?.mohallaDescription ??
              matchedMohallah?.MohallaDescription ??
              matchedMohallah?.mohallaDescription ??
              '-'
          ).trim() || '-',
          designation: str(coordinator?.Designation ?? coordinator?.designation ?? '-').trim() || '-',
          itsNo: str(coordinator?.ITSNo ?? coordinator?.itsNo ?? '-').trim() || '-',
          fullName: str(coordinator?.FullName ?? coordinator?.fullName ?? '-').trim() || '-',
          mobile: str(coordinator?.Mobile ?? coordinator?.mobile ?? '-').trim() || '-',
        };
      });

      rows.sort((a, b) => {
        const sectorCompare = String(a.sector).localeCompare(String(b.sector), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        if (sectorCompare !== 0) return sectorCompare;
        return String(a.subsector).localeCompare(String(b.subsector), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });

      const bodyRows = rows
        .map(
          (row, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${row.sector}</td>
              <td>${row.subsector}</td>
              <td>${row.mohallahDescription}</td>
              <td>${row.designation}</td>
              <td>${row.itsNo}</td>
              <td>${row.fullName}</td>
              <td>${row.mobile}</td>
            </tr>`
        )
        .join('');

      const html = `<html><head><title>All Mohallah Coordinators</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:11px;margin:20px}
        h2{margin:0 0 4px;font-size:16px}
        .sub{color:#666;font-size:10px;margin-bottom:14px}
        table{width:100%;border-collapse:collapse}
        th{background:#0f2850;color:#fff;padding:5px 7px;text-align:left;font-size:10px}
        td{padding:4px 7px;border-bottom:1px solid #e0e0e0;font-size:10px}
        tr:nth-child(even) td{background:#fff3e0}
        @media print{body{margin:10px}}
      </style></head><body>
      <h2>All Mohallah Coordinators</h2>
      <div class="sub">${rows.length} coordinators</div>
      <table>
        <thead>
          <tr>
            <th>S No</th>
            <th>Sector</th>
            <th>Subsector</th>
            <th>Mohallah</th>
            <th>Designation</th>
            <th>ITS No</th>
            <th>Full Name</th>
            <th>Mobile</th>
          </tr>
        </thead>
        <tbody>${bodyRows || '<tr><td colspan="8" style="color:#999">No coordinators found</td></tr>'}</tbody>
      </table>
      <script>window.onload=()=>{window.print()}</script>
      </body></html>`;

      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      const printWindow = window.open(url, '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked while opening print window');
      }
    } catch (error) {
      console.error('Failed to print coordinators:', error);
      toast.error('Failed to load coordinators for print');
    }
  };

  const openAddMohallahModal = () => {
    setMohallahModalMode('add');
    setMohallahForm({
      ID: null,
      Sector: selectedSector || '',
      Subsector: '',
      MohallaDescription: '',
    });
    setMohallahModalOpen(true);
  };

  const openEditMohallahModal = () => {
    if (!selectedMohalla) return;

    setMohallahModalMode('edit');
    setMohallahForm({
      ID: selectedMohalla.ID ?? selectedMohalla.id ?? null,
      Sector: str(selectedMohalla.Sector ?? selectedMohalla.sector),
      Subsector: str(selectedMohalla.Subsector ?? selectedMohalla.subsector),
      MohallaDescription: str(
        selectedMohalla.MohallaDescription ?? selectedMohalla.mohallaDescription
      ),
    });
    setMohallahModalOpen(true);
  };

  const saveMohallah = async () => {
    if (!mohallahForm.Sector || !mohallahForm.Subsector || !mohallahForm.MohallaDescription) {
      toast.error('Sector, Subsector and Mohalla Description are required');
      return;
    }

    setMohallahSaving(true);
    try {
      const payload = {
        ...mohallahForm,
        ID: mohallahForm.ID,
        Id: mohallahForm.ID,
        id: mohallahForm.ID,
      };

      if (mohallahModalMode === 'edit') {
        await mohallahService.UpdateMohallaDetails(payload);
        toast.success('Mohallah updated');
      } else {
        await mohallahService.AddMohallaDetails(payload);
        toast.success('Mohallah added');
      }

      await reloadMohallahs();
      setSelectedSector(mohallahForm.Sector);
      setSelectedSubsector(mohallahForm.Subsector);
      setMohallahModalOpen(false);
    } catch {
      toast.error(mohallahModalMode === 'edit' ? 'Failed to update mohallah' : 'Failed to add mohallah');
    } finally {
      setMohallahSaving(false);
    }
  };

  const handlePrint = () => {
    const noOptionalColumnsSelected =
      !printOpts.showThaliStatus && !printOpts.showThaliSize && !printOpts.showAmount;

    const cols = [
      { key: 'sno', label: 'S No' },
      { key: 'accno', label: 'Acc No' },
      { key: 'name', label: 'Full Name' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'itsNo', label: 'ITS No' },
      { key: 'localHofIts', label: 'Local HOF ITS' },
      { key: 'stayingIn', label: 'Staying In' },
      { key: 'sabeelType', label: 'Sabeel Type' },
      { key: 'membersCount', label: 'Members' },
      ...(printOpts.showThaliStatus ? [{ key: 'thaliStatus', label: 'Thali Status' }] : []),
      ...(printOpts.showThaliSize ? [{ key: 'thaliSize', label: 'Thali Size' }] : []),
      ...(printOpts.showAmount ? [{ key: 'sabeelAmount', label: 'Amount' }] : []),
      ...(printOpts.showAmount || noOptionalColumnsSelected ? [{ key: 'sign', label: 'Sign' }] : []),
    ];

    const coordRows = coordinators
      .map(
        (coordinator) => `
      <tr>
        <td>${coordinator.Designation ?? coordinator.designation ?? ''}</td>
        <td>${coordinator.ITSNo ?? coordinator.itsNo ?? ''}</td>
        <td>${coordinator.FullName ?? coordinator.fullName ?? ''}</td>
        <td>${coordinator.Mobile ?? coordinator.mobile ?? ''}</td>
      </tr>`
      )
      .join('');

    const memberRows = filteredMembers
      .map(
        (member, index) =>
          `<tr>${cols
            .map((col) => {
              if (col.key === 'sno') return `<td>${index + 1}</td>`;
              if (col.key === 'sign') return '<td style="min-width:90px"></td>';
              return `<td>${member[col.key] ?? '-'}</td>`;
            })
            .join('')}</tr>`
      )
      .join('');

    const html = `<html><head><title>${mohallaCode} - ${mohallaName}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;margin:20px}
      h2{margin:0 0 2px;font-size:16px}
      .sub{color:#666;font-size:10px;margin-bottom:14px}
      .badge{display:inline-block;border:2px solid #000;padding:6px 16px;font-size:28px;font-weight:900;margin-right:16px;vertical-align:middle}
      .badge-name{display:inline-block;font-size:13px;font-weight:700;vertical-align:middle}
      .section{font-weight:700;font-size:12px;margin:14px 0 4px;text-decoration:underline}
      .stats{font-weight:700;color:#c0392b;font-size:13px;margin:10px 0 6px}
      table{width:100%;border-collapse:collapse;margin-bottom:12px}
      th{background:#0f2850;color:#fff;padding:5px 7px;text-align:left;font-size:10px}
      td{padding:4px 7px;border-bottom:1px solid #e0e0e0;font-size:10px}
      tr:nth-child(even) td{background:#fff3e0}
      @media print{body{margin:10px}}
    </style></head><body>
    <div>
      <span class="badge">${mohallaCode}</span>
      <span class="badge-name">${mohallaName}${
        eventName ? `<br/><span style="font-weight:400">${eventName}</span>` : ''
      }</span>
    </div>
    <div class="section">Mohallah Coordinator Details</div>
    <table>
      <thead><tr><th>Designation</th><th>ITS No</th><th>Full Name</th><th>Mobile</th></tr></thead>
      <tbody>${coordRows || '<tr><td colspan="4" style="color:#999">No coordinators</td></tr>'}</tbody>
    </table>
    <div class="stats">Total House : ${totalHouses} &nbsp;&nbsp; Total Members : ${totalMembers}</div>
    <table>
      <thead><tr>${cols.map((col) => `<th>${col.label}</th>`).join('')}</tr></thead>
      <tbody>${memberRows || `<tr><td colspan="${cols.length}" style="color:#999">No members</td></tr>`}</tbody>
    </table>
    <script>window.onload=()=>{window.print()}</script>
    </body></html>`;

    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(url, '_blank');
  };

  const hasSelection = Boolean(selectedSubsector);

  return (
    <div>
      <PageHeader
        title="Mohallah Details"
        subtitle="Select a sector and mohallah to view coordinators and member list"
      />

      <MohallahSelectionPanel
        sectors={sectors}
        selectedSector={selectedSector}
        onSectorChange={(value) => {
          setSelectedSector(value);
          setSelectedSubsector('');
          setSelectedStayingIn('');
          setAddRow(null);
          setEditId(null);
        }}
        subsectorOptions={subsectorOptions}
        selectedSubsector={selectedSubsector}
        onSubsectorChange={(value) => {
          setSelectedSubsector(value);
          setSelectedStayingIn('');
          setAddRow(null);
          setEditId(null);
        }}
        selectedSabeelType={selectedSabeelType}
        onSabeelTypeChange={(value) => {
          setSelectedSabeelType(value);
          setSelectedStayingIn('');
        }}
        selectedStayingIn={selectedStayingIn}
        onStayingInChange={setSelectedStayingIn}
        stayingInOptions={stayingInOptions}
        eventName={eventName}
        onEventNameChange={setEventName}
        mohallaCode={mohallaCode}
        mohallaName={mohallaName}
        onAddMohallah={openAddMohallahModal}
        onEditMohallah={openEditMohallahModal}
        canEditMohallah={Boolean(selectedMohalla)}
      />

      <CoordinatorTable
        hasSelection={hasSelection}
        coordLoading={coordLoading}
        coordinators={coordinators}
        addRow={addRow}
        setAddRow={setAddRow}
        editId={editId}
        setEditId={setEditId}
        editData={editData}
        setEditData={setEditData}
        onSaveAdd={saveAdd}
        onSaveEdit={saveEdit}
        onDelete={deleteCoord}
        onPrintAll={handlePrintAllCoordinators}
      />

      {hasSelection && (
        <>
          <PrintOptionsBar
            printOpts={printOpts}
            setPrintOpts={setPrintOpts}
            onPrint={handlePrint}
            disabled={filteredMembers.length === 0}
          />

          <MemberListSection
            loadingMembers={loadingMembers}
            totalHouses={totalHouses}
            totalMembers={totalMembers}
            filteredMembers={filteredMembers}
            printOpts={printOpts}
            onViewMember={(accno) => router.push(`/mumin-details?accno=${accno}`)}
            onEditMember={openEditMemberModal}
            membersLoaded={membersLoaded}
          />
        </>
      )}

      <EditMohallahMemberModal
        open={editMemberModalOpen}
        onClose={() => {
          setEditMemberModalOpen(false);
          setEditingMember(null);
        }}
        saving={editMemberSaving}
        member={editingMember}
        form={editMemberForm}
        setForm={setEditMemberForm}
        sectorOptions={sectors}
        subsectorOptions={getSubsectorOptions(editMemberForm.sector)}
        onSave={saveMemberMohallah}
      />

      <EditMohallahModal
        open={mohallahModalOpen}
        mode={mohallahModalMode}
        form={mohallahForm}
        setForm={setMohallahForm}
        onClose={() => setMohallahModalOpen(false)}
        onSave={saveMohallah}
        saving={mohallahSaving}
        sectorOptions={sectors}
        subsectorOptions={getSubsectorOptions(mohallahForm.Sector)}
      />
    </div>
  );
}
