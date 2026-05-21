export const YEARS    = Array.from({ length: 12 }, (_, i) => 1447 - i);
export const SLOTS    = ['Night', 'Day'];
export const TYPES    = ['Mix', 'Gents', 'Ladies'];
export const STATUSES = ['Pending', 'Done', 'Not Done'];
export const RAZA     = ['Raza Pending', 'Additional Raza', 'Raza Done'];
export const EVENTS   = ['Ohbat Majlis', 'Majlis Aza', 'Majlis Melaad', 'Other'];
export const TIMES    = ['7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:15 PM','9:30 PM','10:00 PM'];
export const CLEARANCE_STATUSES = ['', 'Cleared', 'Not Cleared', 'N/A'];

export const blank = () => ({
  ID: null,
  AccNo: '', FullName: '', Sector: '', Mobile: '', Mobile1: '', ITSNo: '',
  LocalHOFITSNo: '', Subsector: '', MohallaDescription: '', SabeelType: '', StayingIn: '',
  Remark: '', ClearanceStatus: '',
  RegistrationNo: '', RegistrationDate: '', ForYear: 1447,
  MajlisType: 'Mix', EventType: 'Ohbat Majlis',
  MajlisDate: '', MajlisTime: '8:00 PM', SlotType: 'Night', MajlisRaza: 'Raza Pending',
  Sadar: '', Zakereen: '', Tazeen: '', BGI: '', CareTaker: '',
  MajlisStatus: 'Pending',
});
