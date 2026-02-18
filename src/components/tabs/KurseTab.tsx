import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Calendar, Users, Euro, MapPin, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Kurse, CreateKurse, Dozenten, Raeume, Anmeldungen } from '@/types/app';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface KurseTabProps {
  kurse: Kurse[];
  dozenten: Dozenten[];
  raeume: Raeume[];
  anmeldungen: Anmeldungen[];
  onRefresh: () => void;
}

export function KurseTab({ kurse, dozenten, raeume, anmeldungen, onRefresh }: KurseTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingKurs, setEditingKurs] = useState<Kurse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    titel: string;
    beschreibung: string;
    startdatum: string;
    enddatum: string;
    max_teilnehmer: number;
    preis: number;
    dozentId: string;
    raumId: string;
  }>({
    titel: '',
    beschreibung: '',
    startdatum: '',
    enddatum: '',
    max_teilnehmer: 0,
    preis: 0,
    dozentId: '',
    raumId: '',
  });

  useEffect(() => {
    if (editingKurs) {
      setForm({
        titel: editingKurs.fields.titel || '',
        beschreibung: editingKurs.fields.beschreibung || '',
        startdatum: editingKurs.fields.startdatum || '',
        enddatum: editingKurs.fields.enddatum || '',
        max_teilnehmer: editingKurs.fields.max_teilnehmer || 0,
        preis: editingKurs.fields.preis || 0,
        dozentId: extractRecordId(editingKurs.fields.dozent) || '',
        raumId: extractRecordId(editingKurs.fields.raum) || '',
      });
    } else {
      setForm({
        titel: '',
        beschreibung: '',
        startdatum: '',
        enddatum: '',
        max_teilnehmer: 0,
        preis: 0,
        dozentId: '',
        raumId: '',
      });
    }
  }, [editingKurs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: CreateKurse = {
        titel: form.titel,
        beschreibung: form.beschreibung || undefined,
        startdatum: form.startdatum,
        enddatum: form.enddatum,
        max_teilnehmer: form.max_teilnehmer,
        preis: form.preis,
        dozent: createRecordUrl(APP_IDS.DOZENTEN, form.dozentId),
        raum: createRecordUrl(APP_IDS.RAEUME, form.raumId),
      };

      if (editingKurs) {
        await LivingAppsService.updateKurseEntry(editingKurs.record_id, data);
      } else {
        await LivingAppsService.createKurseEntry(data);
      }
      setDialogOpen(false);
      setEditingKurs(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteKurseEntry(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (k: Kurse) => {
    setEditingKurs(k);
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const getDozentName = (dozentUrl: string | undefined) => {
    if (!dozentUrl) return '-';
    const id = extractRecordId(dozentUrl);
    const d = dozenten.find((x) => x.record_id === id);
    return d?.fields.name || '-';
  };

  const getRaumName = (raumUrl: string | undefined) => {
    if (!raumUrl) return '-';
    const id = extractRecordId(raumUrl);
    const r = raeume.find((x) => x.record_id === id);
    return r ? `${r.fields.raumname} (${r.fields.gebaeude})` : '-';
  };

  const getAnmeldungenCount = (kursId: string) => {
    return anmeldungen.filter((a) => extractRecordId(a.fields.kurs) === kursId).length;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    try {
      return format(parseISO(date), 'dd.MM.yyyy', { locale: de });
    } catch {
      return date;
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="heading-lg">Kurse</h2>
          <p className="text-muted-foreground text-sm">Verwalten Sie Ihre Kursangebote</p>
        </div>
        <Button
          onClick={() => { setEditingKurs(null); setDialogOpen(true); }}
          className="btn-primary-gradient"
          disabled={dozenten.length === 0 || raeume.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Kurs hinzufügen
        </Button>
      </div>

      {(dozenten.length === 0 || raeume.length === 0) && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-accent-foreground">
            Bitte fügen Sie zuerst{' '}
            {dozenten.length === 0 && 'Dozenten'}
            {dozenten.length === 0 && raeume.length === 0 && ' und '}
            {raeume.length === 0 && 'Räume'}
            {' '}hinzu, bevor Sie Kurse erstellen können.
          </p>
        </div>
      )}

      {kurse.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Keine Kurse"
          description="Fügen Sie Ihren ersten Kurs hinzu, um mit der Verwaltung zu beginnen."
          action={
            dozenten.length > 0 && raeume.length > 0 ? (
              <Button onClick={() => setDialogOpen(true)} className="btn-primary-gradient">
                <Plus className="w-4 h-4 mr-2" />
                Ersten Kurs hinzufügen
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kurse.map((k) => {
            const anmeldungenCount = getAnmeldungenCount(k.record_id);
            const maxTeilnehmer = k.fields.max_teilnehmer || 0;
            const fillPercent = maxTeilnehmer > 0 ? Math.min((anmeldungenCount / maxTeilnehmer) * 100, 100) : 0;

            return (
              <div key={k.record_id} className="card-elevated overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{k.fields.titel}</h3>
                      {k.fields.beschreibung && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{k.fields.beschreibung}</p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(k)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDelete(k.record_id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(k.fields.startdatum)} - {formatDate(k.fields.enddatum)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>{getDozentName(k.fields.dozent)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{getRaumName(k.fields.raum)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t px-5 py-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">{anmeldungenCount}</span>
                        <span className="text-muted-foreground"> / {maxTeilnehmer}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <Euro className="w-4 h-4" />
                      {formatPrice(k.fields.preis)}
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingKurs ? 'Kurs bearbeiten' : 'Neuer Kurs'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titel">Titel *</Label>
              <Input
                id="titel"
                value={form.titel}
                onChange={(e) => setForm({ ...form, titel: e.target.value })}
                required
                className="input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea
                id="beschreibung"
                value={form.beschreibung}
                onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
                className="input-focus min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startdatum">Startdatum *</Label>
                <Input
                  id="startdatum"
                  type="date"
                  value={form.startdatum}
                  onChange={(e) => setForm({ ...form, startdatum: e.target.value })}
                  required
                  className="input-focus"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enddatum">Enddatum *</Label>
                <Input
                  id="enddatum"
                  type="date"
                  value={form.enddatum}
                  onChange={(e) => setForm({ ...form, enddatum: e.target.value })}
                  required
                  className="input-focus"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_teilnehmer">Max. Teilnehmer *</Label>
                <Input
                  id="max_teilnehmer"
                  type="number"
                  min={1}
                  value={form.max_teilnehmer || ''}
                  onChange={(e) => setForm({ ...form, max_teilnehmer: parseInt(e.target.value) || 0 })}
                  required
                  className="input-focus"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preis">Preis (€) *</Label>
                <Input
                  id="preis"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.preis || ''}
                  onChange={(e) => setForm({ ...form, preis: parseFloat(e.target.value) || 0 })}
                  required
                  className="input-focus"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dozent">Dozent *</Label>
              <Select value={form.dozentId} onValueChange={(v) => setForm({ ...form, dozentId: v })}>
                <SelectTrigger className="input-focus">
                  <SelectValue placeholder="Dozent auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {dozenten.map((d) => (
                    <SelectItem key={d.record_id} value={d.record_id}>
                      {d.fields.name} {d.fields.fachgebiet && `(${d.fields.fachgebiet})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="raum">Raum *</Label>
              <Select value={form.raumId} onValueChange={(v) => setForm({ ...form, raumId: v })}>
                <SelectTrigger className="input-focus">
                  <SelectValue placeholder="Raum auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {raeume.map((r) => (
                    <SelectItem key={r.record_id} value={r.record_id}>
                      {r.fields.raumname} ({r.fields.gebaeude}) - {r.fields.kapazitaet} Plätze
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={loading || !form.dozentId || !form.raumId}
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
        title="Kurs löschen"
        description="Möchten Sie diesen Kurs wirklich löschen? Alle zugehörigen Anmeldungen bleiben bestehen."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
