'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  dueDate: string;
  current: number;
  target: number;
  type: 'problems' | 'rating' | 'contests' | 'custom';
}

interface RoadmapShellProps {
  initialCfRating: number;
  initialSolvedCount: number;
}

export function RoadmapShell({ initialCfRating, initialSolvedCount }: RoadmapShellProps) {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Form states
  const [title, setTitle] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [targetVal, setTargetVal] = React.useState(0);
  const [currentVal, setCurrentVal] = React.useState(0);
  const [type, setType] = React.useState<'problems' | 'rating' | 'contests' | 'custom'>('custom');

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('bamblu:goals');
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (err) {
        initDefaultGoals();
      }
    } else {
      initDefaultGoals();
    }
  }, [initialCfRating, initialSolvedCount]);

  const initDefaultGoals = () => {
    const defaultGoals: Goal[] = [
      {
        id: '1',
        title: 'Solve 50 DP problems',
        dueDate: 'Due: March 2026',
        current: Math.min(32, initialSolvedCount),
        target: 50,
        type: 'problems',
      },
      {
        id: '2',
        title: 'Reach 1900 rating',
        dueDate: 'Due: April 2026',
        current: initialCfRating || 1847,
        target: 1900,
        type: 'rating',
      },
      {
        id: '3',
        title: 'Complete 10 contests',
        dueDate: 'Due: May 2026',
        current: 6,
        target: 10,
        type: 'contests',
      },
    ];
    setGoals(defaultGoals);
    localStorage.setItem('bamblu:goals', JSON.stringify(defaultGoals));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate.trim() || targetVal <= 0) return;

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: title.trim(),
      dueDate: `Due: ${dueDate.trim()}`,
      current: currentVal,
      target: targetVal,
      type,
    };

    const updated = [...goals, newGoal];
    setGoals(updated);
    localStorage.setItem('bamblu:goals', JSON.stringify(updated));

    // Reset form
    setTitle('');
    setDueDate('');
    setTargetVal(0);
    setCurrentVal(0);
    setType('custom');
    setModalOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    localStorage.setItem('bamblu:goals', JSON.stringify(updated));
  };

  return (
    <div className="w-full space-y-6 animate-fade-in flex flex-col flex-1">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Roadmap</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your personal coding goals and milestones.
          </p>
        </div>

        <button
          id="add-goal-btn"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-semibold px-4 py-2 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </button>
      </div>

      {/* Goal Cards Stack */}
      {mounted && goals.length > 0 ? (
        <div className="space-y-4 flex-1">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.max(0, (goal.current / goal.target) * 100));

            return (
              <div
                key={goal.id}
                className="relative group rounded-xl bg-[#0F1929] border border-white/[0.06] p-6 space-y-4"
              >
                {/* Delete button (hidden by default, visible on hover) */}
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove goal"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-start justify-between pr-6">
                  <h3 className="text-base font-bold text-white">{goal.title}</h3>
                  <span className="text-xs text-slate-400 font-medium">{goal.dueDate}</span>
                </div>

                {/* Progress bar container */}
                <div className="space-y-2">
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#06B6D4] h-full rounded-full transition-all duration-550"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span>
                      {goal.type === 'rating'
                        ? `Current: ${goal.current}`
                        : `${goal.current} / ${goal.target} completed`}
                    </span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-[#0F1929] p-8 flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 text-sm">No goals added yet.</p>
        </div>
      )}

      {/* Add Goal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0F1929] border border-white/10 p-6 space-y-4 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-xl font-bold text-white">Add Coding Goal</h2>

            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve 50 DP problems"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg bg-[#1E293B] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. March 2026"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg bg-[#1E293B] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06B6D4]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Goal Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-lg bg-[#1E293B] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06B6D4]"
                  >
                    <option value="problems">Problems</option>
                    <option value="rating">Rating</option>
                    <option value="contests">Contests</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Current Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentVal}
                    onChange={(e) => setCurrentVal(Number(e.target.value))}
                    className="w-full rounded-lg bg-[#1E293B] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06B6D4]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Target Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetVal}
                    onChange={(e) => setTargetVal(Number(e.target.value))}
                    className="w-full rounded-lg bg-[#1E293B] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06B6D4]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-semibold px-4 py-2 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
