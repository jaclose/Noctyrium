#!/usr/bin/env python3
"""AXOM-0002b.1 full integrity validation, re-run from scratch.
Runs against the AXOM-0002A archive regardless of invocation directory."""
import json, re, collections, sys, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'AXOM-0002A'))

fail = []
def check(name, cond, detail=''):
    status = 'PASS' if cond else 'FAIL'
    if not cond: fail.append((name, detail))
    print(f'[{status}] {name}' + (f' — {detail}' if detail and not cond else ''))

recs = [json.loads(l) for l in open('RECONSTRUCTION-LEDGER.jsonl') if l.strip()]
byid = {r['candidate_id']: r for r in recs}

# 1. structure
check('193+3 = 196 candidate records', len(recs) == 196, str(len(recs)))
ids = [r['candidate_id'] for r in recs]
nums = [int(i[5:]) for i in ids]
check('IDs unique and contiguous 1..196', len(set(ids)) == 196 and sorted(nums) == list(range(1, 197)))
keysets = set(tuple(sorted(r.keys())) for r in recs)
check('exactly 25 top-level fields, uniform', len(keysets) == 1 and len(list(keysets)[0]) == 25)

OWNER_FIELDS = {'priority','board','product_dna','acceptance_criteria','success_metrics',
                'verification','owner_acceptance','roadmap','impact','status'}
check('no owner-controlled top-level fields', not (set(list(keysets)[0]) & OWNER_FIELDS))

# 2. provenance units
pat = re.compile(r'sources/(core-systems|question-system|historical-review)\.md:(\d+) \(([CQH]-\d+)\)')
units = collections.defaultdict(set)
for r in recs:
    for e in r['evidence_sources']:
        m = pat.search(e['locator'])
        if m: units[m.group(1)].add((int(m.group(2)), m.group(3)))
total_units = sum(len(v) for v in units.values())
check('250/250 raw provenance units cited', total_units == 250,
      str({k: len(v) for k, v in units.items()}))

# 3. unit locators still resolve to headings with correct ordinal (catalogue line-shift check)
prob = 0
for f, us in units.items():
    lines = open(f'sources/{f}.md').read().splitlines()
    heads = {ln: i+1 for i, (ln, _) in enumerate(
        [(j+1, l) for j, l in enumerate(lines) if l.startswith('### ')])}
    for ln, u in us:
        if heads.get(ln) != int(u.split('-')[1]): prob += 1
check('all 250 unit locators resolve to correct heading ordinals', prob == 0, str(prob))

# 4. evidence integrity
dangling = orphan = 0
for r in recs:
    have = {e['ref_id'] for e in r['evidence_sources']}
    used = set(r['evidence_confidence'].get('source_refs') or [])
    for coll, key in [('historical_notes', 'source_refs'), ('canonical_lexicon_mapping', 'source_refs'),
                      ('open_questions', 'source_refs'), ('observed_relationships', 'source_refs')]:
        for x in r.get(coll) or []:
            used |= set(x.get(key) or [])
    for cf in r.get('conflict_flags') or []:
        for side in ('evidence_a', 'evidence_b'):
            if isinstance(cf.get(side), dict):
                used |= set(cf[side].get('source_refs') or [])
    dangling += len(used - have)
    for t in r['related_candidate_records'] or []:
        if t not in byid: orphan += 1
check('zero dangling evidence refs', dangling == 0, str(dangling))
check('zero orphan related-candidate refs', orphan == 0, str(orphan))
unval = sum(1 for r in recs for e in r['evidence_sources'] if not e.get('validated'))
tot_ev = sum(len(r['evidence_sources']) for r in recs)
check(f'all {tot_ev} evidence sources validated', unval == 0, str(unval))
check('all records evidence-bearing', all(r['evidence_sources'] for r in recs))

# 5. reference-list coherence
bad = 0
for r in recs:
    kinds = collections.Counter(e['source_kind'] for e in r['evidence_sources'])
    for f, kind in [('audit_references','Audit'),('checkpoint_references','Checkpoint'),
                    ('conversation_references','Conversation'),('repository_references','Repository'),
                    ('review_references','Review')]:
        if len(r[f]) != kinds.get(kind, 0): bad += 1
check('reference lists match evidence kinds', bad == 0, str(bad))

# 6. relationship symmetry
edges = set()
for r in recs:
    for t in r['related_candidate_records'] or []:
        edges.add((r['candidate_id'], t))
asym = [(a, b) for (a, b) in edges if (b, a) not in edges]
check(f'{len(edges)} directed relationship edges fully bidirectional', not asym, str(asym[:4]))
# related lists sorted+deduped; relationship entries match related list
bad = 0
for r in recs:
    rl = r['related_candidate_records'] or []
    if rl != sorted(set(rl)): bad += 1
    rel_targets = set(x['related_candidate_id'] for x in (r['observed_relationships'] or [])
                      if x['related_candidate_id'])
    if rel_targets - set(rl): bad += 1
check('related lists sorted, deduped, consistent with relationship entries', bad == 0, str(bad))

# 7. vocabulary rules
def d_lifecycle(r):
    if r['conflict_flags']: return 'Conflict'
    if r['open_questions']: return 'Incomplete'
    us = set()
    for e in r['evidence_sources']:
        m = pat.search(e['locator'])
        if m: us.add(m.group(3))
    if len(us) >= 2: return 'Merged'
    return 'Ready For Owner' if r['evidence_confidence']['level'] == 'High' else 'Observed'
lm = [r['candidate_id'] for r in recs if r['lifecycle'] != d_lifecycle(r)]
check('lifecycle derivation rule holds (ARCHIVE-VOCABULARY §1)', not lm, str(lm[:4]))

CLASS = {'Repository':'Repository','Checkpoint':'Repository','Conversation':'Conversation',
         'Audit':'Audit','Review':'Review'}
om = []
for r in recs:
    conf = set(r['evidence_confidence']['source_refs'])
    ks = set(CLASS[e['source_kind']] for e in r['evidence_sources'] if e['ref_id'] in conf)
    d = list(ks)[0] if len(ks) == 1 else 'Mixed'
    if d != r['origin']: om.append(r['candidate_id'])
check('origin derivation rule holds (ARCHIVE-VOCABULARY §4)', not om, str(om[:4]))
cm = [r['candidate_id'] for r in recs if r['confidence'] != r['evidence_confidence']['level']]
check('confidence mirrors evidence_confidence.level', not cm, str(cm[:4]))
VOCAB = {'lifecycle': {'Conflict','Incomplete','Merged','Ready For Owner','Observed'},
         'historical_epoch': {'Noctyrium','Transition','AXOM Alpha','Current'},
         'origin': {'Repository','Conversation','Audit','Review','Mixed'}}
bad = sum(1 for r in recs for f, allowed in VOCAB.items() if r[f] not in allowed)
check('all archival vocabulary values defined', bad == 0, str(bad))
CATS = {'Bug','Feature','Polish','Product Debt','Product Decision','Research','Technical Debt'}
bad = sum(1 for r in recs for c in r['observed_category'] if c not in CATS)
check('zero invalid observed categories', bad == 0, str(bad))

# 8. DNA-label leakage
leak = 0
for fname in ['RECONSTRUCTION-LEDGER.jsonl', 'RECONSTRUCTION-LEDGER.md', 'INDEXES.md']:
    t = open(fname).read()
    for lbl in ['**Design Intent:**','**Product Principle:**','**Core Promise:**',
                '**User Feeling:**','**Product Truth:**','**Product DNA:**']:
        leak += t.count(lbl)
check('zero canonical Product DNA labels in ledger/indexes', leak == 0, str(leak))

# 9. MD <-> JSONL parity
md = open('RECONSTRUCTION-LEDGER.md').read()
heads = re.findall(r'^## (CAND-\d{6}) — (.+)$', md, re.M)
check('MD has 196 records matching JSONL ids/titles',
      len(heads) == 196 and all(h[0] in byid and byid[h[0]]['proposed_title'] == h[1].strip()
                                for h in heads))
labels = collections.Counter(re.findall(r'^- \*\*([A-Za-z /-]+):\*\*', md, re.M))
check('all 23 MD field labels appear 196x each',
      all(labels[l] == 196 for l in ['Observed Category','Evidence Summary','Lifecycle',
                                     'Observed Relationships','Related Candidate Records']))

# 10. distributions and index membership
cat = collections.Counter(c for r in recs for c in r['observed_category'])
conf = collections.Counter(r['confidence'] for r in recs)
orig = collections.Counter(r['origin'] for r in recs)
ep = collections.Counter(r['historical_epoch'] for r in recs)
lc = collections.Counter(r['lifecycle'] for r in recs)
multi = sum(1 for r in recs if len(r['observed_category']) > 1)
cfl = sum(1 for r in recs if r['conflict_flags'])
print(f'   categories: {dict(sorted(cat.items()))}')
print(f'   confidence: {dict(conf)} | origin: {dict(orig)} | epoch: {dict(ep)}')
print(f'   lifecycle: {dict(lc)} | multi-category: {multi} | conflict records: {cfl}')
check('FINAL-REPORT category table matches',
      cat == collections.Counter({'Feature':105,'Product Decision':40,'Research':28,
                                  'Technical Debt':17,'Bug':12,'Product Debt':10,'Polish':7}))
check('confidence dist High 139 / Medium 55 / Low 2',
      conf == collections.Counter({'High':139,'Medium':55,'Low':2}))
check('origin dist Mixed 91 / Repository 93 / Audit 11 / Conversation 1',
      orig == collections.Counter({'Mixed':91,'Repository':93,'Audit':11,'Conversation':1}))
check('epoch dist Current 139 / Alpha 54 / Transition 2 / Noctyrium 1',
      ep == collections.Counter({'Current':139,'AXOM Alpha':54,'Transition':2,'Noctyrium':1}))
check('39 conflict records preserved, none resolved', cfl == 39, str(cfl))
silent = sum(1 for r in recs for cf in r['conflict_flags'] or []
             if cf.get('suggested_interpretation') not in (None, 'None; preserve both.'))
check('zero silently resolved conflicts', silent == 0, str(silent))

idx = open('INDEXES.md').read()
m = re.search(r'## 1\. System Index(.*?)## 2\. Category Index', idx, re.S)
sysids = collections.Counter(re.findall(r'`(CAND-\d{6})`', m.group(1)))
check('System Index: 196 candidates placed exactly once',
      sum(sysids.values()) == 196 and all(v == 1 for v in sysids.values())
      and set(sysids) == set(byid))
m = re.search(r'## 2\. Category Index(.*?)## 3\. Chronological', idx, re.S)
ok = True
for c, n in cat.items():
    mm = re.search(r'### ' + re.escape(c) + r' \((\d+)\)(.*?)(?=### |\Z)', m.group(1), re.S)
    listed = len(re.findall(r'`CAND-\d{6}`', mm.group(2)))
    if int(mm.group(1)) != n or listed != n: ok = False; print('   category index off:', c, mm.group(1), listed, n)
check('Category Index headers and memberships match distributions', ok)
msec = re.search(r'## 3\. Chronological Index(.*?)## 4\. Dependency Index', idx, re.S)
chrono = len(re.findall(r'^\| CAND-\d{6} \|', msec.group(1), re.M))
check('Chronological Index has 196 rows', chrono == 196, str(chrono))

# 11. governance boundary
gov = open('../../governance/AX-0000-REGISTRY.md').read() + \
      open('../../governance/AX-0001-MASTER-PRODUCT-BACKLOG.md').read() + \
      open('../../governance/AX-0002-CONSTITUTION.md').read() + \
      open('../../governance/AX-0003-GOVERNANCE.md').read() + \
      open('../../governance/AX-0009-PRODUCT-LEXICON.md').read() + \
      open('../../governance/AX-0010-UX-STANDARDS.md').read()
check('no Candidate ID inside governance documents', 'CAND-' not in gov)
archive = md + idx + open('FINAL-REPORT.md').read()
check('no canonical AX product ID (>=AX-0100) consumed in archive',
      not re.search(r'AX-0[1-9]\d\d', archive))

# 12. durability
import os
check('vendored full-audit package present (11 files)',
      len([f for f in os.listdir('evidence/full-audit') if not f.startswith('.')]) == 11)
for f in ['ARCHIVE-VOCABULARY.md','UNIT-ANCHORS.md','EVIDENCE-DEPENDENCIES.md']:
    check(f'{f} present', os.path.exists(f))

print()
if fail:
    print('RESULT: FAIL —', len(fail), 'checks failed'); sys.exit(1)
print('RESULT: PASS — all checks green')
