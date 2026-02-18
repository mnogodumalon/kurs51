import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, Check, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Anmeldungen, CreateAnmeldungen, Teilnehmer, Kurse } from '@/types/app';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface AnmeldungenTabProps {
  anmeldungen: Anmeldungen[];
  teilnehmer: Teilnehmer[];
  kurse: Kurse[];
  onRefresh: () => void;
}

export function AnmeldungenTab({ anmeldungen, teilnehmer, kurse, onRefresh }: AnmeldungenTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAnmeldung, setEditingAnmeldung] = useState<Anmeldungen | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    teilnehmerId: string;
    kursId: string;
    anmeldedatum: string;
    bezahlt: boolean;
  }>({
    teilnehmerId: '',
    kursId: '',
    anmeldedatum: format(new Date(), 'yyyy-MM-dd'),
    bezahlt: false,
  });

  useEffect(() => {
    if (editingAnmeldung) {
      setForm({
        teilnehmerId: extractRecordId(editingAnmeldung.fields.teilnehmer) || '',
        kursId: extractRecordId(editingAnmeldung.fields.kurs) || '',
        anmeldedatum: editingAnmeldung.fields.anmeldedatum || '',
        bezahlt: editingAnmeldung.fields.bezahlt || false,
      });
    } else {
      setForm({
        teilnehmerId: '',
        kursId: '',
        anmeldedatum: format(new Date(), 'yyyy-MM-dd'),
        bezahlt: false,
      });
    }
  }, [editingAnmeldung]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: CreateAnmeldungen = {
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, form.teilnehmerId),
        kurs: createRecordUrl(APP_IDS.KURSE, form.kursId),
        anmeldedatum: form.anmeldedatum,
        bezahlt: form.bezahlt,
      };

      if (editingAnmeldung) {
        await LivingAppsService.updateAnmeldungenEntry(editingAnmeldung.record_id, data);
      } else {
        await LivingAppsService.createAnmeldungenEntry(data);
      }
      setDialogOpen(false);
      setEditingAnmeldung(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteAnmeldungenEntry(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const toggleBezahlt = async (a: Anmeldungen) => {
    try {
      await LivingAppsService.updateAnmeldungenEntry(a.record_id, {
        bezahlt: !a.fields.bezahlt,
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const openEdit = (a: Anmeldungen) => {
    setEditingAnmeldung(a);
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const getTeilnehmerName = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const t = teilnehmer.find((x) => x.record_id === id);
    return t?.fields.name || '-';
  };

  const getKursName = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const k = kurse.find((x) => x.record_id === id);
    return k?.fields.titel || '-';
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    try {
      return format(parseISO(date), 'dd.MM.yyyy', { locale: de });
    } catch {
      return date;
    }
  };

  // Calculate stats
  const totalAnmeldungen = anmeldungen.length;
  const bezahltCount = anmeldungen.filter((a) => a.fields.bezahlt).length;
  const offenCount = totalAnmeldungen - bezahltCount;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="heading-lg">Anmeldungen</h2>
          <p className="text-muted-foreground text-sm">Verwalten Sie Kursanmeldungen und Zahlungen</p>
        </div>
        <Button
          onClick={() => { setEditingAnmeldung(null); setDialogOpen(true); }}
          className="btn-primary-gradient"
          disabled={teilnehmer.length === 0 || kurse.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Anmeldung hinzufügen
        </Button>
      </div>

      {(teilnehmer.length === 0 || kurse.length === 0) && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-accent-foreground">
            Bitte fügen Sie zuerst{' '}
            {teilnehmer.length === 0 && 'Teilnehmer'}
            {teilnehmer.length === 0 && kurse.length === 0 && ' und '}
            {kurse.length === 0 && 'Kurse'}
            {' '}hinzu, bevor Sie Anmeldungen erstellen können.
          </p>
        </div>
      )}

      {anmeldungen.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="card-elevated p-4">
            <p className="text-label mb-1">Gesamt</p>
            <p className="text-2xl font-bold">{totalAnmeldungen}</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-label mb-1">Bezahlt</p>
            <p className="text-2xl font-bold text-success">{bezahltCount}</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-label mb-1">Offen</p>
            <p className="text-2xl font-bold text-accent">{offenCount}</p>
          </div>
        </div>
      )}

      {anmeldungen.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Keine Anmeldungen"
          description="Fügen Sie Ihre erste Anmeldung hinzu, um Teilnehmer zu Kursen zuzuweisen."
          action={
            teilnehmer.length > 0 && kurse.length > 0 ? (
              <Button onClick={() => setDialogOpen(true)} className="btn-primary-gradient">
                <Plus className="w-4 h-4 mr-2" />
                Erste Anmeldung hinzufügen
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table className="table-modern">
            <TableHeader>
              <TableRow>
                <TableHead>Teilnehmer</TableHead>
                <TableHead>Kurs</TableHead>
                <TableHead>Anmeldedatum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anmeldungen.map((a) => (
                <TableRow key={a.record_id}>
                  <TableCell className="font-medium">{getTeilnehmerName(a.fields.teilnehmer)}</TableCell>
                  <TableCell>{getKursName(a.fields.kurs)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(a.fields.anmeldedatum)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleBezahlt(a)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        a.fields.bezahlt
                          ? 'bg-success/10 text-success hover:bg-success/20'
                          : 'bg-accent/10 text-accent-foreground hover:bg-accent/20'
                      }`}
                    >
                      {a.fields.bezahlt ? (
                        <>
                          <Check className="w-3 h-3" />
                          Bezahlt
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          Offen
                        </>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDelete(a.record_id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnmeldung ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teilnehmer">Teilnehmer *</Label>
              <Select value={form.teilnehmerId} onValueChange={(v) => setForm({ ...form, teilnehmerId: v })}>
                <SelectTrigger className="input-focus">
                  <SelectValue placeholder="Teilnehmer auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {teilnehmer.map((t) => (
                    <SelectItem key={t.record_id} value={t.record_id}>
                      {t.fields.name} ({t.fields.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs">Kurs *</Label>
              <Select value={form.kursId} onValueChange={(v) => setForm({ ...form, kursId: v })}>
                <SelectTrigger className="input-focus">
                  <SelectValue placeholder="Kurs auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {kurse.map((k) => (
                    <SelectItem key={k.record_id} value={k.record_id}>
                      {k.fields.titel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anmeldedatum">Anmeldedatum *</Label>
              <Input
                id="anmeldedatum"
                type="date"
                value={form.anmeldedatum}
                onChange={(e) => setForm({ ...form, anmeldedatum: e.target.value })}
                required
                className="input-focus"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="bezahlt"
                checked={form.bezahlt}
                onCheckedChange={(checked) => setForm({ ...form, bezahlt: !!checked })}
              />
              <Label htmlFor="bezahlt" className="cursor-pointer">Bezahlt</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={loading || !form.teilnehmerId || !form.kursId}
                className="btn-primary-gradient"
              >
                {loading ? 'Speichern...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Anmeldung löschen"
        description="Möchten Sie diese Anmeldung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
