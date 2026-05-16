'use client';

import { SaveIcon, TrashIcon, EditIcon, XIcon, PrintIcon } from '@/components/shared/Icons';

const DESIGNATIONS = ['Musaida', 'Jr Musaida', 'Masoola', 'Musaid', 'Jr Masaid', 'Masool',  'Coordinator'];

export default function CoordinatorTable({
  hasSelection,
  coordLoading,
  coordinators,
  addRow,
  setAddRow,
  editId,
  setEditId,
  editData,
  setEditData,
  onSaveAdd,
  onSaveEdit,
  onDelete,
  onPrintAll,
}) {
  return (
    <div className="card mb-4">
      <div className="card-header flex items-center justify-between">
        <span>Mohallah Coordinator Details</span>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onPrintAll}>
            <PrintIcon className="w-3.5 h-3.5 mr-1.5" />
            Print All
          </button>
          {hasSelection && !addRow && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setAddRow({ Designation: '', FullName: '', ITSNo: '', Mobile: '' })}
            >
              + Add
            </button>
          )}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {['Action', 'Designation', 'ITS No', 'Full Name', 'Mobile'].map((header) => (
                <th key={header} className="th-navy">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!hasSelection ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400 text-[12px]">
                  Select a Mohallah to view coordinators
                </td>
              </tr>
            ) : coordLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : (
              <>
                {coordinators.map((coordinator) => {
                  const id = coordinator.ID ?? coordinator.id;
                  const isEdit = editId === id;

                  return (
                    <tr key={id} className={isEdit ? 'bg-blue-50' : 'hover:bg-blue-500/[0.025]'}>
                      <td className="px-3 py-2 border-t border-border whitespace-nowrap">
                        {isEdit ? (
                          <div className="flex gap-1">
                            <button className="btn btn-primary btn-sm" onClick={onSaveEdit}>
                              <SaveIcon className="w-3 h-3 mr-1" />
                              Save
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>
                              <XIcon className="w-3 h-3 mr-1" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditId(id);
                                setEditData({ ...coordinator });
                              }}
                            >
                              <EditIcon className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                            <button
                              className="btn btn-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                              onClick={() => onDelete(id)}
                            >
                              <TrashIcon className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2 border-t border-border">
                        {isEdit ? (
                          <select
                            className="form-select text-[12px] py-1"
                            value={editData.Designation ?? editData.designation ?? ''}
                            onChange={(e) =>
                              setEditData((prev) => ({ ...prev, Designation: e.target.value }))
                            }
                          >
                            {DESIGNATIONS.map((designation) => (
                              <option key={designation}>{designation}</option>
                            ))}
                          </select>
                        ) : (
                          coordinator.Designation ?? coordinator.designation ?? '-'
                        )}
                      </td>

                      <td className="px-3 py-2 border-t border-border">
                        {isEdit ? (
                          <input
                            className="form-input text-[12px] py-1"
                            value={editData.ITSNo ?? editData.itsNo ?? ''}
                            onChange={(e) =>
                              setEditData((prev) => ({ ...prev, ITSNo: e.target.value }))
                            }
                          />
                        ) : (
                          coordinator.ITSNo ?? coordinator.itsNo ?? '-'
                        )}
                      </td>

                      <td className="px-3 py-2 border-t border-border font-medium">
                        {isEdit ? (
                          <input
                            className="form-input text-[12px] py-1"
                            value={editData.FullName ?? editData.fullName ?? ''}
                            onChange={(e) =>
                              setEditData((prev) => ({ ...prev, FullName: e.target.value }))
                            }
                          />
                        ) : (
                          coordinator.FullName ?? coordinator.fullName ?? '-'
                        )}
                      </td>

                      <td className="px-3 py-2 border-t border-border">
                        {isEdit ? (
                          <input
                            className="form-input text-[12px] py-1"
                            value={editData.Mobile ?? editData.mobile ?? ''}
                            onChange={(e) =>
                              setEditData((prev) => ({ ...prev, Mobile: e.target.value }))
                            }
                          />
                        ) : (
                          coordinator.Mobile ?? coordinator.mobile ?? '-'
                        )}
                      </td>
                    </tr>
                  );
                })}

                {addRow && (
                  <tr className="bg-green-50/60">
                    <td className="px-3 py-2 border-t border-border whitespace-nowrap">
                      <div className="flex gap-1">
                        <button className="btn btn-primary btn-sm" onClick={onSaveAdd}>
                          <SaveIcon className="w-3 h-3 mr-1" />
                          Add
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setAddRow(null)}>
                          <XIcon className="w-3 h-3 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 border-t border-border">
                      <select
                        className="form-select text-[12px] py-1"
                        value={addRow.Designation}
                        onChange={(e) =>
                          setAddRow((prev) => ({ ...prev, Designation: e.target.value }))
                        }
                      >
                        <option value="">Select...</option>
                        {DESIGNATIONS.map((designation) => (
                          <option key={designation}>{designation}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 border-t border-border">
                      <input
                        className="form-input text-[12px] py-1"
                        placeholder="ITS No"
                        value={addRow.ITSNo}
                        onChange={(e) => setAddRow((prev) => ({ ...prev, ITSNo: e.target.value }))}
                      />
                    </td>
                    <td className="px-3 py-2 border-t border-border">
                      <input
                        className="form-input text-[12px] py-1"
                        placeholder="Full Name"
                        value={addRow.FullName}
                        onChange={(e) =>
                          setAddRow((prev) => ({ ...prev, FullName: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 border-t border-border">
                      <input
                        className="form-input text-[12px] py-1"
                        placeholder="Mobile"
                        value={addRow.Mobile}
                        onChange={(e) => setAddRow((prev) => ({ ...prev, Mobile: e.target.value }))}
                      />
                    </td>
                  </tr>
                )}

                {coordinators.length === 0 && !addRow && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400 text-[12px]">
                      No coordinators found - click + Add to create one
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
