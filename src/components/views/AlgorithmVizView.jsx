import React, { useState, useMemo } from 'react';
import {
  Network,
  Play,
  CheckCircle2,
  XCircle,
  GitMerge,
  RefreshCw,
  ArrowRight,
  FlaskConical,
  Layers,
} from 'lucide-react';
import { IntervalAVLTree } from '../../engine/avlIntervalTree';
import { BUILT_IN_TEST_CASES, COMPLEXITY_ROWS } from '../../data/sampleData';
import { formatInterval, formatNumber } from '../../utils/formatters';

function layoutAvlTree(root) {
  if (!root) return { nodes: [], edges: [], width: 640, height: 220 };

  const nodes = [];
  const edges = [];
  let xIndex = 0;

  const assignPositions = (node, depth, parentPos = null) => {
    if (!node) return null;
    const leftPos = assignPositions(node.left, depth + 1, null);

    const col = xIndex;
    xIndex += 1;
    const x = 70 + col * 112;
    const y = 54 + depth * 88;
    const current = {
      id: `${node.start}-${node.end}`,
      start: node.start,
      end: node.end,
      height: node.height,
      balance: node.balance,
      x,
      y,
      depth,
    };
    nodes.push(current);

    if (leftPos) {
      edges.push({ from: current, to: leftPos, side: 'L' });
    }
    const rightPos = assignPositions(node.right, depth + 1, current);
    if (rightPos) {
      edges.push({ from: current, to: rightPos, side: 'R' });
    }
    return current;
  };

  assignPositions(root, 0);

  const maxX = nodes.reduce((m, n) => Math.max(m, n.x), 200);
  const maxY = nodes.reduce((m, n) => Math.max(m, n.y), 120);

  return {
    nodes,
    edges,
    width: Math.max(600, maxX + 80),
    height: Math.max(240, maxY + 65),
  };
}

function TreeSvg({
  treeData,
  highlightPath = [],
  affectedInterval = null,
  emptyLabel = 'Tree is empty',
}) {
  const layout = useMemo(() => layoutAvlTree(treeData), [treeData]);
  const pathKeys = new Set(highlightPath.map((n) => n.start));

  if (!treeData) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-[#071021] text-xs text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#071021] p-2">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="mx-auto h-auto min-h-[250px] w-full max-w-full"
      >
        {/* Edges */}
        {layout.edges.map((edge) => (
          <g key={`edge-${edge.from.start}-${edge.to.start}`}>
            <line
              x1={edge.from.x}
              y1={edge.from.y + 20}
              x2={edge.to.x}
              y2={edge.to.y - 20}
              stroke="#334155"
              strokeWidth="2"
            />
            <text
              x={(edge.from.x + edge.to.x) / 2 + (edge.side === 'L' ? -8 : 8)}
              y={(edge.from.y + edge.to.y) / 2}
              fill="#64748b"
              fontSize="10"
              fontWeight="600"
              textAnchor="middle"
            >
              {edge.side}
            </text>
          </g>
        ))}

        {/* Nodes */}
        {layout.nodes.map((node) => {
          const isAffected =
            affectedInterval &&
            node.start === affectedInterval.start &&
            node.end === affectedInterval.end;
          const isVisited = pathKeys.has(node.start);

          const fill = isAffected
            ? '#0d9488'
            : isVisited
              ? '#0e7490'
              : '#0f1f3d';
          const stroke = isAffected
            ? '#5eead4'
            : isVisited
              ? '#22d3ee'
              : '#334155';

          return (
            <g key={`node-${node.start}-${node.end}`} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                x="-46"
                y="-22"
                width="92"
                height="44"
                rx="10"
                fill={fill}
                stroke={stroke}
                strokeWidth={isAffected || isVisited ? '2.5' : '1.5'}
              />
              <text
                x="0"
                y="-2"
                fill="#ffffff"
                fontSize="11.5"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                [{node.start}-{node.end}]
              </text>
              <text
                x="0"
                y="14"
                fill="#cbd5e1"
                fontSize="9.5"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                h:{node.height} bf:{node.balance >= 0 ? `+${node.balance}` : node.balance}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AlgorithmVizView({
  treeSnapshot,
  lastTrace,
  onAddPackage,
  onLoadSequence,
}) {
  const [treeViewMode, setTreeViewMode] = useState('after');
  const [quickId, setQuickId] = useState('');
  const [testResults, setTestResults] = useState({});

  const runSingleTest = (tc) => {
    const tree = new IntervalAVLTree();
    const traceLog = [];
    for (const id of tc.arrivals) {
      traceLog.push(tree.insertPackageId(id));
      tree.verifyInvariants();
    }
    for (const id of tc.followUp) {
      traceLog.push(tree.insertPackageId(id));
      tree.verifyInvariants();
    }

    const actualIntervals = tree.getIntervals();
    const intervalsMatch =
      JSON.stringify(actualIntervals) === JSON.stringify(tc.expectedIntervals);
    const duplicatesMatch = tree.duplicateCount === tc.expectedDuplicates;
    const passed = intervalsMatch && duplicatesMatch;

    return {
      passed,
      actualIntervals,
      actualDuplicates: tree.duplicateCount,
      treeHeight: tree.getGlobalStats().treeHeight,
      rotations: tree.rotationCount,
      merges: tree.mergeCount,
      actualText: actualIntervals.map((iv) => formatInterval(iv)).join(', '),
    };
  };

  const handleRunTest = (tc) => {
    const res = runSingleTest(tc);
    setTestResults((prev) => ({ ...prev, [tc.id]: res }));
  };

  const handleRunAllTests = () => {
    const all = {};
    for (const tc of BUILT_IN_TEST_CASES) {
      all[tc.id] = runSingleTest(tc);
    }
    setTestResults(all);
  };

  const handleQuickInsert = (e) => {
    e.preventDefault();
    const res = onAddPackage(quickId);
    if (res.ok) setQuickId('');
  };

  const passedCount = Object.values(testResults).filter((r) => r.passed).length;

  return (
    <div className="space-y-6">
      {/* Header + Interactive Demo Triggers */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            AVL Tree Algorithm Visualization &amp; Verification Suite
          </h1>
          <p className="text-sm text-slate-500">
            Inspect live tree structure, rotations, predecessor/successor lookup paths, before/after diffs, and automated test cases.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onLoadSequence([10, 20, 30], 'RR Rotation Demo')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
            Demo RR Rotation (10, 20, 30)
          </button>
          <button
            type="button"
            onClick={() => onLoadSequence([30, 10, 20], 'LR Rotation Demo')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-600" />
            Demo LR Rotation (30, 10, 20)
          </button>
          <button
            type="button"
            onClick={() => onLoadSequence([1, 3, 5, 2, 4], 'Bridge Merge Sequence')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#081123] px-3 py-2 text-xs font-semibold text-white hover:bg-[#13264c]"
          >
            <GitMerge className="h-3.5 w-3.5 text-teal-400" />
            Demo Multi-Merge (1, 3, 5, 2, 4)
          </button>
        </div>
      </div>

      {/* Live Tree + Step-by-Step Trace Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* SVG AVL Tree Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Live AVL Tree Structure (Keyed by Interval Start)
              </h2>
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTreeViewMode('after')}
                className={`rounded-lg px-3 py-1 transition ${
                  treeViewMode === 'after'
                    ? 'bg-[#081123] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                After State
              </button>
              <button
                type="button"
                onClick={() => setTreeViewMode('before')}
                disabled={!lastTrace}
                className={`rounded-lg px-3 py-1 transition ${
                  treeViewMode === 'before'
                    ? 'bg-[#081123] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                }`}
              >
                Before State
              </button>
              <button
                type="button"
                onClick={() => setTreeViewMode('compare')}
                disabled={!lastTrace}
                className={`rounded-lg px-3 py-1 transition ${
                  treeViewMode === 'compare'
                    ? 'bg-[#081123] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                }`}
              >
                Side-by-Side
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#0d9488]" /> Affected / Merged Node
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#0e7490]" /> Search Path Visited
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#0f1f3d]" /> Balanced AVL Node (|bf| &le; 1)
              </span>
            </div>

            <form onSubmit={handleQuickInsert} className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                value={quickId}
                onChange={(e) => setQuickId(e.target.value)}
                placeholder="Insert ID..."
                className="w-28 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-hidden"
              />
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700"
              >
                Step Insert
              </button>
            </form>
          </div>

          <div className="mt-4">
            {treeViewMode === 'compare' && lastTrace ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-xs font-semibold text-slate-600">
                    Before (+{formatNumber(lastTrace.id)}) â€” Height {lastTrace.beforeHeight}
                  </div>
                  <TreeSvg
                    treeData={lastTrace.beforeTree}
                    highlightPath={[...(lastTrace.predPath || []), ...(lastTrace.succPath || [])]}
                    emptyLabel="Empty before first insertion"
                  />
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-semibold text-teal-700">
                    After ({lastTrace.actionLabel}) â€” Height {lastTrace.afterHeight}
                  </div>
                  <TreeSvg
                    treeData={lastTrace.afterTree}
                    highlightPath={[...(lastTrace.predPath || []), ...(lastTrace.succPath || [])]}
                    affectedInterval={lastTrace.affectedInterval}
                  />
                </div>
              </div>
            ) : treeViewMode === 'before' && lastTrace ? (
              <TreeSvg
                treeData={lastTrace.beforeTree}
                highlightPath={[...(lastTrace.predPath || []), ...(lastTrace.succPath || [])]}
                emptyLabel="Tree was empty before this insertion"
              />
            ) : (
              <TreeSvg
                treeData={treeSnapshot}
                highlightPath={[
                  ...(lastTrace?.predPath || []),
                  ...(lastTrace?.succPath || []),
                ]}
                affectedInterval={lastTrace?.affectedInterval}
              />
            )}
          </div>
        </div>

        {/* Step-by-Step Execution Trace */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Latest Insertion Step-by-Step Trace
            </h2>
            {lastTrace && (
              <span className="rounded-full bg-[#081123] px-3 py-1 font-mono text-xs font-bold text-cyan-300">
                ID: {formatNumber(lastTrace.id)}
              </span>
            )}
          </div>

          {!lastTrace ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              Insert any package ID to inspect predecessor/successor discovery, adjacency checks, and AVL rotations.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {/* Predecessor & Successor Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="font-semibold uppercase tracking-wider text-slate-500">
                    Predecessor (&le; {formatNumber(lastTrace.id)})
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {lastTrace.pred ? formatInterval(lastTrace.pred) : 'None'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="font-semibold uppercase tracking-wider text-slate-500">
                    Successor (&gt; {formatNumber(lastTrace.id)})
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {lastTrace.succ ? formatInterval(lastTrace.succ) : 'None'}
                  </div>
                </div>
              </div>

              {/* Rotations Badge */}
              <div className="rounded-xl border border-slate-200 bg-[#081123] px-3.5 py-2.5 text-xs text-white">
                <span className="font-semibold text-slate-400">AVL Rotations Triggered: </span>
                {lastTrace.rotations.length === 0 ? (
                  <span className="font-mono text-teal-300">None (Balance factors within [-1, +1])</span>
                ) : (
                  <span className="font-mono font-bold text-amber-300">
                    {lastTrace.rotations
                      .map((r) => `${r.type} (pivot ${r.pivotStart} â†’ root ${r.newRootStart})`)
                      .join('; ')}
                  </span>
                )}
              </div>

              {/* Execution Steps */}
              <div className="space-y-2">
                {lastTrace.steps.map((step, idx) => (
                  <div
                    key={step.title}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 font-mono text-[10px] text-white">
                        {idx + 1}
                      </span>
                      {step.title}
                    </div>
                    <p className="mt-1 pl-7 text-xs leading-relaxed text-slate-600">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5-Case Decision Logic Cheat Sheet for Presentation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">
            How the AVL Interval Index Handles Every Arrival Case
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              title: '1. Duplicate',
              rule: 'pred.start <= x <= pred.end',
              effect: 'Ignored immediately; intervals & tree remain untouched.',
              color: 'border-amber-200 bg-amber-50/60 text-amber-900',
            },
            {
              title: '2. Isolated New',
              rule: 'x > pred.end+1 & x < succ.start-1',
              effect: 'Inserts new node [xâ€“x] & runs LL/RR/LR/RL rebalance.',
              color: 'border-cyan-200 bg-cyan-50/60 text-cyan-900',
            },
            {
              title: '3. Extend Right',
              rule: 'pred.end + 1 === x',
              effect: 'Updates pred.end = x in place (start key unchanged).',
              color: 'border-indigo-200 bg-indigo-50/60 text-indigo-900',
            },
            {
              title: '4. Extend Left',
              rule: 'x + 1 === succ.start',
              effect: 'Shifts succ.start = x (preserves strict BST ordering).',
              color: 'border-sky-200 bg-sky-50/60 text-sky-900',
            },
            {
              title: '5. Bridge Merge',
              rule: 'pred.end+1 === x === succ.start-1',
              effect: 'Sets pred.end = succ.end & deletes succ node with rebalance.',
              color: 'border-teal-300 bg-teal-50/80 text-teal-950',
            },
          ].map((c) => (
            <div key={c.title} className={`rounded-xl border p-3.5 ${c.color}`}>
              <div className="text-xs font-bold">{c.title}</div>
              <div className="mt-1 rounded-md bg-white/80 px-2 py-1 font-mono text-[11px] font-semibold">
                {c.rule}
              </div>
              <p className="mt-2 text-xs leading-relaxed opacity-90">{c.effect}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time & Space Complexity Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900">
          Asymptotic Time &amp; Space Complexity Analysis
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-4">Operation</th>
                <th className="py-2.5 pr-4">AVL Interval Index</th>
                <th className="py-2.5 pr-4">Naive Array / Re-Sort</th>
                <th className="py-2.5 pr-4">Space</th>
                <th className="py-2.5">Engineering Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPLEXITY_ROWS.map((row) => (
                <tr key={row.operation} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-4 font-semibold text-slate-900">
                    {row.operation}
                  </td>
                  <td className="py-2.5 pr-4 font-mono font-bold text-teal-700">
                    {row.avlTime}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-rose-600">
                    {row.naiveArrayTime}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-slate-700">{row.space}</td>
                  <td className="py-2.5 text-slate-600">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Built-in Automated Test Suite (Test Cases 1-6) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-teal-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Built-In Verification Suite (Test Cases 1â€“6)
              </h2>
              <p className="text-xs text-slate-500">
                Executes each test case directly against <span className="font-mono">IntervalAVLTree</span> and verifies all AVL invariants.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {Object.keys(testResults).length > 0 && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-800">
                {passedCount} / {BUILT_IN_TEST_CASES.length} Passed
              </span>
            )}
            <button
              type="button"
              onClick={handleRunAllTests}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-700"
            >
              <Play className="h-3.5 w-3.5" />
              Run All 6 Test Cases
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {BUILT_IN_TEST_CASES.map((tc) => {
            const res = testResults[tc.id];
            return (
              <div
                key={tc.id}
                className={`rounded-xl border p-4 transition ${
                  res
                    ? res.passed
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-rose-300 bg-rose-50/40'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 sm:text-sm">
                      {tc.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">{tc.description}</p>
                  </div>
                  {res && (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        res.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {res.passed ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> PASS
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> FAIL
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1 rounded-lg bg-white p-2.5 font-mono text-xs text-slate-700 ring-1 ring-slate-200/80">
                  <div>
                    <span className="text-slate-400">Arrivals: </span>
                    {tc.arrivals.join(', ')}
                    {tc.followUp.length > 0 && ` â†’ then ${tc.followUp.join(', ')}`}
                  </div>
                  <div>
                    <span className="text-slate-400">Expected: </span>
                    <span className="font-semibold text-slate-900">{tc.expectedText}</span>
                  </div>
                  {res && (
                    <div className="border-t border-slate-100 pt-1 text-teal-800">
                      <span className="text-slate-400">Actual:   </span>
                      <span className="font-bold">{res.actualText}</span>
                      {' Â· '}Dup: {res.actualDuplicates} Â· h={res.treeHeight}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunTest(tc)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#081123] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#13264c]"
                  >
                    <Play className="h-3 w-3 text-cyan-300" />
                    Run Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

