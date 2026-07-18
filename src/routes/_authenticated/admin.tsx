import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDict, SITE_NAME } from "@/i18n";
import { adminListLeads, adminListNews, adminSaveNews, adminDeleteNews, isAdmin } from "@/lib/news.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: `Admin — ${SITE_NAME}` }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  service: string;
  language: string;
  created_at: string;
};

type NewsRow = {
  id: string;
  slug: string;
  language: string;
  title: string;
  summary: string;
  body: string | null;
  source_url: string | null;
  published_at: string;
  is_published: boolean;
};

function AdminPage() {
  const t = getDict("en").admin;
  const check = useServerFn(isAdmin);
  const leadsFn = useServerFn(adminListLeads);
  const newsFn = useServerFn(adminListNews);

  const { data: adminCheck, isLoading: checking } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => check({}),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => leadsFn({}) as Promise<Lead[]>,
    enabled: adminCheck?.admin === true,
  });
  const { data: news = [] } = useQuery({
    queryKey: ["admin-news"],
    queryFn: () => newsFn({}) as Promise<NewsRow[]>,
    enabled: adminCheck?.admin === true,
  });

  if (checking) return <div className="grid min-h-[60vh] place-items-center text-sm">…</div>;
  if (!adminCheck?.admin) return <NotAdminScreen />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/auth"))}>
          {getDict("en").auth.signOut}
        </Button>
      </div>
      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">{t.leadsTable}</TabsTrigger>
          <TabsTrigger value="news">{t.newsManage}</TabsTrigger>
        </TabsList>
        <TabsContent value="leads" className="mt-4">
          <LeadsDashboard leads={leads} t={t} />
        </TabsContent>
        <TabsContent value="news" className="mt-4">
          <NewsAdmin news={news} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotAdminScreen() {
  const t = getDict("en").auth;
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">{t.notAdmin}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Contact the site owner to be granted admin access.</p>
      <div className="mt-4">
        <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/"))}>
          {t.signOut}
        </Button>
      </div>
    </div>
  );
}

function LeadsDashboard({ leads, t }: { leads: Lead[]; t: ReturnType<typeof getDict>["admin"] }) {
  const now = Date.now();
  const d7 = now - 7 * 24 * 3600 * 1000;
  const d30 = now - 30 * 24 * 3600 * 1000;

  const last7 = useMemo(() => leads.filter((l) => new Date(l.created_at).getTime() > d7).length, [leads]);
  const last30 = useMemo(() => leads.filter((l) => new Date(l.created_at).getTime() > d30).length, [leads]);

  const byService = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of leads) m.set(l.service, (m.get(l.service) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [leads]);

  const byLang = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of leads) m.set(l.language, (m.get(l.language) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [leads]);

  const overTime = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
      days[d] = 0;
    }
    for (const l of leads) {
      const d = l.created_at.slice(0, 10);
      if (d in days) days[d]++;
    }
    return Object.entries(days).map(([date, count]) => ({ date: date.slice(5), count }));
  }, [leads]);

  const exportCsv = () => {
    const rows = [
      ["Date", "Name", "Email", "Phone", "Service", "Language"],
      ...leads.map((l) => [l.created_at, l.name, l.email ?? "", l.phone ?? "", l.service, l.language]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardDescription>{t.totalLeads}</CardDescription><CardTitle className="text-3xl">{leads.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>{t.last7}</CardDescription><CardTitle className="text-3xl">{last7}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>{t.last30}</CardDescription><CardTitle className="text-3xl">{last30}</CardTitle></CardHeader></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">{t.byService}</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byService}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-base">{t.byLanguage}</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byLang}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--accent))" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t.submissionsOverTime}</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overTime}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t.leadsTable}</CardTitle>
          <Button size="sm" variant="outline" onClick={exportCsv}>{t.exportCsv}</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t.date}</TableHead><TableHead>{t.name}</TableHead><TableHead>{t.contact}</TableHead><TableHead>{t.service}</TableHead><TableHead>{t.language}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell>{l.name}</TableCell>
                  <TableCell className="text-xs">
                    {l.email && <div>{l.email}</div>}
                    {l.phone && <div>{l.phone}</div>}
                  </TableCell>
                  <TableCell>{l.service}</TableCell>
                  <TableCell className="uppercase">{l.language}</TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">—</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NewsAdmin({ news, t }: { news: NewsRow[]; t: ReturnType<typeof getDict>["admin"] }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(adminSaveNews);
  const delFn = useServerFn(adminDeleteNews);
  const [editing, setEditing] = useState<Partial<NewsRow> | null>(null);

  const save = useMutation({
    mutationFn: (payload: Partial<NewsRow>) =>
      saveFn({
        data: {
          id: (payload.id as string | undefined) ?? null,
          slug: payload.slug!,
          language: payload.language as "uk" | "en" | "pl",
          title: payload.title!,
          summary: payload.summary!,
          body: payload.body ?? null,
          source_url: payload.source_url ?? null,
          published_at: payload.published_at ?? new Date().toISOString().slice(0, 10),
          is_published: payload.is_published ?? true,
        },
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-news"] }); setEditing(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-news"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ language: "uk", is_published: true, published_at: new Date().toISOString().slice(0, 10) })}>{t.addNews}</Button>
      </div>
      {editing && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>{t.slug}</Label><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
              <div>
                <Label>{t.language}</Label>
                <Select value={editing.language ?? "uk"} onValueChange={(v) => setEditing({ ...editing, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uk">UA</SelectItem>
                    <SelectItem value="en">EN</SelectItem>
                    <SelectItem value="pl">PL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>{t.titleField}</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><Label>{t.summary}</Label><Textarea rows={3} value={editing.summary ?? ""} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></div>
            <div><Label>Body</Label><Textarea rows={6} value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>{t.sourceUrl}</Label><Input value={editing.source_url ?? ""} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} /></div>
              <div><Label>{t.publishedAt}</Label><Input type="date" value={editing.published_at ?? ""} onChange={(e) => setEditing({ ...editing, published_at: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={editing.is_published ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_published: v === true })} />
              {t.published}
            </label>
            <div className="flex gap-2">
              <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>{t.save}</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>{t.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>{t.publishedAt}</TableHead><TableHead>{t.language}</TableHead><TableHead>{t.titleField}</TableHead><TableHead>{t.slug}</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {news.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="text-xs">{n.published_at}</TableCell>
                  <TableCell className="uppercase">{n.language}</TableCell>
                  <TableCell>{n.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{n.slug}</TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(n)}>{t.edit}</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del.mutate(n.id)}>{t.delete}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
