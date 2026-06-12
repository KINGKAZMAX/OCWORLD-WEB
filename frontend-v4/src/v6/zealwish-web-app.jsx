const { useCallback, useEffect, useMemo, useRef, useState } = React;

const ZEALWISH_BROWSER_AVATAR_FALLBACK = "assets/zealwish-main-character.png";

const WEB_CHAT_FALLBACKS = [
  "I hear you. Let's turn that into one clear next step.",
  "Saved as a character signal. Your passport can grow from moments like this.",
  "ZEALWISH keeps this identity close to your wallet, not trapped in one platform.",
  "That belongs in the memory vault. I can carry it forward from here."
];


const WEB_APP_ROUTES = {
  home: '#/home',
  create: '#/create',
  talk: '#/talk',
  memory: '#/memory',
  world: '#/world',
  rewind: '#/rewind',
  settings: '#/settings'
};

const WEB_APP_MODULES = [
  { id: 'home', label: 'Home', code: '00', title: 'Workspace' },
  { id: 'create', label: 'Create', code: '01', title: 'Character Passport' },
  { id: 'talk', label: 'Talk', code: '02', title: 'Companion Chat' },
  { id: 'memory', label: 'Memory', code: '03', title: 'Memory Vault' },
  { id: 'world', label: 'World', code: '04', title: 'World Layer' },
  { id: 'rewind', label: 'Rewind', code: '05', title: 'Timeline' },
  { id: 'settings', label: 'Settings', code: '06', title: 'Ownership Settings' }
];

const starterMemories = [
  "First character signal generated.",
  "Wallet ownership route is ready.",
  "Memory vault is waiting for the first real moment."
];

const DASHBOARD_QUEUE = [
  { label: "Start character creation", module: "create", detail: "Save the first passport record." },
  { label: "Continue companion chat", module: "talk", detail: "Turn a signal into memory." },
  { label: "Review memory vault", module: "memory", detail: "Check durable continuity notes." },
  { label: "Export ownership record", module: "settings", detail: "Download a portable JSON passport." }
];

const WORKSPACE_SIGNALS = [
  ["Passport", "Identity record"],
  ["Memory", "Continuity spine"],
  ["Wallet", "Ownership handle"],
  ["Export", "Portable state"]
];

function routeFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '') || 'home';
  return WEB_APP_MODULES.some((item) => item.id === raw) ? raw : 'home';
}

function getApiBaseLabel() {
  try {
    return window.ZEALWISH_API?.resolveApiBase?.() || 'not configured';
  } catch {
    return 'not configured';
  }
}

function getFallbackReply(text, historyLength = 0) {
  return WEB_CHAT_FALLBACKS[Math.abs(String(text || '').length + historyLength) % WEB_CHAT_FALLBACKS.length];
}

function toApiMessages(messages) {
  return (messages || []).map((message) => ({
    role: message.role === 'character' ? 'assistant' : 'user',
    content: message.text
  }));
}

function buildChatSystemPrompt(characterName, characterPrompt, memories) {
  return [
    `You are ${characterName || 'Signal Kid'}, a ZEALWISH wallet-owned AI character.`,
    `Identity: ${characterPrompt || 'A portable character passport.'}`,
    `Memory signals: ${(memories || []).slice(0, 5).join(' / ') || 'No durable memories yet.'}`,
    'Reply in concise English with a warm, companion-like tone.'
  ].join('\n');
}

// --- Voice conversation helpers (auto-speak replies + mic input) ---

const VOICE_PREF_KEY = 'zealwish.voice';
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

let activeVoiceAudio = null;

function readVoicePreference() {
  try { return localStorage.getItem(VOICE_PREF_KEY) !== 'off'; } catch { return true; }
}

function persistVoicePreference(enabled) {
  try { localStorage.setItem(VOICE_PREF_KEY, enabled ? 'on' : 'off'); } catch {}
}

function resolveVoiceGender(character) {
  const raw = String(character?.gender || character?.sex || '').trim().toLowerCase();
  return raw === 'male' || raw === 'm' || raw === 'man' || raw === 'boy' ? 'male' : 'female';
}

function stopVoicePlayback() {
  try {
    if (activeVoiceAudio) {
      activeVoiceAudio.pause();
      activeVoiceAudio = null;
    }
    window.ZEALWISH_API?.cancelSpeech?.()?.catch?.(() => {});
    window.speechSynthesis?.cancel?.();
  } catch {}
}

function playVoiceResult(result) {
  if (!result) return false;
  if (result.played) return true;
  if (!result.audioBase64) return false;
  try {
    const audio = new Audio(`data:${result.mimeType || 'audio/mpeg'};base64,${result.audioBase64}`);
    activeVoiceAudio = audio;
    audio.addEventListener('ended', () => { if (activeVoiceAudio === audio) activeVoiceAudio = null; });
    audio.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

function speakWithBrowserVoice(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return false;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

async function speakAssistantText(text, gender) {
  const clean = String(text || '').trim();
  if (!clean) return;
  stopVoicePlayback();
  // 1) Primary: StepFun TTS via the local API. Works on web.html where
  //    ZEALWISH_API.speak(payload) only RETURNS audio data (it doesn't play it),
  //    so we POST { text, gender } ourselves and play the returned StepFun audio.
  try {
    const base = window.ZEALWISH_API?.resolveApiBase?.();
    if (base) {
      const resp = await fetch(`${base}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, gender }),
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (playVoiceResult(data)) return;
      }
    }
  } catch {}
  // 2) Bridges that play internally (ocworld-bridge / desktop): pass an object payload.
  try {
    if (typeof window.ZEALWISH_API?.speak === 'function') {
      if (playVoiceResult(await window.ZEALWISH_API.speak({ text: clean, gender }))) return;
    }
  } catch {}
  // 3) Last resort: browser speech synthesis (robotic, but never silent).
  speakWithBrowserVoice(clean);
}

function InspectorRail({ activeModule, passport, memories, wallet, apiStatus }) {
  const current = WEB_APP_MODULES.find((item) => item.id === activeModule) || WEB_APP_MODULES[0];
  const integrityRows = [
    ["Passport", passport?.id || "Draft"],
    ["Wallet", wallet?.shortAddress || "Pending"],
    ["Memories", `${memories.length} stored`],
    ["Module", current.label],
    ["API", apiStatus?.label || "Checking API..."]
  ];

  return (
    <aside className="app-inspector" aria-label="ZEALWISH Web inspector">
      <div className="inspector-block edge">
        <div className="code mono">INSPECTOR</div>
        <h2>Passport integrity</h2>
        <div className="integrity-list">
          {integrityRows.map(([label, value]) => (
            <div className="integrity-row mono" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="inspector-block compact edge">
        <div className="code mono">ACTIVE WORKSPACE</div>
        <p>{current.title}</p>
        <small className="mono">Browser state / wallet-ready / exportable passport</small>
      </div>
      <div className="inspector-block compact edge">
        <div className="code mono">SYSTEM SIGNALS</div>
        {WORKSPACE_SIGNALS.map(([label, value]) => (
          <div className="signal-row mono" key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Shell({ activeModule, setActiveModule, wallet, passport, memories, apiStatus, onConnectWallet, children }) {
  const current = WEB_APP_MODULES.find((item) => item.id === activeModule) || WEB_APP_MODULES[0];
  const walletLabel = wallet?.shortAddress || (wallet?.status === 'connecting' ? 'Connecting...' : 'Connect OKX Wallet');

  useEffect(() => {
    const activeLink = document.querySelector(`.module-nav a[data-module-id="${activeModule}"]`);
    activeLink?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [activeModule]);

  return (
    <main className="web-app-shell" data-zealwish-web-app="true">
      <aside className="app-sidebar">
        <a className="sidebar-brand" href="index.html#top" aria-label="Back to ZEALWISH landing">
          <b>ZEALWISH</b>
          <span className="mono">Web workspace</span>
        </a>
        <nav className="module-nav" aria-label="ZEALWISH Web modules">
          {WEB_APP_MODULES.map((module) => (
            <a
              key={module.id}
              href={WEB_APP_ROUTES[module.id]}
              data-module-id={module.id}
              className={activeModule === module.id ? 'is-active' : ''}
              onClick={() => setActiveModule(module.id)}
            >
              <span className="code mono">{module.code}</span>
              <b>{module.label}</b>
              <small>{module.title}</small>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer mono">Landing stays as product information. This workspace carries the standard Web product flow.</div>
      </aside>

      <section className="app-main">
        <header className="app-topbar">
          <div className="crumb mono">ZEALWISH Web / {current.label}</div>
          <div className="top-actions">
            <a className="button-secondary edge" href="index.html#top">Landing</a>
            <button className="button-primary edge" onClick={onConnectWallet}>{walletLabel}</button>
          </div>
        </header>
        <div className="workspace">{children}</div>
      </section>

      <InspectorRail activeModule={activeModule} passport={passport} memories={memories} wallet={wallet} apiStatus={apiStatus} />
    </main>
  );
}

function PageTitle({ eyebrow, title, children }) {
  return (
    <div className="page-title">
      <div className="eyebrow mono">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}

function DashboardMetric({ label, value, caption }) {
  return (
    <article className="dashboard-metric edge">
      <span className="mono">{label}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  );
}

function HomeView({ passport, memories, wallet, setActiveModule }) {
  const passportName = passport?.name || 'Draft character';
  const walletState = wallet?.shortAddress || 'Not connected';

  return (
    <section className="workspace-dashboard" data-zealwish-web-dashboard="true">
      <div className="dashboard-header">
        <div>
          <div className="eyebrow mono">ZEALWISH Web / Home</div>
          <h1>Workspace overview</h1>
          <p>Operate the browser product from here: create the passport, continue chat, review memory, and export ownership state.</p>
        </div>
        <button className="button-primary edge" onClick={() => setActiveModule('create')}>Start character creation</button>
      </div>

      <div className="dashboard-grid">
        <DashboardMetric label="Passport" value={passportName} caption="Current character identity" />
        <DashboardMetric label="Memory vault" value={memories.length} caption="Stored continuity signals" />
        <DashboardMetric label="Wallet" value={walletState} caption="Ownership handle" />
        <DashboardMetric label="Export" value="Ready" caption="Portable JSON record" />
      </div>

      <div className="dashboard-lower">
        <section className="panel edge operating-queue">
          <div className="code mono">QUEUE</div>
          <h2>Daily operating queue</h2>
          <div className="queue-list">
            {DASHBOARD_QUEUE.map((item, index) => (
              <button className="queue-item" key={item.label} onClick={() => setActiveModule(item.module)}>
                <span className="mono">0{index + 1}</span>
                <b>{item.label}</b>
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel edge dashboard-passport">
          <div className="code mono">PASSPORT STATUS</div>
          <h2>Passport integrity</h2>
          <div className="passport-status-grid">
            <div><span className="mono">Identity</span><strong>{passportName}</strong></div>
            <div><span className="mono">Wallet</span><strong>{walletState}</strong></div>
            <div><span className="mono">Memory</span><strong>{memories.length} records</strong></div>
          </div>
          <div className="dashboard-actions">
            <button className="button-secondary edge" onClick={() => setActiveModule('talk')}>Continue companion chat</button>
            <button className="button-secondary edge" onClick={() => setActiveModule('settings')}>Export ownership record</button>
          </div>
        </section>
      </div>
    </section>
  );
}

function CreateView({ characterName, setCharacterName, characterPrompt, setCharacterPrompt, passport, wallet, onSave }) {
  const [saveStatus, setSaveStatus] = useState('');
  const handleSaveClick = useCallback(() => {
    onSave();
    setSaveStatus('Passport saved locally.');
  }, [onSave]);

  return (
    <>
      <PageTitle eyebrow="Create" title="Character Passport">
        Create a browser-native character passport first, then use it across chat, memory, world routes, and export.
      </PageTitle>
      <div className="grid-two">
        <div className="panel edge">
          <div className="code mono">CREATE / PASSPORT</div>
          <h2>Shape identity</h2>
          <label className="field-label">Character name</label>
          <input className="field" value={characterName} onChange={(event) => setCharacterName(event.target.value)} />
          <label className="field-label">Identity prompt</label>
          <textarea className="field" value={characterPrompt} onChange={(event) => setCharacterPrompt(event.target.value)} />
          <div style={{ marginTop: 18 }}>
            <button className="button-primary edge" onClick={handleSaveClick}>Save Passport</button>
          </div>
          <div className="action-status mono" role="status" aria-live="polite">{saveStatus}</div>
        </div>
        <div className="panel edge passport-preview">
          <img src={ZEALWISH_BROWSER_AVATAR_FALLBACK} alt="ZEALWISH passport character" />
          <div className="code mono">{passport?.id || 'ZEALWISH-0001'}</div>
          <h2>{passport?.name || characterName}</h2>
          <p>{passport?.prompt || characterPrompt}</p>
          <p className="mono">Wallet: {wallet?.shortAddress || 'not connected'}</p>
        </div>
      </div>
    </>
  );
}

function TalkView({ characterName, chatInput, setChatInput, chatMessages, onSend, chatStatus, isChatPending, apiStatus, voiceEnabled, onToggleVoice, onVoiceTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptHandlerRef = useRef(onVoiceTranscript);

  useEffect(() => {
    transcriptHandlerRef.current = onVoiceTranscript;
  }, [onVoiceTranscript]);

  useEffect(() => () => {
    try { recognitionRef.current?.abort?.(); } catch {}
    recognitionRef.current = null;
  }, []);

  const handleMicClick = useCallback(() => {
    if (!SR) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      return;
    }
    let recognition;
    try { recognition = new SR(); } catch { return; }
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      try {
        const transcript = Array.from(event.results || []).map((result) => result?.[0]?.transcript || '').join(' ').trim();
        if (transcript) transcriptHandlerRef.current?.(transcript);
      } catch {}
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  return (
    <>
      <PageTitle eyebrow="Talk" title="Companion Chat">
        A Web-safe chat surface that calls the ZEALWISH API first, then keeps a deterministic browser fallback for preview resilience.
      </PageTitle>
      <div className="panel edge chat-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div className="code mono">{apiStatus?.state === 'online' ? 'TALK / HTTP API' : 'TALK / BROWSER FALLBACK'}</div>
          <button
            type="button"
            className="talk-voice-toggle mono"
            onClick={onToggleVoice}
            aria-pressed={voiceEnabled}
            title={voiceEnabled ? 'Voice replies on. Click to mute.' : 'Voice replies off. Click to unmute.'}
          >
            {voiceEnabled ? '🔊 Voice on' : '🔇 Voice off'}
          </button>
        </div>
        <h2>{characterName}</h2>
        <div className="chat-log">
          {chatMessages.map((message, index) => (
            <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
              <b>{message.role === 'user' ? 'You' : characterName}</b>
              <span>{message.text}</span>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <div style={{ display: 'flex', gap: 10, minWidth: 0 }}>
            <input className="field" style={{ flex: '1 1 auto', minWidth: 0 }} value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSend(); }} placeholder="Send a signal to your character..." />
            <button
              type="button"
              className={isListening ? 'talk-mic is-listening' : 'talk-mic'}
              onClick={handleMicClick}
              disabled={!SR}
              title={SR ? (isListening ? 'Stop listening' : 'Speak instead of typing') : 'Voice input needs Chrome or Edge'}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              🎤
            </button>
          </div>
          <button className="button-primary edge" onClick={onSend} disabled={isChatPending}>{isChatPending ? 'Sending' : 'Send'}</button>
        </div>
        <div className="action-status mono" role="status" aria-live="polite">
          {isListening ? (
            <span className="talk-listening"><span className="talk-listening-dot" aria-hidden="true"></span>Listening... speak now</span>
          ) : chatStatus}
        </div>
        <style>{`
          .talk-voice-toggle {
            border: 1px solid rgba(255,45,45,.56);
            background: rgba(0,0,0,.28);
            color: var(--white);
            min-height: 32px;
            padding: 4px 12px;
            font-size: 11px;
            letter-spacing: .12em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .talk-voice-toggle[aria-pressed="false"] { color: var(--muted); border-color: rgba(255,255,255,.24); }
          .talk-mic {
            flex: 0 0 auto;
            width: 52px;
            min-height: 44px;
            border: 1px solid rgba(255,45,45,.56);
            background: rgba(0,0,0,.28);
            color: var(--white);
            font-size: 17px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .talk-mic.is-listening {
            border-color: var(--red);
            background: rgba(255,45,45,.2);
            animation: zealwishVoicePulse 1.4s ease-in-out infinite;
          }
          .talk-listening { color: var(--red); display: inline-flex; align-items: center; gap: 8px; }
          .talk-listening-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--red);
            animation: zealwishVoicePulse 1.4s ease-in-out infinite;
          }
          @keyframes zealwishVoicePulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,45,45,.4); }
            50% { box-shadow: 0 0 0 8px rgba(255,45,45,0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .talk-mic.is-listening, .talk-listening-dot { animation: none; }
          }
        `}</style>
      </div>
    </>
  );
}

function MemoryView({ memories, memoryDraft, setMemoryDraft, onAddMemory }) {
  const [memoryStatus, setMemoryStatus] = useState('');
  const handleAddClick = useCallback(() => {
    const added = onAddMemory();
    setMemoryStatus(added ? 'Memory added to vault.' : 'Add a memory before saving.');
  }, [onAddMemory]);

  return (
    <>
      <PageTitle eyebrow="Memory" title="Memory Vault">
        Store durable character memories in the browser workspace and use them as the continuity spine of the passport.
      </PageTitle>
      <div className="grid-two">
        <div className="panel edge">
          <div className="code mono">MEMORY / INPUT</div>
          <h2>Add memory</h2>
          <textarea className="field" value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} placeholder="Add a durable memory..." />
          <div style={{ marginTop: 18 }}><button className="button-primary edge" onClick={handleAddClick}>Add Memory</button></div>
          <div className="action-status mono" role="status" aria-live="polite">{memoryStatus}</div>
        </div>
        <div className="panel edge">
          <div className="code mono">LATEST SIGNALS</div>
          <h2>Vault</h2>
          <div className="memory-stack">
            {memories.map((memory, index) => <div className="memory-item" key={`${memory}-${index}`}>{memory}</div>)}
          </div>
        </div>
      </div>
    </>
  );
}

const WORLD_ROUTES = [
  { title: 'Creator skins', detail: 'Prepare a portable look library for the same passport identity.' },
  { title: 'Playable scenes', detail: 'Route the character into a lightweight scene without losing memory.' },
  { title: 'Agent tasks', detail: 'Let the character carry action context into future task flows.' },
  { title: 'Cross-world passport', detail: 'Check the fields required before moving across worlds.' }
];

const TIMELINE_EVENTS = [
  { day: 'DAY 001', title: 'Character signal created', tag: 'created' },
  { day: 'DAY 027', title: 'First memory vault checkpoint', tag: 'memory' },
  { day: 'DAY 042', title: 'Passport ownership route prepared', tag: 'wallet' }
];

function WorldView() {
  const [worldStatus, setWorldStatus] = useState('Select a route to inspect where this passport can travel next.');

  return (
    <>
      <PageTitle eyebrow="World" title="World Layer">
        Preview how one wallet-owned identity can route into future creator skins, playable scenes, agent tasks, and interoperable worlds.
      </PageTitle>
      <div className="route-grid">
        {WORLD_ROUTES.map((item, index) => (
          <article className="route-card" key={item.title}>
            <span className="mono">0{index + 1}</span>
            <b>{item.title}</b>
            <p>{item.detail}</p>
            <button className="button-secondary edge" onClick={() => setWorldStatus(`World route activated: ${item.title}.`)}>Open route</button>
          </article>
        ))}
      </div>
      <div className="action-status mono" role="status" aria-live="polite">{worldStatus}</div>
    </>
  );
}

function RewindView() {
  const [timelineStatus, setTimelineStatus] = useState('Open a checkpoint or export the full timeline.');

  const handleExportTimeline = useCallback(() => {
    const text = JSON.stringify({ product: 'ZEALWISH Web Workspace', timeline: TIMELINE_EVENTS }, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zealwish-timeline-export.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setTimelineStatus('Timeline JSON downloaded.');
  }, []);

  return (
    <>
      <PageTitle eyebrow="Rewind" title="Relationship Timeline">
        Rewind keeps milestones visible so the character feels continuous instead of disposable.
      </PageTitle>
      <div className="timeline">
        {TIMELINE_EVENTS.map((event) => (
          <div className="timeline-row mono" key={event.day}>
            <time>{event.day}</time>
            <strong>{event.title}</strong>
            <span>{event.tag}</span>
            <button className="button-secondary edge" onClick={() => setTimelineStatus(`Timeline checkpoint opened: ${event.title}.`)}>Open checkpoint</button>
          </div>
        ))}
      </div>
      <div className="settings-actions">
        <button className="button-primary edge" onClick={handleExportTimeline}>Export full timeline</button>
      </div>
      <div className="action-status mono" role="status" aria-live="polite">{timelineStatus}</div>
    </>
  );
}

function SettingsView({ wallet, apiStatus, onConnectWallet, onRefreshApiStatus, exportText, onExport }) {
  const [copyStatus, setCopyStatus] = useState('');
  const walletRows = [
    ["Status", wallet?.status || "idle"],
    ["Address", wallet?.shortAddress || "Not connected"],
    ["Chain", wallet?.chainId || "Pending"]
  ];
  const apiRows = [
    ["Runtime API", apiStatus?.label || "Checking API..."],
    ["API base", apiStatus?.apiBase || getApiBaseLabel()]
  ];
  const storageRows = [
    ["Passport", "localStorage / zealwish.web.passport"],
    ["Memories", "localStorage / zealwish.web.memories"],
    ["Export", exportText ? "Generated in this session" : "Waiting for export"]
  ];

  const handleCopyExport = useCallback(async () => {
    if (!exportText) {
      setCopyStatus('Generate an export before copying.');
      return;
    }
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyStatus('Export JSON copied to clipboard.');
    } catch {
      setCopyStatus('Clipboard is not available in this browser.');
    }
  }, [exportText]);

  const handleExportClick = useCallback(() => {
    onExport();
    setCopyStatus('Export JSON generated.');
  }, [onExport]);

  const handleDownloadExport = useCallback(() => {
    if (!exportText) {
      setCopyStatus('Generate an export before downloading.');
      return;
    }
    const blob = new Blob([exportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zealwish-passport-export.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setCopyStatus('Export JSON downloaded.');
  }, [exportText]);

  return (
    <section data-zealwish-settings-panel="true">
      <PageTitle eyebrow="Settings" title="Data ownership center">
        Connect wallet identity, inspect browser storage, and export a portable character passport record from the Web workspace.
      </PageTitle>

      <div className="settings-grid">
        <div className="settings-stack">
          <section className="panel edge">
            <div className="code mono">WALLET / CONNECTION</div>
            <h2>Connection status</h2>
            <p>OKX Wallet links this browser passport to a user-controlled ownership handle.</p>
            <div className="status-ledger">
              {[...walletRows, ...apiRows].map(([label, value]) => (
                <div className="status-row mono" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="settings-actions">
              <button className="button-primary edge" onClick={onConnectWallet}>Connect OKX Wallet</button>
              <button className="button-secondary edge" onClick={onRefreshApiStatus}>Refresh API</button>
            </div>
            {wallet?.error && <p className="error">{wallet.error}</p>}
          </section>

          <section className="panel edge">
            <div className="code mono">BROWSER / STORAGE</div>
            <h2>Local browser storage</h2>
            <p>Preview data stays in this browser until the export is copied or downloaded by the user.</p>
            <div className="storage-ledger">
              {storageRows.map(([label, value]) => (
                <div className="storage-row mono" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel edge settings-export">
          <div className="code mono">EXPORT / PORTABLE RECORD</div>
          <h2>Export ownership record</h2>
          <p>Generate a JSON snapshot that contains the current passport and memory vault state.</p>
          <div className="settings-actions">
            <button className="button-primary edge" onClick={handleExportClick}>Export Passport</button>
            <button className="button-secondary edge" onClick={handleCopyExport} disabled={!exportText}>Copy export JSON</button>
            <button className="button-secondary edge" onClick={handleDownloadExport} disabled={!exportText}>Download export JSON</button>
          </div>
          <div className="copy-status mono">{copyStatus}</div>
          <pre className="export-box">{exportText || 'No export generated yet.'}</pre>
        </section>
      </div>
    </section>
  );
}

function App() {
  const [activeModule, setActiveModuleState] = useState(routeFromHash);
  const [wallet, setWallet] = useState(() => window.ZEALWISH_WALLET?.getState?.() || { status: 'idle', shortAddress: '', error: '' });
  const [apiStatus, setApiStatus] = useState(() => ({
    state: 'checking',
    label: 'Checking API...',
    apiBase: getApiBaseLabel()
  }));
  const [characterName, setCharacterName] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zealwish.web.passport') || 'null')?.name || 'Signal Kid'; } catch { return 'Signal Kid'; }
  });
  const [characterPrompt, setCharacterPrompt] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zealwish.web.passport') || 'null')?.prompt || 'A red-signal AI companion with a portable wallet-owned identity.'; } catch { return 'A red-signal AI companion with a portable wallet-owned identity.'; }
  });
  const [passport, setPassport] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zealwish.web.passport') || 'null'); } catch { return null; }
  });
  const [memories, setMemories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zealwish.web.memories') || 'null') || starterMemories; } catch { return starterMemories; }
  });
  const [memoryDraft, setMemoryDraft] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'character', text: 'ZEALWISH Web is ready. Create a passport, then give me a memory to carry.' }
  ]);
  const [chatStatus, setChatStatus] = useState('');
  const [isChatPending, setIsChatPending] = useState(false);
  const [exportText, setExportText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(readVoicePreference);
  const lastSpokenIndexRef = useRef(chatMessages.length - 1);

  useEffect(() => window.ZEALWISH_WALLET?.onChange?.(setWallet), []);
  useEffect(() => {
    const onHash = () => setActiveModuleState(routeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setActiveModule = useCallback((moduleId) => {
    window.location.hash = WEB_APP_ROUTES[moduleId] || '#/home';
    setActiveModuleState(moduleId);
  }, []);

  const refreshApiStatus = useCallback(async () => {
    const apiBase = getApiBaseLabel();
    if (!window.ZEALWISH_API?.health) {
      setApiStatus({
        state: 'fallback',
        label: 'API unavailable — browser fallback active.',
        apiBase
      });
      return false;
    }
    try {
      await window.ZEALWISH_API.health();
      setApiStatus({
        state: 'online',
        label: 'API connected.',
        apiBase
      });
      return true;
    } catch {
      setApiStatus({
        state: 'fallback',
        label: 'API unavailable — browser fallback active.',
        apiBase
      });
      return false;
    }
  }, []);

  useEffect(() => {
    refreshApiStatus();
  }, [refreshApiStatus]);

  const handleConnectWallet = useCallback(async () => {
    if (!window.ZEALWISH_WALLET?.connect) {
      setWallet({ status: 'error', error: 'OKX Wallet service is not loaded.', shortAddress: '' });
      return;
    }
    setWallet(await window.ZEALWISH_WALLET.connect());
  }, []);

  const handleSavePassport = useCallback(() => {
    const next = {
      id: 'ZEALWISH-0001',
      name: characterName.trim() || 'Signal Kid',
      prompt: characterPrompt.trim(),
      wallet: wallet?.address || 'not connected',
      chainId: wallet?.chainId || 'pending',
      avatar: ZEALWISH_BROWSER_AVATAR_FALLBACK,
      updatedAt: new Date().toISOString()
    };
    setPassport(next);
    localStorage.setItem('zealwish.web.passport', JSON.stringify(next));
    return next;
  }, [characterName, characterPrompt, wallet]);

  const handleAddMemory = useCallback((value = memoryDraft) => {
    const clean = String(value || '').trim();
    if (!clean) return false;
    const next = [clean, ...memories].slice(0, 10);
    setMemories(next);
    setMemoryDraft('');
    localStorage.setItem('zealwish.web.memories', JSON.stringify(next));
    return true;
  }, [memoryDraft, memories]);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((previous) => {
      const next = !previous;
      persistVoicePreference(next);
      if (!next) stopVoicePlayback();
      return next;
    });
  }, []);

  useEffect(() => {
    const lastIndex = chatMessages.length - 1;
    if (lastIndex <= lastSpokenIndexRef.current) return;
    const latest = chatMessages[lastIndex];
    if (!latest || latest.role !== 'character') return;
    lastSpokenIndexRef.current = lastIndex;
    if (!voiceEnabled) return;
    speakAssistantText(latest.text, resolveVoiceGender(passport)).catch(() => {});
  }, [chatMessages, voiceEnabled, passport]);

  const handleSendWebChat = useCallback(async (overrideText) => {
    const clean = (typeof overrideText === 'string' ? overrideText : chatInput).trim();
    if (!clean || isChatPending) return;
    const userMessage = { role: 'user', text: clean };
    const history = [...chatMessages, userMessage];
    setChatMessages(history);
    setChatInput('');
    setIsChatPending(true);
    setChatStatus('Sending through ZEALWISH API...');
    handleAddMemory(`Chat signal: ${clean}`);

    try {
      if (!window.ZEALWISH_API?.chat) throw new Error('ZEALWISH API chat is not available.');
      const result = await window.ZEALWISH_API.chat({
        system: buildChatSystemPrompt(characterName, characterPrompt, memories),
        messages: toApiMessages(history)
      });
      const reply = result?.text || getFallbackReply(clean, history.length);
      setChatMessages([...history, { role: 'character', text: reply, source: result?.source || 'http-api' }]);
      setChatStatus('API reply received.');
      setApiStatus({
        state: 'online',
        label: 'API connected.',
        apiBase: getApiBaseLabel()
      });
    } catch {
      const reply = getFallbackReply(clean, history.length);
      setChatMessages([...history, { role: 'character', text: reply, source: 'browser-fallback' }]);
      setChatStatus('API unavailable — browser fallback active.');
      refreshApiStatus();
    } finally {
      setIsChatPending(false);
    }
  }, [chatInput, chatMessages, isChatPending, handleAddMemory, characterName, characterPrompt, memories, refreshApiStatus]);

  const handleVoiceTranscript = useCallback((transcript) => {
    const clean = String(transcript || '').trim();
    if (!clean) return;
    setChatInput(clean);
    handleSendWebChat(clean);
  }, [handleSendWebChat]);

  const handleExportPassport = useCallback(() => {
    const payload = passport || handleSavePassport();
    const text = JSON.stringify({ passport: payload, memories, product: 'ZEALWISH Web Workspace' }, null, 2);
    setExportText(text);
    return text;
  }, [passport, memories, handleSavePassport]);

  const view = useMemo(() => {
    if (activeModule === 'create') return <CreateView characterName={characterName} setCharacterName={setCharacterName} characterPrompt={characterPrompt} setCharacterPrompt={setCharacterPrompt} passport={passport} wallet={wallet} onSave={handleSavePassport} />;
    if (activeModule === 'talk') return <TalkView characterName={characterName} chatInput={chatInput} setChatInput={setChatInput} chatMessages={chatMessages} onSend={handleSendWebChat} chatStatus={chatStatus} isChatPending={isChatPending} apiStatus={apiStatus} voiceEnabled={voiceEnabled} onToggleVoice={handleToggleVoice} onVoiceTranscript={handleVoiceTranscript} />;
    if (activeModule === 'memory') return <MemoryView memories={memories} memoryDraft={memoryDraft} setMemoryDraft={setMemoryDraft} onAddMemory={handleAddMemory} />;
    if (activeModule === 'world') return <WorldView />;
    if (activeModule === 'rewind') return <RewindView />;
    if (activeModule === 'settings') return <SettingsView wallet={wallet} apiStatus={apiStatus} onConnectWallet={handleConnectWallet} onRefreshApiStatus={refreshApiStatus} exportText={exportText} onExport={handleExportPassport} />;
    return <HomeView passport={passport} memories={memories} wallet={wallet} setActiveModule={setActiveModule} />;
  }, [activeModule, characterName, characterPrompt, passport, wallet, chatInput, chatMessages, chatStatus, isChatPending, apiStatus, memoryDraft, memories, exportText, voiceEnabled, handleToggleVoice, handleVoiceTranscript, handleSavePassport, handleSendWebChat, handleAddMemory, handleConnectWallet, refreshApiStatus, handleExportPassport, setActiveModule]);

  return <Shell activeModule={activeModule} setActiveModule={setActiveModule} wallet={wallet} passport={passport} memories={memories} apiStatus={apiStatus} onConnectWallet={handleConnectWallet}>{view}</Shell>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
