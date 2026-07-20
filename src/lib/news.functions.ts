import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LocaleSchema = z.enum(["uk", "en", "pl"]);

async function checkIsAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}


export const listNewsPublic = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ language: LocaleSchema, limit: z.number().min(1).max(50).optional() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("news")
      .select("id, slug, language, title, summary, source_url, published_at")
      .eq("language", data.language)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 20);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getNewsBySlug = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string(), language: LocaleSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("news")
      .select("id, slug, language, title, summary, body, source_url, published_at")
      .eq("slug", data.slug)
      .eq("language", data.language)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// ---- Admin ----

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { admin: data === true };
  });

export const adminListLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role !== true) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminListNews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role !== true) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("news")
      .select("*")
      .order("published_at", { ascending: false })
      .order("language");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const NewsInputSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  slug: z.string().min(1).max(120),
  language: LocaleSchema,
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(1000),
  body: z.string().max(20000).nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  published_at: z.string(),
  is_published: z.boolean(),
});

export const adminSaveNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => NewsInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role !== true) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      slug: data.slug,
      language: data.language,
      title: data.title,
      summary: data.summary,
      body: data.body ?? null,
      source_url: data.source_url ?? null,
      published_at: data.published_at,
      is_published: data.is_published,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("news").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("news")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

export const adminDeleteNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role !== true) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("news").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
