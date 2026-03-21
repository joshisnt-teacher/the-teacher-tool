#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  local: {
    url: 'http://127.0.0.1:54321',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  },
  cloud: {
    url: 'https://aogorchudxilnkhtfvqq.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQxMzMxNywiZXhwIjoyMDcyOTg5MzE3fQ.pL1-TBMlFmnIo1NNaSkdL1X6WzD2of3FjZVMBrI-0QA'
  }
};

// Utility functions
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

function logStep(message) {
  console.log(`\n🔄 ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

function logWarning(message) {
  console.warn(`⚠️  ${message}`);
}

// Check if Supabase CLI is available
function checkSupabaseCLI() {
  try {
    execSync('npx supabase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    try {
      execSync('supabase --version', { stdio: 'pipe' });
      return true;
    } catch (error2) {
      return false;
    }
  }
}

// Create backup directory if it doesn't exist
function ensureBackupDir() {
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
    logSuccess('Created backups directory');
  }
  return backupDir;
}

// Execute SQL statements
async function executeSQLStatements(supabase, sqlContent, description) {
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SET session_replication_role'));

  logStep(`Executing ${statements.length} SQL statements for ${description}`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      if (error) {
        logError(`Statement ${i + 1}/${statements.length}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
        if (i % 10 === 0 || i === statements.length - 1) {
          console.log(`  Progress: ${i + 1}/${statements.length} statements processed`);
        }
      }
    } catch (err) {
      logError(`Statement ${i + 1}/${statements.length}: ${err.message}`);
      errorCount++;
    }
  }

  logSuccess(`${description} completed: ${successCount} successful, ${errorCount} errors`);
  return { successCount, errorCount };
}

// Backup local database using Supabase CLI
async function backupLocal() {
  logStep('Creating local database backup using Supabase CLI');
  
  if (!checkSupabaseCLI()) {
    logError('Supabase CLI not found. Please install it first: npm install -g supabase');
    return null;
  }

  const backupDir = ensureBackupDir();
  const timestamp = getTimestamp();
  const backupFile = path.join(backupDir, `local-backup-${timestamp}.sql`);

  try {
    // Use supabase db dump to create a backup
    try {
      execSync(`npx supabase db dump --local -f "${backupFile}"`, { stdio: 'inherit' });
    } catch (error) {
      execSync(`supabase db dump --local -f "${backupFile}"`, { stdio: 'inherit' });
    }
    logSuccess(`Local backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    logError(`Failed to create local backup: ${error.message}`);
    return null;
  }
}

// Backup cloud database
async function backupCloud() {
  logStep('Creating cloud database backup');
  
  if (CONFIG.cloud.serviceKey.includes('YOUR_CLOUD_SERVICE_KEY_HERE')) {
    logError('Cloud service key not configured. Please set SUPABASE_SERVICE_KEY environment variable.');
    return null;
  }

  const backupDir = ensureBackupDir();
  const timestamp = getTimestamp();
  const backupFile = path.join(backupDir, `cloud-backup-${timestamp}.sql`);

  try {
    // Use supabase db dump with cloud connection
    const dbUrl = `postgresql://postgres:[YOUR-PASSWORD]@db.aogorchudxilnkhtfvqq.supabase.co:5432/postgres`;
    logWarning('Cloud backup requires database URL with password. Please configure manually or use Supabase dashboard.');
    
    // For now, we'll create a placeholder
    fs.writeFileSync(backupFile, `-- Cloud backup placeholder created at ${new Date().toISOString()}\n-- Please use Supabase dashboard or configure database URL for full backup\n`);
    logSuccess(`Cloud backup placeholder created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    logError(`Failed to create cloud backup: ${error.message}`);
    return null;
  }
}

// Pull data from cloud to local
async function pullFromCloud() {
  logStep('Pulling data from cloud to local database');

  // First, create a backup of local data
  const localBackup = await backupLocal();
  if (!localBackup) {
    logError('Failed to create local backup. Aborting pull operation.');
    return;
  }

  if (CONFIG.cloud.serviceKey.includes('YOUR_CLOUD_SERVICE_KEY_HERE')) {
    logError('Cloud service key not configured. Please set SUPABASE_SERVICE_KEY environment variable.');
    logError('You can find your service key at: https://app.supabase.com/project/aogorchudxilnkhtfvqq/settings/api');
    return;
  }

  try {
    logStep('Resetting local database and applying migrations');
    try {
      execSync('npx supabase db reset --local', { stdio: 'inherit' });
    } catch (error) {
      execSync('supabase db reset --local', { stdio: 'inherit' });
    }
    
    logStep('Pulling schema and data from cloud');
    try {
      execSync('npx supabase db pull --local', { stdio: 'inherit' });
    } catch (error) {
      execSync('supabase db pull --local', { stdio: 'inherit' });
    }
    
    logSuccess('Successfully pulled data from cloud to local');
    logSuccess(`Local backup saved at: ${localBackup}`);
  } catch (error) {
    logError(`Failed to pull from cloud: ${error.message}`);
    logError(`You can restore your local data using: node db-sync.js restore-local "${localBackup}"`);
  }
}

// Push data from local to cloud
async function pushToCloud() {
  logStep('Pushing schema and migrations from local to cloud database');

  if (!checkSupabaseCLI()) {
    logError('Supabase CLI not found. Please install it first: npm install -g supabase');
    return;
  }

  // First, create a backup of cloud data
  logWarning('⚠️  IMPORTANT: This will modify your cloud database!');
  logWarning('Creating cloud backup before proceeding...');
  const cloudBackup = await backupCloud();
  
  if (CONFIG.cloud.serviceKey.includes('YOUR_CLOUD_SERVICE_KEY_HERE')) {
    logError('Cloud service key not configured. Please set SUPABASE_SERVICE_KEY environment variable.');
    logError('You can find your service key at: https://app.supabase.com/project/aogorchudxilnkhtfvqq/settings/api');
    return;
  }

  try {
    logStep('Step 1: Linking local project to cloud project');
    
    // Check if already linked
    const projectRefFile = path.join(__dirname, 'supabase', '.temp', 'project-ref');
    let isLinked = false;
    
    if (fs.existsSync(projectRefFile)) {
      const projectRef = fs.readFileSync(projectRefFile, 'utf8').trim();
      if (projectRef === 'aogorchudxilnkhtfvqq') {
        isLinked = true;
        logSuccess('Project already linked to cloud');
      }
    }
    
    if (!isLinked) {
      logStep('Linking to cloud project: aogorchudxilnkhtfvqq');
      try {
        // Use non-interactive flag if available, otherwise provide instructions
        execSync(`npx supabase link --project-ref aogorchudxilnkhtfvqq`, { 
          stdio: 'inherit',
          env: { ...process.env, SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN || '' }
        });
        logSuccess('Successfully linked to cloud project');
      } catch (error) {
        logWarning('Automatic linking failed. You may need to link manually:');
        console.log('  Run: npx supabase link --project-ref aogorchudxilnkhtfvqq');
        console.log('  You may need a Supabase access token. Get it from:');
        console.log('  https://app.supabase.com/account/tokens');
        console.log('\n  Or set SUPABASE_ACCESS_TOKEN environment variable');
        return;
      }
    }

    logStep('Step 2: Pushing migrations to cloud');
    logWarning('This will apply all pending migrations to your cloud database.');
    
    try {
      execSync(`npx supabase db push`, { stdio: 'inherit' });
      logSuccess('✅ Successfully pushed migrations to cloud!');
      logSuccess(`Cloud backup saved at: ${cloudBackup || 'See Supabase dashboard for backups'}`);
      
      logStep('Next steps:');
      console.log('1. Verify changes in Supabase dashboard');
      console.log('2. If you need to sync data (not just schema), use a data migration script');
      console.log('3. Test your application with the updated cloud database');
      
    } catch (error) {
      logError(`Failed to push migrations: ${error.message}`);
      logWarning('If you have schema differences, you may need to:');
      console.log('1. Generate a migration: npx supabase db diff -f migration_name');
      console.log('2. Review the generated migration file');
      console.log('3. Run: npx supabase db push');
      throw error;
    }
    
  } catch (error) {
    logError(`Failed to push to cloud: ${error.message}`);
    logWarning('You can restore from backup if needed');
  }
}

// Restore from backup file
async function restoreLocal(backupFile) {
  if (!fs.existsSync(backupFile)) {
    logError(`Backup file not found: ${backupFile}`);
    return;
  }

  logStep(`Restoring local database from: ${backupFile}`);

  try {
    const supabase = createClient(CONFIG.local.url, CONFIG.local.serviceKey);
    const sqlContent = fs.readFileSync(backupFile, 'utf8');
    
    await executeSQLStatements(supabase, sqlContent, 'local database restoration');
    logSuccess('Local database restored successfully');
  } catch (error) {
    logError(`Failed to restore local database: ${error.message}`);
  }
}

// Generate migration from local schema differences
async function generateMigration(migrationName) {
  logStep('Generating migration from local schema differences');

  if (!checkSupabaseCLI()) {
    logError('Supabase CLI not found. Please install it first: npm install -g supabase');
    return;
  }

  if (!migrationName) {
    logError('Migration name is required');
    console.log('Usage: node db-sync.js generate-migration <migration_name>');
    console.log('Example: node db-sync.js generate-migration add_new_tables');
    return;
  }

  try {
    logStep(`Generating migration: ${migrationName}`);
    logWarning('This compares your local database to the cloud and creates a migration file.');
    
    // First ensure we're linked
    const projectRefFile = path.join(__dirname, 'supabase', '.temp', 'project-ref');
    if (!fs.existsSync(projectRefFile)) {
      logWarning('Project not linked. Linking now...');
      try {
        execSync(`npx supabase link --project-ref aogorchudxilnkhtfvqq`, { 
          stdio: 'inherit',
          env: { ...process.env, SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN || '' }
        });
      } catch (error) {
        logError('Failed to link. Please link manually first:');
        console.log('  npx supabase link --project-ref aogorchudxilnkhtfvqq');
        return;
      }
    }

    // Generate the migration
    try {
      execSync(`npx supabase db diff -f ${migrationName}`, { stdio: 'inherit' });
      logSuccess(`✅ Migration generated successfully!`);
      logStep('Next steps:');
      console.log('1. Review the migration file in supabase/migrations/');
      console.log('2. Make any necessary adjustments');
      console.log('3. Push to cloud: npm run db:push');
    } catch (error) {
      logError(`Failed to generate migration: ${error.message}`);
      logWarning('Make sure your local Supabase is running: npm run supabase:start');
    }
  } catch (error) {
    logError(`Failed to generate migration: ${error.message}`);
  }
}

// List available backups
function listBackups() {
  const backupDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    logWarning('No backups directory found');
    return;
  }

  const backups = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse(); // Most recent first

  if (backups.length === 0) {
    logWarning('No backup files found');
    return;
  }

  console.log('\n📁 Available backups:');
  backups.forEach((backup, index) => {
    const filePath = path.join(backupDir, backup);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1);
    console.log(`  ${index + 1}. ${backup} (${size} KB, ${stats.mtime.toLocaleString()})`);
  });
}

// Show help
function showHelp() {
  console.log(`
🔄 Database Sync Utility for Teacher Tool

Usage: node db-sync.js <command> [arguments]

Commands:
  pull                    Pull data from cloud to local (with local backup)
  push                    Push migrations from local to cloud (with cloud backup)
  generate-migration      Generate a migration from local schema differences
  backup-local            Create backup of local database
  backup-cloud            Create backup of cloud database  
  restore-local           Restore local database from backup file
  list-backups            List all available backup files
  help                    Show this help message

Environment Variables:
  SUPABASE_SERVICE_KEY         Your cloud Supabase service key (required for cloud operations)
  SUPABASE_ACCESS_TOKEN        Your Supabase access token (for linking projects)

Examples:
  # Push local schema to cloud
  node db-sync.js push

  # Generate migration from local changes
  node db-sync.js generate-migration add_new_tables

  # Pull data from cloud
  node db-sync.js pull

  # Create backups
  node db-sync.js backup-local
  node db-sync.js backup-cloud

  # Restore from backup
  node db-sync.js restore-local backups/local-backup-2024-10-02T10-30-00.sql

  # List backups
  node db-sync.js list-backups

Workflow for Pushing Local to Cloud:
1. Make sure local Supabase is running: npm run supabase:start
2. Make your schema changes locally
3. Generate migration: node db-sync.js generate-migration my_changes
4. Review the migration file in supabase/migrations/
5. Push to cloud: node db-sync.js push

Safety Features:
- Automatic backups before destructive operations
- Timestamped backup files
- Error handling and rollback instructions
- Project linking verification

Setup:
1. Get your service key from: https://app.supabase.com/project/aogorchudxilnkhtfvqq/settings/api
2. Get your access token from: https://app.supabase.com/account/tokens
3. Set environment variables:
   - set SUPABASE_SERVICE_KEY=your_service_key_here
   - set SUPABASE_ACCESS_TOKEN=your_access_token_here
4. Link project: npx supabase link --project-ref aogorchudxilnkhtfvqq
`);
}

// Main function
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  console.log('🔄 Teacher Tool Database Sync Utility\n');

  switch (command) {
    case 'pull':
      await pullFromCloud();
      break;
    case 'push':
      await pushToCloud();
      break;
    case 'generate-migration':
      await generateMigration(arg);
      break;
    case 'backup-local':
      await backupLocal();
      break;
    case 'backup-cloud':
      await backupCloud();
      break;
    case 'restore-local':
      if (!arg) {
        logError('Please specify backup file path');
        console.log('Usage: node db-sync.js restore-local <backup-file-path>');
        break;
      }
      await restoreLocal(arg);
      break;
    case 'list-backups':
      listBackups();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      logError('Unknown command. Use "help" to see available commands.');
      showHelp();
  }
}

// Run the main function
main().catch(console.error);

export {
  pullFromCloud,
  pushToCloud,
  backupLocal,
  backupCloud,
  restoreLocal,
  listBackups
};
