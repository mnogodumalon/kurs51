import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users, Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { LivingAppsService } from '@/services/livingAppsService';
import type { Teilnehmer, CreateTeilnehmer } from '@/types/app';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface TeilnehmerTabProps {
  teilnehmer: Teilnehmer[];
  onRefresh: () => void;
}

export function TeilnehmerTab({ teilnehmer, onRefresh }: TeilnehmerTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTeilnehmer, setEditingTeilnehmer] = useState<Teilnehmer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateTeilnehmer>({
    name: '',
    email: '',
    telefon: '',
    geburtsdatum: '',
  });

  useEffect(() => {
    if (editingTeilnehmer) {
      setForm({
        name: editingTeilnehmer.fields.name || '',
        email: editingTeilnehmer.fields.email || '',
        telefon: editingTeilnehmer.fields.telefon || '',
        geburtsdatum: editingTeilnehmer.fields.geburtsdatum || '',
      });
    } else {
      setForm({ name: '', email: '', telefon: '', geburtsdatum: '' });
    }
  }, [editingTeilnehmer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form };
      if (!data.geburtsdatum) delete data.geburtsdatum;

      if (editingTeilnehmer) {
        await LivingAppsService.updateTeilnehmerEntry(editingTeilnehmer.record_id, data);
      } else {
        await LivingAppsService.createTeilnehmerEntry(data);
      }
      setDialogOpen(false);
      setEditingTeilnehmer(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteTeilnehmerEntry(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (t: Teilnehmer) => {
    setEditingTeilnehmer(t);
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    try {
      return format(parseISO(date), 'dd.MM.yyyy', { locale: de });
    } catch {
      return date;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="heading-lg">Teilnehmer</h2>
          <p className="text-muted-foreground text-sm">Verwalten Sie Ihre Kursteilnehmer</p>
        </div>
        <Button onClick={() => { setEditingTeilnehmer(null); setDialogOpen(true); }} className="btn-primary-gradient">
          <Plus className="w-4 h-4 mr-2" />
          Teilnehmer hinzufügen
        </Button>
      </div>

      {teilnehmer.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Keine Teilnehmer"
          description="Fügen Sie Ihren ersten Teilnehmer hinzu, um Anmeldungen zu verwalten."
          action={
            <Button onClick={() => setDialogOpen(true)} className="btn-primary-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Ersten Teilnehmer hinzufügen
            </Button>
          }
        />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table className="table-modern">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Geburtsdatum</TableHead>
                <TableHead className="w-[100px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teilnehmer.map((t) => (
                <TableRow key={t.record_id}>
                  <TableCell className="font-medium">{t.fields.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {t.fields.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.fields.telefon ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {t.fields.telefon}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {t.fields.geburtsdatum ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(t.fields.geburtsdatum)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDelete(t.record_id)}>
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
            <DialogTitle>{editingTeilnehmer ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                className="input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
              <Input
                id="geburtsdatum"
                type="date"
                value={form.geburtsdatum}
                onChange={(e) => setForm({ ...form, geburtsdatum: e.target.value })}
                className="input-focus"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading} className="btn-primary-gradient">
                {loading ? 'Speichern...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Teilnehmer löschen"
        description="Möchten Sie diesen Teilnehmer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
