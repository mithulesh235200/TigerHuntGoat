// Bilingual UI strings (English + Tamil) with a tiny external store.
// Usage: const { lang, t, setLang } = useLang(); — t is stable per language.
import { useSyncExternalStore } from "react";

export type Lang = "en" | "ta";

const LANG_KEY = "aadu-puli-aatam-lang";

const en = {
  tagline: "Traditional Tamil Hunt & Strategy Game",
  howToPlay: "How to Play",
  playGame: "Play Game",
  mainMenu: "Main Menu",
  muteAudio: "Mute Audio",
  unmuteAudio: "Unmute Audio",
  langToggle: "தமிழ்",
  offlineMsg: "Offline mode — vs AI & 2-player work, online rooms paused",
  installCta: "Install app — play offline",

  setupKicker: "Traditional Tamil Strategy Game",
  setupDesc:
    "Three tigers hunt fifteen goats on a 23-point grid. Choose your side, test your strategic vision against the AI or invite friends.",
  challengeMode: "Challenge Opening Mode",
  on: "ON",
  off: "OFF",
  modeGoat: "Goats",
  modeGoatSub: "Play as the Herd",
  modeGoatNote: "vs Minimax AI Tigers",
  modeTiger: "Tigers",
  modeTigerSub: "Play as the Hunters",
  modeTigerNote: "vs Minimax AI Goats",
  modeLocal: "Local 2P",
  modeLocalSub: "Hotseat Match",
  modeLocalNote: "Same device",
  modeOnline: "Online",
  modeOnlineSub: "Invite a Friend",
  modeOnlineNote: "Realtime channel",
  startBattle: "Start Battle Match",
  takeTour: "Take the Interactive Tour",

  guideKicker: "Game Guide & Strategy",
  guideTitle: "How to Play Aadu Puli Aatam",
  guideDesc:
    "Aadu Puli Aatam (Lambs & Tigers) is an asymmetric ancient South Indian strategy board game played on a 23-vertex grid.",
  goatsTitle: "The Goat Herd (15 Goats)",
  goatR1:
    "Placement Phase: Place 1 goat per turn onto any empty point. Goats cannot move until all 15 are placed.",
  goatR2:
    "Movement Phase: Once all 15 goats are placed, goats move 1 step along connected lines to adjacent empty points.",
  goatR3:
    "Victory Condition: Surround and completely trap all 3 Tigers so they have 0 legal moves available.",
  tigerTitle: "The Tigers (3 Tigers)",
  tigerR1:
    "Setup & Movement: Tigers start on predefined apex positions and move 1 step along connected lines.",
  tigerR2:
    "Capture Mechanics: Tigers capture a goat by jumping over 1 adjacent goat into an empty space along a straight line path.",
  tigerR3:
    "Victory Condition: Capture 5 goats, rendering it impossible for goats to block all 3 tigers.",
  hotkeys: "Keyboard Hotkeys",
  kHint: "Tactical Hint",
  kUndo: "Undo Move",
  kNew: "New Game",
  kEsc: "Clear Selection",
  gotIt: "Got It, Let's Play!",

  victoryKicker: "Match Victory Complete",
  tigerWins: "🐯 Tigers Win!",
  goatWins: "🐐 Goats Win!",
  tigerWinsDesc: "The predators captured 5 goats and dominated the board.",
  goatWinsDesc: "The goat herd successfully trapped all 3 tigers!",
  winner: "Winner",
  moves: "Moves",
  captures: "Captures",
  playAgain: "Play Again",

  liveStatus: "Live Match Status",
  session: "Session #",
  placementPhase: "Placement Phase ({n} goats left)",
  movementPhase: "Movement Phase (Full Grid)",
  goatsToMove: "Goats to Move",
  tigersToMove: "Tigers to Move",
  goatTurn: "🐐 Goat Turn",
  tigerTurn: "🐯 Tiger Turn",
  thinking: "AI Minimax Engine Calculating Move...",
  turnCountdown: "Turn Countdown",
  secondsLeft: "{n}s remaining",
  availMoves: "Available Moves",
  legalOptions: "legal options",
  tacRec: "Tactical Recommendation",
  analyzing: "Analyzing...",
  coachTitle: "AI Tactical Coach",
  scoreboard: "Battle Scoreboard",
  goatsPlaced: "Goats Placed",
  leftWord: "left",
  capturedTitle: "Goats Captured",
  toWin: "to win",
  herdOnGrid: "Herd On Grid",
  goatsUnit: "Goats",
  hunters: "Prowling Hunters",
  tigersUnit: "3 Tigers",
  careerRecord: "Career Match Record",
  totalGames: "{n} total games",
  goatWinsCard: "Goat Wins",
  tigerWinsCard: "Tiger Wins",
  streak: "Streak",
  controlsTitle: "Game Controls & AI",
  challengeRule: "Challenge Opening Rule",
  aiDifficulty: "AI Minimax Difficulty",
  easy: "Easy",
  easyNote: "Casual",
  medium: "Medium",
  mediumNote: "Tactical",
  hard: "Hard",
  hardNote: "Expert",
  appTheme: "App Theme",
  inviteOnline: "Online Invite Code",
  inviteLocal: "Local Hotseat Invite",
  matchCode: "Match Code",
  copyOnline: "Copy Online Invite Link",
  copyLocal: "Copy Room Link",
  copiedMsg: "Invite Link Copied!",
  history: "Move Feed History",
  noMoves: "No moves recorded yet. Place the first goat!",
  newGame: "New Game",
  hintBtn: "Tactical Hint",
  undoBtn: "Undo",
  soundOn: "Sound On",
  mutedWord: "Muted",
  analyticsTitle: "Match Analytics",
  winRate: "Win rate by side",
  byMode: "Games by mode",
  recentCaptures: "Captures in recent games",
  noData: "Finish a game to unlock charts.",
  online: "Online",
  offline: "Offline",

  battleReady: "Battle Ready",
  movePlacement: "Goat Placement",
  moveMovement: "Piece Movement",
  moveCapture: "Tactical Capture",
  urgent: "⚡ Urgent · {n}s",
  turnHash: "Turn #{n}",
  ariaEmpty: "{node} (Empty point)",
  ariaDest: "{node} (Empty point, Legal Destination)",
  ariaPiece: "{node} ({side})",
  ariaSelected: "{node} ({side}, Selected)",

  footerLeft: "v1.5 offline PWA",
  footerRight: "Vs AI & 2-player work offline · Online rooms need internet",

  clockLabel: "Turn Clock",
  timeoutLabel: "On Timeout",
  warnOnly: "Warn",
  forfeitGame: "Forfeit",
  secs: "{n}s",

  viewingMove: "Move {i} / {n}",
  replayPrev: "Prev",
  replayNext: "Next",
  replayExit: "Exit replay",
  replayLive: "Back to live",
  copyReplay: "Share replay",
  replayCopied: "Replay link copied!",
  replayShared: "Replay shared!",
  replayFailed: "Sharing failed — link ready to copy.",
  replayLoaded: "Shared replay loaded. Step through the moves!",

  tourKicker: "Interactive Tour",
  tourTitle: "Learn the Hunt in 2 Minutes",
  tourNext: "Next",
  tourBack: "Back",
  tourSkip: "Skip tour",
  tourPractice: "Practice vs Easy AI",
  tourDemo: "Watch demo move",
  tourStep1T: "The Battlefield",
  tourStep1B:
    "23 connected points. 3 tigers start at the apex triangle; goats enter one per turn. This is a live board — press “Watch demo move” to see it play.",
  tourStep2T: "Goats Place First",
  tourStep2B:
    "Goats cannot move until all 15 are placed. Strong players build a wall near the center before the tigers break out.",
  tourStep3T: "Tigers Pounce",
  tourStep3B:
    "Tigers slide along lines — and capture by jumping over an adjacent goat into empty space, exactly like checkers.",
  tourStep4T: "Trap or Be Eaten",
  tourStep4B:
    "Goats win by surrounding every tiger until none can move. Tigers win by capturing 5 goats. Watch the capture counter!",
  tourStep5T: "Your Turn, Commander",
  tourStep5B:
    "Jump into an easy practice match. Press H anytime for a tactical hint, U to undo, and try to trap all three tigers.",

  forfeitLogGoat: "🐐 Goats forfeited on time ⏱",
  forfeitLogTiger: "🐯 Tigers forfeited on time ⏱",

  whoTiger: "🐯 Tiger",
  whoGoat: "🐐 Goat",
  logPlace: "{who} placed on {node}",
  logCapture: "{who} jumped {from} → {to} (Captured {over})",
  logMove: "{who} moved {from} → {to}",

  coachDone: "Match complete. Review the move log to see tactical turning points.",
  coachCapture: "Tactical strike window: {n} jump is available.",
  coachCapturePlural: "Tactical strike window: {n} jumps are available.",
  coachOpening: "Opening Rule: place goat on a central point to maximize herd defense.",
  coachHerd:
    "Herd Strategy: place goats near center to construct blocking barriers against tigers.",
  coachDanger: "Critical Danger: Tiger mobility is restricted. Find an escape route immediately!",
  coachPressure: "Predator Pressure: 2 more captures seal victory for the Tigers.",
  coachDefault: "Strategic Read: maintain central control and look for tactical jump openings.",

  sPlaceFirst: "Place a goat on any empty point to begin.",
  sNewGame: "New game started. Goats place first.",
  sRestored: "Match restored. Continue where you left off.",
  sJoinedOnline: "Joined online room #{room}. Connecting to opponent...",
  sJoinedLocal: "Joined 2-Player Match (Room #{room}). Goats place first!",
  sLocalReady: "Local 2-player match ready. Room #{room}. Goats start first.",
  sOnlineCreated: "Online room #{room} created. Copy invite link for Tiger player.",
  sGoatsAI: "Goats to move. Select an empty point.",
  sTigersAI: "Tigers to move. The AI is setting up.",
  sGoatsMove: "Goats turn to move.",
  sTigersMove: "Tigers turn to move.",
  sCaptured: "A goat was captured on point {node}.",
  sUndone: "Move undone.",
  sNoLegal: "No legal move available.",
  sHint: "Tactical hint: {move}.",
  sTimeLowGoat: "Goats are running low on turn time!",
  sTimeLowTiger: "Tigers are running low on turn time!",
  sChallengeFirst: "Challenge Rule: first goat must land on a central point.",
  sOccupied: "That point is occupied — choose an empty node.",
  sNoDest: "That piece has no legal destination.",
  sChooseDest: "Choose a highlighted destination point.",
  sSelectOwn: "Select your own piece first.",
  sInviteOnline: "Online invite link copied. Share with your opponent!",
  sInviteLocal: "Local match link copied to clipboard.",
  sInviteShared: "Invite shared!",
  sOfflinePause: "You are offline. Online rooms are paused — vs AI and 2-player work offline.",
  sOfflineSwitch: "You are offline. Online rooms need internet — starting local 2-player instead.",
  sOpponentMoved: "Opponent moved. Your turn!",
  sRematch: "Opponent started a new game — rematch!",
  sTigerWin: "Tigers captured 5 goats and win the hunt!",
  sGoatWin: "All tigers are trapped — the goats win!",
  sForfeitTigerWin: "Goats ran out of time — the Tigers win!",
  sForfeitGoatWin: "Tigers ran out of time — the Goats win!",
};

export type Strings = typeof en;

const ta: Strings = {
  tagline: "பாரம்பரிய தமிழ் வேட்டை & தந்திர விளையாட்டு",
  howToPlay: "விளையாடுவது எப்படி",
  playGame: "விளையாடு",
  mainMenu: "முகப்பு",
  muteAudio: "ஒலியை அணை",
  unmuteAudio: "ஒலியை இயக்கு",
  langToggle: "EN",
  offlineMsg: "ஆஃப்லைன் முறை — AI & 2-வீரர் வேலை செய்யும், ஆன்லைன் அறைகள் நிறுத்தம்",
  installCta: "செயலியை நிறுவு — ஆஃப்லைனில் விளையாடு",

  setupKicker: "பாரம்பரிய தமிழ் தந்திர விளையாட்டு",
  setupDesc:
    "23 புள்ளிகள் கொண்ட களத்தில் 3 புலிகள் 15 ஆடுகளை வேட்டையாடுகின்றன. உங்கள் பக்கத்தைத் தேர்ந்து AI-ஐ எதிர்கொள்ளுங்கள் அல்லது நண்பர்களை அழையுங்கள்.",
  challengeMode: "சவால் தொடக்க விதி",
  on: "இயக்கம்",
  off: "அணைப்பு",
  modeGoat: "ஆடுகள்",
  modeGoatSub: "மந்தையாக விளையாடு",
  modeGoatNote: "AI புலிகளுக்கு எதிராக",
  modeTiger: "புலிகள்",
  modeTigerSub: "வேட்டையாடிகளாக விளையாடு",
  modeTigerNote: "AI ஆடுகளுக்கு எதிராக",
  modeLocal: "உள்ளூர் 2P",
  modeLocalSub: "ஒரே கருவியில்",
  modeLocalNote: "ஒரே திரை",
  modeOnline: "ஆன்லைன்",
  modeOnlineSub: "நண்பரை அழை",
  modeOnlineNote: "நேரலை இணைப்பு",
  startBattle: "போரைத் தொடங்கு",
  takeTour: "பயிற்சி சுற்றுலா",

  guideKicker: "விளையாட்டு வழிகாட்டி & தந்திரம்",
  guideTitle: "ஆடு புலி ஆட்டம் விளையாடுவது எப்படி",
  guideDesc:
    "ஆடு புலி ஆட்டம் (ஆட்டுக்குட்டிகள் & புலிகள்) 23 முனைகள் கொண்ட பண்டைய தென்னிந்திய தந்திர விளையாட்டு.",
  goatsTitle: "ஆட்டு மந்தை (15 ஆடுகள்)",
  goatR1:
    "வைப்பு கட்டம்: ஒரு முறைக்கு 1 ஆட்டை காலி புள்ளியில் வைக்கவும். 15 ஆடுகளும் வைக்கும் வரை ஆடுகள் நகர முடியாது.",
  goatR2:
    "நகர்வு கட்டம்: 15 ஆடுகளும் வைத்த பிறகு, ஆடுகள் இணைந்த கோடுகளில் 1 அடி அருகிலுள்ள காலி புள்ளிக்கு நகரும்.",
  goatR3:
    "வெற்றி நிபந்தனை: 3 புலிகளையும் சுற்றி வளைத்து அவற்றுக்கு 0 சட்ட நகர்வுகள் இல்லாமல் சிக்க வைக்கவும்.",
  tigerTitle: "புலிகள் (3 புலிகள்)",
  tigerR1: "அமைப்பு & நகர்வு: புலிகள் உச்சி நிலைகளில் தொடங்கி இணைந்த கோடுகளில் 1 அடி நகரும்.",
  tigerR2:
    "பிடிப்பு முறை: அருகிலுள்ள ஆட்டின் மீது நேர்கோட்டில் காலி இடத்திற்குத் தாண்டி புலிகள் ஆட்டைப் பிடிக்கும்.",
  tigerR3: "வெற்றி நிபந்தனை: 5 ஆடுகளைப் பிடித்தால் புலிகள் வெல்லும்.",
  hotkeys: "விசைப்பலகை குறுக்குவழிகள்",
  kHint: "தந்திர குறிப்பு",
  kUndo: "நகர்வை திரும்பப்பெறு",
  kNew: "புதிய ஆட்டம்",
  kEsc: "தேர்வை நீக்கு",
  gotIt: "புரிந்தது, விளையாடலாம்!",

  victoryKicker: "போட்டி வெற்றி நிறைவு",
  tigerWins: "🐯 புலிகள் வென்றன!",
  goatWins: "🐐 ஆடுகள் வென்றன!",
  tigerWinsDesc: "வேட்டையாடிகள் 5 ஆடுகளைப் பிடித்து களத்தை ஆண்டன.",
  goatWinsDesc: "ஆட்டு மந்தை 3 புலிகளையும் வெற்றிகரமாகச் சிக்க வைத்தது!",
  winner: "வெற்றியாளர்",
  moves: "நகர்வுகள்",
  captures: "பிடிப்புகள்",
  playAgain: "மீண்டும் விளையாடு",

  liveStatus: "நேரலை போட்டி நிலை",
  session: "அமர்வு #",
  placementPhase: "வைப்பு கட்டம் ({n} ஆடுகள் மீதம்)",
  movementPhase: "நகர்வு கட்டம் (முழு களம்)",
  goatsToMove: "ஆடுகள் நகர வேண்டும்",
  tigersToMove: "புலிகள் நகர வேண்டும்",
  goatTurn: "🐐 ஆடுகள் முறை",
  tigerTurn: "🐯 புலிகள் முறை",
  thinking: "AI மினிமேக்ஸ் நகர்வைக் கணக்கிடுகிறது...",
  turnCountdown: "முறை எண்ணிறக்கம்",
  secondsLeft: "{n}வி மீதம்",
  availMoves: "கிடைக்கும் நகர்வுகள்",
  legalOptions: "சட்ட வாய்ப்புகள்",
  tacRec: "தந்திர பரிந்துரை",
  analyzing: "ஆராய்கிறது...",
  coachTitle: "AI தந்திர பயிற்சியாளர்",
  scoreboard: "போர் மதிப்பெண் பலகை",
  goatsPlaced: "வைத்த ஆடுகள்",
  leftWord: "மீதம்",
  capturedTitle: "பிடிபட்ட ஆடுகள்",
  toWin: "வெல்ல",
  herdOnGrid: "களத்தில் மந்தை",
  goatsUnit: "ஆடுகள்",
  hunters: "பதுங்கும் வேட்டையாடிகள்",
  tigersUnit: "3 புலிகள்",
  careerRecord: "வாழ்நாள் போட்டிப் பதிவு",
  totalGames: "மொத்தம் {n} ஆட்டங்கள்",
  goatWinsCard: "ஆடு வெற்றிகள்",
  tigerWinsCard: "புலி வெற்றிகள்",
  streak: "தொடர்",
  controlsTitle: "ஆட்டக் கட்டுப்பாடுகள் & AI",
  challengeRule: "சவால் தொடக்க விதி",
  aiDifficulty: "AI மினிமேக்ஸ் கடினம்",
  easy: "எளிது",
  easyNote: "சாதாரணம்",
  medium: "நடுத்தரம்",
  mediumNote: "தந்திரம்",
  hard: "கடினம்",
  hardNote: "நிபுணர்",
  appTheme: "செயலி தோற்றம்",
  inviteOnline: "ஆன்லைன் அழைப்புக் குறியீடு",
  inviteLocal: "உள்ளூர் அழைப்பு",
  matchCode: "போட்டிக் குறியீடு",
  copyOnline: "ஆன்லைன் அழைப்பு இணைப்பை நகலெடு",
  copyLocal: "அறை இணைப்பை நகலெடு",
  copiedMsg: "அழைப்பு இணைப்பு நகலெடுக்கப்பட்டது!",
  history: "நகர்வு வரலாறு",
  noMoves: "இன்னும் நகர்வுகள் இல்லை. முதல் ஆட்டை வையுங்கள்!",
  newGame: "புதிய ஆட்டம்",
  hintBtn: "தந்திர குறிப்பு",
  undoBtn: "திரும்பப்பெறு",
  soundOn: "ஒலி இயக்கம்",
  mutedWord: "அமைதி",
  analyticsTitle: "போட்டி பகுப்பாய்வு",
  winRate: "பக்க வாரியாக வெற்றி விகிதம்",
  byMode: "முறை வாரியாக ஆட்டங்கள்",
  recentCaptures: "சமீப ஆட்டங்களில் பிடிப்புகள்",
  noData: "விளக்கப்படங்களுக்கு ஒரு ஆட்டத்தை முடியுங்கள்.",
  online: "ஆன்லைன்",
  offline: "ஆஃப்லைன்",

  battleReady: "போர் தயார்",
  movePlacement: "ஆடு வைப்பு",
  moveMovement: "காய் நகர்வு",
  moveCapture: "தந்திர பிடிப்பு",
  urgent: "⚡ அவசரம் · {n}வி",
  turnHash: "முறை #{n}",
  ariaEmpty: "{node} (காலி புள்ளி)",
  ariaDest: "{node} (காலி புள்ளி, சட்ட இலக்கு)",
  ariaPiece: "{node} ({side})",
  ariaSelected: "{node} ({side}, தேர்வு)",

  footerLeft: "v1.5 ஆஃப்லைன் PWA",
  footerRight: "AI & 2-வீரர் ஆஃப்லைனில் வேலை செய்யும் · ஆன்லைன் அறைகளுக்கு இணையம் தேவை",

  clockLabel: "முறை கடிகாரம்",
  timeoutLabel: "நேரம் முடிந்தால்",
  warnOnly: "எச்சரிக்கை",
  forfeitGame: "தோல்வி",
  secs: "{n}வி",

  viewingMove: "நகர்வு {i} / {n}",
  replayPrev: "முன்",
  replayNext: "அடுத்து",
  replayExit: "மறுபார்வையிலிருந்து வெளியேறு",
  replayLive: "நேரலைக்குத் திரும்பு",
  copyReplay: "மறுபார்வையைப் பகிர்",
  replayCopied: "மறுபார்வை இணைப்பு நகலெடுக்கப்பட்டது!",
  replayShared: "மறுபார்வை பகிரப்பட்டது!",
  replayFailed: "பகிர்வு தோல்வி — இணைப்பு நகலெடுக்கத் தயார்.",
  replayLoaded: "பகிர்ந்த மறுபார்வை ஏற்றப்பட்டது. நகர்வுகளைப் பாருங்கள்!",

  tourKicker: "பயிற்சி சுற்றுலா",
  tourTitle: "2 நிமிடத்தில் வேட்டையைக் கற்க",
  tourNext: "அடுத்து",
  tourBack: "முன்",
  tourSkip: "தவிர்",
  tourPractice: "எளிய AI-உடன் பயிற்சி",
  tourDemo: "மாதிரி நகர்வைப் பார்",
  tourStep1T: "போர்க்களம்",
  tourStep1B:
    "23 இணைந்த புள்ளிகள். 3 புலிகள் உச்சி முக்கோணத்தில் தொடங்கும்; ஆடுகள் ஒவ்வொரு முறையும் ஒன்றாக வரும். இது நேரலை பலகை — “மாதிரி நகர்வைப் பார்” என்பதை அழுத்தி விளையாடுவதைப் பாருங்கள்.",
  tourStep2T: "ஆடுகள் முதலில் வைக்கும்",
  tourStep2B:
    "15 ஆடுகளும் வைக்கும் வரை ஆடுகள் நகர முடியாது. புலிகள் வெளியேறும் முன் மையத்துக்கு அருகில் சுவர் எழுப்புவதே வலுவான தந்திரம்.",
  tourStep3T: "புலிகள் பாயும்",
  tourStep3B:
    "புலிகள் கோடுகளில் நழுவும் — அருகிலுள்ள ஆட்டின் மீது காலி இடத்திற்குத் தாண்டி, செஸ் போலவே பிடிக்கும்.",
  tourStep4T: "சிக்க வை அல்லது சிக்கிக்கொள்",
  tourStep4B:
    "எந்தப் புலியும் நகர முடியாமல் சுற்றி வளைத்தால் ஆடுகள் வெல்லும். 5 ஆடுகளைப் பிடித்தால் புலிகள் வெல்லும். பிடிப்பு எண்ணிக்கையைக் கவனியுங்கள்!",
  tourStep5T: "இப்போது உங்கள் முறை, தளபதியே",
  tourStep5B:
    "எளிய பயிற்சி ஆட்டத்தில் குதியுங்கள். எப்போதும் H-ஐ அழுத்தி தந்திர குறிப்பு பெறுங்கள், U-வால் திரும்பப்பெறுங்கள், மூன்று புலிகளையும் சிக்க வையுங்கள்.",

  forfeitLogGoat: "🐐 ஆடுகள் நேரம் முடிந்து தோற்றன ⏱",
  forfeitLogTiger: "🐯 புலிகள் நேரம் முடிந்து தோற்றன ⏱",

  whoTiger: "🐯 புலி",
  whoGoat: "🐐 ஆடு",
  logPlace: "{who} {node}-இல் வைத்தது",
  logCapture: "{who} {from} → {to} தாண்டியது ({over}-ஐப் பிடித்தது)",
  logMove: "{who} {from} → {to} நகர்ந்தது",

  coachDone: "போட்டி நிறைவு. திருப்புமுனைகளைக் காண நகர்வுப் பதிவைப் பாருங்கள்.",
  coachCapture: "தந்திர தாக்குதல் வாய்ப்பு: {n} தாண்டல் உள்ளது.",
  coachCapturePlural: "தந்திர தாக்குதல் வாய்ப்பு: {n} தாண்டல்கள் உள்ளன.",
  coachOpening: "தொடக்க விதி: மந்தை பாதுகாப்புக்கு மையப் புள்ளியில் ஆட்டை வையுங்கள்.",
  coachHerd: "மந்தை தந்திரம்: புலிகளைத் தடுக்க மையத்துக்கு அருகில் ஆடுகளை வையுங்கள்.",
  coachDanger: "மிக ஆபத்து: புலி நகர்வு குறைவு. உடனே தப்பும் வழியைக் காணுங்கள்!",
  coachPressure: "வேட்டை அழுத்தம்: மேலும் 2 பிடிப்புகள் புலிகளுக்கு வெற்றியைத் தரும்.",
  coachDefault: "தந்திர பார்வை: மையக் கட்டுப்பாட்டைத் தக்கவைத்து தாண்டல் வாய்ப்புகளைப் பாருங்கள்.",

  sPlaceFirst: "தொடங்க காலி புள்ளியில் ஒரு ஆட்டை வையுங்கள்.",
  sNewGame: "புதிய ஆட்டம் தொடங்கியது. ஆடுகள் முதலில் வைக்கும்.",
  sRestored: "போட்டி மீட்கப்பட்டது. விட்ட இடத்திலிருந்து தொடருங்கள்.",
  sJoinedOnline: "ஆன்லைன் அறை #{room}-இல் சேர்ந்தீர்கள். எதிராளியுடன் இணைகிறது...",
  sJoinedLocal: "2-வீரர் போட்டியில் (அறை #{room}) சேர்ந்தீர்கள். ஆடுகள் முதலில்!",
  sLocalReady: "உள்ளூர் 2-வீரர் போட்டி தயார். அறை #{room}. ஆடுகள் தொடங்கும்.",
  sOnlineCreated:
    "ஆன்லைன் அறை #{room} உருவாக்கப்பட்டது. புலி வீரருக்கு அழைப்பு இணைப்பை நகலெடுங்கள்.",
  sGoatsAI: "ஆடுகள் நகர வேண்டும். காலி புள்ளியைத் தேர்ந்தெடுங்கள்.",
  sTigersAI: "புலிகள் நகர வேண்டும். AI தயாராகிறது.",
  sGoatsMove: "ஆடுகள் நகரும் முறை.",
  sTigersMove: "புலிகள் நகரும் முறை.",
  sCaptured: "{node} புள்ளியில் ஒரு ஆடு பிடிபட்டது.",
  sUndone: "நகர்வு திரும்பப்பெறப்பட்டது.",
  sNoLegal: "சட்ட நகர்வு இல்லை.",
  sHint: "தந்திர குறிப்பு: {move}.",
  sTimeLowGoat: "ஆடுகளுக்கு முறை நேரம் குறைவாக உள்ளது!",
  sTimeLowTiger: "புலிகளுக்கு முறை நேரம் குறைவாக உள்ளது!",
  sChallengeFirst: "சவால் விதி: முதல் ஆடு மையப் புள்ளியில் விழ வேண்டும்.",
  sOccupied: "அந்தப் புள்ளி நிரம்பியுள்ளது — காலி முனையைத் தேர்ந்தெடுங்கள்.",
  sNoDest: "அந்தக் காய்க்குச் சட்ட இலக்கு இல்லை.",
  sChooseDest: "ஒளிரும் இலக்குப் புள்ளியைத் தேர்ந்தெடுங்கள்.",
  sSelectOwn: "முதலில் உங்கள் காயைத் தேர்ந்தெடுங்கள்.",
  sInviteOnline: "ஆன்லைன் அழைப்பு இணைப்பு நகலெடுக்கப்பட்டது. எதிராளியுடன் பகிருங்கள்!",
  sInviteLocal: "உள்ளூர் போட்டி இணைப்பு நகலெடுக்கப்பட்டது.",
  sInviteShared: "அழைப்பு பகிரப்பட்டது!",
  sOfflinePause:
    "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். ஆன்லைன் அறைகள் நிறுத்தம் — AI & 2-வீரர் வேலை செய்யும்.",
  sOfflineSwitch:
    "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். ஆன்லைன் அறைகளுக்கு இணையம் தேவை — உள்ளூர் 2-வீரர் தொடங்குகிறது.",
  sOpponentMoved: "எதிராளி நகர்ந்துவிட்டார். உங்கள் முறை!",
  sRematch: "எதிராளி புதிய ஆட்டத்தைத் தொடங்கினார் — மறுபோட்டி!",
  sTigerWin: "புலிகள் 5 ஆடுகளைப் பிடித்து வேட்டையில் வென்றன!",
  sGoatWin: "அனைத்துப் புலிகளும் சிக்கின — ஆடுகள் வென்றன!",
  sForfeitTigerWin: "ஆடுகளுக்கு நேரம் முடிந்தது — புலிகள் வென்றன!",
  sForfeitGoatWin: "புலிகளுக்கு நேரம் முடிந்தது — ஆடுகள் வென்றன!",
};

const STRINGS: Record<Lang, Strings> = { en, ta };

function readSaved(): Lang {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return "en";
  try {
    const raw = localStorage.getItem(LANG_KEY);
    if (raw === "ta" || raw === "en") return raw;
  } catch {
    // ignore
  }
  return "en";
}

let current: Lang = "en";
let initialized = false;
const listeners = new Set<() => void>();

function ensureInit() {
  if (!initialized) {
    initialized = true;
    current = readSaved();
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): Lang {
  ensureInit();
  return current;
}

function getServerSnapshot(): Lang {
  return "en";
}

export function setLang(lang: Lang) {
  ensureInit();
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang === "ta" ? "ta" : "en";
  }
  listeners.forEach((fn) => fn());
}

export function getSavedLang(): Lang {
  ensureInit();
  return current;
}

export function useLang() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { lang, t: STRINGS[lang], setLang };
}
