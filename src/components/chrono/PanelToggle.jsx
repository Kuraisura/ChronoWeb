import { ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function PanelToggle({ open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={open ? 'Collapse panel' : 'Expand panel'}
      aria-expanded={open}
      className="motion-button w-9 h-9 rounded-md border border-chrono-border text-chrono-muted hover:text-chrono-text hover:bg-chrono-text/5 flex items-center justify-center shrink-0"
    >
      {open ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
    </button>
  );
}
