'use client';
import PermissionGuard from '@/components/shared/PermissionGuard';

import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { takhmeenService } from '@/services';

// ── Page Sizes ────────────────────────────────────────────────────────────────
const PAGE_SIZES = {
  'A4-portrait':  { w: 794,  h: 1123, label: 'A4 Portrait'  },
  'A4-landscape': { w: 1123, h: 794,  label: 'A4 Landscape' },
  'A5-portrait':  { w: 559,  h: 794,  label: 'A5 Portrait'  },
  'A5-landscape': { w: 794,  h: 559,  label: 'A5 Landscape' },
};
const DEFAULT_PAGE        = 'A4-portrait';
const DEFAULT_MARGIN      = { top: 20, right: 20, bottom: 20, left: 20 };
const DEFAULT_MARGIN_UNIT = 'mm';

const MARGIN_UNIT_FACTOR = { mm: 3.7795, cm: 37.795, in: 96 };
function pxToUnit(px, unit) { return Math.round((px / MARGIN_UNIT_FACTOR[unit]) * 10) / 10; }
function unitToPx(val, unit) { return Math.round(val * MARGIN_UNIT_FACTOR[unit]); }

// ── Mumin Fields (all from normalizeMember) ────────────────────────────────────
const MUMIN_FIELDS = [
  // Identity
  { field: 'name',          label: 'Full Name',       group: 'Identity' },
  { field: 'accno',         label: 'Acc No',          group: 'Identity' },
  { field: 'itsNo',         label: 'ITS No',          group: 'Identity' },
  { field: 'mobile',        label: 'Mobile',          group: 'Identity' },
  { field: 'mobile1',       label: 'Mobile (Alt)',    group: 'Identity' },
  { field: 'hofName',       label: 'HOF Name',        group: 'Identity' },
  { field: 'hofIts',        label: 'HOF ITS',         group: 'Identity' },
  // Location
  { field: 'sector',        label: 'Sector',          group: 'Location' },
  { field: 'subsector',     label: 'Sub Sector Code', group: 'Location' },
  { field: 'subsectorName', label: 'Mohallah Name',   group: 'Location' },
  { field: 'mohallah',      label: 'Mohallah',        group: 'Location' },
  { field: 'address',       label: 'Address',         group: 'Location' },
  { field: 'stayingIn',     label: 'Staying In',      group: 'Location' },
  { field: 'mouze',         label: 'Mouze',           group: 'Location' },
  // Status
  { field: 'sabeelType',    label: 'Sabeel Type',     group: 'Status' },
  { field: 'workStatus',    label: 'Work Status',     group: 'Status' },
  { field: 'grade',         label: 'Grade',           group: 'Status' },
  { field: 'status',        label: 'Account Status',  group: 'Status' },
  { field: 'thaaliStatus',  label: 'Thaali Status',   group: 'Status' },
  { field: 'thaaliSize',    label: 'Thaali Size',     group: 'Status' },
  // Finance
  { field: 'sabeelAmount',  label: 'Sabeel Amount',   group: 'Finance' },
  { field: 'sabeelRemark',  label: 'Sabeel Remark',   group: 'Finance' },
  // FMB & Misc
  { field: 'distributor',   label: 'Distributor',     group: 'FMB & Misc' },
  { field: 'tokenNo',       label: 'Token No',        group: 'FMB & Misc' },
  { field: 'fmbRemark',     label: 'FMB Remark',      group: 'FMB & Misc' },
  // Dates
  { field: 'createdDate',   label: 'Account Created', group: 'Dates' },
  { field: 'closeYear',     label: 'Close Year',      group: 'Dates' },
  { field: 'tempFrom',      label: 'Temp From',       group: 'Dates' },
  { field: 'tempTo',        label: 'Temp To',         group: 'Dates' },
];
const MUMIN_GROUPS = [...new Set(MUMIN_FIELDS.map(f => f.group))];

// ── Raza Fields (from razadetails table) ───────────────────────────────────────
const RAZA_FIELDS = [
  { field: 'serialNo',    label: 'Serial No'    },
  { field: 'requestDate', label: 'Request Date' },
  { field: 'razafor',     label: 'Raza For'     },
  { field: 'eventDate',   label: 'Event Date'   },
  { field: 'hijriDate',   label: 'Hijri Date'   },
  { field: 'place',       label: 'Place'        },
  { field: 'eventTime',   label: 'Event Time'   },
  { field: 'thaal',       label: 'Thaal'        },
  { field: 'remark',      label: 'Remark'       },
  { field: 'razaStatus',  label: 'Raza Status'  },
  { field: 'requestby',   label: 'Requested By' },
  { field: 'accno',       label: 'Acc No'       },
  { field: 'fullName',    label: 'Full Name'    },
  { field: 'mobile',      label: 'Mobile'       },
  { field: 'mobile1',     label: 'Mobile (alt)' },
  { field: 'itsNo',       label: 'ITS No'       },
  { field: 'address',     label: 'Address'      },
];

// ── Receipt Fields (from transactions table) ────────────────────────────────
const RECEIPT_FIELDS = [
  { field: 'receiptNo',     label: 'Receipt No'        },
  { field: 'date',          label: 'Received Date'     },
  { field: 'mode',          label: 'Payment Mode'      },
  { field: 'refNo',         label: 'Ref / Cheque No'   },
  { field: 'remark',        label: 'Remark'            },
  { field: 'amount',        label: 'Amount'            },
  { field: 'amountInWords', label: 'Amount in Words'   },
  { field: 'mainHead',      label: 'Main Head'         },
  { field: 'subHead',       label: 'Sub Head'          },
  { field: 'accno',         label: 'Acc No'            },
  { field: 'status',        label: 'Status'            },
  { field: 'fundLabel',     label: 'Fund Label (Auto)' },
  { field: 'cashMemoLabel',  label: 'Cash Memo Badge'           },
  { field: 'receivedFrom',   label: 'Received From (Name)'      },
  { field: 'createdBy',      label: 'Received By (Collector)'   },
];

const HISTORY_COLS = [
  { key: 'forYear',   label: 'Year'      },
  { key: 'takhmeen',  label: 'Takhmeen'  },
  { key: 'received',  label: 'Received'  },
  { key: 'grade',     label: 'Grade'     },
  { key: 'date',      label: 'Date'      },
  { key: 'remark',    label: 'Remark'    },
  { key: 'remaining', label: 'Remaining' },
];
const DEFAULT_COLS = ['forYear', 'takhmeen', 'grade', 'received'];

// Legacy localStorage key — used only for one-time migration
const LEGACY_STORAGE_KEY = 'takhmeen_form_templates';

// ── Default Receipt Templates ────────────────────────────────────────────────
function makeDefaultReceiptTemplates() {
  const TNR  = 'Times New Roman';
  const KANZ = 'Al-KANZ';

  // ── A4 Portrait (794×1123): receipt slip top-half + annexure bottom-half ──
  const a4Elements = [
    // Receipt slip outer border
    { id:'rs_box',      type:'box',          x:10,  y:10,  w:774, h:516, borderWidth:2,   borderColor:'#000000', bgColor:'' },
    // Header
    { id:'rs_h1',       type:'label',        x:16,  y:16,  w:762, h:27,  text:'SHIA DAWOODI BOHRA JAMAAT MASJID & DARUL EMARAT, SAGWARA', fontSize:13, fontFamily:TNR, bold:true, align:'center', fontColor:'#000000', bgColor:'' },
    { id:'rs_h2',       type:'label',        x:16,  y:43,  w:762, h:19,  text:'Waqf Reg. No. 21 (Dungarpur)', fontSize:12, fontFamily:TNR, align:'center', fontColor:'#000000', bgColor:'' },
    { id:'rs_h3',       type:'label',        x:16,  y:62,  w:762, h:19,  text:'Managed by : Anjuman-e-Saifee Jamaat, Sagwara', fontSize:12, fontFamily:TNR, align:'center', fontColor:'#000000', bgColor:'' },
    { id:'rs_hline',    type:'line',         x:10,  y:83,  w:774, h:4,   orientation:'h', lineColor:'#000000', lineWidth:1.5, lineStyle:'solid' },
    // Row 1: receipt no (right) | cash memo badge (centre) | date (left)
    { id:'rs_rno_l',    type:'label',        x:524, y:90,  w:120, h:26,  text:'رسید نمبر :', fontSize:15, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'rs_rno_v',    type:'receiptField', field:'receiptNo',     label:'', x:648, y:90,  w:130, h:26, fontSize:14, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'rs_cm',       type:'receiptField', field:'cashMemoLabel', label:'', x:290, y:90,  w:160, h:26, fontSize:14, fontFamily:'Arial', bold:true, align:'center', fontColor:'#dc2626', bgColor:'' },
    { id:'rs_dt_l',     type:'label',        x:18,  y:90,  w:90,  h:26,  text:'تاریخ :', fontSize:15, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'rs_dt_v',     type:'receiptField', field:'date',          label:'', x:112, y:90,  w:160, h:26, fontSize:14, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    // Row 2: Name
    { id:'rs_nm_l',     type:'label',        x:660, y:124, w:122, h:27,  text:'نام :', fontSize:16, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'rs_nm_hon',   type:'label',        x:478, y:124, w:178, h:27,  text:'(حفظہ اللہ تعالی)', fontSize:13, fontFamily:KANZ, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'rs_nm_v',     type:'receiptField', field:'receivedFrom',  label:'', x:18,  y:124, w:456, h:27, fontSize:15, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    // Row 3: ITS No (left) | Acc No (right)
    { id:'rs_its_l',    type:'label',        x:18,  y:159, w:66,  h:25,  text:'ITS No :', fontSize:13, fontFamily:TNR, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'rs_its_v',    type:'muminField',   field:'itsNo',         label:'', x:88,  y:159, w:160, h:25, fontSize:13, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'rs_acc_l',    type:'label',        x:556, y:159, w:100, h:25,  text:'سال نمبر :', fontSize:15, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'rs_acc_v',    type:'receiptField', field:'accno',         label:'', x:660, y:159, w:118, h:25, fontSize:14, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    // Row 4: Address
    { id:'rs_addr_l',   type:'label',        x:18,  y:191, w:70,  h:25,  text:'Address :', fontSize:13, fontFamily:TNR, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'rs_addr_v',   type:'muminField',   field:'address',       label:'', x:92,  y:191, w:688, h:26, fontSize:13, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    // Salaam
    { id:'rs_salaam',   type:'label',        x:190, y:228, w:414, h:36,  text:'بعد السلام الجمیل', fontSize:22, fontFamily:KANZ, align:'center', fontColor:'#000000', bgColor:'' },
    // Amount row (right→left: label | amount | اکہ | amount-in-words)
    { id:'rs_amt_l',    type:'label',        x:442, y:276, w:210, h:28,  text:'آپ طرف سی روبیہ :', fontSize:15, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'rs_amt_v',    type:'receiptField', field:'amount',        label:'', x:314, y:276, w:124, h:28, fontSize:15, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'rs_ankhe',    type:'label',        x:268, y:276, w:42,  h:28,  text:'اکہ', fontSize:14, fontFamily:KANZ, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'rs_amtw',     type:'receiptField', field:'amountInWords', label:'', x:18,  y:276, w:246, h:28, fontSize:12, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    // Fund label (full text from ContributionType: Urdu + English)
    { id:'rs_fund',     type:'receiptField', field:'fundLabel',     label:'', x:18,  y:316, w:760, h:30, fontSize:15, fontFamily:KANZ, bold:true, align:'center', fontColor:'#000000', bgColor:'' },
    // Signature / bottom row
    { id:'rs_sig_l',    type:'label',        x:376, y:450, w:406, h:22,  text:'(وصول کرنار رقم صحیح عبد سیدنا طع)', fontSize:12, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'rs_recv',     type:'receiptField', field:'createdBy',     label:'', x:540, y:472, w:238, h:22, fontSize:12, fontFamily:TNR, bold:true, align:'center', fontColor:'#000000', bgColor:'' },
    { id:'rs_sig_line', type:'line',         x:500, y:494, w:278, h:3,   orientation:'h', lineColor:'#000000', lineWidth:1, lineStyle:'solid' },
    { id:'rs_mode',     type:'receiptField', field:'mode',          label:'', x:18,  y:498, w:180, h:22, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },

    // ── Annexure ─────────────────────────────────────────────────────────────
    { id:'ax_box',      type:'box',          x:10,  y:542, w:774, h:572, borderWidth:1.5, borderColor:'#000000', bgColor:'' },
    { id:'ax_hdr',      type:'label',        x:10,  y:542, w:774, h:32,  text:'Receipt Details', fontSize:13, fontFamily:TNR, bold:true, align:'center', fontColor:'#000000', bgColor:'#e8e8e8' },
    { id:'ax_hline',    type:'line',         x:10,  y:574, w:774, h:2,   orientation:'h', lineColor:'#aaaaaa', lineWidth:1, lineStyle:'solid' },
    // Info row 1: receipt no | date
    { id:'ax_r1_l1',    type:'label',        x:18,  y:580, w:78,  h:21,  text:'Receipt No:', fontSize:11, fontFamily:TNR, bold:true, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'ax_r1_v1',    type:'receiptField', field:'receiptNo',     label:'', x:98,  y:580, w:120, h:21, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'ax_r1_l2',    type:'label',        x:265, y:580, w:100, h:21,  text:'Received Date:', fontSize:11, fontFamily:TNR, bold:true, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'ax_r1_v2',    type:'receiptField', field:'date',          label:'', x:368, y:580, w:140, h:21, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    // Info row 2: acc no | full name
    { id:'ax_r2_l1',    type:'label',        x:18,  y:605, w:58,  h:21,  text:'Acc No:', fontSize:11, fontFamily:TNR, bold:true, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'ax_r2_v1',    type:'receiptField', field:'accno',         label:'', x:78,  y:605, w:120, h:21, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'ax_r2_l2',    type:'label',        x:220, y:605, w:76,  h:21,  text:'Full Name:', fontSize:11, fontFamily:TNR, bold:true, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'ax_r2_v2',    type:'receiptField', field:'receivedFrom',  label:'', x:298, y:605, w:488, h:21, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    // Info row 3: ITS | mobile | mode
    { id:'ax_r3_l1',    type:'label',        x:18,  y:630, w:52,  h:21,  text:'ITS No:', fontSize:11, fontFamily:TNR, bold:true, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'ax_r3_v1',    type:'muminField',   field:'itsNo',         label:'', x:72,  y:630, w:130, h:21, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'ax_r3_l2',    type:'label',        x:240, y:630, w:56,  h:21,  text:'Mobile:', fontSize:11, fontFamily:TNR, bold:true, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'ax_r3_v2',    type:'muminField',   field:'mobile',        label:'', x:298, y:630, w:150, h:21, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'ax_r3_l3',    type:'label',        x:490, y:630, w:48,  h:21,  text:'Mode:', fontSize:11, fontFamily:TNR, bold:true, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'ax_r3_v3',    type:'receiptField', field:'mode',          label:'', x:540, y:630, w:140, h:21, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    // Remark
    { id:'ax_rem_l',    type:'label',        x:18,  y:655, w:58,  h:21,  text:'Remark:', fontSize:11, fontFamily:TNR, bold:true, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'ax_rem_v',    type:'receiptField', field:'remark',        label:'', x:78,  y:655, w:704, h:21, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'ax_iline',    type:'line',         x:10,  y:679, w:774, h:2,   orientation:'h', lineColor:'#cccccc', lineWidth:1, lineStyle:'solid' },
    // Items grid
    { id:'ax_grid',     type:'receiptItemsGrid', x:10, y:681, w:774, h:428, fontSize:13, fontFamily:TNR, bgColor:'#ffffff' },
  ];

  // ── A5 Landscape (794×559): receipt slip only (annexure on next page via CSS) ──
  const a5Elements = [
    { id:'s5_box',      type:'box',          x:8,   y:8,   w:778, h:543, borderWidth:2,   borderColor:'#000000', bgColor:'' },
    { id:'s5_h1',       type:'label',        x:14,  y:13,  w:766, h:23,  text:'SHIA DAWOODI BOHRA JAMAAT MASJID & DARUL EMARAT, SAGWARA', fontSize:12, fontFamily:TNR, bold:true, align:'center', fontColor:'#000000', bgColor:'' },
    { id:'s5_h2',       type:'label',        x:14,  y:36,  w:766, h:18,  text:'Waqf Reg. No. 21 (Dungarpur)   |   Managed by : Anjuman-e-Saifee Jamaat, Sagwara', fontSize:11, fontFamily:TNR, align:'center', fontColor:'#000000', bgColor:'' },
    { id:'s5_hline',    type:'line',         x:8,   y:57,  w:778, h:3,   orientation:'h', lineColor:'#000000', lineWidth:1.5, lineStyle:'solid' },
    // Row 1: receipt no | cash memo | date
    { id:'s5_rno_l',    type:'label',        x:490, y:63,  w:110, h:24,  text:'رسید نمبر :', fontSize:14, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'s5_rno_v',    type:'receiptField', field:'receiptNo',     label:'', x:602, y:63,  w:178, h:24, fontSize:13, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'s5_cm',       type:'receiptField', field:'cashMemoLabel', label:'', x:278, y:63,  w:160, h:24, fontSize:13, fontFamily:'Arial', bold:true, align:'center', fontColor:'#dc2626', bgColor:'' },
    { id:'s5_dt_l',     type:'label',        x:14,  y:63,  w:82,  h:24,  text:'تاریخ :', fontSize:14, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'s5_dt_v',     type:'receiptField', field:'date',          label:'', x:98,  y:63,  w:152, h:24, fontSize:13, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    // Row 2: Name
    { id:'s5_nm_l',     type:'label',        x:646, y:94,  w:132, h:25,  text:'نام :', fontSize:15, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'s5_nm_hon',   type:'label',        x:460, y:94,  w:182, h:25,  text:'(حفظہ اللہ تعالی)', fontSize:12, fontFamily:KANZ, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'s5_nm_v',     type:'receiptField', field:'receivedFrom',  label:'', x:14,  y:94,  w:442, h:26, fontSize:14, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    // Row 3: ITS | Acc No
    { id:'s5_its_l',    type:'label',        x:14,  y:127, w:62,  h:23,  text:'ITS No :', fontSize:12, fontFamily:TNR, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'s5_its_v',    type:'muminField',   field:'itsNo',         label:'', x:78,  y:127, w:150, h:23, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'s5_acc_l',    type:'label',        x:536, y:127, w:100, h:23,  text:'سال نمبر :', fontSize:14, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'s5_acc_v',    type:'receiptField', field:'accno',         label:'', x:638, y:127, w:152, h:23, fontSize:13, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    // Row 4: Address
    { id:'s5_addr_l',   type:'label',        x:14,  y:156, w:66,  h:23,  text:'Address :', fontSize:12, fontFamily:TNR, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'s5_addr_v',   type:'muminField',   field:'address',       label:'', x:82,  y:156, w:700, h:24, fontSize:12, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
    // Salaam
    { id:'s5_salaam',   type:'label',        x:200, y:190, w:394, h:32,  text:'بعد السلام الجمیل', fontSize:20, fontFamily:KANZ, align:'center', fontColor:'#000000', bgColor:'' },
    // Amount row
    { id:'s5_amt_l',    type:'label',        x:420, y:232, w:214, h:26,  text:'آپ طرف سی روبیہ :', fontSize:14, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'s5_amt_v',    type:'receiptField', field:'amount',        label:'', x:296, y:232, w:120, h:26, fontSize:14, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    { id:'s5_ankhe',    type:'label',        x:252, y:232, w:40,  h:26,  text:'اکہ', fontSize:13, fontFamily:KANZ, align:'left',  fontColor:'#000000', bgColor:'' },
    { id:'s5_amtw',     type:'receiptField', field:'amountInWords', label:'', x:14,  y:232, w:234, h:26, fontSize:11, fontFamily:TNR, bold:true, align:'left',   fontColor:'#000000', bgColor:'' },
    // Fund label (full text from ContributionType: Urdu + English)
    { id:'s5_fund',     type:'receiptField', field:'fundLabel',     label:'', x:14,  y:270, w:770, h:28, fontSize:15, fontFamily:KANZ, bold:true, align:'center', fontColor:'#000000', bgColor:'' },
    // Bottom row
    { id:'s5_sig_l',    type:'label',        x:376, y:480, w:406, h:22,  text:'(وصول کرنار رقم صحیح عبد سیدنا طع)', fontSize:11, fontFamily:KANZ, align:'right', fontColor:'#000000', bgColor:'' },
    { id:'s5_recv',     type:'receiptField', field:'createdBy',     label:'', x:510, y:502, w:268, h:20, fontSize:11, fontFamily:TNR, bold:true, align:'center', fontColor:'#000000', bgColor:'' },
    { id:'s5_sig_line', type:'line',         x:480, y:522, w:298, h:3,   orientation:'h', lineColor:'#000000', lineWidth:1, lineStyle:'solid' },
    { id:'s5_mode',     type:'receiptField', field:'mode',          label:'', x:14,  y:526, w:180, h:20, fontSize:11, fontFamily:TNR, align:'left',   fontColor:'#000000', bgColor:'' },
  ];

  return [
    {
      Name: 'Receipt - A4',
      SubHead: null,
      IsDefault: 0,
      TemplateJson: JSON.stringify({ pageSize: 'A4-portrait',  margin: { top:10, right:10, bottom:10, left:10 }, marginUnit:'mm', bgImage:'', elements: a4Elements }),
    },
    {
      Name: 'Receipt - A5',
      SubHead: null,
      IsDefault: 0,
      TemplateJson: JSON.stringify({ pageSize: 'A5-landscape', margin: { top:8,  right:8,  bottom:8,  left:8  }, marginUnit:'mm', bgImage:'', elements: a5Elements }),
    },
  ];
}

// ── DB ↔ Frontend conversion ────────────────────────────────────────────────
function dbRowToTpl(row) {
  let config = {};
  try { config = JSON.parse(row.TemplateJson || '{}'); } catch {}
  return {
    id:         row.ID,
    name:       row.Name,
    subHead:    row.SubHead  || '',
    isDefault:  Boolean(row.IsDefault),
    pageSize:   config.pageSize   || DEFAULT_PAGE,
    margin:     config.margin     || DEFAULT_MARGIN,
    marginUnit: config.marginUnit || DEFAULT_MARGIN_UNIT,
    bgImage:    config.bgImage    || '',
    elements:   config.elements   || [],
  };
}

function tplToDbPayload(tpl) {
  return {
    ID:          tpl.id,
    Name:        tpl.name,
    SubHead:     tpl.subHead || null,
    IsDefault:   tpl.isDefault ? 1 : 0,
    TemplateJson: JSON.stringify({
      pageSize:   tpl.pageSize   || DEFAULT_PAGE,
      margin:     tpl.margin     || DEFAULT_MARGIN,
      marginUnit: tpl.marginUnit || DEFAULT_MARGIN_UNIT,
      bgImage:    tpl.bgImage    || '',
      elements:   tpl.elements   || [],
    }),
  };
}

const FONT_LIST = [
  'Arial', 'Arial Narrow', 'Calibri', 'Cambria', 'Comic Sans MS',
  'Courier New', 'Georgia', 'Helvetica', 'Impact',
  'Noto Naskh Arabic', 'Noto Sans', 'Noto Serif',
  'Palatino Linotype', 'Tahoma', 'Times New Roman', 'Trebuchet MS',
  'Verdana', 'Al-KANZ',
];

// Display name for each element type (shown as "control name" in properties)
const EL_NAME = {
  muminField:   el => MUMIN_FIELDS.find(f => f.field === el?.field)?.label || 'Mumin Field',
  subHead:      ()  => 'Hub Sub Head',
  forYear:      ()  => 'For Year',
  currentDate:  ()  => 'Current Date',
  historyGrid:  ()  => 'History Grid',
  label:        ()  => 'Static Label',
  inputLine:    ()  => 'Input Line',
  image:        el  => el?.isBackground ? 'Background Image' : 'Image',
  razaField:        el => RAZA_FIELDS.find(f => f.field === el?.field)?.label || 'Raza Field',
  receiptField:     el => RECEIPT_FIELDS.find(f => f.field === el?.field)?.label || 'Receipt Field',
  receiptItemsGrid: ()  => 'Receipt Items Grid',
  box:              ()  => 'Box / Rectangle',
  line:         el  => (el?.orientation || 'h') === 'v' ? 'Vertical Line' : 'Horizontal Line',
};

// ── Element ID helper ──────────────────────────────────────────────────────────
function newId() { return `e_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }

// Migrate old bgImage string → image element (used during localStorage → DB migration)
function migrateBgImage(t) {
  if (t.bgImage && !(t.elements || []).find(e => e.type === 'image')) {
    const ps = PAGE_SIZES[t.pageSize || DEFAULT_PAGE] || PAGE_SIZES[DEFAULT_PAGE];
    const imgEl = { id: `img_${t.id}`, type: 'image', src: t.bgImage, x: 0, y: 0, w: ps.w, h: ps.h, isBackground: true, locked: false };
    return { ...t, bgImage: '', elements: [imgEl, ...(t.elements || [])] };
  }
  return t;
}

// ── Element defaults ────────────────────────────────────────────────────────────
function mkEl(type, field) {
  const base = {
    id: newId(), x: 80, y: 80, w: 240, h: 32,
    fontSize: 13, fontFamily: 'Arial', fontColor: '#111827', bold: false, italic: false,
    bgColor: '', align: 'left',
  };
  switch (type) {
    case 'muminField':  return { ...base, type, field, label: (MUMIN_FIELDS.find(f => f.field === field)?.label || '') + ':' };
    case 'razaField':        return { ...base, type, field, label: (RAZA_FIELDS.find(f => f.field === field)?.label || '') + ':' };
    case 'receiptField':     return { ...base, type, field, label: (RECEIPT_FIELDS.find(f => f.field === field)?.label || '') + ':' };
    case 'receiptItemsGrid': return { ...base, type, w: 560, h: 200, fontSize: 11, bgColor: '#ffffff' };
    case 'subHead':          return { ...base, type, label: 'Sub Head:' };
    case 'forYear':     return { ...base, type, label: 'Year:' };
    case 'currentDate': return { ...base, type, label: 'Date:' };
    case 'historyGrid': return { ...base, type, columns: [...DEFAULT_COLS], w: 560, h: 220, rowCount: 5, fontSize: 11, bgColor: '#ffffff' };
    case 'label':       return { ...base, type, text: 'Label Text', fontSize: 20, bold: true, w: 360, h: 44 };
    case 'inputLine':   return { ...base, type, label: 'Amount:', w: 280, h: 32 };
    case 'box':         return { ...base, type, borderColor: '#111827', borderWidth: 1, borderRadius: 0, bgColor: '', w: 200, h: 100 };
    case 'line':        return { ...base, type, orientation: 'h', lineColor: '#111827', lineWidth: 2, lineStyle: 'solid', w: 200, h: 20 };
    default:            return { ...base, type };
  }
}

// ── Resize math ─────────────────────────────────────────────────────────────────
const MIN_SZ = 30;
function applyResize(orig, handle, dx, dy) {
  let { x, y, w, h } = { x: orig.x, y: orig.y, w: orig.w || 200, h: orig.h || 32 };
  if (handle.includes('n')) { y += dy; h -= dy; }
  if (handle.includes('s')) { h += dy; }
  if (handle.includes('w')) { x += dx; w -= dx; }
  if (handle.includes('e')) { w += dx; }
  if (w < MIN_SZ) { if (handle.includes('w')) x = orig.x + (orig.w || 200) - MIN_SZ; w = MIN_SZ; }
  if (h < MIN_SZ) { if (handle.includes('n')) y = orig.y + (orig.h || 32) - MIN_SZ; h = MIN_SZ; }
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

// ── Resize handles ─────────────────────────────────────────────────────────────
const HANDLE_DEFS = [
  { id: 'nw', cursor: 'nw-resize', style: { top: -5,    left: -5   } },
  { id: 'n',  cursor: 'n-resize',  style: { top: -5,    left: '50%', transform: 'translateX(-50%)' } },
  { id: 'ne', cursor: 'ne-resize', style: { top: -5,    right: -5  } },
  { id: 'w',  cursor: 'w-resize',  style: { top: '50%', left: -5,   transform: 'translateY(-50%)' } },
  { id: 'e',  cursor: 'e-resize',  style: { top: '50%', right: -5,  transform: 'translateY(-50%)' } },
  { id: 'sw', cursor: 'sw-resize', style: { bottom: -5, left: -5   } },
  { id: 's',  cursor: 's-resize',  style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
  { id: 'se', cursor: 'se-resize', style: { bottom: -5, right: -5  } },
];

function ResizeHandles({ onHandleDown }) {
  return (
    <>
      {HANDLE_DEFS.map(h => (
        <div
          key={h.id}
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onHandleDown(e, h.id); }}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            width: 9, height: 9,
            background: '#3b82f6',
            border: '2px solid #ffffff',
            borderRadius: 2,
            boxShadow: '0 0 0 1px #1d4ed8',
            cursor: h.cursor,
            zIndex: 30,
            ...h.style,
          }}
        />
      ))}
    </>
  );
}

// ── Canvas element renderer ────────────────────────────────────────────────────
function DesignerElement({ el, selected, isMultiSelected, onElementMouseDown, onResizeStart }) {
  const ts = {
    fontSize:   el.fontSize  || 13,
    fontFamily: el.fontFamily || 'Arial',
    color:      el.fontColor || '#111827',
    fontWeight: el.bold   ? 700 : 400,
    fontStyle:  el.italic ? 'italic' : 'normal',
    textAlign:  el.align  || 'left',
    lineHeight: 1.3,
  };

  const locked = Boolean(el.locked);

  return (
    <div
      style={{
        position:   'absolute',
        left:       el.x,
        top:        el.y,
        width:      el.w || 'auto',
        height:     el.h || 'auto',
        background: (el.type === 'image' || el.type === 'line') ? 'transparent' : (el.bgColor || 'transparent'),
        outline:    locked ? 'none' : (selected ? '2px solid #3b82f6' : (isMultiSelected ? '2px dashed #6366f1' : (el.type === 'image' && el.isBackground !== false ? '1px dashed rgba(59,130,246,0.15)' : el.type === 'image' ? '1px dashed rgba(59,130,246,0.5)' : '1px dashed rgba(130,130,130,0.4)'))),
        cursor:     locked ? 'default' : 'move',
        userSelect: 'none',
        overflow:   'hidden',
        zIndex:     selected ? 10 : (el.type === 'box' ? 0 : (el.type === 'image' && el.isBackground !== false ? 0 : 2)),
        padding:    el.type === 'image' ? 0 : '2px 4px',
        boxSizing:  'border-box',
        textAlign:  el.align || 'left',
      }}
      onMouseDown={e => { if (locked) return; e.stopPropagation(); onElementMouseDown(e, el.id); }}
      onClick={e => { if (!locked) e.stopPropagation(); }}
      onContextMenu={e => { e.preventDefault(); if (!locked) onElementMouseDown(e, el.id); }}
    >
      {/* Lock badge */}
      {locked && el.type === 'image' && (
        <div style={{ position: 'absolute', top: 4, right: 4, zIndex: 5, background: 'rgba(0,0,0,0.45)', borderRadius: 4, padding: '1px 5px', fontSize: 11, color: '#fff', pointerEvents: 'none', lineHeight: 1.6 }}>
          🔒
        </div>
      )}

      {/* Image element */}
      {el.type === 'image' && (
        <img src={el.src} alt="" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: el.isBackground !== false ? 'fill' : 'contain', display: 'block', pointerEvents: 'none' }} />
      )}

      {/* Field-bound elements */}
      {(el.type === 'muminField' || el.type === 'razaField' || el.type === 'receiptField' || el.type === 'subHead' || el.type === 'forYear') && (
        <span style={ts}>
          <span style={{ fontWeight: el.bold ? 700 : 600 }}>{el.label}&nbsp;</span>
          <span style={{ color: '#3b82f6', fontStyle: 'normal' }}>___</span>
        </span>
      )}

      {el.type === 'currentDate' && (
        <span style={ts}>
          <span style={{ fontWeight: el.bold ? 700 : 600 }}>{el.label}&nbsp;</span>
          <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </span>
      )}

      {/* Static label */}
      {el.type === 'label' && <span style={ts}>{el.text}</span>}

      {/* Input line */}
      {el.type === 'inputLine' && (
        <div style={{ ...ts, display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: 2 }}>
          <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{el.label}&nbsp;</span>
          <span style={{ flex: 1, borderBottom: `1.5px solid ${el.fontColor || '#111'}`, display: 'block', minWidth: 30 }} />
        </div>
      )}

      {/* History grid */}
      {el.type === 'historyGrid' && (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: el.bgColor || '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontFamily: el.fontFamily || 'Arial' }}>
            <thead>
              <tr>
                {(el.columns || DEFAULT_COLS).map(c => (
                  <th key={c} style={{ border: '1px solid #d1d5db', padding: '2px 4px', background: '#f0f4fa', fontSize: Math.max((el.fontSize || 11) - 1, 9), fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {HISTORY_COLS.find(h => h.key === c)?.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: el.rowCount || 5 }).map((_, i) => (
                <tr key={i}>
                  {(el.columns || DEFAULT_COLS).map(c => (
                    <td key={c} style={{ border: '1px solid #e5e7eb', padding: '2px 4px', height: 20 }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt items grid preview */}
      {el.type === 'receiptItemsGrid' && (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: el.bgColor || '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontFamily: el.fontFamily || 'Arial' }}>
            <thead>
              <tr>
                {['#', 'Sub Head', 'Year', 'Amount'].map((h, i) => (
                  <th key={h} style={{ border: '1px solid #d1d5db', padding: '2px 4px', background: '#e8e8e8', fontSize: Math.max((el.fontSize || 11) - 1, 9), fontWeight: 600, textAlign: i === 0 || i === 2 ? 'center' : i === 3 ? 'right' : 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #e5e7eb', padding: '2px 4px', height: 20, textAlign: 'center', fontSize: el.fontSize || 11, color: '#9ca3af' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '2px 4px', height: 20 }} />
                  <td style={{ border: '1px solid #e5e7eb', padding: '2px 4px', height: 20 }} />
                  <td style={{ border: '1px solid #e5e7eb', padding: '2px 4px', height: 20 }} />
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ border: '1px solid #ccc', padding: '2px 4px', background: '#e8e8e8', fontSize: Math.max((el.fontSize || 11) - 1, 9), fontStyle: 'italic', color: '#6b7280' }}>Amount in words…</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 4px', background: '#e8e8e8', fontWeight: 'bold', textAlign: 'right', fontSize: el.fontSize || 11 }}>₹ —</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Box / Rectangle */}
      {el.type === 'box' && (
        <div style={{
          position: 'absolute', inset: 0, boxSizing: 'border-box', pointerEvents: 'none',
          border: `${el.borderWidth || 1}px solid ${el.borderColor || '#111827'}`,
          borderRadius: el.borderRadius || 0,
        }} />
      )}

      {/* Line */}
      {el.type === 'line' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          {(el.orientation || 'h') === 'v'
            ? <div style={{ width: 0, height: '100%', borderLeft: `${el.lineWidth || 2}px ${el.lineStyle || 'solid'} ${el.lineColor || '#111827'}` }} />
            : <div style={{ width: '100%', height: 0, borderTop: `${el.lineWidth || 2}px ${el.lineStyle || 'solid'} ${el.lineColor || '#111827'}` }} />
          }
        </div>
      )}

      {(selected || isMultiSelected) && !locked && (
        <ResizeHandles onHandleDown={(e, handle) => onResizeStart(e, el.id, handle)} />
      )}
    </div>
  );
}

// ── Properties Panel ───────────────────────────────────────────────────────────
function PropertiesPanel({ el, onChange, onDelete, onCopy }) {
  if (!el) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-5 gap-2">
        <div className="text-3xl text-gray-200">⊹</div>
        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          Click any element on the canvas to edit its properties
        </p>
      </div>
    );
  }

  const displayName = EL_NAME[el.type]?.(el) || el.type;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Control name header */}
      <div className="flex-shrink-0 bg-navy-900 text-white px-3 py-2.5 flex items-center justify-between">
        <div>
          <div className="text-[9px] text-white/40 uppercase tracking-widest leading-tight">Control</div>
          <div className="text-[14px] font-semibold leading-tight">{displayName}</div>
        </div>
        <div className="flex gap-1">
          <button onClick={onCopy}
            className="text-[10px] bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 border border-blue-500/30 rounded px-2 py-1 transition-colors">
            ⎘ Copy
          </button>
          <button onClick={onDelete}
            className="text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 rounded px-2 py-1 transition-colors">
            ✕ Delete
          </button>
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-[12px]">

        {/* Lock toggle — images only */}
        {el.type === 'image' && (
          <button
            onClick={() => onChange({ ...el, locked: !el.locked })}
            className={`w-full text-[11px] py-1.5 rounded border font-medium transition-colors flex items-center justify-center gap-1.5 ${
              el.locked
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'bg-white border-border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {el.locked ? '🔒 Locked — click to unlock' : '🔓 Unlocked — click to lock'}
          </button>
        )}

        {/* Position & Size */}
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Position & Size</div>
          <div className="grid grid-cols-2 gap-1.5">
            {[['X', 'x'], ['Y', 'y'], ['W', 'w'], ['H', 'h']].map(([lbl, key]) => (
              <label key={key}>
                <span className="form-label text-[10px]">{lbl} (px)</span>
                <input type="number" className="form-input text-[11px] py-1"
                  value={el[key] ?? 0}
                  onChange={e => onChange({ ...el, [key]: Number(e.target.value) })} />
              </label>
            ))}
          </div>
        </div>

        {/* Typography — hidden for image/shape elements */}
        {el.type !== 'image' && el.type !== 'box' && el.type !== 'line' && <div>
          <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Typography</div>
          <div className="space-y-2.5">
            {/* Font family */}
            <label>
              <span className="form-label text-[10px]">Font</span>
              <select className="form-input text-[11px] py-1"
                value={el.fontFamily || 'Arial'}
                style={{ fontFamily: el.fontFamily || 'Arial' }}
                onChange={e => onChange({ ...el, fontFamily: e.target.value })}>
                {FONT_LIST.map(f => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>
            </label>

            {/* Font size slider */}
            <label>
              <span className="form-label text-[10px]">Font Size — {el.fontSize || 13}px</span>
              <input type="range" min={8} max={48} value={el.fontSize || 13}
                onChange={e => onChange({ ...el, fontSize: Number(e.target.value) })}
                className="w-full accent-blue-500" />
            </label>

            {/* Font color */}
            <div className="flex items-center gap-2">
              <span className="form-label text-[10px] w-14 flex-shrink-0">Color</span>
              <input type="color" value={el.fontColor || '#111827'}
                onChange={e => onChange({ ...el, fontColor: e.target.value })}
                className="h-7 w-10 rounded cursor-pointer border border-border flex-shrink-0" />
              <span className="text-[10px] text-gray-500 font-mono">{el.fontColor || '#111827'}</span>
            </div>

            {/* Bold / Italic / Align */}
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => onChange({ ...el, bold: !el.bold })}
                className={`h-7 w-8 text-[13px] font-bold rounded border transition-colors ${el.bold ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-600 border-border hover:bg-gray-50'}`}>
                B
              </button>
              <button onClick={() => onChange({ ...el, italic: !el.italic })}
                className={`h-7 w-8 text-[13px] italic rounded border transition-colors ${el.italic ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-600 border-border hover:bg-gray-50'}`}>
                I
              </button>
              <div className="w-px bg-border" />
              {[['L','left'],['C','center'],['R','right']].map(([lbl,a]) => (
                <button key={a} onClick={() => onChange({ ...el, align: a })}
                  className={`h-7 w-8 text-[11px] rounded border transition-colors ${(el.align||'left') === a ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-500 border-border hover:bg-gray-50'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>}

        {/* Background — hidden for image/line elements */}
        {el.type !== 'image' && el.type !== 'line' && <div>
          <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Background</div>
          <div className="flex items-center gap-2">
            <input type="color" value={el.bgColor || '#ffffff'}
              onChange={e => onChange({ ...el, bgColor: e.target.value })}
              className="h-7 w-10 rounded cursor-pointer border border-border flex-shrink-0" />
            <span className="text-[10px] text-gray-500 font-mono flex-1">{el.bgColor || 'none'}</span>
            <button onClick={() => onChange({ ...el, bgColor: '' })}
              className="text-[10px] text-gray-500 hover:text-red-600 border border-border rounded px-2 py-1 flex-shrink-0 transition-colors">
              Clear
            </button>
          </div>
        </div>}

        {/* Element-specific: prefix label */}
        {(el.type === 'muminField' || el.type === 'razaField' || el.type === 'receiptField' || el.type === 'subHead' || el.type === 'forYear' || el.type === 'inputLine') && (
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Prefix Label</div>
            <input className="form-input text-[11px]" value={el.label || ''}
              onChange={e => onChange({ ...el, label: e.target.value })} />
          </div>
        )}

        {/* Raza field picker */}
        {el.type === 'razaField' && (
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Bound Field</div>
            <select className="form-input text-[11px]" value={el.field || ''}
              onChange={e => {
                const f = RAZA_FIELDS.find(x => x.field === e.target.value);
                onChange({ ...el, field: e.target.value, label: f ? f.label + ':' : el.label });
              }}>
              {RAZA_FIELDS.map(f => <option key={f.field} value={f.field}>{f.label}</option>)}
            </select>
          </div>
        )}

        {/* Receipt field picker */}
        {el.type === 'receiptField' && (
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Bound Field</div>
            <select className="form-input text-[11px]" value={el.field || ''}
              onChange={e => {
                const f = RECEIPT_FIELDS.find(x => x.field === e.target.value);
                onChange({ ...el, field: e.target.value, label: f ? f.label + ':' : el.label });
              }}>
              {RECEIPT_FIELDS.map(f => <option key={f.field} value={f.field}>{f.label}</option>)}
            </select>
          </div>
        )}

        {/* Static label text */}
        {el.type === 'label' && (
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Text Content</div>
            <textarea className="form-input text-[11px] resize-y" rows={3} value={el.text || ''}
              onChange={e => onChange({ ...el, text: e.target.value })} />
          </div>
        )}

        {/* Box properties */}
        {el.type === 'box' && (
          <div className="space-y-3">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Box Style</div>
            <div className="flex items-center gap-2">
              <span className="form-label text-[10px] w-20 flex-shrink-0">Border Color</span>
              <input type="color" value={el.borderColor || '#111827'}
                onChange={e => onChange({ ...el, borderColor: e.target.value })}
                className="h-7 w-10 rounded cursor-pointer border border-border flex-shrink-0" />
              <span className="text-[10px] text-gray-500 font-mono">{el.borderColor || '#111827'}</span>
            </div>
            <label>
              <span className="form-label text-[10px]">Border Width — {el.borderWidth ?? 1}px</span>
              <input type="range" min={0} max={20} value={el.borderWidth ?? 1}
                onChange={e => onChange({ ...el, borderWidth: Number(e.target.value) })}
                className="w-full accent-blue-500" />
            </label>
            <label>
              <span className="form-label text-[10px]">Border Radius — {el.borderRadius ?? 0}px</span>
              <input type="range" min={0} max={100} value={el.borderRadius ?? 0}
                onChange={e => onChange({ ...el, borderRadius: Number(e.target.value) })}
                className="w-full accent-blue-500" />
            </label>
          </div>
        )}

        {/* Line properties */}
        {el.type === 'line' && (
          <div className="space-y-3">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Line Style</div>
            <div>
              <span className="form-label text-[10px]">Orientation</span>
              <div className="flex gap-1.5 mt-1">
                {[['H','h','Horizontal'],['V','v','Vertical']].map(([lbl,val,title]) => (
                  <button key={val} title={title} onClick={() => onChange({ ...el, orientation: val })}
                    className={`h-7 px-3 text-[11px] rounded border transition-colors ${(el.orientation || 'h') === val ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-600 border-border hover:bg-gray-50'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="form-label text-[10px] w-14 flex-shrink-0">Color</span>
              <input type="color" value={el.lineColor || '#111827'}
                onChange={e => onChange({ ...el, lineColor: e.target.value })}
                className="h-7 w-10 rounded cursor-pointer border border-border flex-shrink-0" />
              <span className="text-[10px] text-gray-500 font-mono">{el.lineColor || '#111827'}</span>
            </div>
            <div>
              <span className="form-label text-[10px]">Style</span>
              <div className="flex gap-1.5 mt-1">
                {[['Solid','solid'],['Dashed','dashed'],['Dotted','dotted']].map(([lbl,val]) => (
                  <button key={val} onClick={() => onChange({ ...el, lineStyle: val })}
                    className={`h-7 flex-1 text-[10px] rounded border transition-colors ${(el.lineStyle || 'solid') === val ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-600 border-border hover:bg-gray-50'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span className="form-label text-[10px]">Thickness — {el.lineWidth ?? 2}px</span>
              <input type="range" min={1} max={20} value={el.lineWidth ?? 2}
                onChange={e => onChange({ ...el, lineWidth: Number(e.target.value) })}
                className="w-full accent-blue-500" />
            </label>
          </div>
        )}

        {/* History grid options */}
        {el.type === 'historyGrid' && (
          <div className="space-y-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Grid Options</div>
              <label>
                <span className="form-label text-[10px]">Visible Rows — {el.rowCount || 5}</span>
                <input type="range" min={1} max={12} value={el.rowCount || 5}
                  onChange={e => onChange({ ...el, rowCount: Number(e.target.value) })}
                  className="w-full accent-blue-500" />
              </label>
            </div>
            <div>
              <span className="form-label text-[10px]">Visible Columns</span>
              <div className="mt-1 space-y-1">
                {HISTORY_COLS.map(c => (
                  <label key={c.key} className="flex items-center gap-2 cursor-pointer select-none text-[11px]">
                    <input type="checkbox" className="accent-blue-500"
                      checked={(el.columns || DEFAULT_COLS).includes(c.key)}
                      onChange={ev => {
                        const cols = (el.columns || DEFAULT_COLS).filter(x => x !== c.key);
                        if (ev.target.checked) cols.push(c.key);
                        onChange({ ...el, columns: cols });
                      }} />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PrintTemplatesPage() {
  const [templates,    setTemplates]    = useState([]);
  const [activeId,     setActiveId]     = useState(null);
  const [selectedEl,   setSelectedEl]   = useState(null);
  const [groupOpen,    setGroupOpen]    = useState({});
  const [loading,      setLoading]      = useState(true);
  const [multiSel,     setMultiSel]     = useState(new Set()); // Set of selected element IDs
  const [lassoBox,     setLassoBox]     = useState(null);      // {x1,y1,x2,y2} canvas coords while dragging
  const canvasRef    = useRef(null);
  const dragRef      = useRef(null);
  const fileRef      = useRef(null);
  const fileRefImg   = useRef(null);
  const copiedElRef  = useRef(null);
  const lassoRef     = useRef(null);
  // Keep a ref to latest templates + activeId for use inside drag closures
  const stateRef    = useRef({ templates, activeId, selectedEl, multiSel });
  useEffect(() => { stateRef.current = { templates, activeId, selectedEl, multiSel }; }, [templates, activeId, selectedEl, multiSel]);

  // ── Load templates from DB on mount ─────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    takhmeenService.loadFormTemplates()
      .then(res => {
        const rows = res?.data?.data || [];
        if (rows.length) {
          const tpls = rows.map(dbRowToTpl);
          setTemplates(tpls);
          setActiveId(tpls[0].id);
          // Clear stale localStorage now that DB is authoritative
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } else {
          // One-time migration: if DB is empty but localStorage has templates, import them
          try {
            const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '[]');
            if (legacy.length) {
              migrateFromLocalStorage(legacy);
            }
          } catch {}
        }
      })
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function migrateFromLocalStorage(legacy) {
    toast.loading('Migrating templates to database…', { id: 'migrate' });
    try {
      const migrated = [];
      for (const t of legacy) {
        const clean = migrateBgImage(t);
        const payload = {
          Name:        clean.name,
          SubHead:     clean.subHead || null,
          IsDefault:   clean.isDefault ? 1 : 0,
          TemplateJson: JSON.stringify({
            pageSize: clean.pageSize, margin: clean.margin, marginUnit: clean.marginUnit,
            bgImage: clean.bgImage || '', elements: clean.elements || [],
          }),
        };
        const res = await takhmeenService.addFormTemplate(payload);
        migrated.push({ ...clean, id: res?.data?.insertId || res?.insertId });
      }
      setTemplates(migrated);
      setActiveId(migrated[0]?.id || null);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      toast.success(`Migrated ${migrated.length} template(s) to database`, { id: 'migrate' });
    } catch {
      toast.error('Migration failed — templates may need to be recreated', { id: 'migrate' });
    }
  }

  const activeTemplate = templates.find(t => t.id === activeId) || null;
  const pageKey  = activeTemplate?.pageSize || DEFAULT_PAGE;
  const pageSize = PAGE_SIZES[pageKey] || PAGE_SIZES[DEFAULT_PAGE];
  const margin   = { ...DEFAULT_MARGIN, ...(activeTemplate?.margin || {}) };

  // ── Template CRUD ────────────────────────────────────────────────────────────
  async function seedReceiptTemplates() {
    const defaults = makeDefaultReceiptTemplates();
    try {
      let touched = 0;
      const updatedIds = [];
      for (const payload of defaults) {
        const existing = templates.find(t => t.name === payload.Name);
        if (existing) {
          // Update the existing template with the fresh layout
          await takhmeenService.updateFormTemplate({ ...tplToDbPayload(existing), TemplateJson: payload.TemplateJson });
          let config = {};
          try { config = JSON.parse(payload.TemplateJson || '{}'); } catch {}
          patchTpl(existing.id, config);
          updatedIds.push(existing.id);
          touched++;
        } else {
          const res = await takhmeenService.addFormTemplate(payload);
          const newId = res?.data?.insertId ?? res?.insertId;
          if (!newId) continue;
          let config = {};
          try { config = JSON.parse(payload.TemplateJson || '{}'); } catch {}
          setTemplates(prev => [...prev, { id: newId, name: payload.Name, subHead: '', isDefault: false, ...config }]);
          updatedIds.push(newId);
          touched++;
        }
      }
      if (updatedIds.length) setActiveId(updatedIds[0]);
      toast.success(`Receipt templates ${touched > 0 ? 'updated' : 'ready'} (${touched})`);
    } catch {
      toast.error('Failed to update receipt templates');
    }
  }

  async function createTpl() {
    const name = prompt('Template name:');
    if (!name?.trim()) return;
    try {
      const res = await takhmeenService.addFormTemplate({
        Name: name.trim(), SubHead: null, IsDefault: 0,
        TemplateJson: JSON.stringify({ pageSize: DEFAULT_PAGE, margin: DEFAULT_MARGIN, marginUnit: DEFAULT_MARGIN_UNIT, bgImage: '', elements: [] }),
      });
      const newId = res?.data?.insertId ?? res?.insertId;
      if (!newId) throw new Error('No ID returned');
      const tpl = { id: newId, name: name.trim(), subHead: '', isDefault: false, pageSize: DEFAULT_PAGE, margin: DEFAULT_MARGIN, marginUnit: DEFAULT_MARGIN_UNIT, bgImage: '', elements: [] };
      setTemplates(prev => [...prev, tpl]);
      setActiveId(newId); setSelectedEl(null);
    } catch { toast.error('Failed to create template'); }
  }

  async function renameTpl(id) {
    const old = templates.find(t => t.id === id);
    const name = prompt('Rename to:', old?.name);
    if (!name?.trim()) return;
    patchTpl(id, { name: name.trim() });
    try { await takhmeenService.updateFormTemplate({ ID: id, Name: name.trim() }); }
    catch { toast.error('Failed to rename'); }
  }

  async function deleteTpl(id) {
    if (!confirm('Delete this template?')) return;
    setTemplates(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeId === id) { setActiveId(next[0]?.id || null); setSelectedEl(null); }
      return next;
    });
    try { await takhmeenService.deleteFormTemplate(id); }
    catch { toast.error('Failed to delete'); }
  }

  function patchTpl(id, patch) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }


  // ── Element helpers ──────────────────────────────────────────────────────────
  function addEl(type, field, opts = {}) {
    if (!activeTemplate) { toast.error('Create or select a template first'); return; }
    const el = { ...mkEl(type, field), ...opts };
    patchTpl(activeId, { elements: [...(activeTemplate.elements || []), el] });
    setSelectedEl(el.id);
  }

  function updateEl(el) {
    if (!activeTemplate) return;
    patchTpl(activeId, { elements: activeTemplate.elements.map(e => e.id === el.id ? el : e) });
  }

  function deleteEl(elId) {
    if (!activeTemplate) return;
    patchTpl(activeId, { elements: activeTemplate.elements.filter(e => e.id !== elId) });
    setSelectedEl(null);
  }

  // ── Element mouse-down: handles ctrl+click toggle and regular click/drag ──────
  function onElementMouseDown(e, elId) {
    if (e.ctrlKey || e.metaKey) {
      // Toggle in multi-select, no drag
      setMultiSel(prev => {
        const next = new Set(prev);
        if (next.has(elId)) next.delete(elId); else next.add(elId);
        return next;
      });
      setSelectedEl(elId);
      return;
    }
    const { multiSel: mSel } = stateRef.current;
    const isInMulti = mSel.size > 1 && mSel.has(elId);
    setSelectedEl(elId);
    if (!isInMulti) setMultiSel(new Set([elId]));
    startDrag(e, elId, 'move');
  }

  // ── Rubber-band lasso selection ───────────────────────────────────────────────
  function startLasso(e) {
    if (e.button !== 0 || e.target !== canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { templates: tpls, activeId: aid } = stateRef.current;
    const ps = PAGE_SIZES[tpls.find(t => t.id === aid)?.pageSize || DEFAULT_PAGE] || PAGE_SIZES[DEFAULT_PAGE];
    const scale = ps.w / rect.width;
    const x0 = (e.clientX - rect.left) * scale;
    const y0 = (e.clientY - rect.top) * scale;
    lassoRef.current = { x0, y0 };
    setLassoBox({ x1: x0, y1: y0, x2: x0, y2: y0 });

    const onMove = ev => {
      if (!lassoRef.current) return;
      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return;
      setLassoBox({ x1: x0, y1: y0, x2: (ev.clientX - r.left) * scale, y2: (ev.clientY - r.top) * scale });
    };
    const onUp = ev => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (!lassoRef.current) return;
      lassoRef.current = null;
      setLassoBox(null);
      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return;
      const x1 = (ev.clientX - r.left) * scale;
      const y1 = (ev.clientY - r.top) * scale;
      const dist = Math.abs(x1 - x0) + Math.abs(y1 - y0);
      if (dist < 8) {
        if (!ev.ctrlKey && !ev.metaKey) { setSelectedEl(null); setMultiSel(new Set()); }
        return;
      }
      const { templates: tpls2, activeId: aid2 } = stateRef.current;
      const tpl = tpls2.find(t => t.id === aid2);
      if (!tpl) return;
      const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
      const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
      const inside = tpl.elements.filter(el => {
        const cx = el.x + (el.w || 0) / 2;
        const cy = el.y + (el.h || 0) / 2;
        return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
      });
      if (inside.length) {
        const ids = new Set(inside.map(el => el.id));
        if (ev.ctrlKey || ev.metaKey) {
          setMultiSel(prev => new Set([...prev, ...ids]));
        } else {
          setMultiSel(ids);
        }
        setSelectedEl(inside[inside.length - 1].id);
      } else if (!ev.ctrlKey && !ev.metaKey) {
        setMultiSel(new Set());
        setSelectedEl(null);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // ── Unified drag (move + resize) ─────────────────────────────────────────────
  const startDrag = useCallback((e, elId, mode, handle = null) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const { templates: tpls, activeId: aid, multiSel: mSel } = stateRef.current;
    const ps   = PAGE_SIZES[tpls.find(t => t.id === aid)?.pageSize || DEFAULT_PAGE] || PAGE_SIZES[DEFAULT_PAGE];
    const scale = ps.w / rect.width;
    const el   = tpls.find(t => t.id === aid)?.elements.find(x => x.id === elId);
    if (!el) return;

    // Determine which elements to move (multi-move if applicable)
    const isMultiMove = mode === 'move' && mSel.size > 1 && mSel.has(elId);
    const movedIds = isMultiMove ? [...mSel] : [elId];
    // Capture original positions for all moved elements
    const origPositions = {};
    for (const mid of movedIds) {
      const me = tpls.find(t => t.id === aid)?.elements.find(x => x.id === mid);
      if (me) origPositions[mid] = { x: me.x, y: me.y };
    }

    dragRef.current = {
      mode, elId, handle, scale,
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y, origW: el.w || 200, origH: el.h || 32,
      movedIds, origPositions,
    };

    const onMove = ev => {
      const d = dragRef.current;
      if (!d) return;
      const { activeId: aid2 } = stateRef.current;
      const dx = (ev.clientX - d.startX) * d.scale;
      const dy = (ev.clientY - d.startY) * d.scale;
      setTemplates(prev => prev.map(t => {
        if (t.id !== aid2) return t;
        return {
          ...t,
          elements: t.elements.map(e => {
            if (d.mode === 'move') {
              if (!d.movedIds.includes(e.id)) return e;
              const orig = d.origPositions[e.id];
              if (!orig) return e;
              return { ...e, x: Math.max(0, Math.round(orig.x + dx)), y: Math.max(0, Math.round(orig.y + dy)) };
            }
            if (e.id !== d.elId) return e;
            return { ...e, ...applyResize({ x: d.origX, y: d.origY, w: d.origW, h: d.origH }, d.handle, dx, dy) };
          }),
        };
      }));
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // ── Ctrl+C / Ctrl+V — use stateRef so closure is never stale ───────────────
  useEffect(() => {
    function onCopyPaste(e) {
      if (!e.ctrlKey && !e.metaKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const key = e.key.toLowerCase();

      if (key === 'c') {
        const { templates: tpls, activeId: aid, multiSel: mSel, selectedEl: sel } = stateRef.current;
        const srcIds = mSel.size > 0 ? [...mSel] : (sel ? [sel] : []);
        if (!srcIds.length || !aid) return;
        const els = tpls.find(t => String(t.id) === String(aid))?.elements.filter(e => srcIds.includes(e.id)) || [];
        if (!els.length) return;
        e.preventDefault();
        copiedElRef.current = els;
        toast.success(`Copied ${els.length} element${els.length > 1 ? 's' : ''}`, { id: 'cp', duration: 900 });
      }

      if (key === 'v') {
        const src = copiedElRef.current;
        const list = Array.isArray(src) ? src : (src ? [src] : []);
        if (!list.length || !activeId) return;
        e.preventDefault();
        const pasted = list.map(el => ({ ...el, id: newId(), x: (el.x || 0) + 15, y: (el.y || 0) + 15 }));
        setTemplates(prev => prev.map(t =>
          String(t.id) !== String(activeId) ? t : { ...t, elements: [...t.elements, ...pasted] }
        ));
        const newIds = new Set(pasted.map(el => el.id));
        setMultiSel(newIds);
        setSelectedEl(pasted[pasted.length - 1].id);
      }
    }
    window.addEventListener('keydown', onCopyPaste);
    return () => window.removeEventListener('keydown', onCopyPaste);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Arrow keys + Delete (stateRef is fine here — no element lookup needed) ───
  useEffect(() => {
    const ARROWS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      const { selectedEl: sel, activeId: aid, multiSel: mSel } = stateRef.current;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !inInput) {
        const toDelete = mSel.size > 0 ? [...mSel] : (sel ? [sel] : []);
        if (!toDelete.length || !aid) return;
        e.preventDefault();
        setTemplates(prev => prev.map(t =>
          t.id !== aid ? t : { ...t, elements: t.elements.filter(el => !toDelete.includes(el.id)) }
        ));
        setMultiSel(new Set());
        setSelectedEl(null);
        return;
      }

      const { selectedEl: sel2, activeId: aid2, multiSel: mSel2 } = stateRef.current;
      const toMove = mSel2.size > 0 ? [...mSel2] : (sel2 ? [sel2] : []);
      if (!ARROWS[e.key] || inInput) return;
      if (!toMove.length || !aid2) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const [dx, dy] = ARROWS[e.key].map(v => v * step);
      setTemplates(prev => prev.map(t => {
        if (t.id !== aid2) return t;
        return { ...t, elements: t.elements.map(el =>
          !toMove.includes(el.id) ? el : { ...el, x: Math.max(0, el.x + dx), y: Math.max(0, el.y + dy) }
        )};
      }));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Background image upload ───────────────────────────────────────────────────
  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src  = ev.target.result;
      const tpl  = templates.find(t => t.id === activeId);
      const els  = tpl?.elements || [];
      const bg   = els.find(x => x.type === 'image' && x.isBackground !== false);
      if (bg) {
        patchTpl(activeId, { elements: els.map(x => x.id === bg.id ? { ...x, src } : x) });
      } else {
        const ps    = PAGE_SIZES[tpl?.pageSize || DEFAULT_PAGE] || PAGE_SIZES[DEFAULT_PAGE];
        const imgEl = { id: newId(), type: 'image', src, x: 0, y: 0, w: ps.w, h: ps.h, isBackground: true, locked: false };
        patchTpl(activeId, { elements: [imgEl, ...els] });
        setSelectedEl(imgEl.id);
      }
      toast.success('Background image updated');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // ── Logo / stamp / overlay image upload ──────────────────────────────────────
  function handleAddImage(e) {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src  = ev.target.result;
      const tpl  = templates.find(t => t.id === activeId);
      const ps   = PAGE_SIZES[tpl?.pageSize || DEFAULT_PAGE] || PAGE_SIZES[DEFAULT_PAGE];
      const imgEl = {
        id: newId(), type: 'image', src,
        x: Math.round(ps.w / 2 - 75), y: Math.round(ps.h / 2 - 75),
        w: 150, h: 150,
        isBackground: false, locked: false,
      };
      patchTpl(activeId, { elements: [...(tpl?.elements || []), imgEl] });
      setSelectedEl(imgEl.id);
      toast.success('Image added — drag to position, handles to resize');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const selEl = activeTemplate?.elements.find(e => e.id === selectedEl) || null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <PermissionGuard permission="takhmeen.edit">
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-title text-navy-900">Design Templates</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Create and design printable form layouts — Drag to move · Resize handles · Ctrl+click or drag canvas to multi-select · Ctrl+C/V to copy/paste across templates.
          </p>
        </div>
        {activeTemplate && (
          <button onClick={async () => {
            try { await takhmeenService.updateFormTemplate(tplToDbPayload(activeTemplate)); toast.success('Saved'); }
            catch { toast.error('Save failed'); }
          }} className="btn btn-primary btn-sm">Save Layout</button>
        )}
      </div>

      <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">

        {/* ── Left Panel ── */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-2.5 overflow-y-auto">

          {/* Templates */}
          <div className="card flex-shrink-0">
            <div className="card-header py-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold">Templates</span>
              <div className="flex items-center gap-2">
                <button onClick={seedReceiptTemplates} title="Add default Receipt - A4 and Receipt - A5 templates" className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold whitespace-nowrap">+ Receipt</button>
                <button onClick={createTpl} className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold">+ New</button>
              </div>
            </div>
            <div className="divide-y divide-border max-h-36 overflow-y-auto">
              {!templates.length && <div className="px-3 py-2 text-[11px] text-gray-400">No templates yet</div>}
              {templates.map(t => (
                <div key={t.id}
                  onClick={() => { setActiveId(t.id); setSelectedEl(null); setMultiSel(new Set()); }}
                  className={`flex items-center gap-1 px-3 py-2 cursor-pointer text-[12px] transition-colors ${activeId === t.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                  {t.isDefault && <span title="Default for this SubHead" className="text-yellow-500 text-[10px] flex-shrink-0">★</span>}
                  <span className="flex-1 truncate">{t.name}</span>
                  <button onClick={e => { e.stopPropagation(); renameTpl(t.id); }}
                    title="Rename" className="text-gray-400 hover:text-gray-700 px-0.5">✎</button>
                  <button onClick={e => { e.stopPropagation(); deleteTpl(t.id); }}
                    title="Delete" className="text-gray-400 hover:text-red-500 px-0.5">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Page Settings */}
          {activeTemplate && (
            <div className="card flex-shrink-0">
              <div className="card-header py-2"><span className="text-[12px] font-semibold">Page</span></div>
              <div className="p-2.5 space-y-2.5">
                <div>
                  <label className="form-label text-[10px]">Size & Orientation</label>
                  <select className="form-input text-[11px]" value={pageKey}
                    onChange={e => patchTpl(activeId, { pageSize: e.target.value })}>
                    {Object.entries(PAGE_SIZES).map(([k, v]) =>
                      <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label text-[10px]">Margins</label>
                    <select className="form-input text-[10px] py-0.5 w-14"
                      value={activeTemplate.marginUnit || DEFAULT_MARGIN_UNIT}
                      onChange={e => patchTpl(activeId, { marginUnit: e.target.value })}>
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {['top','right','bottom','left'].map(side => {
                      const unit = activeTemplate.marginUnit || DEFAULT_MARGIN_UNIT;
                      return (
                        <label key={side}>
                          <span className="form-label text-[9px] capitalize">{side}</span>
                          <input type="number" min={0} max={200} step={0.5} className="form-input text-[10px] py-0.5"
                            value={pxToUnit(margin[side] ?? 20, unit)}
                            onChange={e => patchTpl(activeId, { margin: { ...margin, [side]: unitToPx(Number(e.target.value), unit) } })} />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Template Settings */}
          {activeTemplate && (
            <div className="card flex-shrink-0">
              <div className="card-header py-2"><span className="text-[12px] font-semibold">Template Settings</span></div>
              <div className="p-2.5 space-y-2">
                <div>
                  <label className="form-label text-[10px]">Linked SubHead</label>
                  <input
                    className="form-input text-[11px]"
                    placeholder="e.g. Vajebaat"
                    value={activeTemplate.subHead || ''}
                    onChange={e => patchTpl(activeId, { subHead: e.target.value })}
                  />
                  <p className="text-[9px] text-gray-400 mt-0.5">Used to auto-select this template when opened from the vajebaat tab.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={!!activeTemplate.isDefault}
                    onChange={e => patchTpl(activeId, { isDefault: e.target.checked })}
                  />
                  <span className="text-[11px] text-gray-700">Default template for this SubHead</span>
                  {activeTemplate.isDefault && <span className="text-yellow-500 text-[12px]">★</span>}
                </label>
              </div>
            </div>
          )}

          {/* Add Elements */}
          {activeTemplate && (
            <div className="card flex-shrink-0">
              <div className="card-header py-2"><span className="text-[12px] font-semibold">Add Elements</span></div>
              <div className="p-2 space-y-0.5">

                <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-1 pt-1 pb-0.5">Form Fields</div>
                {[['Hub Sub Head','subHead'],['For Year','forYear'],['Current Date','currentDate'],['History Grid','historyGrid']].map(([lbl,type]) => (
                  <button key={type} onClick={() => addEl(type)}
                    className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-700">
                    {lbl}
                  </button>
                ))}

                <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-1 pt-2 pb-0.5">Mumin Fields</div>
                {MUMIN_GROUPS.map(group => (
                  <div key={group}>
                    <button
                      onClick={() => setGroupOpen(p => ({ ...p, [group]: !p[group] }))}
                      className="w-full flex items-center justify-between text-[11px] px-2 py-0.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors">
                      <span className="font-medium">{group}</span>
                      <span className="text-[9px]">{groupOpen[group] ? '▾' : '▸'}</span>
                    </button>
                    {groupOpen[group] && (
                      <div className="ml-3 border-l border-blue-100 pl-1 space-y-0.5">
                        {MUMIN_FIELDS.filter(f => f.group === group).map(f => (
                          <button key={f.field} onClick={() => addEl('muminField', f.field)}
                            className="w-full text-left text-[11px] px-2 py-0.5 rounded hover:bg-blue-50 text-gray-600 hover:text-blue-700">
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-1 pt-2 pb-0.5">Raza Fields</div>
                <button
                  onClick={() => setGroupOpen(p => ({ ...p, __raza__: !p.__raza__ }))}
                  className="w-full flex items-center justify-between text-[11px] px-2 py-0.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors">
                  <span className="font-medium">Raza Details</span>
                  <span className="text-[9px]">{groupOpen.__raza__ ? '▾' : '▸'}</span>
                </button>
                {groupOpen.__raza__ && (
                  <div className="ml-3 border-l border-blue-100 pl-1 space-y-0.5">
                    {RAZA_FIELDS.map(f => (
                      <button key={f.field} onClick={() => addEl('razaField', f.field)}
                        className="w-full text-left text-[11px] px-2 py-0.5 rounded hover:bg-blue-50 text-gray-600 hover:text-blue-700">
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-1 pt-2 pb-0.5">Receipt Fields</div>
                <button
                  onClick={() => setGroupOpen(p => ({ ...p, __receipt__: !p.__receipt__ }))}
                  className="w-full flex items-center justify-between text-[11px] px-2 py-0.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors">
                  <span className="font-medium">Receipt Details</span>
                  <span className="text-[9px]">{groupOpen.__receipt__ ? '▾' : '▸'}</span>
                </button>
                {groupOpen.__receipt__ && (
                  <div className="ml-3 border-l border-blue-100 pl-1 space-y-0.5">
                    {RECEIPT_FIELDS.map(f => (
                      <button key={f.field} onClick={() => addEl('receiptField', f.field)}
                        className="w-full text-left text-[11px] px-2 py-0.5 rounded hover:bg-blue-50 text-gray-600 hover:text-blue-700">
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => addEl('receiptItemsGrid')}
                  className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-700">
                  Receipt Items Grid
                </button>

                <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-1 pt-2 pb-0.5">Shapes & Layout</div>
                <button onClick={() => addEl('box')}
                  className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-700">
                  Box / Rectangle
                </button>
                <button onClick={() => addEl('line', null, { orientation: 'h', w: 200, h: 20 })}
                  className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-700">
                  Horizontal Line
                </button>
                <button onClick={() => addEl('line', null, { orientation: 'v', w: 20, h: 200 })}
                  className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-700">
                  Vertical Line
                </button>
                <input ref={fileRefImg} type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
                <button onClick={() => fileRefImg.current?.click()}
                  className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-700">
                  🖼 Add Image (Logo / Stamp)
                </button>

                <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-1 pt-2 pb-0.5">Other</div>
                {[['Static Label','label'],['Input Line (blank)','inputLine']].map(([lbl,type]) => (
                  <button key={type} onClick={() => addEl(type)}
                    className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-700">
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Background Image */}
          {activeTemplate && (() => {
            const bgEl = (activeTemplate.elements || []).find(e => e.type === 'image' && e.isBackground !== false);
            return (
              <div className="card flex-shrink-0">
                <div className="card-header py-2"><span className="text-[12px] font-semibold">Background Image</span></div>
                <div className="p-2 space-y-1.5">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                  <button onClick={() => fileRef.current?.click()} className="btn btn-secondary btn-sm w-full text-[11px]">
                    {bgEl ? 'Replace Background' : 'Upload Background'}
                  </button>
                  {bgEl && (
                    <>
                      <button
                        onClick={() => patchTpl(activeId, {
                          elements: (activeTemplate.elements || []).map(x =>
                            x.id === bgEl.id ? { ...x, locked: !bgEl.locked } : x
                          )
                        })}
                        className={`w-full text-[11px] rounded py-1 border transition-colors flex items-center justify-center gap-1 ${
                          bgEl.locked
                            ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                            : 'bg-white border-border text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {bgEl.locked ? '🔒 Locked — click to unlock' : '🔓 Unlocked — click to lock'}
                      </button>
                      <button onClick={() => {
                        patchTpl(activeId, { elements: (activeTemplate.elements || []).filter(e => e.id !== bgEl.id) });
                        setSelectedEl(null);
                      }}
                        className="w-full text-[11px] text-red-500 border border-red-200 rounded py-1 hover:bg-red-50 transition-colors">
                        Clear Background
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Canvas ── */}
        <div className="flex-1 min-w-0 overflow-auto bg-gray-300 rounded-xl p-6"
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {loading ? (
            <div className="flex items-center justify-center w-full h-64">
              <p className="text-gray-400 text-[13px]">Loading templates…</p>
            </div>
          ) : !activeTemplate ? (
            <div className="flex items-center justify-center w-full h-64">
              <p className="text-gray-400 text-[13px]">Create or select a template to start designing</p>
            </div>
          ) : (
            <div
              ref={canvasRef}
              onMouseDown={startLasso}
              onClick={e => { if (!lassoRef.current) { setSelectedEl(null); setMultiSel(new Set()); } }}
              onContextMenu={e => e.preventDefault()}
              style={{
                position:   'relative',
                width:      pageSize.w,
                height:     pageSize.h,
                flexShrink: 0,
                background: '#ffffff',
                border:     '1px solid #c9cdd4',
                boxShadow:  '0 6px 40px rgba(0,0,0,0.18)',
                overflow:   'hidden',
              }}
            >
              {/* Margin guide lines (designer only) */}
              <div style={{ position: 'absolute', top: margin.top, left: 0, right: 0, borderTop: '1px dashed rgba(59,130,246,0.3)', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', bottom: margin.bottom, left: 0, right: 0, borderTop: '1px dashed rgba(59,130,246,0.3)', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: margin.left, borderLeft: '1px dashed rgba(59,130,246,0.3)', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, right: margin.right, borderRight: '1px dashed rgba(59,130,246,0.3)', pointerEvents: 'none', zIndex: 1 }} />

              {/* Elements */}
              {(activeTemplate.elements || []).map(el => (
                <DesignerElement
                  key={el.id}
                  el={el}
                  selected={selectedEl === el.id}
                  isMultiSelected={multiSel.has(el.id)}
                  onElementMouseDown={onElementMouseDown}
                  onResizeStart={(e, id, handle) => startDrag(e, id, 'resize', handle)}
                />
              ))}

              {/* Lasso selection overlay */}
              {lassoBox && (() => {
                const lx = Math.min(lassoBox.x1, lassoBox.x2);
                const ly = Math.min(lassoBox.y1, lassoBox.y2);
                const lw = Math.abs(lassoBox.x2 - lassoBox.x1);
                const lh = Math.abs(lassoBox.y2 - lassoBox.y1);
                return (
                  <div style={{ position: 'absolute', left: lx, top: ly, width: lw, height: lh,
                    border: '1.5px dashed #3b82f6', background: 'rgba(59,130,246,0.07)',
                    pointerEvents: 'none', zIndex: 50 }} />
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Properties Panel ── */}
        <div className="w-56 flex-shrink-0 flex flex-col border border-border rounded-xl overflow-hidden bg-white"
          style={{ alignSelf: 'stretch' }}>
          <PropertiesPanel
            el={selEl}
            onChange={updateEl}
            onDelete={() => selEl && deleteEl(selEl.id)}
            onCopy={() => selEl && (copiedElRef.current = [selEl])}
          />
        </div>

      </div>
    </div>
  </PermissionGuard>
  );
}
