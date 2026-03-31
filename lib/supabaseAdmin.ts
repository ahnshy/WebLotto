import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

if (!url) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!serviceKey) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE is not set');
}

export const supabaseAdmin = createClient(
    url || 'https://placeholder.supabase.co',
    serviceKey || 'placeholder-key',
    {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
            headers: {
                'x-my-custom-header': 'my-app'
            }
        }
    }
);
