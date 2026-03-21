import { createClient } from '@supabase/supabase-js';

const cloudClient = createClient(
  'https://aogorchudxilnkhtfvqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQxMzMxNywiZXhwIjoyMDcyOTg5MzE3fQ.pL1-TBMlFmnIo1NNaSkdL1X6WzD2of3FjZVMBrI-0QA'
);

const localClient = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

// All tables we're trying to sync (same order as sync-data.js)
const ALL_TABLES = [
  // Core reference tables (no dependencies)
  'schools',
  'curriculum',
  'tag',
  
  // Tables that depend on core tables
  'strand',           // depends on curriculum
  'achievement_standard',
  'content_item',     // depends on strand (which depends on curriculum)
  
  // User and class related tables
  'users',           // may have self-referencing or other constraints
  'students',        // depends on schools
  'classes',         // depends on schools
  'enrolments',      // depends on students and classes
  
  // Content relationships
  'content_item_tag', // depends on content_item and tag
  
  // Class content and sessions
  'class_content_item', // depends on classes and content_item
  'class_sessions',     // depends on classes
  'tasks',             // depends on class_sessions or content
  'questions',         // depends on tasks or content
  
  // Dashboard (depends on users/classes)
  'dashboard_layouts',  // depends on users (teachers)
  'dashboard_widgets',  // depends on dashboard_layouts
  
  // Results and responses (depend on students, questions, tasks)
  'results',           // depends on students and tasks
  'question_results',  // depends on students and questions
  'student_responses', // depends on students and questions
  'student_notes'      // depends on students
];

async function getTableCount(client, tableName) {
  try {
    const { count, error } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return { error: error.message };
    }
    
    return { count: count || 0 };
  } catch (err) {
    return { error: err.message };
  }
}

async function getSampleData(client, tableName, limit = 3) {
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .limit(limit);
    
    if (error) {
      return { error: error.message };
    }
    
    return { data: data || [] };
  } catch (err) {
    return { error: err.message };
  }
}

async function verifySync() {
  console.log('🔍 Verifying database sync for ALL tables...\n');
  
  let syncedTables = [];
  let failedTables = [];
  let totalCloudRecords = 0;
  let totalLocalRecords = 0;
  
  for (const tableName of ALL_TABLES) {
    console.log(`📊 Checking ${tableName}:`);
    
    const cloudResult = await getTableCount(cloudClient, tableName);
    const localResult = await getTableCount(localClient, tableName);
    
    if (cloudResult.error) {
      console.log(`  ❌ Cloud error: ${cloudResult.error}`);
      allSynced = false;
      continue;
    }
    
    if (localResult.error) {
      console.log(`  ❌ Local error: ${localResult.error}`);
      allSynced = false;
      continue;
    }
    
    console.log(`  Cloud: ${cloudResult.count} records`);
    console.log(`  Local: ${localResult.count} records`);
    
    totalCloudRecords += cloudResult.count;
    totalLocalRecords += localResult.count;
    
    if (cloudResult.count === localResult.count) {
      console.log(`  ✅ Synced (${cloudResult.count} records)`);
      syncedTables.push({ name: tableName, count: cloudResult.count });
      
      // Show sample data for tables with data (but limit output)
      if (cloudResult.count > 0 && cloudResult.count <= 50) {
        const sampleResult = await getSampleData(localClient, tableName, 1);
        if (sampleResult.data && sampleResult.data.length > 0) {
          console.log(`  📝 Sample: ${JSON.stringify(sampleResult.data[0]).substring(0, 100)}...`);
        }
      }
    } else {
      console.log(`  ⚠️  Count mismatch!`);
      failedTables.push({ 
        name: tableName, 
        cloudCount: cloudResult.count, 
        localCount: localResult.count 
      });
    }
    
    console.log('');
  }
  
  console.log('\n📊 SYNC VERIFICATION SUMMARY:');
  console.log(`Total tables checked: ${ALL_TABLES.length}`);
  console.log(`Successfully synced: ${syncedTables.length}`);
  console.log(`Failed to sync: ${failedTables.length}`);
  console.log(`Total cloud records: ${totalCloudRecords}`);
  console.log(`Total local records: ${totalLocalRecords}`);
  
  if (syncedTables.length > 0) {
    console.log('\n✅ SUCCESSFULLY SYNCED TABLES:');
    syncedTables.forEach(table => {
      console.log(`  - ${table.name}: ${table.count} records`);
    });
  }
  
  if (failedTables.length > 0) {
    console.log('\n❌ TABLES WITH SYNC ISSUES:');
    failedTables.forEach(table => {
      console.log(`  - ${table.name}: Cloud(${table.cloudCount}) vs Local(${table.localCount})`);
    });
    
    console.log('\n💡 NEXT STEPS FOR FAILED TABLES:');
    console.log('1. Run "node check-schema-differences.js" to identify schema mismatches');
    console.log('2. Fix schema differences in your local database');
    console.log('3. Run "node sync-data.js" to retry syncing');
    console.log('4. Run this verification again');
  }
  
  if (failedTables.length === 0) {
    console.log('\n🎉 SUCCESS: All tables are synchronized!');
    console.log('✅ Your local and cloud databases are now mirroring each other!');
  } else {
    console.log(`\n⚠️  ${failedTables.length} tables still need attention`);
    console.log('💡 This is likely due to schema differences or foreign key constraints');
  }
}

verifySync().catch(console.error);
