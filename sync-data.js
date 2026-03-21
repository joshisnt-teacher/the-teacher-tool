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

// Tables to sync (in dependency order - fixed based on foreign key constraints)
const TABLES_TO_SYNC = [
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

async function clearLocalTable(tableName) {
  try {
    const { error } = await localClient
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      logWarning(`Warning clearing ${tableName}: ${error.message}`);
    }
  } catch (err) {
    logWarning(`Warning clearing ${tableName}: ${err.message}`);
  }
}

async function syncTable(tableName) {
  try {
    logStep(`Syncing table: ${tableName}`);
    
    // Get data from cloud
    const { data: cloudData, error: cloudError } = await cloudClient
      .from(tableName)
      .select('*');
    
    if (cloudError) {
      if (cloudError.message.includes('relation') || cloudError.message.includes('does not exist')) {
        logWarning(`Table ${tableName} doesn't exist in cloud, skipping`);
        return;
      }
      throw cloudError;
    }
    
    if (!cloudData || cloudData.length === 0) {
      logWarning(`No data found in cloud table ${tableName}`);
      return;
    }
    
    // Clear local table first
    await clearLocalTable(tableName);
    
    // Insert data into local in batches
    const batchSize = 50; // Reduced batch size for better error handling
    let totalInserted = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < cloudData.length; i += batchSize) {
      const batch = cloudData.slice(i, i + batchSize);
      
      const { error: localError } = await localClient
        .from(tableName)
        .insert(batch);
      
      if (localError) {
        if (localError.message.includes('relation') || localError.message.includes('does not exist')) {
          logWarning(`Table ${tableName} doesn't exist in local, skipping`);
          return;
        }
        
        // Handle specific error types
        if (localError.message.includes('foreign key constraint')) {
          logWarning(`Foreign key constraint error in ${tableName} - may need dependency data first`);
        } else if (localError.message.includes('schema cache') || localError.message.includes('column')) {
          logWarning(`Schema mismatch in ${tableName} - local and cloud schemas may differ`);
        } else {
          logError(`Error inserting batch into ${tableName}: ${localError.message}`);
        }
        totalErrors += batch.length;
      } else {
        totalInserted += batch.length;
      }
    }
    
    if (totalInserted > 0) {
      logSuccess(`Synced ${totalInserted}/${cloudData.length} records for ${tableName}`);
    } else if (totalErrors > 0) {
      logWarning(`Failed to sync ${tableName}: ${totalErrors} records had errors`);
    }
    
  } catch (error) {
    logError(`Failed to sync ${tableName}: ${error.message}`);
  }
}

async function syncAllData() {
  console.log('🔄 Starting data sync from cloud to local...\n');
  
  // Test connections first
  logStep('Testing connections...');
  
  try {
    const { error: cloudError } = await cloudClient.from('schools').select('count', { count: 'exact', head: true });
    if (cloudError && !cloudError.message.includes('relation')) {
      throw new Error(`Cloud connection failed: ${cloudError.message}`);
    }
    logSuccess('Cloud connection OK');
  } catch (error) {
    logError(`Cloud connection failed: ${error.message}`);
    return;
  }
  
  try {
    const { error: localError } = await localClient.from('schools').select('count', { count: 'exact', head: true });
    if (localError && !localError.message.includes('relation')) {
      throw new Error(`Local connection failed: ${localError.message}`);
    }
    logSuccess('Local connection OK');
  } catch (error) {
    logError(`Local connection failed: ${error.message}`);
    return;
  }
  
  // Sync each table
  for (const tableName of TABLES_TO_SYNC) {
    await syncTable(tableName);
  }
  
  console.log('\n🎉 Data sync completed!');
  console.log('Your local database now mirrors your cloud database.');
}

// Run the sync
syncAllData().catch(console.error);
