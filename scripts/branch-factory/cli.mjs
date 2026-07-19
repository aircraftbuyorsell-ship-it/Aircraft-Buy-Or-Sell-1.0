#!/usr/bin/env node
import { inspectRepository, validateFactory, nextTask } from './core.mjs';
const cmd = process.argv[2] || 'status';
if (cmd === 'inspect') console.log(JSON.stringify(inspectRepository(), null, 2));
else if (cmd === 'validate') { const r = validateFactory(); console.log(JSON.stringify(r, null, 2)); process.exit(r.ok ? 0 : 1); }
else if (cmd === 'next') console.log(JSON.stringify(nextTask(), null, 2));
else if (cmd === 'status') { const r = validateFactory(); console.log(r.ok ? 'Branch Factory status: valid' : `Branch Factory status: invalid\n${r.errors.join('\n')}`); process.exit(r.ok ? 0 : 1); }
else if (cmd === 'report') console.log(JSON.stringify(inspectRepository(), null, 2));
else { console.error('Usage: branch-factory inspect|status|validate|next|report'); process.exit(2); }
