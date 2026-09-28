# DocHarvest Website Redesign Plan

Status: approved for implementation in the next session.

Repository: `D:\gd-new\docs`
Product: DocHarvest / `docharvest`

## Objective

Redesign the complete website so visitors can quickly understand:

1. What DocHarvest does
2. Why raw documentation is a problem
3. How to use the CLI, GUI, MCP server, and Agent Skill
4. What outputs are produced
5. How integrations and connectivity work
6. Which workflow fits their needs

The redesign must avoid AI-design slop, preserve the existing brand identity, and improve product comprehension before adding technical depth.

## Design direction

Primary surface: **Decide / Learn**.

Secondary surfaces: **Configure**, **Operate**, and **Inspect**.

Preserve the existing "Index Sheet" brand language:

- Near-black/zinc palette
- One amber accent
- Square geometry
- Ruled section divisions
- Archivo/Geist Mono typography
- Monospace for commands, paths, outputs, and numbers
- Real screenshots and real artifacts

Remove or avoid:

- Generic SaaS bento grids
- Glassmorphism
- Gradient backgrounds
- Decorative shadows
- Repeated icon-plus-card patterns
- Fake dashboards or arbitrary metrics
- Excessive centered hero content
- Unverified performance claims

## New information architecture

1. **Header**
   - Product
   - How it works
   - Outputs
   - Integrations
   - Workflows
   - Docs
   - GitHub
   - Install

2. **Hero**
   - One clear product promise
   - Short explanation
   - One real install/capture command
   - Install and GitHub actions

3. **How it works**
   - Capture
   - Compile
   - Use anywhere

4. **Choose your workflow**
   - CLI
   - Desktop GUI
   - MCP server
   - Agent Skill

5. **Product walkthrough**
   - Capture Studio screenshot
   - Provider detection
   - Capture progress
   - Document Library screenshot
   - Search/export/use flow

6. **Outputs**
   - `pages/`
   - `docs.md`
   - `llms.txt`
   - `search.db`
   - RAG JSONL
   - PDF handbook
   - Version snapshots

7. **Connectivity and integrations**
   - MCP clients
   - Agent skill locations
   - Local output consumers
   - Expandable configuration examples

8. **Supported platforms**
   - Compact overview of detectors
   - Detailed detector table as secondary reference

9. **Proof and benchmarks**
   - Only source-backed measurements
   - Include benchmark context and provenance

10. **FAQ and final CTA**
    - Answer installation, privacy, support, MCP, scoping, versions, and unsupported-site questions

## Implementation phases

### Phase 0: Truth and content contract

Audit and normalize:

- Product naming
- Package and CLI commands
- MCP tool count
- Supported platforms
- Benchmark values
- Test count
- Screenshot labels
- Version references
- Metadata and SEO copy

Likely files:

- `docs/app/layout.tsx`
- `docs/lib/stats.ts`
- `docs/data/showcaseData.ts`
- `docs/data/manifest.json`
- `docs/data/index-data.json`
- `docs/components/Masthead.tsx`
- `docs/components/AgentTools.tsx`
- `docs/components/Workflows.tsx`

Also review the external `startupbar.co` script before retaining it.

### Phase 1: Rebuild page composition

Rewrite the landing page around focused components such as:

- `Hero`
- `HowItWorks`
- `WorkflowPaths`
- `ProductWalkthrough`
- `Outputs`
- `Connectivity`
- `SupportedPlatforms`
- `Proof`
- `Faq`
- `Footer`

Move highly technical reference material below the main product narrative or into expandable sections.

Likely files:

- `docs/app/page.tsx`
- `docs/components/ClientContainer.tsx`
- `docs/components/Header.tsx`
- `docs/components/Masthead.tsx`
- New components under `docs/components/`

### Phase 2: Clean the visual system

Update `docs/app/globals.css` to:

- Remove gradients
- Remove glassmorphism
- Remove decorative shadows
- Reduce repeated card surfaces
- Standardize ruled sections
- Improve content widths and spacing
- Improve mobile layout
- Preserve focus-visible and reduced-motion behavior
- Ensure 44px minimum touch targets

### Phase 3: Improve interaction design

Keep and refine:

- Copyable commands
- Install modal
- Theme toggle
- MCP configuration tabs
- Output explorer
- Workflow selection

Simplify or remove:

- Four-way hero command switcher
- Fake telemetry panels
- Decorative simulations without a user task
- Excessive hover transitions

Add:

- Persistent install action
- Clear active section state
- Keyboard-accessible tabs
- Mobile-safe code blocks
- Inline copy success feedback

### Phase 4: Rewrite content

Use the existing brand voice:

- Plain language
- Short sentences
- Show commands beside claims
- Explain technical terms on first use
- Avoid hype language
- Do not invent metrics, testimonials, or claims

### Phase 5: Verify

Run and verify:

- `npm run test:run`
- `npm run build`
- Fix the missing ESLint dependency/configuration, then run `npm run lint`
- Browser checks at 390px, 768px, and 1440px
- Keyboard-only navigation
- Focus states
- Copy interactions
- Theme toggle
- Install modal
- External links
- Console errors
- Responsive overflow

## Acceptance criteria

- The product is understandable in the first viewport.
- CLI, GUI, MCP, and Agent Skill paths are clearly differentiated.
- A working install command is reachable in one click.
- Outputs are explained with real filenames.
- Connectivity is understandable without reading a large table.
- No generic gradients, glass cards, fake dashboards, or filler sections.
- All claims and metrics have verified sources.
- Product, package, and CLI naming are consistent.
- The existing amber/zinc brand remains recognizable.
- Mobile has no horizontal page overflow.
- The page is keyboard and screen-reader accessible.

## Baseline before implementation

- `npm run test:run`: 63 tests passed
- `npm run build`: passed
- `npm run lint`: blocked because `eslint` is not available to the project script
- Existing untracked file: `repomix-architecture.xml`

## Next session starting point

Start with Phase 0: reconcile naming, commands, metrics, MCP tool counts, and source-of-truth data before changing the UI composition.
