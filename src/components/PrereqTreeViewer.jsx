import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { mockCourses, mockPrerequisites } from '../data/mockCourseData';
import './PrereqTreeViewer.css';

// ============================================================================
// Constants
// ============================================================================

/** Semester display order (index 0 = earliest). */
const SEMESTER_ORDER = ['fall', 'spring', 'summer'];

/** Semester color palette — WCAG AA contrast on white/dark card backgrounds. */
const SEMESTER_COLORS = {
  unassigned: { bg: '#6B6B68', border: '#4A4A47', text: '#FFFFFF', label: 'Unassigned' },
  sem1:  { bg: '#005035', border: '#003822', text: '#FFFFFF', label: 'Year 1 — Fall'   },
  sem2:  { bg: '#1A6B4A', border: '#005035', text: '#FFFFFF', label: 'Year 1 — Spring' },
  sem3:  { bg: '#2D8A62', border: '#1A6B4A', text: '#FFFFFF', label: 'Year 1 — Summer' },
  sem4:  { bg: '#7B6F2F', border: '#5A4F1A', text: '#FFFFFF', label: 'Year 2 — Fall'   },
  sem5:  { bg: '#A49665', border: '#7B6F2F', text: '#1A1A1A', label: 'Year 2 — Spring' },
  sem6:  { bg: '#C4B88A', border: '#A49665', text: '#1A1A1A', label: 'Year 2 — Summer' },
  sem7:  { bg: '#1A4A7A', border: '#0D2E50', text: '#FFFFFF', label: 'Year 3 — Fall'   },
  sem8:  { bg: '#2A6FAA', border: '#1A4A7A', text: '#FFFFFF', label: 'Year 3 — Spring' },
  sem9:  { bg: '#4A8FCA', border: '#2A6FAA', text: '#1A1A1A', label: 'Year 3 — Summer' },
  sem10: { bg: '#7A2D2D', border: '#5A1A1A', text: '#FFFFFF', label: 'Year 4 — Fall'   },
  sem11: { bg: '#AA4A4A', border: '#7A2D2D', text: '#FFFFFF', label: 'Year 4 — Spring' },
  sem12: { bg: '#CA7070', border: '#AA4A4A', text: '#1A1A1A', label: 'Year 4 — Summer' },
  // Years 5-8 (extra semesters)
  sem13: { bg: '#4A2D7A', border: '#2D1A5A', text: '#FFFFFF', label: 'Year 5 — Fall'   },
  sem14: { bg: '#6A4DAA', border: '#4A2D7A', text: '#FFFFFF', label: 'Year 5 — Spring' },
  sem15: { bg: '#8A6DCA', border: '#6A4DAA', text: '#1A1A1A', label: 'Year 5 — Summer' },
  sem16: { bg: '#2D5A2D', border: '#1A3A1A', text: '#FFFFFF', label: 'Year 6 — Fall'   },
  sem17: { bg: '#4A8A4A', border: '#2D5A2D', text: '#FFFFFF', label: 'Year 6 — Spring' },
  sem18: { bg: '#6AAA6A', border: '#4A8A4A', text: '#1A1A1A', label: 'Year 6 — Summer' },
  sem19: { bg: '#5A3A1A', border: '#3A2208', text: '#FFFFFF', label: 'Year 7 — Fall'   },
  sem20: { bg: '#8A6A3A', border: '#5A3A1A', text: '#FFFFFF', label: 'Year 7 — Spring' },
  sem21: { bg: '#BAAA7A', border: '#8A6A3A', text: '#1A1A1A', label: 'Year 7 — Summer' },
  sem22: { bg: '#3A3A6A', border: '#1A1A4A', text: '#FFFFFF', label: 'Year 8 — Fall'   },
  sem23: { bg: '#5A5A9A', border: '#3A3A6A', text: '#FFFFFF', label: 'Year 8 — Spring' },
  sem24: { bg: '#8A8ACA', border: '#5A5A9A', text: '#1A1A1A', label: 'Year 8 — Summer' },
};

/** Returns the semKey (e.g. 'sem3') for a plan entry, or 'unassigned'. */
function getSemKey(entry) {
  if (!entry || entry.plan_year === 0 || entry.plan_semester === 'unassigned') return 'unassigned';
  const yearOffset = (entry.plan_year - 1) * SEMESTER_ORDER.length;
  const semOffset  = SEMESTER_ORDER.indexOf(entry.plan_semester);
  if (semOffset === -1) return 'unassigned';
  return `sem${yearOffset + semOffset + 1}`;
}

/** Sort-weight for a semKey — lower number = earlier in plan. */
function semOrder(key) {
  if (key === 'unassigned') return Infinity;
  return parseInt(key.replace('sem', ''), 10);
}

// ============================================================================
// Layout constants for the orthogonal (elbow-routed) tree
// ============================================================================
const NODE_W  = 160;  // node card width
const NODE_H  = 56;   // node card height
const COL_GAP = 80;   // horizontal space between columns
const ROW_GAP = 24;   // vertical space between rows in the same column

// ============================================================================
// Graph builder
// ============================================================================

/**
 * Builds a topological-layer layout for all courses in planEntries.
 *
 * Returns:
 *   nodes: Array<{ id, course, semKey, col, row, x, y }>
 *   edges: Array<{ from, to, type: 'prereq' | 'coreq' }>
 *
 * Layout algorithm:
 *  1. Collect all relevant course IDs (plan courses + their transitive prereqs).
 *  2. Build adjacency for prereqs.
 *  3. Assign columns via longest-path / topological depth.
 *  4. Pack rows within each column.
 *  5. Compute pixel positions.
 */
function buildGraph(planEntries, courseMap) {
  // ---- 1. Gather all needed course IDs ----
  const planCourseIds = new Set(planEntries.map((e) => e.course_id));

  // Build a quick prereq lookup: prereqsOf[cid] = Set of required_course_ids
  const prereqsOf = {};
  mockPrerequisites.forEach(({ course_id, required_course_id }) => {
    if (!prereqsOf[course_id]) prereqsOf[course_id] = new Set();
    prereqsOf[course_id].add(required_course_id);
  });

  // Expand to include transitive prerequisites
  const allIds = new Set(planCourseIds);
  const queue  = [...planCourseIds];
  while (queue.length) {
    const id = queue.shift();
    for (const req of (prereqsOf[id] ?? [])) {
      if (!allIds.has(req)) {
        allIds.add(req);
        queue.push(req);
      }
    }
  }

  // ---- 2. Build topological depth (column) via longest-path from roots ----
  //  col(course) = max(col(prereq) + 1) for all prereqs, or 0 if no prereqs
  const col = {};
  const visited = new Set();

  function assignCol(id) {
    if (visited.has(id)) return col[id] ?? 0;
    visited.add(id);
    const prereqIds = [...(prereqsOf[id] ?? [])].filter((r) => allIds.has(r));
    if (prereqIds.length === 0) {
      col[id] = 0;
    } else {
      prereqIds.forEach(assignCol);
      col[id] = Math.max(...prereqIds.map((r) => col[r])) + 1;
    }
    return col[id];
  }
  for (const id of allIds) assignCol(id);

  // ---- 3. Assign row within each column ----
  //  Sort by plan semester order so courses taken earlier appear higher.
  const semKeyOf = {};
  planEntries.forEach((e) => { semKeyOf[e.course_id] = getSemKey(e); });
  // For prereq-only courses (not in plan), mark as 'unassigned'
  for (const id of allIds) {
    if (!semKeyOf[id]) semKeyOf[id] = 'unassigned';
  }

  const colBuckets = {};
  for (const id of allIds) {
    const c = col[id];
    if (!colBuckets[c]) colBuckets[c] = [];
    colBuckets[c].push(id);
  }

  const row = {};
  for (const [c, ids] of Object.entries(colBuckets)) {
    // Sort by semester order then by alpha_code+numeric_code for stability
    ids.sort((a, b) => {
      const so = semOrder(semKeyOf[a]) - semOrder(semKeyOf[b]);
      if (so !== 0) return so;
      const ca = courseMap[a];
      const cb = courseMap[b];
      const codeA = ca ? `${ca.alpha_code}${ca.numeric_code}` : a;
      const codeB = cb ? `${cb.alpha_code}${cb.numeric_code}` : b;
      return codeA.localeCompare(codeB);
    });
    ids.forEach((id, i) => { row[id] = i; });
  }

  // ---- 4. Compute pixel positions ----
  const maxCol = Math.max(0, ...Object.values(col));
  const nodes = [];
  for (const id of allIds) {
    const c   = col[id];
    const r   = row[id];
    const x   = c * (NODE_W + COL_GAP);
    const y   = r * (NODE_H + ROW_GAP);
    const course = courseMap[id] ?? mockCourses.find((mc) => mc.course_id === id);
    nodes.push({ id, course, semKey: semKeyOf[id], col: c, row: r, x, y });
  }

  // ---- 5. Build edges ----
  const edges = [];
  for (const id of allIds) {
    for (const req of (prereqsOf[id] ?? [])) {
      if (allIds.has(req)) {
        edges.push({ from: req, to: id, type: 'prereq' });
      }
    }
  }

  // Canvas size
  const colCount  = maxCol + 1;
  const colSizes  = Object.fromEntries(
    Object.entries(colBuckets).map(([c, ids]) => [c, ids.length])
  );
  const maxRows   = Math.max(1, ...Object.values(colSizes));
  const svgWidth  = colCount  * NODE_W + (colCount  - 1) * COL_GAP + 40;
  const svgHeight = maxRows   * NODE_H + (maxRows   - 1) * ROW_GAP + 40;

  return { nodes, edges, svgWidth, svgHeight };
}

// ============================================================================
// Orthogonal edge path builder (90° only, elbow routing)
// ============================================================================

/**
 * Returns an SVG `d` path string for an orthogonal (elbow) connector
 * from the right edge of the "from" node to the left edge of the "to" node.
 *
 *  from ──────────┐
 *                 │
 *                 └────── to
 */
function elbowPath(fromNode, toNode) {
  // Start: right-center of from node
  const x1 = fromNode.x + NODE_W;
  const y1 = fromNode.y + NODE_H / 2;
  // End: left-center of to node
  const x2 = toNode.x;
  const y2 = toNode.y + NODE_H / 2;

  // Midpoint X for the vertical segment
  const mx = Math.round((x1 + x2) / 2);

  if (y1 === y2) {
    // Same row: simple horizontal line
    return `M ${x1} ${y1} H ${x2}`;
  }

  // Elbow: right → vertical → right
  return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;
}

// ============================================================================
// Legend component
// ============================================================================
function Legend({ semKeys }) {
  const unique = [...new Set(semKeys)].sort((a, b) => semOrder(a) - semOrder(b));
  return (
    <div className="prereq-tree-legend">
      {unique.map((key) => {
        const c = SEMESTER_COLORS[key] ?? SEMESTER_COLORS.unassigned;
        return (
          <div key={key} className="prereq-tree-legend-item">
            <span
              className="prereq-tree-legend-swatch"
              style={{ background: c.bg, border: `2px solid ${c.border}` }}
            />
            <span className="prereq-tree-legend-label">{c.label}</span>
          </div>
        );
      })}
      <div className="prereq-tree-legend-item">
        <svg width="36" height="14" aria-hidden="true">
          <line x1="0" y1="7" x2="36" y2="7" stroke="#005035" strokeWidth="2" markerEnd="url(#arr-prereq-legend)" />
          <defs>
            <marker id="arr-prereq-legend" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#005035" />
            </marker>
          </defs>
        </svg>
        <span className="prereq-tree-legend-label">Prerequisite</span>
      </div>
      <div className="prereq-tree-legend-item">
        <span
          className="prereq-tree-legend-swatch"
          style={{ background: '#6B6B68', border: '2px solid #4A4A47' }}
        />
        <span className="prereq-tree-legend-label">Not in plan (required prereq)</span>
      </div>
    </div>
  );
}

// ============================================================================
// Main PrereqTreeViewer component
// ============================================================================

export default function PrereqTreeViewer({ planEntries, courseMap }) {
  const svgRef = useRef(null);
  const [hoveredId, setHoveredId]     = useState(null);
  const [selectedId, setSelectedId]   = useState(null);
  const [transform, setTransform]     = useState({ x: 20, y: 20, scale: 1 });
  const isPanning                     = useRef(false);
  const panStart                      = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Build graph from plan entries
  const { nodes, edges, svgWidth, svgHeight } = useMemo(
    () => buildGraph(planEntries, courseMap),
    [planEntries, courseMap]
  );

  // Build lookup maps
  const nodeById = useMemo(() => {
    const m = {};
    nodes.forEach((n) => { m[n.id] = n; });
    return m;
  }, [nodes]);

  // ---- Pan / zoom handlers ----
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.prereq-node')) return; // don't pan when clicking a node
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    e.currentTarget.style.cursor = 'grabbing';
  }, [transform]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform((t) => ({ ...t, x: panStart.current.tx + dx, y: panStart.current.ty + dy }));
  }, []);

  const handleMouseUp = useCallback((e) => {
    isPanning.current = false;
    if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.909;
    setTransform((t) => {
      const newScale = Math.max(0.3, Math.min(2.5, t.scale * factor));
      return { ...t, scale: newScale };
    });
  }, []);

  const resetView = () => setTransform({ x: 20, y: 20, scale: 1 });

  // Attach non-passive wheel listener
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ---- Highlight logic ----
  const focusId = selectedId ?? hoveredId;

  /** IDs connected to focusId via edges (prereqs or dependents). */
  const connectedIds = useMemo(() => {
    if (!focusId) return new Set();
    const ids = new Set([focusId]);
    edges.forEach(({ from, to }) => {
      if (from === focusId || to === focusId) {
        ids.add(from);
        ids.add(to);
      }
    });
    return ids;
  }, [focusId, edges]);

  const dimNode = (id) => focusId && !connectedIds.has(id);
  const dimEdge = (from, to) => focusId && (!connectedIds.has(from) || !connectedIds.has(to));

  // ---- Empty / loading states ----
  if (planEntries.length === 0) {
    return (
      <div className="prereq-tree-empty">
        <p>Add courses to your plan to see the prerequisite tree.</p>
      </div>
    );
  }

  const semKeys = nodes.map((n) => n.semKey);
  const planCourseIds = new Set(planEntries.map((e) => e.course_id));

  const selectedNode = selectedId ? nodeById[selectedId] : null;

  return (
    <div className="prereq-tree-container">
      {/* Controls bar */}
      <div className="prereq-tree-toolbar">
        <span className="prereq-tree-toolbar-hint">
          Scroll to zoom · Drag to pan · Click a node to highlight
        </span>
        <div className="prereq-tree-toolbar-actions">
          <button
            type="button"
            className="prereq-tree-ctrl-btn"
            onClick={() => setTransform((t) => ({ ...t, scale: Math.min(2.5, t.scale * 1.2) }))}
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="prereq-tree-ctrl-btn"
            onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.3, t.scale * 0.833) }))}
            title="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="prereq-tree-ctrl-btn prereq-tree-ctrl-btn--reset"
            onClick={resetView}
            title="Reset view"
          >
            Reset
          </button>
          {selectedId && (
            <button
              type="button"
              className="prereq-tree-ctrl-btn prereq-tree-ctrl-btn--clear"
              onClick={() => setSelectedId(null)}
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        className="prereq-tree-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: 'grab' }}
      >
        <svg
          ref={svgRef}
          width={svgWidth * transform.scale + Math.abs(transform.x) + 40}
          height={svgHeight * transform.scale + Math.abs(transform.y) + 40}
          aria-label="Course prerequisite tree"
          role="img"
        >
          <defs>
            {/* Prereq arrowhead */}
            <marker
              id="arr-prereq"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#005035" />
            </marker>
            {/* Dimmed arrowhead */}
            <marker
              id="arr-prereq-dim"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#C0C0BC" />
            </marker>
          </defs>

          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* ---- Edges ---- */}
            {edges.map(({ from, to, type }) => {
              const fn = nodeById[from];
              const tn = nodeById[to];
              if (!fn || !tn) return null;
              const dim   = dimEdge(from, to);
              const path  = elbowPath(fn, tn);
              const isFocused = focusId && connectedIds.has(from) && connectedIds.has(to);
              return (
                <path
                  key={`${from}→${to}`}
                  d={path}
                  className={[
                    'prereq-edge',
                    dim       ? 'prereq-edge--dim'     : '',
                    isFocused ? 'prereq-edge--focused' : '',
                  ].join(' ')}
                  markerEnd={dim ? 'url(#arr-prereq-dim)' : 'url(#arr-prereq)'}
                />
              );
            })}

            {/* ---- Nodes ---- */}
            {nodes.map(({ id, course, semKey, x, y }) => {
              if (!course) return null;
              const color      = SEMESTER_COLORS[semKey] ?? SEMESTER_COLORS.unassigned;
              const isInPlan   = planCourseIds.has(id);
              const dim        = dimNode(id);
              const isSelected = selectedId === id;
              const isHovered  = hoveredId === id;

              return (
                <g
                  key={id}
                  className={[
                    'prereq-node',
                    dim        ? 'prereq-node--dim'      : '',
                    isSelected ? 'prereq-node--selected' : '',
                    isHovered  ? 'prereq-node--hovered'  : '',
                    !isInPlan  ? 'prereq-node--phantom'  : '',
                  ].join(' ')}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => setSelectedId((prev) => (prev === id ? null : id))}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${course.alpha_code} ${course.numeric_code}: ${course.title}`}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedId((prev) => (prev === id ? null : id));
                    }
                  }}
                >
                  {/* Card background */}
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={6}
                    ry={6}
                    className="prereq-node-rect"
                    style={{
                      fill:   color.bg,
                      stroke: isSelected ? '#FFD700' : color.border,
                      strokeWidth: isSelected ? 3 : 2,
                    }}
                  />
                  {/* Not-in-plan indicator: dashed border overlay */}
                  {!isInPlan && (
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={6}
                      ry={6}
                      fill="none"
                      stroke={color.border}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      opacity={0.7}
                    />
                  )}

                  {/* Course code */}
                  <text
                    x={NODE_W / 2}
                    y={20}
                    textAnchor="middle"
                    className="prereq-node-code"
                    style={{ fill: color.text }}
                  >
                    {course.alpha_code} {course.numeric_code}
                  </text>

                  {/* Course title (truncated) */}
                  <text
                    x={NODE_W / 2}
                    y={38}
                    textAnchor="middle"
                    className="prereq-node-title"
                    style={{ fill: color.text, opacity: 0.85 }}
                  >
                    {course.title.length > 22
                      ? course.title.slice(0, 21) + '…'
                      : course.title}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Detail panel for selected node */}
      {selectedNode && selectedNode.course && (
        <div className="prereq-tree-detail">
          <div className="prereq-tree-detail-header">
            <span
              className="prereq-tree-detail-badge"
              style={{
                background: (SEMESTER_COLORS[selectedNode.semKey] ?? SEMESTER_COLORS.unassigned).bg,
                color:      (SEMESTER_COLORS[selectedNode.semKey] ?? SEMESTER_COLORS.unassigned).text,
              }}
            >
              {selectedNode.course.alpha_code} {selectedNode.course.numeric_code}
            </span>
            <span className="prereq-tree-detail-sem">
              {(SEMESTER_COLORS[selectedNode.semKey] ?? SEMESTER_COLORS.unassigned).label}
              {!planCourseIds.has(selectedNode.id) && (
                <span className="prereq-tree-detail-phantom"> (prerequisite only — not in your plan)</span>
              )}
            </span>
          </div>
          <div className="prereq-tree-detail-title">{selectedNode.course.title}</div>
          <div className="prereq-tree-detail-desc">{selectedNode.course.description}</div>
          <div className="prereq-tree-detail-meta">
            <span>{selectedNode.course.credit_hours} credit hours</span>
            <span>· {selectedNode.course.alpha_code} department</span>
          </div>
          {/* Incoming prereqs */}
          {(() => {
            const prereqNodes = edges
              .filter(({ to }) => to === selectedNode.id)
              .map(({ from }) => nodeById[from])
              .filter(Boolean);
            if (prereqNodes.length === 0) return null;
            return (
              <div className="prereq-tree-detail-prereqs">
                <span className="prereq-tree-detail-label">Requires:</span>
                {prereqNodes.map((pn) => (
                  <button
                    key={pn.id}
                    type="button"
                    className="prereq-tree-detail-link"
                    onClick={() => setSelectedId(pn.id)}
                  >
                    {pn.course?.alpha_code} {pn.course?.numeric_code}
                  </button>
                ))}
              </div>
            );
          })()}
          {/* Outgoing (unlocks) */}
          {(() => {
            const unlockedNodes = edges
              .filter(({ from }) => from === selectedNode.id)
              .map(({ to }) => nodeById[to])
              .filter(Boolean);
            if (unlockedNodes.length === 0) return null;
            return (
              <div className="prereq-tree-detail-prereqs">
                <span className="prereq-tree-detail-label">Unlocks:</span>
                {unlockedNodes.map((un) => (
                  <button
                    key={un.id}
                    type="button"
                    className="prereq-tree-detail-link"
                    onClick={() => setSelectedId(un.id)}
                  >
                    {un.course?.alpha_code} {un.course?.numeric_code}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <Legend semKeys={semKeys} />
    </div>
  );
}
