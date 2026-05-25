// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export const CUSTOMER_AUTH_URL =
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-auth`;

export const CUSTOMER_CHECK_URL =
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-check`;
