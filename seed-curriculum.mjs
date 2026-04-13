#!/usr/bin/env node
/**
 * seed-curriculum.mjs
 *
 * Reads all descriptor markdown files from scsa-descriptors/ and upserts them
 * into the curriculum, strand, and content_item tables in Supabase.
 *
 * Run with:  node seed-curriculum.mjs
 * Add --dry-run to preview without writing to the database.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Supabase client (service role so RLS doesn't block seeding)
// ---------------------------------------------------------------------------
const SUPABASE_URL = 'https://aogorchudxilnkhtfvqq.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQxMzMxNywiZXhwIjoyMDcyOTg5MzE3fQ.pL1-TBMlFmnIo1NNaSkdL1X6WzD2of3FjZVMBrI-0QA';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ---------------------------------------------------------------------------
// Curriculum config — one entry per folder in scsa-descriptors/
// ---------------------------------------------------------------------------
const CURRICULUM_CONFIG = {
  'yr7-hass': {
    authority: 'SCSA',
    learning_area: 'HASS',
    year_band: 'Year 7',
    version: '2026',
    year_level_description: 'Year 7 HASS — History, Geography, Civics and Citizenship, Economics and Business',
    hasSubfolders: true,
  },
  'yr9-hass': {
    authority: 'SCSA',
    learning_area: 'HASS',
    year_band: 'Year 9',
    version: '2026',
    year_level_description: 'Year 9 HASS — History, Geography, Civics and Citizenship, Economics and Business',
    hasSubfolders: true,
  },
  'yr7-digitech': {
    authority: 'SCSA',
    learning_area: 'Digital Technologies',
    year_band: 'Year 7',
    version: '2026',
    year_level_description: 'Year 7 Digital Technologies — Knowledge and Understanding, Processes and Production Skills',
    hasSubfolders: false,
  },
  'yr8-digitech': {
    authority: 'SCSA',
    learning_area: 'Digital Technologies',
    year_band: 'Year 8',
    version: '2026',
    year_level_description: 'Year 8 Digital Technologies — Knowledge and Understanding, Processes and Production Skills',
    hasSubfolders: false,
  },
  'yr9-digitech': {
    authority: 'Rehoboth',
    learning_area: 'Digital Technologies',
    year_band: 'Year 9',
    version: '2026',
    year_level_description: 'Year 9 Digital Technology — school-designed elective (3D Printing, Game Design, Robotics, Python)',
    hasSubfolders: false,
  },
  'yr12-bme': {
    authority: 'SCSA',
    learning_area: 'Business Management and Enterprise',
    year_band: 'Year 12',
    version: '2026',
    year_level_description: 'Year 12 Business Management and Enterprise — Units 3 and 4',
    hasSubfolders: false,
  },
};

// Maps subfolder names (HASS) to proper strand names
const STRAND_FOLDER_MAP = {
  civics:    'Civics and Citizenship',
  economics: 'Economics and Business',
  geography: 'Geography',
  history:   'History',
  skills:    'Skills',
};

// ---------------------------------------------------------------------------
// Markdown parsing helpers
// ---------------------------------------------------------------------------

/** Parses YAML-style frontmatter from a markdown string. */
function parseFrontmatter(content) {
  // Strip BOM if present
  const clean = content.replace(/^\uFEFF/, '');
  const match = clean.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: clean };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*"?([^"]+)"?\s*$/);
    if (kv) meta[kv[1].trim()] = kv[2].trim();
  }
  const body = clean.slice(match[0].length).trim();
  return { meta, body };
}

/** Extracts the text under a ## Heading, stopping at the next ## or a dataview block. */
function extractSection(body, heading) {
  const pattern = new RegExp(`##\\s+${heading}\\s*\\r?\\n([\\s\\S]*?)(?=\\n##|\\n\`\`\`dataview|$)`, 'i');
  const match = body.match(pattern);
  if (!match) return '';
  return match[1].trim();
}

// ---------------------------------------------------------------------------
// Main seed logic
// ---------------------------------------------------------------------------

async function upsertCurriculum(config) {
  if (DRY_RUN) {
    console.log('  [DRY RUN] Would upsert curriculum:', config.authority, config.learning_area, config.year_band);
    return `dry-run-curriculum-${config.year_band}`;
  }

  // Check if it already exists
  const { data: existing } = await supabase
    .from('curriculum')
    .select('id')
    .eq('authority', config.authority)
    .eq('learning_area', config.learning_area)
    .eq('year_band', config.year_band)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('curriculum')
    .insert({
      authority: config.authority,
      learning_area: config.learning_area,
      year_band: config.year_band,
      version: config.version,
      year_level_description: config.year_level_description,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Curriculum insert failed: ${error.message}`);
  return data.id;
}

async function upsertStrand(curriculumId, strandName) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would upsert strand: "${strandName}"`);
    return `dry-run-strand-${strandName}`;
  }

  const { data: existing } = await supabase
    .from('strand')
    .select('id')
    .eq('curriculum_id', curriculumId)
    .eq('name', strandName)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('strand')
    .insert({ curriculum_id: curriculumId, name: strandName })
    .select('id')
    .single();

  if (error) throw new Error(`Strand insert failed for "${strandName}": ${error.message}`);
  return data.id;
}

async function upsertContentItem(strandId, code, description) {
  if (DRY_RUN) {
    console.log(`    [DRY RUN] Would upsert content item: ${code}`);
    return;
  }

  const { data: existing } = await supabase
    .from('content_item')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  if (existing) return; // already exists, skip

  const { error } = await supabase
    .from('content_item')
    .insert({ strand_id: strandId, code, description, display_code: code });

  if (error) throw new Error(`Content item insert failed for "${code}": ${error.message}`);
}

/** Reads all .md files in a directory (non-recursive). Returns parsed file data. */
function readDescriptors(dir) {
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .map(f => {
      const { meta, body } = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'));
      const description = extractSection(body, 'Description');
      return { code: meta.code, strandName: meta.strand, description };
    })
    .filter(item => item.code && item.description);
}

async function seedFolder(folderName, config) {
  const folderPath = path.join(__dirname, 'scsa-descriptors', folderName);
  if (!fs.existsSync(folderPath)) {
    console.log(`  Skipping ${folderName} — folder not found`);
    return;
  }

  console.log(`\n📚 ${config.year_band} ${config.learning_area} (${config.authority})`);
  const curriculumId = await upsertCurriculum(config);

  if (config.hasSubfolders) {
    // HASS: each subfolder is a strand
    const subfolders = fs.readdirSync(folderPath).filter(
      f => fs.statSync(path.join(folderPath, f)).isDirectory()
    );

    for (const subfolder of subfolders) {
      const strandName = STRAND_FOLDER_MAP[subfolder] || subfolder;
      console.log(`  → Strand: ${strandName}`);
      const strandId = await upsertStrand(curriculumId, strandName);

      const items = readDescriptors(path.join(folderPath, subfolder));
      for (const item of items) {
        console.log(`    ✓ ${item.code}`);
        await upsertContentItem(strandId, item.code, item.description);
      }
      console.log(`    ${items.length} item(s)`);
    }
  } else {
    // Flat folder: strand comes from frontmatter
    const items = readDescriptors(folderPath);

    // Group by strand name
    const byStrand = new Map();
    for (const item of items) {
      const key = item.strandName || 'General';
      if (!byStrand.has(key)) byStrand.set(key, []);
      byStrand.get(key).push(item);
    }

    for (const [strandName, strandItems] of byStrand) {
      console.log(`  → Strand: ${strandName}`);
      const strandId = await upsertStrand(curriculumId, strandName);
      for (const item of strandItems) {
        console.log(`    ✓ ${item.code}`);
        await upsertContentItem(strandId, item.code, item.description);
      }
      console.log(`    ${strandItems.length} item(s)`);
    }

    if (items.length === 0) {
      console.log('  (no descriptor files — curriculum record created only)');
    }
  }
}

async function main() {
  if (DRY_RUN) console.log('\n⚠️  DRY RUN MODE — nothing will be written to the database\n');

  let totalItems = 0;

  for (const [folderName, config] of Object.entries(CURRICULUM_CONFIG)) {
    await seedFolder(folderName, config);
  }

  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
