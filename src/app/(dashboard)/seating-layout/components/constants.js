export const THIS_YEAR  = new Date().getFullYear().toString();
export const YEARS      = Array.from({ length: 6 }, (_, i) => (parseInt(THIS_YEAR) - 2 + i).toString());

// Default suggestions shown before API responds (or if API/migration not set up)
export const DEFAULT_LOOKUPS = {
  EventType:   ['Shehrullah', 'Miqaat', 'Ashara', 'Lailat-ul-Qadr', 'Eid', 'Other'],
  VenueType:   ['Masjid', 'Markaz', 'Other'],
  SectionType: ['Gents', 'Ladies', 'Children', 'Mixed', 'Other'],
  Position:    ['Center', 'Top', 'Bottom', 'Left', 'Right'],
  Year:        ['1443', '1444', '1445', '1446', '1447', '1448', '1449', '1450',
                '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029'],
};

export const SEAT_COLORS = {
  Available: 'bg-gray-200 hover:bg-blue-200 cursor-pointer border border-gray-300',
  Allocated: 'bg-red-500 hover:bg-red-600 cursor-pointer border border-red-600 text-white',
  Blocked:   'bg-yellow-400 hover:bg-yellow-500 cursor-pointer border border-yellow-500',
};

// Converts 0-based row index to label: 0→A, 25→Z, 26→AA, 27→AB, 52→BA …
export function getRowLabel(index) {
  let label = '';
  let n = index + 1;
  while (n > 0) {
    n--;
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26);
  }
  return label;
}

export function buildSeatKey(row, col) { return `${row}-${col}`; }

export function buildSeatMap(allocations) {
  const map = {};
  (allocations || []).forEach(a => { map[buildSeatKey(a.RowLabel, a.ColNo)] = a; });
  return map;
}
