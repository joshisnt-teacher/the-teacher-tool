// One-off script: bcrypt-hash all plain-text PINs in the central students table.
// Run with: CENTRAL_SUPABASE_URL=... CENTRAL_SUPABASE_KEY=... node scripts/hash-pins.js

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.VITE_CENTRAL_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_CENTRAL_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_CENTRAL_SUPABASE_URL or VITE_CENTRAL_SUPABASE_ANON_KEY in .env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SALT_ROUNDS = 10;

async function main() {
  const { data: students, error } = await supabase
    .from('students')
    .select('id, username, pin');

  if (error) {
    console.error('Failed to fetch students:', error.message);
    process.exit(1);
  }

  console.log(`Fetched ${students.length} students. Starting hashing...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const label = `${i + 1}/${students.length}: ${student.username ?? student.id}`;

    try {
      const hashed = await bcrypt.hash(student.pin, SALT_ROUNDS);

      const { error: updateError } = await supabase
        .from('students')
        .update({ pin: hashed })
        .eq('id', student.id);

      if (updateError) throw updateError;

      console.log(`✓ Hashed ${label}`);
      success++;
    } catch (err) {
      console.error(`✗ Failed ${label}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} hashed successfully, ${failed} failed.`);
}

main();
