import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Building2, Users } from 'lucide-react';
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
import type { Raeume, CreateRaeume } from '@/types/app';

interface RaeumeTabProps {
  raeume: Raeume[];
  onRefresh: () => void;
}

export function RaeumeTab({ raeume, onRefresh }: RaeumeTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRaum, setEditingRaum] = useState<Raeume | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateRaeume>({
    raumname: '',
    gebaeude: '',
    kapazitaet: 0,
  });

  useEffect(() => {
    if (editingRaum) {
      setForm({
        raumname: editingRaum.fields.raumname || '',
        gebaeude: editingRaum.fields.gebaeude || '',
        kapazitaet: editingRaum.fields.kapazitaet || 0,
      });
    } else {
      setForm({ raumname: '', gebaeude: '', kapazitaet: 0 });
    }
  }, [editingRaum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRaum) {
        await LivingAppsService.updateRaeumeEntry(editingRaum.record_id, form);
      } else {
        await LivingAppsService.createRaeumeEntry(form);
      }
      setDialogOpen(false);
      setEditingRaum(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteRaeumeEntry(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (r: Raeume) => {
    setEditingRaum(r);
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="heading-lg">Räume</h2>
          <p className="text-muted-foreground text-sm">Verwalten Sie Ihre Unterrichtsräume</p>
        </div>
        <Button onClick={() => { setEditingRaum(null); setDialogOpen(true); }} className="btn-primary-gradient">
          <Plus className="w-4 h-4 mr-2" />
          Raum hinzufügen
        </Button>
      </div>

      {raeume.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Keine Räume"
          description="Fügen Sie Ihren ersten Raum hinzu, um Kurse dort abzuhalten."
          action={
            <Button onClick={() => setDialogOpen(true)} className="btn-primary-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Ersten Raum hinzufügen
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {raeume.map((r) => (
            <div key={r.record_id} className="card-elevated p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => openDelete(r.record_id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1">{r.fields.raumname}</h3>
              <p className="text-muted-foreground text-sm mb-3">{r.fields.gebaeude}</p>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{r.fields.kapazitaet}</span>
                <span className="text-muted-foreground">Plätze</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRaum ? 'Raum bearbeiten' : 'Neuer Raum'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="raumname">Raumname *</Label>
              <Input
                id="raumname"
                value={form.raumname}
                onChange={(e) => setForm({ ...form, raumname: e.target.value })}
                required
                placeholder="z.B. Raum 101"
                className="input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gebaeude">Gebäude *</Label>
              <Input
                id="gebaeude"
                value={form.gebaeude}
                onChange={(e) => setForm({ ...form, gebaeude: e.target.value })}
                required
                placeholder="z.B. Hauptgebäude"
                className="input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kapazitaet">Kapazität *</Label>
              <Input
                id="kapazitaet"
                type="number"
                min={1}
                value={form.kapazitaet || ''}
                onChange={(e) => setForm({ ...form, kapazitaet: parseInt(e.target.value) || 0 })}
                required
                placeholder="z.B. 30"
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
        title="Raum löschen"
        description="Möchten Sie diesen Raum wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
