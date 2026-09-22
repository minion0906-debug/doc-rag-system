import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dklgzlkrykmbwkudkexl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbGd6bGtyeWttYndrdWRrZXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNjY3MDMsImV4cCI6MjEwMjg0MjcwM30.03l4C3UTr1IQ2fuqu5RoplstWqiLfPXIAjSaryGNFQg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getAuthToken(): Promise<string | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    } catch (err) {
        console.error("Error retrieving Supabase auth token:", err);
        return null;
    }
}

export async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (err) {
        console.error("Error retrieving Supabase user:", err);
        return null;
    }
}

export async function signOutUser() {
    try {
        await supabase.auth.signOut();
    } catch (err) {
        console.error("Error signing out:", err);
    }
}
