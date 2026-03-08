import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY")!;

    // Verify webhook signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSig) {
      return new Response("Invalid signature", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const event = JSON.parse(body);

    if (event.event !== "charge.success") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { reference, metadata } = event.data;
    const userId = metadata?.user_id;
    const classTagId = metadata?.class_tag_id;

    if (!userId || !classTagId) {
      return new Response("Missing metadata", { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Grant access
    const { error } = await adminClient.from("class_access").upsert(
      {
        user_id: userId,
        class_tag_id: classTagId,
        payment_reference: reference,
      },
      { onConflict: "user_id,class_tag_id" }
    );

    if (error) {
      console.error("Insert error:", error);
      return new Response("DB error", { status: 500, headers: corsHeaders });
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
