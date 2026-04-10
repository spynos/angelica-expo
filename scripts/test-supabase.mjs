import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const tables = [
  'users',
  'poems',
  'likes',
  'bookmarks',
  'puzzles',
  'puzzle_records',
  'push_tokens',
];

let allOk = true;
for (const t of tables) {
  const { error } = await supabase.from(t).select('*', { count: 'exact', head: true });
  if (error && error.code === '42P01') {
    console.log(`❌ ${t} — table missing`);
    allOk = false;
  } else if (error && !['PGRST116', '42501'].includes(error.code)) {
    // 42501 = insufficient_privilege (RLS blocking anon read — that's fine, table exists)
    console.log(`⚠️  ${t} — ${error.code}: ${error.message}`);
  } else {
    console.log(`✅ ${t}`);
  }
}

process.exit(allOk ? 0 : 1);
