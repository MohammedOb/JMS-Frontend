'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx              from 'clsx';
import toast             from 'react-hot-toast';
import PageHeader        from '@/components/shared/PageHeader';
import { incomeHeadService, expenseHeadService } from '@/services';

import IncomeHeadList      from './components/IncomeHeadList';
import IncomeHeadAddModal  from './components/IncomeHeadAddModal';
import IncomeHeadEditModal from './components/IncomeHeadEditModal';

import ExpenseHeadList      from './components/ExpenseHeadList';
import ExpenseHeadAddModal  from './components/ExpenseHeadAddModal';
import ExpenseHeadEditModal from './components/ExpenseHeadEditModal';

export default function IncomeExpenseHeadsPage() {
  const [tab, setTab] = useState('income'); // 'income' | 'expense'

  // ── Income Head state ──────────────────────────────────────────────────────
  const [incomeRows,     setIncomeRows]     = useState([]);
  const [incomeLoading,  setIncomeLoading]  = useState(false);
  const [incomeAddOpen,  setIncomeAddOpen]  = useState(false);
  const [incomeEditItem, setIncomeEditItem] = useState(null);

  // Derived: unique ContributionType values used as suggestions in modals
  const incomeContribSuggestions = [...new Set(incomeRows.map(r => r.ContributionType).filter(Boolean))];

  const loadIncome = useCallback(async () => {
    setIncomeLoading(true);
    try {
      const res = await incomeHeadService.load({});
      const rows = res.data?.data ?? res.data;
      setIncomeRows(Array.isArray(rows) ? rows : []);
    } catch {
      toast.error('Failed to load income heads');
    } finally {
      setIncomeLoading(false);
    }
  }, []);

  useEffect(() => { loadIncome(); }, [loadIncome]);

  // Called by Add/Edit modals after a successful save
  const handleIncomeSaved = () => {
    setIncomeAddOpen(false);
    setIncomeEditItem(null);
    loadIncome();
  };

  // ── Expense Head state ─────────────────────────────────────────────────────
  const [expenseRows,     setExpenseRows]     = useState([]);
  const [expenseLoading,  setExpenseLoading]  = useState(false);
  const [expenseAddOpen,  setExpenseAddOpen]  = useState(false);
  const [expenseEditItem, setExpenseEditItem] = useState(null);

  const loadExpense = useCallback(async () => {
    setExpenseLoading(true);
    try {
      const res = await expenseHeadService.load({});
      const rows = res.data?.data ?? res.data;
      setExpenseRows(Array.isArray(rows) ? rows : []);
    } catch {
      toast.error('Failed to load expense heads');
    } finally {
      setExpenseLoading(false);
    }
  }, []);

  useEffect(() => { loadExpense(); }, [loadExpense]);

  const handleExpenseSaved = () => {
    setExpenseAddOpen(false);
    setExpenseEditItem(null);
    loadExpense();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Income & Expense Heads"
        subtitle="Manage income and expense account heads"
      />

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 bg-white border border-border rounded-lg p-1 w-fit">
        <button
          className={clsx(
            'px-4 py-1.5 rounded-md text-[12.5px] font-medium transition-all',
            tab === 'income' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
          onClick={() => setTab('income')}
        >
          Income Head
        </button>
        <button
          className={clsx(
            'px-4 py-1.5 rounded-md text-[12.5px] font-medium transition-all',
            tab === 'expense' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
          onClick={() => setTab('expense')}
        >
          Expense Head
        </button>
      </div>

      {/* ── Income Head tab ──────────────────────────────────────────────────── */}
      {tab === 'income' && (
        <IncomeHeadList
          rows={incomeRows}
          loading={incomeLoading}
          onAdd={() => setIncomeAddOpen(true)}
          onEdit={(item) => setIncomeEditItem(item)}
          onDeleted={loadIncome}
        />
      )}

      {/* ── Expense Head tab ─────────────────────────────────────────────────── */}
      {tab === 'expense' && (
        <ExpenseHeadList
          rows={expenseRows}
          loading={expenseLoading}
          onAdd={() => setExpenseAddOpen(true)}
          onEdit={(item) => setExpenseEditItem(item)}
          onReload={loadExpense}
        />
      )}

      {/* ── Income Head modals ───────────────────────────────────────────────── */}
      <IncomeHeadAddModal
        open={incomeAddOpen}
        onClose={() => setIncomeAddOpen(false)}
        onSaved={handleIncomeSaved}
        existingRows={incomeRows}
        contribSuggestions={incomeContribSuggestions}
      />
      <IncomeHeadEditModal
        open={!!incomeEditItem}
        onClose={() => setIncomeEditItem(null)}
        item={incomeEditItem}
        onSaved={handleIncomeSaved}
        existingRows={incomeRows}
        contribSuggestions={incomeContribSuggestions}
      />

      {/* ── Expense Head modals ──────────────────────────────────────────────── */}
      <ExpenseHeadAddModal
        open={expenseAddOpen}
        onClose={() => setExpenseAddOpen(false)}
        onSaved={handleExpenseSaved}
        existingRows={expenseRows}
      />
      <ExpenseHeadEditModal
        open={!!expenseEditItem}
        onClose={() => setExpenseEditItem(null)}
        item={expenseEditItem}
        onSaved={handleExpenseSaved}
        existingRows={expenseRows}
      />
    </div>
  );
}
