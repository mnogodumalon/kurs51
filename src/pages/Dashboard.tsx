import { useState, useEffect, useCallback } from 'react';
import { BookOpen, GraduationCap, Users, Building2, ClipboardList, Euro, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/StatCard';
import { DozentenTab } from '@/components/tabs/DozentenTab';
import { RaeumeTab } from '@/components/tabs/RaeumeTab';
import { TeilnehmerTab } from '@/components/tabs/TeilnehmerTab';
import { KurseTab } from '@/components/tabs/KurseTab';
import { AnmeldungenTab } from '@/components/tabs/AnmeldungenTab';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Dozenten, Raeume, Teilnehmer, Kurse, Anmeldungen } from '@/types/app';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [activeTab, setActiveTab] = useState('kurse');

  const loadData = useCallback(async () => {
    try {
      const [d, r, t, k, a] = await Promise.all([
        LivingAppsService.getDozenten(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getKurse(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setDozenten(d);
      setRaeume(r);
      setTeilnehmer(t);
      setKurse(k);
      setAnmeldungen(a);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate revenue
  const totalRevenue = anmeldungen
    .filter((a) => a.fields.bezahlt)
    .reduce((sum, a) => {
      const kursId = a.fields.kurs?.match(/([a-f0-9]{24})$/i)?.[1];
      const kurs = kurse.find((k) => k.record_id === kursId);
      return sum + (kurs?.fields.preis || 0);
    }, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="heading-xl">Kursverwaltung</h1>
              <p className="text-muted-foreground text-sm">Verwalten Sie Kurse, Dozenten, Teilnehmer und mehr</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <StatCard
            label="Kurse"
            value={kurse.length}
            icon={BookOpen}
            trend={`${kurse.filter((k) => new Date(k.fields.startdatum || '') > new Date()).length} bevorstehend`}
          />
          <StatCard label="Dozenten" value={dozenten.length} icon={GraduationCap} />
          <StatCard label="Teilnehmer" value={teilnehmer.length} icon={Users} />
          <StatCard label="Räume" value={raeume.length} icon={Building2} />
          <div className="card-hero p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">Umsatz (bezahlt)</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs opacity-80 mt-1">
                  {anmeldungen.filter((a) => a.fields.bezahlt).length} von {anmeldungen.length} bezahlt
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <Euro className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border p-1 h-auto flex-wrap">
            <TabsTrigger value="kurse" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Kurse
            </TabsTrigger>
            <TabsTrigger value="dozenten" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              Dozenten
            </TabsTrigger>
            <TabsTrigger value="teilnehmer" className="gap-2">
              <Users className="w-4 h-4" />
              Teilnehmer
            </TabsTrigger>
            <TabsTrigger value="raeume" className="gap-2">
              <Building2 className="w-4 h-4" />
              Räume
            </TabsTrigger>
            <TabsTrigger value="anmeldungen" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Anmeldungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kurse">
            <KurseTab
              kurse={kurse}
              dozenten={dozenten}
              raeume={raeume}
              anmeldungen={anmeldungen}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="dozenten">
            <DozentenTab dozenten={dozenten} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="teilnehmer">
            <TeilnehmerTab teilnehmer={teilnehmer} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="raeume">
            <RaeumeTab raeume={raeume} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="anmeldungen">
            <AnmeldungenTab
              anmeldungen={anmeldungen}
              teilnehmer={teilnehmer}
              kurse={kurse}
              onRefresh={loadData}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
