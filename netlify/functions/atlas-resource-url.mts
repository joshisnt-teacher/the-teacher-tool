/**
 * atlas-resource-url.mts
 *
 * POST /api/atlas-resource-url
 *
 * Called by Pulse's own browser UI with the teacher's Pulse session
 * token. Verifies that session locally, then calls Atlas's
 * pulse-resource-url endpoint server-to-server with the shared
 * ATLAS_TO_PULSE_API_KEY secret to fetch a fresh signed URL for a
 * file resource.
 */

import { createClient } from "@supabase/supabase-js";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return json(401, { error: "unauthorized", message: "Missing Bearer token" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return json(500, { error: "server_error", message: "Missing Supabase env vars" });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return json(401, { error: "unauthorized", message: "Invalid or expired token" });
  }

  let body: { resource_id?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_request", message: "Invalid JSON" });
  }

  if (!body.resource_id) {
    return json(400, { error: "invalid_request", message: "resource_id is required" });
  }

  const ATLAS_BASE_URL = process.env.ATLAS_BASE_URL ?? "https://atlas.edufied.com.au";
  const ATLAS_TO_PULSE_API_KEY = process.env.ATLAS_TO_PULSE_API_KEY;
  if (!ATLAS_TO_PULSE_API_KEY) {
    return json(500, { error: "server_error", message: "ATLAS_TO_PULSE_API_KEY not set" });
  }

  const atlasResponse = await fetch(`${ATLAS_BASE_URL}/api/pulse-resource-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ATLAS_TO_PULSE_API_KEY}`,
    },
    body: JSON.stringify({ resource_id: body.resource_id }),
  });

  const atlasData = await atlasResponse.json();
  return json(atlasResponse.status, atlasData);
};
