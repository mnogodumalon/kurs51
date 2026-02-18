import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GraduationCap, Mail, Phone, BookOpen } from 'lucide-react';
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
import type { Dozenten, CreateDozenten } from '@/types/app';

interface DozentenTabProps {
  dozenten: Dozenten[];
  onRefresh: () => void;
}

export function DozentenTab({ dozenten, onRefresh }: DozentenTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDozent, setEditingDozent] = useState<Dozenten | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateDozenten>({
    name: '',
    email: '',
    telefon: '',
    fachgebiet: '',
  });

  useEffect(() => {
    if (editingDozent) {
      setForm({
        name: editingDozent.fields.name || '',
        email: editingDozent.fields.email || '',
        telefon: editingDozent.fields.telefon || '',
        fachgebiet: editingDozent.fields.fachgebiet || '',
      });
    } else {
      setForm({ name: '', email: '', telefon: '', fachgebiet: '' });
    }
  }, [editingDozent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingDozent) {
        await LivingAppsService.updateDozentenEntry(editingDozent.record_id, form);
      } else {
        await LivingAppsService.createDozentenEntry(form);
      }
      setDialogOpen(false);
      setEditingDozent(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteDozentenEntry(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (d: Dozenten) => {
    setEditingDozent(d);
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
          <h2 className="heading-lg">Dozenten</h2>
          <p className="text-muted-foreground text-sm">Verwalten Sie Ihre Dozenten und deren Fachgebiete</p>
        </div>
        <Button onClick={() => { setEditingDozent(null); setDialogOpen(true); }} className="btn-primary-gradient">
          <Plus className="w-4 h-4 mr-2" />
          Dozent hinzufügen
        </Button>
      </div>

      {dozenten.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Keine Dozenten"
          description="Fügen Sie Ihren ersten Dozenten hinzu, um Kurse zuzuweisen."
          action={
            <Button onClick={() => setDialogOpen(true)} className="btn-primary-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Ersten Dozenten hinzufügen
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
                <TableHead>Fachgebiet</TableHead>
                <TableHead className="w-[100px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dozenten.map((d) => (
                <TableRow key={d.record_id}>
                  <TableCell className="font-medium">{d.fields.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {d.fields.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {d.fields.telefon && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {d.fields.telefon}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {d.fields.fachgebiet && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        <BookOpen className="w-3 h-3" />
                        {d.fields.fachgebiet}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(d)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDelete(d.record_id)}>
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
            <DialogTitle>{editingDozent ? 'Dozent bearbeiten' : 'Neuer Dozent'}</DialogTitle>
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
              <Label htmlFor="fachgebiet">Fachgebiet</Label>
              <Input
                id="fachgebiet"
                value={form.fachgebiet}
                onChange={(e) => setForm({ ...form, fachgebiet: e.target.value })}
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
        title="Dozent löschen"
        description="Möchten Sie diesen Dozenten wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
