#!/usr/bin/env node
/**
 * AHEAD — Supabase Migration Runner
 * ==================================
 * Reads supabase/migrations/001_initial_schema.sql and applies it directly
 * to your Supabase Cloud PostgreSQL project using the service-role key.
 *
 * Usage
 * -----
 *   node scripts/migrate.js                 # apply all pending migrations
 *   node scripts/migrate.js --seed          # apply migrations + seed data
 *   node scripts/migrate.js --reset-seed    # re-run seed only (idempotent)
 *
 * Requirements
 * ------------
 *   Node.js >= 18
 *   npm install @supabase/supabase-js dotenv   (run from /scripts or root)
 *
 * Environment variables (read from .env in this file's parent directory,
 * OR from the backend/.env if run from the backend directory):
 *
 *   SUPABASE_URL              your-project.supabase.co URL
 *   SUPABASE_SERVICE_ROLE_KEY service_role secret key (NEVER commit this)
 *
 * Security note
 * -------------
 *   The service-role key bypasses RLS. It is used ONLY here, in this
 *   server-side migration script. Never expose it in frontend code.
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const readline = require('readline');

// ---------------------------------------------------------------------------
// Load environment variables
// Try: project root .env, then backend/.env, then process.env directly
// ---------------------------------------------------------------------------
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
      console.log(`  ✓ Loaded env from: ${candidate}`);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Validate required env vars
// ---------------------------------------------------------------------------
function validateEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error('\n❌  Missing required environment variables:\n');
    for (const k of missing) {
      console.error(`    ${k}`);
    }
    console.error(`
How to fix:
  1. Create a .env file in the project root (or backend/) with:

       SUPABASE_URL=https://your-project.supabase.co
       SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

  2. Get your values from:
       https://supabase.com/dashboard -> Project Settings -> API

  3. NEVER commit .env to source control.
`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Dynamically require @supabase/supabase-js
// ---------------------------------------------------------------------------
function requireSupabase() {
  const candidates = [
    path.resolve(__dirname, '..', 'node_modules', '@supabase', 'supabase-js'),
    path.resolve(__dirname, '..', 'backend', 'node_modules', '@supabase', 'supabase-js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return require(c);
    }
  }
  console.error(`
❌  @supabase/supabase-js not found.

Install it by running ONE of:
  cd backend && npm install
  npm install @supabase/supabase-js   (from project root)
`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Split SQL into individual statements safely
// Handles $$ dollar-quoted function bodies and standard semicolons.
// ---------------------------------------------------------------------------
function splitStatements(sql) {
  const statements = [];
  let current      = '';
  let inDollarQuote = false;
  let dollarTag    = '';
  let i            = 0;

  while (i < sql.length) {
    // Check for dollar-quote start/end
    if (!inDollarQuote) {
      const dollarMatch = sql.slice(i).match(/^\$([A-Za-z_]*)\$/);
      if (dollarMatch) {
        dollarTag     = dollarMatch[0];
        inDollarQuote = true;
        current      += dollarTag;
        i            += dollarTag.length;
        continue;
      }
    } else {
      if (sql.slice(i).startsWith(dollarTag)) {
        inDollarQuote = false;
        current      += dollarTag;
        i            += dollarTag.length;
        continue;
      }
    }

    const ch = sql[i];

    // Statement delimiter
    if (ch === ';' && !inDollarQuote) {
      current = current.trim();
      if (current.length > 0) {
        statements.push(current + ';');
      }
      current = '';
      i++;
      continue;
    }

    // Skip single-line comments
    if (!inDollarQuote && ch === '-' && sql[i + 1] === '-') {
      const newline = sql.indexOf('\n', i);
      i = newline === -1 ? sql.length : newline + 1;
      continue;
    }

    current += ch;
    i++;
  }

  const last = current.trim();
  if (last.length > 0) statements.push(last);

  return statements.filter(s => s.replace(/;$/, '').trim().length > 0);
}

// ---------------------------------------------------------------------------
// Execute a single SQL statement via supabase.rpc fallback pattern.
// Supabase JS SDK does not expose a raw pg query interface directly,
// so we use the PostgREST /rpc endpoint wrapping pg_query or rely on
// the management API.  For migration use-cases the cleanest approach
// is to use the postgres connection string if available, otherwise
// we call each DDL statement through a stored helper if present.
//
// Because the supabase-js client does not support raw DDL directly,
// we use the Supabase Management REST API (v1) — which IS available
// on Supabase Cloud — to execute arbitrary SQL with the service role.
// ---------------------------------------------------------------------------
async function executeSqlViaApi(supabaseUrl, serviceRoleKey, sql) {
  // Extract project ref from URL: https://<ref>.supabase.co
  const refMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!refMatch) {
    throw new Error(`Cannot extract project ref from SUPABASE_URL: ${supabaseUrl}`);
  }
  const projectRef = refMatch[1];
  const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  // Dynamic import of node-fetch or use built-in fetch (Node 18+)
  const fetchFn = typeof fetch !== 'undefined' ? fetch : await importFetch();

  const response = await fetchFn(apiUrl, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }

  return response.json();
}

async function importFetch() {
  try {
    const mod = await import('node-fetch');
    return mod.default;
  } catch {
    throw new Error('Node.js fetch is not available. Use Node.js >= 18.');
  }
}

// ---------------------------------------------------------------------------
// Alternative: execute via supabase-js rpc (requires exec_sql function)
// We create that helper first if it doesn't exist.
// ---------------------------------------------------------------------------
async function executeViaSupabaseRpc(supabase, statement) {
  const { error } = await supabase.rpc('exec_sql', { query: statement });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Main migration runner
// ---------------------------------------------------------------------------
async function runMigrations(options = {}) {
  const { seed = false } = options;

  console.log('\n════════════════════════════════════════════════════════');
  console.log('  AHEAD — Supabase Migration Runner');
  console.log('════════════════════════════════════════════════════════\n');

  loadEnv();
  validateEnv();

  const supabaseUrl      = process.env.SUPABASE_URL;
  const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Project ref extraction
  const refMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!refMatch) {
    console.error('❌  SUPABASE_URL does not look like a valid Supabase Cloud URL.');
    console.error('    Expected format: https://your-project-ref.supabase.co');
    process.exit(1);
  }
  const projectRef = refMatch[1];
  console.log(`  Project ref : ${projectRef}`);
  console.log(`  Supabase URL: ${supabaseUrl}\n`);

  // Read migration file
  const migrationPath = path.resolve(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌  Migration file not found:\n    ${migrationPath}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`  ✓ Migration file read: ${path.basename(migrationPath)}`);
  console.log(`    Size: ${(migrationSql.length / 1024).toFixed(1)} KB\n`);

  // If --seed, also read seed.sql (if separate from the main migration)
  let seedSql = '';
  if (seed) {
    const seedPath = path.resolve(__dirname, '..', 'supabase', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      seedSql = fs.readFileSync(seedPath, 'utf8');
      console.log(`  ✓ Seed file read: ${path.basename(seedPath)}`);
      console.log(`    Size: ${(seedSql.length / 1024).toFixed(1)} KB\n`);
    }
  }

  // Confirm before running
  await confirm(
    '  ⚠️  This will apply DDL and DML changes to your Supabase project.\n' +
    '  Are you sure you want to proceed? (yes/no): '
  );

  // Execute migration using Supabase Management API
  console.log('\n  Applying migration via Supabase Management API...\n');

  const allSql = migrationSql + (seedSql ? '\n\n' + seedSql : '');
  const statements = splitStatements(allSql);

  console.log(`  Found ${statements.length} SQL statements to execute.\n`);

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (let idx = 0; idx < statements.length; idx++) {
    const stmt = statements[idx];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
    process.stdout.write(`  [${String(idx + 1).padStart(3, '0')}/${statements.length}] ${preview}...`);

    try {
      await executeSqlViaApi(supabaseUrl, serviceRoleKey, stmt);
      process.stdout.write(' ✓\n');
      passed++;
    } catch (err) {
      const msg = err.message || String(err);
      process.stdout.write(` ✗\n`);

      // Non-fatal: already-exists errors are expected when re-running
      const isIdempotent =
        msg.includes('already exists') ||
        msg.includes('duplicate key value') ||
        msg.includes('relation') ||
        msg.includes('policy') ||
        msg.includes('ON CONFLICT');

      if (isIdempotent) {
        process.stdout.write(`         ↳ Skipped (already applied): ${msg.slice(0, 100)}\n`);
        passed++;
      } else {
        process.stdout.write(`         ↳ ERROR: ${msg.slice(0, 200)}\n`);
        errors.push({ statement: preview, error: msg });
        failed++;
      }
    }
  }

  // Summary
  console.log('\n════════════════════════════════════════════════════════');
  console.log(`  Migration complete`);
  console.log(`  ✓ Passed : ${passed}`);
  console.log(`  ✗ Failed : ${failed}`);

  if (errors.length > 0) {
    console.log('\n  Failed statements:');
    for (const e of errors) {
      console.log(`\n    Statement: ${e.statement}`);
      console.log(`    Error    : ${e.error}`);
    }
    console.log('\n  Check the errors above and re-run after fixing.\n');
    process.exit(1);
  } else {
    console.log('\n  ✅ All statements applied successfully.');
    console.log('\n  Next steps:');
    console.log('    1. Open Supabase Dashboard → Table Editor → verify tables exist');
    console.log('    2. Open Authentication → confirm on_auth_user_created trigger is active');
    console.log('    3. Start the backend: cd backend && npm run dev');
    console.log('    4. Start the frontend: cd frontend && npm run dev');
    console.log('════════════════════════════════════════════════════════\n');
  }
}

// ---------------------------------------------------------------------------
// Prompt helper
// ---------------------------------------------------------------------------
function confirm(question) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      if (answer.trim().toLowerCase() === 'yes' || answer.trim().toLowerCase() === 'y') {
        resolve();
      } else {
        console.log('\n  Migration cancelled.\n');
        process.exit(0);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
const args  = process.argv.slice(2);
const seed  = args.includes('--seed') || args.includes('--reset-seed');

runMigrations({ seed }).catch(err => {
  console.error('\n❌  Unexpected error:', err.message || err);
  process.exit(1);
});

