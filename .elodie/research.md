# Obsidian Graph View — Deep Research

---

## 1. Libraries & Rendering Stack Used by Obsidian

Obsidian is an Electron app (Chromium + Node.js). The graph view specifically uses:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Rendering** | Custom **WebGL** renderer (previously PIXI.js, migrated to a bespoke WebGL pipeline) | Drawing nodes, edges, labels at 60fps with thousands of nodes |
| **Physics engine** | Custom force simulation heavily inspired by **d3-force** | Computing node positions each tick |
| **Spatial indexing** | **Quadtree** (Barnes-Hut approximation) | O(n log n) repulsion instead of O(n²) brute-force |
| **Text rendering** | WebGL SDF (Signed Distance Field) text or Canvas 2D texture atlas | Crisp labels at any zoom level |
| **Interaction** | Custom pan/zoom with wheel + drag (not d3-zoom) | Navigation within the graph |

### Why WebGL over Canvas 2D?
- Canvas 2D issues draw calls per-shape; at ~1000+ nodes with edges, the CPU bottlenecks on path construction and fill.
- WebGL batches all circles into a single draw call using instanced rendering (one vertex buffer, one draw call for all nodes).
- Edge lines become a single GL_LINES draw call.
- Result: Obsidian handles 10,000+ node graphs smoothly.

### d3-force — The Foundation
Obsidian's physics is modeled on [d3-force](https://github.com/d3/d3-force), which provides composable force functions:
- `forceCenter` — gravitational pull toward viewport center
- `forceManyBody` — mutual repulsion (Coulomb-like charge) with Barnes-Hut optimization
- `forceLink` — spring forces along edges (Hooke's law)
- `forceCollide` — overlap prevention (not used by Obsidian, but available)
- `forceX` / `forceY` — positional constraints

Obsidian likely forks or reimplements these rather than importing the npm package directly, since it customizes alpha decay, has WebGL rendering hooks, and manages the tick loop itself.

---

## 2. All Obsidian Graph View Sliders & Controls

### 2.1 Filters (top section)
| Control | Type | What It Does |
|---------|------|-------------|
| **Search filter** | Text input | Query-based filter — only matching notes and their neighbors are shown. Uses Obsidian's search syntax (`path:`, `tag:`, `file:`, etc.) |
| **Tags** | Toggle | Show/hide tag nodes (tags appear as separate nodes with edges to notes that use them) |
| **Attachments** | Toggle | Show/hide attachment nodes (images, PDFs, etc.) |
| **Existing files only** | Toggle | Hide "ghost" nodes (linked-to notes that don't actually exist yet) |
| **Orphans** | Toggle | Show/hide notes with zero connections |

### 2.2 Groups
| Control | Type | What It Does |
|---------|------|-------------|
| **New group** | Button + query + color picker | Create a color group. Any note matching the search query gets that color. Multiple groups stack (last wins). Used for visual categorization by folder, tag, or any search query. |

### 2.3 Display
| Control | Type | What It Does |
|---------|------|-------------|
| **Arrows** | Toggle | Show directional arrows on edges (indicates link direction — which note links to which) |
| **Text fade threshold** | Slider | Zoom level at which note title labels begin to appear. Low = labels visible when zoomed out, high = labels only visible when zoomed in close. This is a **LOD (level-of-detail)** optimization — at far zoom, labels are too small to read so they're culled entirely. |
| **Node size** | Slider | Base radius of nodes. Nodes with more connections are still proportionally larger (Obsidian scales by degree), but this shifts the whole scale up/down. |
| **Line thickness** | Slider | Stroke width of edges connecting nodes. |

### 2.4 Forces (the physics engine)
| Slider | Default | Range | What It Controls |
|--------|---------|-------|-----------------|
| **Center force** | ~0.5 | 0–1 | Strength of gravitational pull toward the center of the viewport. Higher = tighter overall cluster. Prevents nodes from drifting to infinity. Maps to d3's `forceCenter` strength. |
| **Repel force** | ~0.5 | 0–1 | Strength of mutual repulsion between all node pairs. Higher = more spacing between nodes. Maps to d3's `forceManyBody` charge parameter (negative = repulsive). |
| **Link force** | ~0.5 | 0–1 | Strength of spring attraction along edges. Higher = linked nodes pull closer. Maps to d3's `forceLink` strength. |
| **Link distance** | ~0.5 | 0–1 | The natural/rest length of the spring connecting linked nodes. Higher = longer rest length = linked nodes settle farther apart. Maps to d3's `forceLink` distance parameter. |

### Key Difference from Current Implementation
Your current implementation has **attraction**, **repulsion**, and **inherent attraction** — but is missing:
- **Center force** as a separate slider (Obsidian uses this to keep the whole graph from drifting)
- **Link distance** (rest length of springs — you currently only have pull strength, not target distance)
- **Text fade threshold** (LOD for labels)
- **Node size** slider (you have a fixed `r: 4`)

---

## 3. The Orphan Ring Phenomenon

### Observation
> "Records that don't have connections/links form a ring around the main circles."

### Why This Happens — The Math

In a force-directed layout, every node experiences:
1. **Center force** — pulls toward viewport center: $\vec{F}_{center} = -k_c \cdot \vec{r}$ (linear spring toward origin)
2. **Repulsion** — pushes away from every other node: $\vec{F}_{repel} = \frac{k_r}{|\vec{r}_{ij}|^2} \cdot \hat{r}_{ij}$ (inverse-square, Coulomb-like)
3. **Link force** — pulls toward connected neighbors: $\vec{F}_{link} = -k_l \cdot (|\vec{r}_{ij}| - d_0) \cdot \hat{r}_{ij}$ (Hooke's law spring)

**Connected nodes** experience all three forces. The link forces bind them into a dense cluster near the center. They resist the repulsion from other connected nodes because the spring force keeps pulling them back.

**Orphan nodes** (no connections) experience only center force and repulsion — **no link force**. Here's what happens:

1. Center force pulls them inward toward the connected cluster.
2. But the connected cluster is dense and every node in it repels the orphan.
3. The orphan settles at the radius $r^*$ where center pull exactly balances total repulsion from the cluster:

$$k_c \cdot r^* = \sum_{j \in \text{cluster}} \frac{k_r}{|r^* - r_j|^2}$$

4. Since the cluster is roughly centered and all orphans experience the same balance point, they all settle at approximately the same distance from center.

5. Once at that radius, orphans still repel **each other**. Equal repulsion among points constrained to a shell naturally distributes them uniformly — forming a **ring** (in 2D) or sphere (in 3D).

### The Ring is Actually Correct Behavior
This isn't a bug — it's the mathematically expected equilibrium. Obsidian shows the same pattern. The ring visually communicates "these notes are isolated" which is genuinely useful information.

### If You Want to Break the Ring
- Add slight random noise to orphan positions each tick
- Give orphans a weaker center force so they spread out more
- Place orphans in a separate layout region (Obsidian's "Orphans" toggle hides them entirely)
- Use a different arrangement for orphans (grid, random scatter with collision)

---

## 4. Why Nodes Don't Cluster Tightly Even With High Attraction

### Diagnosis of Current Implementation

Looking at the current code, the issue is in the force scaling:

```js
// Current centroid pull
const base = inh * 0.0000001    // incredibly small
const boost = attr * 0.000001   // still very small
nodes[i].vx += dx * (base + boost)

// Current pairwise attraction
const f = 0.000001 * (1 + inh + attr)  // also tiny
```

**Problem 1: Force magnitudes are too small relative to velocities.**
With `vx/vy` starting at `±0.3` and damping of `0.98`, the velocity has an effective magnitude of ~15 pixels/frame after initial settle (0.3 / 0.02 = 15). But the attraction forces are `~1e-6 * distance`, which for a 300px gap is `~0.0003` per tick. It takes thousands of frames to meaningfully change velocity.

**Problem 2: Repulsion radius is too small.**
```js
if (distSq < minDist * rep * 10 && distSq > 0.1) {
  const force = rep * 0.3 / distSq
```
`minDist = 400`, `rep * 10 = 5`, so repulsion only activates at `distSq < 2000` → within ~45px. But attraction pulls from anywhere. This means nodes settle into medium-distance arrangements where neither force acts strongly — a "dead zone."

**Problem 3: No cooling schedule / alpha decay.**
d3-force uses an **alpha** value (starts at 1.0, decays toward 0) that scales all forces. This is simulated annealing — high energy early (big movements to find structure), then cooling to fine-tune. Without it, the system never "settles" properly; it just oscillates.

### How to Fix
1. **Scale forces properly**: attraction should produce accelerations of ~0.01–0.1 px/frame², not 1e-6.
2. **Use alpha decay**: Multiply all forces by `alpha`, which decays from 1.0 to ~0.001 over time.
3. **Repulsion should have infinite range** (just gets weaker with distance) — don't hard-cutoff at 45px.
4. **Link distance**: Attract when beyond rest length, *repel when closer* — this is what creates structure.

---

## 5. The Math: Force-Directed Graph Algorithms

### 5.1 The Fundamental Model

A force-directed graph solves for node positions $\{(x_i, y_i)\}$ by simulating a physical system until it reaches equilibrium. Every node is a charged particle; every edge is a spring.

**Total energy to minimize:**

$$E = \sum_{(i,j) \in \text{edges}} \frac{1}{2} k_l (|\vec{r}_{ij}| - d_0)^2 + \sum_{i \neq j} \frac{k_r}{|\vec{r}_{ij}|} + \sum_i \frac{1}{2} k_c |\vec{r}_i|^2$$

The system evolves by:

$$\vec{v}_i(t+1) = \alpha \cdot \left[ \vec{v}_i(t) \cdot \text{damping} + \sum \vec{F}_i \right]$$
$$\vec{r}_i(t+1) = \vec{r}_i(t) + \vec{v}_i(t+1)$$

Where $\alpha$ is the cooling parameter.

### 5.2 Individual Force Equations

#### Repulsion (Coulomb's Law — All Pairs)
Every node repels every other node:

$$\vec{F}_{repel}(i, j) = -\frac{k_r}{|\vec{r}_{ij}|^2} \cdot \hat{r}_{ij}$$

- $k_r$ = repulsion strength (Obsidian's "Repel force" slider scales this)
- $\hat{r}_{ij}$ = unit vector from $j$ to $i$
- Negative sign = pushes away

**Typical value**: $k_r \approx -30$ in d3-force (negative charge = repulsive). Obsidian's slider [0,1] maps to something like $k_r \in [-100, 0]$.

#### Attraction / Link Force (Hooke's Law — Along Edges Only)
Each edge acts as a spring:

$$\vec{F}_{link}(i, j) = k_l \cdot (|\vec{r}_{ij}| - d_0) \cdot \hat{r}_{ij}$$

- $k_l$ = link strength. d3-force defaults to $1 / \min(\text{degree}(i), \text{degree}(j))$ — weaker springs for high-degree nodes (prevents hairball collapse).
- $d_0$ = rest length (Obsidian's "Link distance" slider). Default ~30px.
- When $|\vec{r}_{ij}| > d_0$: attractive (pulls together)
- When $|\vec{r}_{ij}| < d_0$: repulsive (pushes apart) — **this is key for structure**

#### Center Force (Gravitational Well)
Prevents the graph from drifting:

$$\vec{F}_{center}(i) = -k_c \cdot (\vec{r}_i - \vec{r}_{center})$$

- $k_c$ = center strength (Obsidian's "Center force" slider)
- Linear pull toward viewport center
- Typical: $k_c \approx 0.1$

### 5.3 Alpha Decay (Simulated Annealing)

This is the single most important optimization for organic-feeling graphs:

$$\alpha(t+1) = \alpha(t) + (\alpha_{target} - \alpha(t)) \cdot \alpha_{decay}$$

- $\alpha_0 = 1.0$ (initial)
- $\alpha_{target} = 0$ (equilibrium)
- $\alpha_{decay} \approx 0.0228$ (d3-force default, chosen so alpha ≈ 0.001 after 300 ticks)

All forces are multiplied by $\alpha$ before application:

$$\vec{v}_i \mathrel{+}= \vec{F}_i \cdot \alpha$$

**Why this matters**: Without alpha decay, forces keep pushing nodes around forever. With it:
- **Early ticks** ($\alpha \approx 1$): Big movements, discover global structure
- **Middle ticks** ($\alpha \approx 0.1$): Refine clusters
- **Late ticks** ($\alpha \approx 0.001$): Micro-adjustments, system "freezes" in place

When a user drags a node or changes a slider, **alpha is "reheated"** (set back to ~0.3) so the graph re-organizes with new parameters.

### 5.4 Velocity Verlet Integration

d3-force uses a variant of Velocity Verlet (more stable than Euler):

```
v(t + dt) = v(t) * damping + F(t) * alpha
x(t + dt) = x(t) + v(t + dt)
```

Damping (called `velocityDecay` in d3): default **0.4** — meaning velocity is multiplied by 0.6 each tick. This is much more aggressive than your `0.98` damping. Higher damping → faster convergence, less "bouncing."

**Your code uses 0.98, d3 uses 0.6.** This is likely why your simulation feels "floaty" and nodes don't settle — they retain too much velocity.

### 5.5 Barnes-Hut Optimization (O(n log n) Repulsion)

Brute-force repulsion is $O(n^2)$. For 1000 nodes, that's 500,000 pair calculations per tick at 60fps = 30M/sec. Barnes-Hut reduces this to $O(n \log n)$:

**Algorithm:**
1. Build a **quadtree** from all node positions (O(n log n))
2. For each node, traverse the quadtree:
   - If a cell is "far enough away" (cell width / distance < θ, where θ ≈ 0.9), treat the entire cell as a single point with combined charge at the center of mass
   - Otherwise, recurse into the cell's children
3. Compute repulsion from the approximated points

**Effect**: Instead of computing $n-1$ repulsion vectors per node, you compute $\sim \log n$. For 5000 nodes: 5000² = 25M → 5000 × 12 ≈ 60K calculations per tick.

**Implementation sketch:**
```
class QuadTree:
    bounds: {x, y, width, height}
    body: Node | null          # leaf: single node
    children: [NW, NE, SW, SE] # internal: 4 quadrants
    totalCharge: number        # sum of charges in subtree
    centerOfMass: {x, y}      # weighted center of all nodes in subtree

function computeRepulsion(node, quadTreeCell):
    if cell is empty: return
    dx = cell.centerOfMass.x - node.x
    dy = cell.centerOfMass.y - node.y
    dist = sqrt(dx² + dy²)
    
    if cell.width / dist < θ OR cell is leaf:
        # Treat cell as single body
        force = cell.totalCharge / dist²
        node.vx += dx / dist * force
        node.vy += dy / dist * force
    else:
        # Too close — recurse into children
        for child in cell.children:
            computeRepulsion(node, child)
```

### 5.6 Degree-Based Sizing (Obsidian's Node Size Logic)

Obsidian scales node radius by connectivity:

$$r_i = r_{base} + k \cdot \sqrt{\text{degree}(i)}$$

Or sometimes:

$$r_i = r_{base} \cdot (1 + \log(1 + \text{degree}(i)))$$

This gives a visual weight to well-connected "hub" notes. The `Node size` slider controls $r_{base}$.

### 5.7 Fruchterman-Reingold Reference

An alternative classic algorithm (historically influential):

**Attraction**: $f_a(d) = \frac{d^2}{k}$ where $k = C \cdot \sqrt{\frac{\text{area}}{|V|}}$

**Repulsion**: $f_r(d) = \frac{-k^2}{d}$

**Cooling**: temperature $T$ decreases linearly each iteration. Node displacement is capped at $T$:

$$\vec{\delta}_i = \frac{\vec{F}_i}{|\vec{F}_i|} \cdot \min(|\vec{F}_i|, T)$$

This is simpler than d3-force but less flexible. d3's modular approach (composable forces) is more practical.

---

## 6. Alternative Productive Views for Records/Templates

Beyond a "cool-looking" graph, here are views that make force-directed graphs genuinely useful:

### 6.1 Local Graph View (Ego-Centric)
**What**: Click a node → show only that node + its direct connections (1-hop neighbors). Optionally extend to 2-hop.
**Why it's productive**: Global graphs become hairballs. Local view answers "what is this record connected to?" instantly. Obsidian's local graph view (visible in the right sidebar) is one of its most-used features.
**Implementation**: Filter the node set to just `selectedNode ∪ neighbors(selectedNode)`. Re-run force layout on the subgraph.

### 6.2 Search-Filtered Graph
**What**: Type a query → only matching records (and their edges) are displayed. Non-matching nodes fade or disappear.
**Why it's productive**: "Show me all records linked to template X" or "all records with status = Active" — instantly see the subgraph structure.
**Implementation**: Apply a filter predicate to nodes. Fade non-matching (alpha = 0.1) rather than removing (preserves spatial context).

### 6.3 Group Coloring by Arbitrary Properties
**What**: Create named groups with colors based on queries (Obsidian's "Groups" feature). E.g., "path:Projects → blue", "tag:urgent → red".
**Why it's productive**: Instant visual categorization. You already color by template — extend this to status, date range, or any field value.

### 6.4 Depth/Distance View
**What**: Select a "root" node. Color all other nodes by graph distance (hops) from root. 1-hop = bright, 2-hop = medium, 3+ = faded.
**Why it's productive**: Reveals the "neighborhood" structure of any record. Answers "how closely related is Record A to Record B?"

### 6.5 Timeline-Anchored Graph
**What**: X-axis represents time (creation/modification date). Nodes are placed based on their date along X, force-directed along Y only.
**Why it's productive**: See when records were created and how temporal neighbors relate. Reveals bursts of activity and temporal patterns.

### 6.6 Template-Clustered Force Layout (Your Current Approach, Enhanced)
**What**: Treat each template as a "super-node" with gravitational pull. Records orbit their template centroid. Cross-template edges create inter-cluster tension.
**Enhancement**: Add a **cluster force** — a dedicated force that pulls same-template nodes toward a shared point, independent of the general physics. d3 has `forceCluster` implementations that do this efficiently.

### 6.7 Matrix / Adjacency View
**What**: Rows = records, columns = records. Cell = colored if linked. Group rows/columns by template.
**Why it's productive**: At scale, graphs become unreadable — matrices don't. You can spot patterns (dense blocks = highly interconnected groups, off-diagonal blocks = inter-template connections) that are invisible in node-link views.

### 6.8 Hierarchical / Tree View (for Parent-Child Records)
**What**: If records have a parent-child relationship (e.g., Sample → Sub-Sample), display as a collapsible tree rather than a force graph.
**Why it's productive**: Trees convey hierarchy; force graphs don't. Mixed view: force layout for cross-links, tree layout for hierarchies.

### 6.9 MOC (Map of Content) Pattern
**What**: Specific "index" records that link to clusters of related records. The graph centers on these MOC nodes, with sub-clusters radiating from them.
**Why it's productive**: Creates navigable structure in large vaults. Translates well to records: a "Project" record linking to all its "Samples", "Animals", etc.

### 6.10 Side-by-Side: Record Detail + Graph
**What**: Click a node → full record detail panel slides in from the side (or bottom). The graph stays interactive alongside it.
**Why it's productive**: You already have hover/click detail. Enhance with: editable fields, status changes, and a mini local-graph showing just that record's connections.

---

## 7. Summary of Recommended Changes for Current Implementation

Based on this research, here's what would bring the current graph closer to Obsidian-quality:

### Physics Fixes (highest impact)
1. **Add alpha decay**: Start `alpha = 1.0`, decay toward 0 each tick. Multiply all forces by alpha. Reheat on interaction.
2. **Increase damping**: Change from `0.98` to `~0.6` (velocityDecay = 0.4 in d3 terms means multiply by 0.6).
3. **Scale forces properly**: Attraction should be `~0.01–0.1` per unit distance, not `1e-6`.
4. **Remove repulsion distance cutoff**: Let repulsion work at all distances (it falls off as $1/r^2$ naturally).
5. **Add rest length to springs**: Attract when beyond rest length, repel when closer.

### New Sliders
6. **Center force** slider — separate from attraction
7. **Link distance** slider — controls rest length of springs between same-template nodes
8. **Node size** slider — base radius
9. **Text fade threshold** — hide labels when zoomed out (relevant if you add zoom/pan)

### Performance
10. **Barnes-Hut quadtree** for repulsion — not urgent at 25 nodes, critical at 500+.
11. **WebGL rendering** — not urgent at current scale, needed for 1000+.

### Productive Features
12. **Local graph** on click — show only selected node + neighbors
13. **Filter by template** or field values in the graph
14. **Degree-based node sizing** — bigger nodes = more connections
15. **Orphan toggle** — hide/show unconnected nodes

### Force Constant Reference (starting points)
| Force | Constant | Suggested Range |
|-------|----------|----------------|
| Center | $k_c$ | 0.01 – 0.3 |
| Repulsion | $k_r$ | -100 – -10 (negative = repulsive) |
| Link strength | $k_l$ | 0.01 – 0.5 |
| Link distance | $d_0$ | 20 – 200 px |
| Damping (velocity decay) | $d$ | 0.4 – 0.7 (multiply velocity by $1 - d$) |
| Alpha decay | $\alpha_d$ | 0.01 – 0.05 per tick |

---

## 8. Quick Reference: d3-force Default Configuration

For reference, here's what d3-force uses out of the box (and what Obsidian is derived from):

```js
const simulation = d3.forceSimulation(nodes)
  .force("charge", d3.forceManyBody()
    .strength(-30)              // repulsion
    .theta(0.9)                 // Barnes-Hut accuracy (0.9 = fast, 0.5 = accurate)
    .distanceMin(1)             // min distance (prevents explosion at overlap)
    .distanceMax(Infinity))     // no cutoff — repulsion works everywhere
  .force("link", d3.forceLink(links)
    .strength(1 / minDegree)    // weaker springs for highly-connected nodes
    .distance(30)               // rest length
    .iterations(1))             // constraint iterations per tick
  .force("center", d3.forceCenter(width/2, height/2)
    .strength(0.1))
  .alphaDecay(0.0228)          // alpha ≈ 0.001 after 300 ticks
  .alphaMin(0.001)             // simulation stops when alpha < this
  .velocityDecay(0.4)          // heavy damping
  .on("tick", render)
```

The fact that Obsidian builds on these exact primitives means you can adopt them directly and get identical behavior, then customize from there.
