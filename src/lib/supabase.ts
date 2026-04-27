import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Route all REST API calls through our same-origin nginx proxy.
// Mobile and corporate networks in Russia sometimes throttle direct
// connections to Supabase (US). The proxy on the SPb server bypasses this.
// WebSocket realtime still goes direct to Supabase (proxy handles HTTP only).
const proxiedFetch: typeof fetch = (input, init) => {
  let url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
  if (url.startsWith(supabaseUrl)) {
    url = '/api/supabase' + url.slice(supabaseUrl.length);
  }
  return fetch(url, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: proxiedFetch },
});
