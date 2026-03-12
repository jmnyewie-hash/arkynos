import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const email = claimsData.claims.email;

    const { callback_url } = await req.json();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get active semester
    const { data: activeSemester } = await adminClient
      .from("semesters")
      .select("id, semester_name")
      .eq("is_active", true)
      .maybeSingle();

    if (!activeSemester) {
      return new Response(JSON.stringify({ error: "No active semester" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already premium for this semester
    const { data: profile } = await adminClient
      .from("profiles")
      .select("subscription_tier, paid_semester_id")
      .eq("user_id", userId)
      .single();

    if (profile?.subscription_tier === "founder") {
      return new Response(JSON.stringify({ error: "Founders already have unlimited access" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile?.subscription_tier === "premium" && profile?.paid_semester_id === activeSemester.id) {
      return new Response(JSON.stringify({ error: "Already premium for this semester" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reference = `sem_${activeSemester.id}_${userId}_${Date.now()}`;
    const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

    // Initialize Paystack - 2 GHS = 200 pesewas
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: 200, // 2 GHS in pesewas
        currency: "GHS",
        reference,
        callback_url: callback_url || "",
        metadata: {
          user_id: userId,
          semester_id: activeSemester.id,
          payment_type: "semester_premium",
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return new Response(JSON.stringify({ error: paystackData.message || "Payment init failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log pending payment
    await adminClient.from("payment_logs").insert({
      user_id: userId,
      payment_type: "semester_premium",
      amount_pesewas: 200,
      reference,
      status: "pending",
      metadata: { semester_id: activeSemester.id, semester_name: activeSemester.semester_name },
    });

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
