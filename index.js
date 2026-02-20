import { cleanStudentNotes } from "./services/openaiService.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (path === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean notes endpoint
    if (path === "/api/clean-notes" && method === "POST") {
      try {
        const body = await request.json();
        const { notes } = body;

        if (!notes || typeof notes !== "string") {
          return new Response(
            JSON.stringify({
              error: "Please send notes as text in the request body.",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Pass environment variables to the service
        const cleanedResult = await cleanStudentNotes(notes, env);

        return new Response(JSON.stringify(cleanedResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("AI route error:", error);
        return new Response(
          JSON.stringify({
            error: "Could not clean notes right now. Please try again.",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // 404
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
