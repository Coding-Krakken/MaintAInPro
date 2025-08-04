// Script to find Supabase Auth users missing profiles in the 'users' table
// Usage: node scripts/check-missing-user-profiles.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findMissingProfiles() {
  // Find all profiles with organization_id: null
  const { data: nullOrgProfiles, error: nullOrgError } = await supabase
    .from('users')
    .select('*')
    .is('organization_id', null);
  if (nullOrgError) {
    console.error(
      'Error fetching profiles with null organization_id:',
      nullOrgError.message
    );
    process.exit(1);
  }

  if (nullOrgProfiles.length > 0) {
    console.log(
      `Deleting ${nullOrgProfiles.length} profiles with null organization_id...`
    );
    for (const profile of nullOrgProfiles) {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', profile.id);
      if (deleteError) {
        console.error(
          `Failed to delete profile ${profile.email}:`,
          deleteError.message
        );
      } else {
        console.log(`Deleted profile ${profile.email}`);
      }
    }
    // Re-insert profiles with correct organization_id
    console.log('Re-inserting profiles with correct organization_id...');
    for (const profile of nullOrgProfiles) {
      const now = new Date().toISOString();
      const { error: insertError } = await supabase.from('users').insert({
        id: profile.id,
        organization_id: '164c2cc5-ffca-4982-a5d5-a0790288b078',
        email: profile.email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        role: profile.role || 'user',
        avatar_url: profile.avatar_url || '',
        phone: profile.phone || '',
        department: profile.department || '',
        employee_id: profile.employee_id || '',
        is_active: profile.is_active !== undefined ? profile.is_active : true,
        last_login: profile.last_login || null,
        created_at: now,
        updated_at: now,
      });
      if (insertError) {
        console.error(
          `Failed to insert profile for ${profile.email}:`,
          insertError.message
        );
      } else {
        console.log(`Inserted profile for ${profile.email}`);
      }
    }
    console.log('✅ Profile re-insertion complete.');
  }
  // Get all users from Supabase Auth
  const { data: authUsers, error: authError } =
    await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError.message);
    process.exit(1);
  }

  // Get all user profiles from 'users' table
  const { data: userProfiles, error: profileError } = await supabase
    .from('users')
    .select('id');
  if (profileError) {
    console.error('Error fetching user profiles:', profileError.message);
    process.exit(1);
  }

  const profileIds = new Set(userProfiles.map(u => u.id));
  const missing = authUsers.users.filter(u => !profileIds.has(u.id));

  if (missing.length === 0) {
    console.log('✅ All auth users have profiles in the users table.');
    return;
  }

  console.log('❌ Missing profiles for the following user IDs:');
  for (const u of missing) {
    console.log(`- ${u.id} (${u.email})`);
    // Insert full profile with defaults
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from('users').insert({
      id: u.id,
      organization_id: '164c2cc5-ffca-4982-a5d5-a0790288b078',
      email: u.email,
      first_name: '',
      last_name: '',
      role: 'user', // Default role
      avatar_url: '',
      phone: '',
      department: '',
      employee_id: '',
      is_active: true,
      last_login: null,
      created_at: now,
      updated_at: now,
    });
    if (insertError) {
      console.error(
        `Failed to insert profile for ${u.email}:`,
        insertError.message
      );
    } else {
      console.log(`Inserted profile for ${u.email}`);
    }
  }
  console.log('✅ Profile insertion complete.');
}

findMissingProfiles();
