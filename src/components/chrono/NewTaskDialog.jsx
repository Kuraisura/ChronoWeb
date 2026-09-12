import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LIMITS, validateTask } from '@/lib/validation';
import { localISODate, formatMinutes } from '@/lib/chronoData';

const initialForm = () => ({ title: '', description: '', date: localISODate(), start_time: '09:00', end_time: '10:00', location: '', status: 'upcoming' });

export default function NewTaskDialog({ open, onClose, onCreate }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (open) setErrors({}); }, [open]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const submit = async () => {
    const nextErrors = validateTask(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const [startHour, startMinute] = form.start_time.split(':').map(Number);
    const [endHour, endMinute] = form.end_time.split(':').map(Number);
    const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    setSubmitting(true);
    try {
      await onCreate({ ...form, title: form.title.trim(), description: form.description.trim(), location: form.location.trim(), duration: formatMinutes(minutes), checklist: [], notes: '' });
      setForm(initialForm());
    } catch (error) {
      setErrors({ submit: error?.message || 'The task could not be created.' });
    } finally { setSubmitting(false); }
  };

  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}><DialogContent className="bg-chrono-surface border-chrono-border text-chrono-text max-w-lg"><DialogHeader><DialogTitle className="text-chrono-text">New task</DialogTitle></DialogHeader>
    <div className="space-y-4 py-2">
      <Field label="Title" error={errors.title} count={`${form.title.length}/${LIMITS.title}`}><Input value={form.title} onChange={(e) => setField('title', e.target.value)} maxLength={LIMITS.title + 1} aria-invalid={!!errors.title} className="bg-chrono-bg border-chrono-border text-chrono-text" placeholder="Task title" autoFocus /></Field>
      <Field label="Description" error={errors.description} count={`${form.description.length}/${LIMITS.description}`}><textarea value={form.description} onChange={(e) => setField('description', e.target.value)} maxLength={LIMITS.description + 1} aria-invalid={!!errors.description} rows={3} className="w-full bg-chrono-bg border border-chrono-border rounded-md px-3 py-2 text-sm text-chrono-text outline-none resize-none focus:border-chrono-accent" placeholder="What needs to be done?" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" error={errors.date}><Input type="date" min="1900-01-01" max="2100-12-31" value={form.date} onChange={(e) => setField('date', e.target.value)} aria-invalid={!!errors.date} className="bg-chrono-bg border-chrono-border text-chrono-text font-mono" /></Field>
        <Field label="Status" error={errors.status}><select value={form.status} onChange={(e) => setField('status', e.target.value)} className="w-full h-9 bg-chrono-bg border border-chrono-border rounded-md px-3 text-sm text-chrono-text"><option value="upcoming">Upcoming</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></Field>
        <Field label="Start time" error={errors.start_time}><Input type="time" value={form.start_time} onChange={(e) => setField('start_time', e.target.value)} aria-invalid={!!errors.start_time} className="bg-chrono-bg border-chrono-border text-chrono-text font-mono" /></Field>
        <Field label="End time" error={errors.end_time}><Input type="time" value={form.end_time} onChange={(e) => setField('end_time', e.target.value)} aria-invalid={!!errors.end_time} className="bg-chrono-bg border-chrono-border text-chrono-text font-mono" /></Field>
      </div>
      <Field label="Location (optional)" error={errors.location} count={`${form.location.length}/${LIMITS.location}`}><Input value={form.location} onChange={(e) => setField('location', e.target.value)} maxLength={LIMITS.location + 1} aria-invalid={!!errors.location} className="bg-chrono-bg border-chrono-border text-chrono-text" placeholder="Room, building, or link" /></Field>
      {errors.submit && <p className="form-error" role="alert">{errors.submit}</p>}
    </div>
    <DialogFooter><Button variant="ghost" onClick={onClose} disabled={submitting} className="text-chrono-muted hover:text-chrono-text">Cancel</Button><Button onClick={submit} disabled={submitting} className="bg-chrono-accent text-black hover:bg-chrono-accent/90">{submitting ? 'Creating…' : 'Create task'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

function Field({ label, error, count, children }) {
  return <div className="space-y-1.5"><div className="flex justify-between gap-3"><Label className="text-chrono-muted text-xs">{label}</Label>{count && <span className="text-[10px] font-mono text-chrono-dim">{count}</span>}</div>{children}{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
