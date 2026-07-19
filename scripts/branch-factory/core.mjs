import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const STATES = ['QUEUED','ASSIGNED','IMPLEMENTING','READY_FOR_TEST','TESTING','READY_FOR_VALIDATION','VALIDATING','PASSED','READY_FOR_MERGE','COMPLETED','TEST_FAILED','VALIDATION_FAILED','BLOCKED','CANCELLED'];
export const TRANSITIONS = new Map([
  ['QUEUED', ['ASSIGNED','BLOCKED','CANCELLED']],
  ['ASSIGNED', ['IMPLEMENTING','BLOCKED','CANCELLED']],
  ['IMPLEMENTING', ['READY_FOR_TEST','BLOCKED','CANCELLED']],
  ['READY_FOR_TEST', ['TESTING','BLOCKED','CANCELLED']],
  ['TESTING', ['READY_FOR_VALIDATION','TEST_FAILED','BLOCKED','CANCELLED']],
  ['TEST_FAILED', ['IMPLEMENTING','BLOCKED','CANCELLED']],
  ['READY_FOR_VALIDATION', ['VALIDATING','BLOCKED','CANCELLED']],
  ['VALIDATING', ['PASSED','VALIDATION_FAILED','BLOCKED','CANCELLED']],
  ['VALIDATION_FAILED', ['IMPLEMENTING','BLOCKED','CANCELLED']],
  ['PASSED', ['READY_FOR_MERGE','BLOCKED','CANCELLED']],
  ['READY_FOR_MERGE', ['COMPLETED','BLOCKED','CANCELLED']],
  ['COMPLETED', []], ['BLOCKED', ['ASSIGNED','CANCELLED']], ['CANCELLED', []]
]);
const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(root, p));

export function canTransition(from, to) { return (TRANSITIONS.get(from) || []).includes(to); }
export function transitionTask(task, to, evidence = {}) {
  if (!STATES.includes(task.status) || !STATES.includes(to)) throw new Error(`Unknown lifecycle state: ${task.status} -> ${to}`);
  if (!canTransition(task.status, to)) throw new Error(`Invalid lifecycle transition: ${task.status} -> ${to}`);
  return { ...task, status: to, evidence: { ...(task.evidence || {}), ...evidence } };
}

function validateYamlSyntax(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const errors = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith('#') || line.trim().startsWith('-')) return;
    if (!/^\s*[A-Za-z0-9_-]+:\s*.*$/.test(line)) errors.push(`${file}:${i+1}: expected simple YAML key/value syntax`);
  });
  return errors;
}

export function inspectRepository() {
  const files = execFileSync('rg', ['--files', '--hidden', '-g', '!*node_modules*', '-g', '!.git'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const report = {
    generated_at: new Date().toISOString(),
    branch: execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(),
    git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean),
    package_manager: exists('package-lock.json') ? 'npm' : 'unknown',
    runtime: { package_json: exists('package.json'), vite: files.includes('vite.config.js') },
    counts: {
      files: files.length,
      pages: files.filter(f => f.startsWith('src/pages/')).length,
      components: files.filter(f => f.startsWith('src/components/')).length,
      base44_functions: new Set(files.filter(f => f.startsWith('base44/functions/')).map(f => f.split('/').slice(0,3).join('/'))).size,
      base44_entities: files.filter(f => f.startsWith('base44/entities/')).length,
      base44_connectors: files.filter(f => f.startsWith('base44/connectors/')).length,
      base44_agents: files.filter(f => f.startsWith('base44/agents/')).length
    },
    openapi_files: files.filter(f => /openapi|swagger/i.test(f)),
    sdk_indicators: files.filter(f => /sdk|client/i.test(f)).slice(0, 50),
    mcp_files: files.filter(f => /mcp/i.test(f)),
    tests: files.filter(f => /(^test\/|\.test\.|\.spec\.)/.test(f)),
    ci_workflows: files.filter(f => f.startsWith('.github/workflows/')),
    tracking_files: files.filter(f => /(^factory\/state\.json$|goal|milestone|task)/i.test(f)),
    automation_config: files.filter(f => /(AGENTS\.md|base44\/agents|\.github\/workflows)/.test(f))
  };
  fs.writeFileSync(path.join(root, '.branch-factory/reports/repository-inspection.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

export function validateFactory() {
  const errors = [];
  for (const file of ['.branch-factory/bootstrap.yaml', ...fs.readdirSync(path.join(root,'.branch-factory/agents')).map(f => `.branch-factory/agents/${f}`)]) errors.push(...validateYamlSyntax(file));
  for (const file of ['.branch-factory/state.json','.branch-factory/sprint.json','.branch-factory/tasks.json']) { try { readJson(file); } catch(e) { errors.push(`${file}: ${e.message}`); } }
  const state = readJson('.branch-factory/state.json'), tasks = readJson('.branch-factory/tasks.json').tasks;
  if (!exists(state.authoritative_goal_tracker)) errors.push(`Missing authoritative goal tracker ${state.authoritative_goal_tracker}`);
  if (!exists(state.milestone_reference)) errors.push(`Missing milestone reference ${state.milestone_reference}`);
  const ids = new Set();
  for (const t of tasks) {
    if (ids.has(t.id)) errors.push(`Duplicate task id ${t.id}`); ids.add(t.id);
    if (!STATES.includes(t.status)) errors.push(`${t.id}: invalid status ${t.status}`);
    for (const dep of t.dependencies || []) if (!tasks.some(x => x.id === dep)) errors.push(`${t.id}: missing dependency ${dep}`);
    for (const field of ['capability','source_files','target_architecture','allowed_files','forbidden_changes','acceptance_criteria','test_commands','rollback','goal_refs']) if (t[field] == null) errors.push(`${t.id}: missing ${field}`);
  }
  const agentIds = fs.readdirSync(path.join(root,'.branch-factory/agents')).map(f => f.replace(/\.yaml$/,''));
  for (const required of ['orchestrator','implementation-agent','test-agent','validator-agent','repository-steward']) if (!agentIds.includes(required)) errors.push(`Missing agent ${required}`);
  if (exists('docs') && execFileSync('find', ['docs', '-type', 'f'], { cwd: root, encoding: 'utf8' }).split('\n').some(f => /architecture|rfc|adl|roadmap/i.test(f))) errors.push('Duplicate architecture document detected');
  return { ok: errors.length === 0, errors };
}

export function nextTask() {
  const tasks = readJson('.branch-factory/tasks.json').tasks;
  return tasks.find(t => t.status === 'QUEUED' && (t.dependencies || []).every(d => tasks.find(x => x.id === d)?.status === 'COMPLETED')) || null;
}
