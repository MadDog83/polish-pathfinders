import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LeadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200).nullable(),
  phone: z.string().min(3).max(40).nullable(),
  service: z.string().min(1).max(80),
  language: z.enum(["uk", "en", "pl"]),
  consent: z.literal(true),
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data) => LeadSchema.parse(data))
  .handler(async ({ data }) => {
    if (!data.email && !data.phone) {
      throw new Error("Provide email or phone");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leads").insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      service: data.service,
      language: data.language,
      consent: data.consent,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
