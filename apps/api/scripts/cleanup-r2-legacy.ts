/**
 * One-shot: remove paths legados do R2 (`images/`, `audio/`, `test/`) que
 * existem por causa do layout content-addressed antigo + experimentos manuais.
 * Os paths atuais (`stories/`, `avatars/`, `previews/`) ficam intactos.
 *
 *   bun run cleanup-r2          # dry-run
 *   bun run cleanup-r2 --yes    # apaga de verdade
 *
 * Idempotente — listar de novo depois deve voltar zero matches.
 */
import { listKeys, deleteKey, storageEnabled } from '@/storage';

const LEGACY_PREFIXES = ['images/', 'audio/', 'test/'] as const;

async function main() {
  if (!storageEnabled) {
    console.error('R2 storage não habilitado — defina R2_* no .env.');
    process.exit(1);
  }
  const dryRun = !process.argv.includes('--yes');

  for (const prefix of LEGACY_PREFIXES) {
    const keys = await listKeys(prefix);
    console.log(`[cleanup] prefix "${prefix}" → ${keys.length} keys`);
    if (keys.length === 0) continue;
    if (dryRun) {
      keys.slice(0, 10).forEach((k) => console.log(`  - ${k}`));
      if (keys.length > 10) console.log(`  … +${keys.length - 10} mais`);
      continue;
    }
    let done = 0;
    for (const key of keys) {
      await deleteKey(key);
      done++;
      if (done % 50 === 0) console.log(`  apagados ${done}/${keys.length}`);
    }
    console.log(`  ✓ apagados ${done} (prefix "${prefix}")`);
  }

  if (dryRun) console.log('\n(dry-run) rode com --yes para apagar de verdade.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
