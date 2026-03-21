import { createClient } from '@supabase/supabase-js';

// Configuration
const cloudClient = createClient(
  'https://aogorchudxilnkhtfvqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQxMzMxNywiZXhwIjoyMDcyOTg5MzE3fQ.pL1-TBMlFmnIo1NNaSkdL1X6WzD2of3FjZVMBrI-0QA'
);

const localClient = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

// Tables that failed to sync
const FAILED_TABLES = [
  'content_item',
  'users', 
  'students',
  'content_item_tag',
  'class_content_item',
  'class_sessions',
  'dashboard_layouts',
  'dashboard_widgets',
  'results',
  'question_results',
  'student_notes'
];

function logStep(message) {
  console.log(`\n🔍 ${message}`);
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

async function testTableInsert(tableName) {
  logStep(`Diagnosing sync issues for: ${tableName}`);
  
  try {
    // Get a sample record from cloud
    const { data: cloudData, error: cloudError } = await cloudClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (cloudError) {
      logError(`Cloud error for ${tableName}: ${cloudError.message}`);
      return;
    }
    
    if (!cloudData || cloudData.length === 0) {
      logWarning(`No data in cloud ${tableName}`);
      return;
    }
    
    const sampleRecord = cloudData[0];
    console.log(`📋 Sample cloud record structure:`);
    Object.entries(sampleRecord).forEach(([key, value]) => {
      const type = value === null ? 'null' : typeof value;
      console.log(`  ${key}: ${type} = ${JSON.stringify(value)}`);
    });
    
    // Try to insert this record into local
    console.log(`\n🧪 Testing insert into local ${tableName}...`);
    const { error: insertError } = await localClient
      .from(tableName)
      .insert([sampleRecord]);
    
    if (insertError) {
      logError(`Insert failed: ${insertError.message}`);
      
      // Analyze the error
      if (insertError.message.includes('foreign key constraint')) {
        const fkMatch = insertError.message.match(/violates foreign key constraint "([^"]+)"/);
        if (fkMatch) {
          console.log(`  🔗 Foreign key issue: ${fkMatch[1]}`);
          console.log(`  💡 This table depends on data in another table that hasn't synced yet`);
        }
      } else if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        const colMatch = insertError.message.match(/column "([^"]+)" of relation "([^"]+)" does not exist/);
        if (colMatch) {
          console.log(`  📊 Schema issue: Column "${colMatch[1]}" missing in local table`);
          console.log(`  💡 Local table schema is different from cloud`);
        }
      } else if (insertError.message.includes('schema cache')) {
        console.log(`  📊 Schema cache issue - likely column mismatch`);
        console.log(`  💡 Local and cloud table structures differ`);
      } else {
        console.log(`  🤔 Other issue: ${insertError.message}`);
      }
    } else {
      logSuccess(`Insert test passed - this table should sync fine`);
      
      // Clean up test record
      await localClient
        .from(tableName)
        .delete()
        .eq('id', sampleRecord.id);
    }
    
  } catch (error) {
    logError(`Failed to diagnose ${tableName}: ${error.message}`);
  }
}

async function checkTableExists(client, tableName, clientType) {
  try {
    const { error } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return { exists: false, error: `Table ${tableName} doesn't exist in ${clientType}` };
      }
      return { exists: true, error: error.message };
    }
    
    return { exists: true };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function main() {
  console.log('🔍 Sync Issue Diagnostic Tool\n');
  console.log('This will help identify why specific tables failed to sync.\n');
  
  // First check if all tables exist
  logStep('Checking table existence...');
  for (const tableName of FAILED_TABLES) {
    const cloudCheck = await checkTableExists(cloudClient, tableName, 'cloud');
    const localCheck = await checkTableExists(localClient, tableName, 'local');
    
    console.log(`\n📋 ${tableName}:`);
    console.log(`  Cloud: ${cloudCheck.exists ? '✅ exists' : '❌ missing'} ${cloudCheck.error || ''}`);
    console.log(`  Local: ${localCheck.exists ? '✅ exists' : '❌ missing'} ${localCheck.error || ''}`);
    
    if (!cloudCheck.exists || !localCheck.exists) {
      if (!localCheck.exists) {
        console.log(`  💡 ACTION: Create ${tableName} table in local database`);
      }
      continue;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  logStep('Testing actual sync issues...');
  
  // Test insert issues for existing tables
  for (const tableName of FAILED_TABLES.slice(0, 3)) { // Test first 3 to avoid spam
    await testTableInsert(tableName);
    console.log('\n' + '-'.repeat(60));
  }
  
  console.log('\n📋 SUMMARY & NEXT STEPS:');
  console.log('1. ❌ Missing tables: Create them using Supabase migrations');
  console.log('2. 🔗 Foreign key errors: Sync dependency tables first');
  console.log('3. 📊 Schema mismatches: Update local schema to match cloud');
  console.log('4. 🧪 Test specific tables: Run this script with individual tables');
  console.log('\n💡 Most common fixes:');
  console.log('   - Run: npx supabase db pull --local (to get latest schema)');
  console.log('   - Or: npx supabase db reset --local (fresh start)');
  console.log('   - Then: node sync-data.js (to retry sync)');
}

main().catch(console.error);
