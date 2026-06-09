<p align="center">
  <img src="docs/images/banner.png" width="100%" alt="ZEALWISH — Create. Grow. Own your AI character." />
</p>

<p align="center">
  <a href="https://github.com/KINGKAZMAX/OCWORLD-WEB/stargazers"><img src="https://img.shields.io/github/stars/KINGKAZMAX/OCWORLD-WEB?style=for-the-badge&color=FF2D55&labelColor=0A0A0A" alt="Stars" /></a>
  <a href="https://github.com/KINGKAZMAX/OCWORLD-WEB/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Private-FF2D55?style=for-the-badge&labelColor=0A0A0A" alt="License" /></a>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&labelColor=0A0A0A" alt="React" />
  <img src="https://img.shields.io/badge/Electron-35-47848F?style=for-the-badge&logo=electron&labelColor=0A0A0A" alt="Electron" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&labelColor=0A0A0A" alt="TypeScript" />
</p>

<p align="center">
  <strong>English</strong>
</p>

<p align="center">
  <a href="#what-is-zealwish">What is ZEALWISH</a> &bull;
  <a href="#key-features">Features</a> &bull;
  <a href="#screenshots">Screenshots</a> &bull;
  <a href="#competitive-positioning">Why ZEALWISH</a> &bull;
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#tech-stack">Stack</a> &bull;
  <a href="#roadmap">Roadmap</a>
</p>

---

> **ZEALWISH is the first AI character platform where you create, grow, and truly own a living digital companion — backed by persistent memory and Web3 identity.**

---

## What is ZEALWISH?

ZEALWISH is a character life system, not a productivity assistant or a chatbot wrapper. It lets anyone create an AI character with a visual identity, personality, and voice — then build a real relationship through daily conversations, shared moments, and growing memory.

The AI companion market has proven demand: Character.AI reached 20M monthly active users; Replika surpassed 30M registered users. But every existing platform shares the same flaw — **your character, memories, and relationship history belong to the platform, not to you.** When the service shuts down or changes its terms, everything is gone.

ZEALWISH introduces the missing layer: **ownership.** Your AI character's identity, memory vault, and relationship state can be represented as a portable, user-owned asset. NFT is not the product — ownership is the product. The character can move across future apps, games, creator worlds, and agent networks.

## Our Vision

1. **Characters should belong to people, not platforms.** An AI companion that holds your memories, taste, and relationship history should never be rented from one company forever.
2. **Memory creates continuity.** A companion becomes real when it remembers — not when it responds. Persistent memory is the emotional spine of any meaningful AI relationship.
3. **Open ecosystems beat walled gardens.** The long-term value of an AI character multiplies when it can travel across social platforms, games, creator tools, and agent networks.

## Key Features

- **Create Your OC** — Generate a visual AI character from a text prompt. Choose a visual style (pixel art, anime, cyber, 3D figure, comic ink, arcade), define personality and voice, then shape the being through interaction.
- **Persistent Memory Vault** — Conversations, moments, preferences, rituals, and emotional context become a structured relationship timeline instead of disposable chat history. Your character remembers grandma's osmanthus cake, your sleep schedule, and how your week went.
- **Intimacy Growth System** — A four-stage relationship model (Stranger → Familiar → Friend → Intimate) that evolves through daily interaction. The character's tone, behavior, and responses shift as the bond deepens.
- **Onboarding Ritual** — A cinematic four-step character creation ceremony: ignition → visual style selection → character prompt → first meeting. Not a form to fill out — a moment to experience.
- **Web3 Ownership Layer** — Character identity, memory vault, and provenance can be minted as portable on-chain assets. Users hold the keys to their AI companion's existence.
- **Multi-Platform Runtime** — Runs as an Electron desktop app with a local AI agent runtime (Hermes), and as a standalone web application accessible from any browser.
- **Bilingual Interface** — Full English and Chinese (中文) support with instant language switching.
- **Command Palette (⌘K)** — Fast navigation across all views: Plaza, Talk, Rewind, Record, Settings, and session management.

## Screenshots

| Landing Page | Character Creation |
|:---:|:---:|
| ![Landing](docs/images/hero-landing.png) | ![Create OC](docs/images/create-oc.png) |

| Chat Interface | Memory Archive |
|:---:|:---:|
| ![Chat](docs/images/chat-interface.png) | ![Memory](docs/images/memory-archive.png) |

| Ownership & Market |
|:---:|
| ![Ownership](docs/images/ownership-market.png) |

## Competitive Positioning

The AI companion market is growing rapidly (60M+ downloads in H1 2025, $120M+ sector revenue), but every major player is a walled garden. Here is how ZEALWISH compares:

| Capability | Character.AI | Replika | Kindroid | Nomi.ai | **ZEALWISH** |
|:---|:---:|:---:|:---:|:---:|:---:|
| Character creation | Breadth (18M+) | Single companion | Deep customization | Single companion | **Create + customize** |
| Long-term memory | Basic | Yes | Unlimited | Human-level | **Structured vault** |
| Relationship growth | Minimal | Yes | Minimal | Evolving | **4-stage intimacy** |
| User owns character | No | No | No | No | **Web3 identity** |
| Portable across platforms | No | No | No | No | **Open portability** |
| Creator economy | None | None | None | None | **Planned marketplace** |
| Open source | No | No | No | No | **Yes** |

**The gap ZEALWISH fills:** Character.AI proved people want to create AI characters (20M MAU). Replika proved people form deep bonds with AI (30M users). Kindroid and Nomi proved memory and customization drive engagement. **Nobody has connected these capabilities with ownership.** That intersection is ZEALWISH's wedge.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    ZEALWISH                         │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Landing     │  │  App Shell   │  │  Web3      │ │
│  │  (React 18)  │  │  (Electron)  │  │  Layer     │ │
│  │  CDN + Babel │  │  Vite + TS   │  │  Identity  │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                │        │
│  ┌──────┴─────────────────┴────────────────┴──────┐ │
│  │              Shared Runtime Layer              │ │
│  │  Hermes Agent · Memory Vault · TTS · Image Gen │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|:---|:---|
| Desktop runtime | Electron 35 |
| Frontend (app) | React 18, TypeScript 5.8, Vite 6 |
| Frontend (web landing) | React 18 via CDN + Babel standalone |
| Local AI agent | Hermes Agent (Python) |
| Memory system | Local JSON persistence with structured vault |
| Image generation | Marswave GPT-Image-2 (16:9, 2K) |
| TTS | Browser SpeechSynthesis / Remote TTS adapter |
| Testing | Vitest |
| Ownership layer | Web3 identity protocol (planned) |

## Quick Start

### Web (Landing Page + App Shell)

No build step required. Serve the `frontend-v4` directory with any static server:

```bash
# Python
python3 -m http.server 8789 --directory frontend-v4

# Node.js
npx serve frontend-v4

# Then open
open http://localhost:8789
```

### Desktop App (Electron)

```bash
npm install
npm run dev
```

### Build & Test

```bash
npm run build
npm run test
```

## FAQ

**Do I need an API key or cloud service?**
No. The web version runs entirely in the browser with mock fallbacks. The desktop app can connect to a local Hermes Agent for full AI capabilities, but works without it.

**Is my data private?**
Yes. All memory, conversation history, and character data are stored locally on your device. Nothing is sent to external servers unless you explicitly connect a remote AI provider.

**What does "ownership" actually mean here?**
The ownership layer represents your character's identity, memory, and provenance as a portable record. Today this is a local JSON vault. The roadmap includes on-chain minting so the identity can be carried across platforms — the character follows you, not the other way around.

**Can I create multiple characters?**
Yes. The system supports multiple OC profiles with independent memory vaults and relationship states.

**Is this a crypto project?**
ZEALWISH uses Web3 as an ownership infrastructure, not as the product. The AI character experience comes first. Blockchain is the layer that makes identity portable and durable.

## Roadmap

- **v0.4** (current) — Working prototype with character creation, chat, memory vault, intimacy system, bilingual UI
- **v0.5** — Web3 identity minting, character export/import, enhanced memory visualization
- **v1.0** — Creator marketplace, cross-platform character portability, community character worlds
- **Future** — A2A (Agent-to-Agent) dialogue network, game integration SDK, voice-first companion mode

## Status

ZEALWISH is an active prototype built for the [UCWS Singapore Hackathon 2026](https://evol.epicconnector.ai/events/ucws-singapore-hackathon---2026-cxgy). The codebase evolved from the OCWORLD project, repositioned with a global English-first narrative and Web3 ownership architecture.

## Acknowledgements

Built with [React](https://react.dev), [Electron](https://www.electronjs.org), [Vite](https://vitejs.dev), and [JetBrains Mono](https://www.jetbrains.com/lp/mono/).

## License

Private — All rights reserved.
