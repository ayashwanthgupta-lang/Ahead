#!/usr/bin/env node
/**
 * AHEAD — Database Connection Tester
 * ====================================
 * Verifies that your Supabase credentials are correct and the schema
 * has been successfully applied, before starting the backend server.
 *
 * Usage:
 *   node scripts/verify-db.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// Load env
function loadEnv() {
  const candidates = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', 'backend', '.env'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const lines = fs.readFileSync(candidate, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
      break;
    }
  }
}

function requireSupabase() {
  const candidates = [
    path.resolve(__dirname, '..', 'node_modules', '@supabase', 'supabase-js'),
    path.resolve(__dirname, '..', 'backend', 'node_modules', '@supabase', 'supabase-js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return require(c);
  }
  console.error('❌  @supabase/supabase-js not found. Run: cd backend && npm install');
  process.exit(1);
}

async function verify() {
  console.log('\n════════════════════════════════════════════');
  console.log('  AHEAD — Database Verification');
  console.log('════════════════════════════════════════════\n');

  loadEnv();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
  }

  const { createClient } = requireSupabase();
  const supabase = createClient(url, key);

  const checks = [
    { name: 'profiles table',                 query: () => supabase.from('profiles').select('id').limit(1) },
    { name: 'services table',                 query: () => supabase.from('services').select('id').limit(1) },
    { name: 'appointment_slots table',        query: () => supabase.from('appointment_slots').select('id').limit(1) },
    { name: 'appointments table',             query: () => supabase.from('appointments').select('id').limit(1) },
    { name: 'visit_guides table',             query: () => supabase.from('visit_guides').select('id').limit(1) },
    { name: 'communication_messages table',   query: () => supabase.from('communication_messages').select('id').limit(1) },
    { name: 'accessibility_preferences table',query: () => supabase.from('accessibility_preferences').select('id').limit(1) },
    { name: 'service_feedback table',         query: () => supabase.from('service_feedback').select('id').limit(1) },
    { name: 'audit_events table',             query: () => supabase.from('audit_events').select('id').limit(1) },
    { name: 'demo services seeded',           query: () => supabase.from('services').select('id').eq('is_active', true) },
    { name: 'predefined messages seeded',     query: () => supabase.from('communication_messages').select('id').eq('is_predefined', true) },
    { name: 'demo slots seeded',              query: () => supabase.from('appointment_slots').select('id') },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const { data, error } = await check.query();
      if (error) throw new Error(error.message);
      const count = Array.isArray(data) ? data.length : '?';
      console.log(`  ✓ ${check.name.padEnd(38)} (${count} row(s))`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${check.name.padEnd(38)} — ${err.message}`);
      failed++;
    }
  }

  console.log('\n════════════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);

  if (failed === 0) {
    console.log('  ✅ Database is ready. You can start the backend.\n');
  } else {
    console.log('  ⚠️  Some checks failed. Run: node scripts/migrate.js --seed\n');
    process.exit(1);
  }
}

verify().catch(err => {
  console.error('❌  Unexpected error:', err.message || err);
  process.exit(1);
});

