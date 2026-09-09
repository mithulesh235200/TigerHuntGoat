# Aadu Pulli Amigo

Create a complete, fully playable, and beautifully designed web-based game of "Aadu Pulli Aatam" (Lambs and Tigers / Goats and Tigers) using React, Tailwind CSS, HTML5 Canvas or SVG, and TypeScript.

Build this as a standalone, zero-dependency browser application with a smart, local algorithmic AI opponent. Implement the following architecture and feature set:

### 1. BOARD GRAPH NETWORK & RULES ENGINE

- Map the traditional game board using the standard 23 intersecting vertex points (nodes) connected via a graph network (adjacency list representation).

- Include all valid lines:

  - Central triangular apex (top node connected to 3 base nodes).

  - Main 4x4 inner grid structure with diagonals and cross lines.

- Implement official Aadu Pulli Aatam rules:

  - Setup: 3 Tigers start at predefined apex/top positions; 15 Goats start off-board in the placement queue.

  - Phase 1 (Placement): The Goat player places 1 Goat per turn onto any empty vertex node. Goats cannot move until all 15 are placed. Tigers can move or capture during this phase.

  - Phase 2 (Movement): Once all 15 Goats are placed, Goats can move 1 step along connected lines to adjacent empty nodes.

  - Tiger Mechanics: Tigers move 1 step along valid lines OR capture a Goat by jumping over a single adjacent Goat into an empty space along a straight line path.

  - Win Conditions:

    - Goats Win: If all 3 Tigers are completely trapped and have zero valid moves or captures available.

    - Tigers Win: If Tigers capture 5 or more Goats (making it impossible for Goats to trap them).

### 2. SMART LOCAL AI OPPONENT (MINIMAX + ALPHA-BETA PRUNING)

- Implement a pure JavaScript/TypeScript AI algorithm (No external APIs or backends required).

- Add a toggle for Game Mode: "Player vs AI (Play as Goats vs AI Tiger)", "Player vs AI (Play as Tiger vs AI Goat)", or "Player vs Player (Local Hotseat)".

- For the AI Tiger algorithm, use Minimax with Alpha-Beta Pruning (Depth 3–5) with a custom heuristic evaluation function:

  - High priority (+1000 pts) for immediate Goat captures.

  - High priority (+100 pts) for mobility/freedom of movement (number of valid moves available for Tigers).

  - Penalty (-200 pts) if a Tiger becomes partially or fully cornered/isolated.

  - Strategic positioning rewards for holding high-mobility central nodes.

### 3. MODERN USER INTERFACE & EXPERIENCE

- Clean, aesthetic game board UI rendered using SVG or HTML Canvas with smooth drag-and-drop or click-to-select movement.

- Visual Indicators:

  - Highlight selectable pieces on hover/click.

  - Highlight valid target destination nodes and potential jump/capture moves.

  - Highlight the previous move path so players can follow AI turns easily.

- Sidebar Dashboard:

  - Turn Indicator (Current Turn: Goats / Tigers).

  - Goat Counter: "Goats Remaining to Place: X / 15" and "Goats Captured: X / 5".

  - Difficulty Selector (Easy: Random/Greedy, Medium: Minimax Depth 3, Hard: Minimax Depth 5).

  - Move History Log and Game Status Messages.

  - Action buttons: "New Game", "Reset Board", and "Undo Move".

### 4. ANIMATION & SOUND

- Smooth transitions for piece placement and movement animations.

- Sound effects (using Web Audio API or lightweight assets) for piece placement, captures, invalid move alerts, and win/loss states with a toggle mute button.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Online Rooms and Vercel

Online two-player rooms use Supabase Realtime for move synchronization. The app itself can be
deployed to Vercel; Supabase only provides the realtime channel.

1. Create a Supabase project and copy its project URL and anon key.
2. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`.
3. Run `npm run dev` and choose **Online** to create a room. Copy the invite link for the Tiger
  player.
4. Import the repository into Vercel. The Vercel preset is already configured in `vite.config.ts`.
5. Add the same two `VITE_` variables under Vercel project settings for Preview and Production,
  then redeploy.

The Supabase anon key is intended for browser use. Do not add a service-role key to the app or to
Vercel client environment variables.
