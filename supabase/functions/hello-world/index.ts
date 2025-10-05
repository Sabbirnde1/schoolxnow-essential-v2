// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server

// Note: This is a Deno-specific import and will only work in the Supabase Edge Functions environment.
// For local development with VS Code, you will see TypeScript errors, but these can be ignored
// as the code will run correctly in the Supabase Edge Functions Deno runtime.
// @ts-ignore: Deno-specific import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore: Import will work in Deno
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  name?: string;
}

interface ResponseData {
  message: string;
  timestamp: string;
  success: boolean;
}

// We need to use 'any' here since the Deno Request type is not available in the TS config
serve(async (req: any) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the request body as our RequestBody interface
    const { name } = await req.json() as RequestBody;
    
    const data: ResponseData = {
      message: `Hello ${name || 'World'}!`,
      timestamp: new Date().toISOString(),
      success: true
    };

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    // Cast to any to access .message property safely
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    );
  }
});