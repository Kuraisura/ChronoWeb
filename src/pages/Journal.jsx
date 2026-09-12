import { useEffect, useState } from 'react';
import { journalService } from '@/api/chronoService';

import { Plus, Clock, MapPin, Pencil, Trash2, X } from 'lucide-react';
import TopBar from '@/components/chrono/TopBar';
import PanelToggle from '@/components/chrono/PanelToggle';
import RichTextEditor from '@/components/chrono/RichTextEditor';
import { useToast } from '@/components/ui/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { LIMITS, sanitizeRichText, validateJournal } from '@/lib/validation';

export default function Journal() {
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', content: '' });
  const [draftErrors, setDraftErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [panelOpen, setPanelOpen] = useState(true);
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const thisWeek = entries.filter((entry) => new Date(entry.date ? `${entry.date}T00:00:00` : entry.created_at) >= weekAgo).length;
  const averageLength = entries.length ? Math.round(entries.reduce((sum, entry) => sum + (entry.content || '').replace(/<[^>]+>/g, '').length, 0) / entries.length) : 0;
  const latestDate = entries[0]?.date ? new Date(`${entries[0].date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No entries yet';

  const load = async () => {
    const data = await journalService.list(50);
    setEntries(data);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const errors = validateJournal(draft);
    setDraftErrors(errors);
    if (Object.keys(errors).length) return;
    await journalService.create({
      title: draft.title.trim(), content: sanitizeRichText(draft.content),
      date: new Date().toISOString().slice(0, 10),
      duration: '',
      location: '',
      category: '',
    });
    setDraft({ title: '', content: '' });
    setDraftErrors({});
    setComposing(false);
    toast({ title: 'Journal entry saved' });
    load();
  };

  const startEdit = (e) => {
    setEditingId(e.id);
    setEditDraft({ title: e.title, content: e.content || '' });
    setEditErrors({});
  };

  const saveEdit = async () => {
    const errors = validateJournal(editDraft);
    setEditErrors(errors);
    if (Object.keys(errors).length) return;
    await journalService.update(editingId, { title: editDraft.title.trim(), content: sanitizeRichText(editDraft.content) });
    setEditingId(null);
    toast({ title: 'Entry updated' });
    load();
  };

  const deleteEntry = async (e) => {
    await journalService.remove(e.id);
    toast({ title: 'Entry deleted' });
    load();
  };

  return (
    <>
      <TopBar />
      <div className={`flex-1 grid overflow-hidden ${panelOpen ? 'lg:grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
        <div className="overflow-auto px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-mono text-chrono-muted tracking-[0.2em]">FIELD JOURNAL</div>
              <h1 className="text-3xl font-semibold text-chrono-text mt-1">Shift Logs</h1>
              <div className="text-sm text-chrono-muted mt-1.5">{entries.length} entries • Latest: {latestDate}</div>
            </div>
            <div className="flex items-center gap-2">
              {!panelOpen && <PanelToggle open={false} onToggle={() => setPanelOpen(true)} />}
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => setComposing((c) => !c)}
                className="bg-chrono-accent text-black text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <Plus size={16} /> New Entry
              </motion.button>
            </div>
          </div>

          <AnimatePresence>{composing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 rounded-lg border border-chrono-accent/40 bg-chrono-surface p-5 space-y-3 overflow-hidden">
              <input
                value={draft.title}
                onChange={(e) => { setDraft({ ...draft, title: e.target.value }); setDraftErrors((current) => ({ ...current, title: undefined })); }}
                maxLength={LIMITS.journalTitle + 1}
                aria-invalid={!!draftErrors.title}
                placeholder="Entry title"
                className="w-full bg-transparent text-chrono-text text-lg font-medium outline-none placeholder:text-chrono-dim"
              />
              {draftErrors.title && <p className="form-error" role="alert">{draftErrors.title}</p>}
              <RichTextEditor
                value={draft.content}
                onChange={(v) => { setDraft({ ...draft, content: v }); setDraftErrors((current) => ({ ...current, content: undefined })); }}
                placeholder="Write your shift log — add text, images, links, lists, headings…"
              />
              {draftErrors.content && <p className="form-error" role="alert">{draftErrors.content}</p>}
              <div className="flex gap-2">
                <button onClick={create} className="bg-chrono-accent text-black text-sm px-4 py-2 rounded-md">
                  Save Entry
                </button>
                <button onClick={() => setComposing(false)} className="border border-chrono-border text-chrono-text text-sm px-4 py-2 rounded-md">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}</AnimatePresence>

          <div className="space-y-3 mt-6">
            {loading && <div className="text-chrono-muted text-sm">Loading entries…</div>}
            {!loading && entries.length === 0 && (
              <div className="text-chrono-muted text-sm py-12 text-center">No journal entries yet.</div>
            )}
            {entries.map((e) =>
              editingId === e.id ? (
                <div key={e.id} className="rounded-lg border border-chrono-accent/40 bg-chrono-surface p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-chrono-accent tracking-wider">EDITING ENTRY</span>
                    <button onClick={() => setEditingId(null)} className="text-chrono-muted hover:text-chrono-text">
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    value={editDraft.title}
                    onChange={(ev) => { setEditDraft({ ...editDraft, title: ev.target.value }); setEditErrors((current) => ({ ...current, title: undefined })); }}
                    maxLength={LIMITS.journalTitle + 1}
                    aria-invalid={!!editErrors.title}
                    placeholder="Entry title"
                    className="w-full bg-chrono-bg border border-chrono-border rounded-md px-3 py-2 text-chrono-text text-base font-medium outline-none focus:border-chrono-accent/50"
                  />
                  {editErrors.title && <p className="form-error" role="alert">{editErrors.title}</p>}
                  <RichTextEditor
                    value={editDraft.content}
                    onChange={(v) => { setEditDraft({ ...editDraft, content: v }); setEditErrors((current) => ({ ...current, content: undefined })); }}
                    placeholder="Write your shift log…"
                  />
                  {editErrors.content && <p className="form-error" role="alert">{editErrors.content}</p>}
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="bg-chrono-accent text-black text-sm px-4 py-2 rounded-md">
                      Save Changes
                    </button>
                    <button onClick={() => setEditingId(null)} className="border border-chrono-border text-chrono-text text-sm px-4 py-2 rounded-md">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div key={e.id} className="rounded-lg border border-chrono-border bg-chrono-surface p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-chrono-muted">{e.date}</span>
                    <div className="flex items-center gap-1">
                      {e.duration && (
                        <span className="flex items-center gap-1 text-xs font-mono text-chrono-muted mr-2">
                          <Clock size={12} /> {e.duration}
                        </span>
                      )}
                      <button
                        onClick={() => startEdit(e)}
                        className="w-7 h-7 rounded-md border border-chrono-border text-chrono-muted hover:text-chrono-accent hover:border-chrono-accent/40 flex items-center justify-center transition-colors"
                        title="Edit entry"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteEntry(e)}
                        className="w-7 h-7 rounded-md border border-chrono-border text-chrono-muted hover:text-chrono-danger hover:border-chrono-danger/40 flex items-center justify-center transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-chrono-text font-semibold mb-1.5">{e.title}</h3>
                  {e.content && <div className="chrono-content" dangerouslySetInnerHTML={{ __html: sanitizeRichText(e.content) }} />}
                  {e.location && (
                    <div className="flex items-center gap-1.5 text-xs text-chrono-dim mt-3">
                      <MapPin size={12} /> {e.location}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {panelOpen && (
          <div className="overflow-auto border-l border-chrono-border bg-chrono-bg hidden lg:block">
            <div className="flex justify-end px-5 pt-4">
              <PanelToggle open onToggle={() => setPanelOpen(false)} />
            </div>
            <div className="px-5 pb-6 space-y-4">
              <div className="rounded-lg border border-chrono-border bg-chrono-surface p-5">
                <div className="text-[10px] font-mono text-chrono-muted tracking-wider mb-3">JOURNAL METRICS</div>
                <div className="space-y-3">
                  {[
                    { l: 'Total Entries', v: entries.length },
                    { l: 'This Week', v: thisWeek },
                    { l: 'Avg Entry Length', v: `${averageLength} chars` },
                  ].map((m) => (
                    <div key={m.l} className="flex items-center justify-between">
                      <span className="text-sm text-chrono-muted">{m.l}</span>
                      <span className="font-mono text-sm text-chrono-text">{m.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full border border-chrono-border text-chrono-text text-sm py-2.5 rounded-md hover:bg-chrono-text/5 transition-colors">
                Export Journal (JSON)
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
