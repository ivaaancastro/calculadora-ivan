// Supabase Edge Function: intervals-proxy
// Proxies requests to Intervals.icu API server-side to bypass CORS
// Deploy with: supabase functions deploy intervals-proxy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validate user via Supabase Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const { endpoint, athleteId, apiKey, params = {} } = await req.json();

    if (!endpoint || !athleteId || !apiKey) {
      return new Response(JSON.stringify({ error: "Missing endpoint, athleteId or apiKey" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Build Intervals.icu URL
    const BASE = "https://intervals.icu/api/v1";
    const queryString = new URLSearchParams(params).toString();
    let url = "";

    switch (endpoint) {
      case "wellness":
        url = `${BASE}/athlete/${athleteId}/wellness${queryString ? "?" + queryString : ""}`;
        break;
      case "athlete":
        url = `${BASE}/athlete/${athleteId}`;
        break;
      case "activities":
        url = `${BASE}/athlete/${athleteId}/activities${queryString ? "?" + queryString : ""}`;
        break;
      default:
        // Generic passthrough - allow any valid endpoint path under athlete/{id}
        url = `${BASE}/athlete/${athleteId}/${endpoint}${queryString ? "?" + queryString : ""}`;
    }

    // 4. Call Intervals.icu with Basic Auth
    const authBasic = `Basic ${btoa(`API_KEY:${apiKey}`)}`;
    const icuRes = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": authBasic,
        "Accept": "application/json",
      },
    });

    const data = await icuRes.json();

    if (!icuRes.ok) {
      return new Response(JSON.stringify({ error: `Intervals.icu error ${icuRes.status}`, detail: data }), {
        status: icuRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("intervals-proxy error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
