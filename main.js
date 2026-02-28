let board = null;
let game = new Chess();
let mainLine = [];
let mistakeMap = {};
let currentMoveIndex = 0;
let mode = 'main';
let correctionIndex = 0;
let visitedCheckpoint = {};
let isAutoPlaying = false;
let autoPlayInterval = null;
let currentArrows = [];

const uiRunBtn = document.getElementById('btn-run');
const uiPrevBtn = document.getElementById('btn-prev');
const uiNextBtn = document.getElementById('btn-next');
const uiLoadBtn = document.getElementById('btn-load');
const uiExplanation = document.getElementById('explanation-panel');
const uiExpTitle = document.getElementById('exp-title');
const uiExpBadge = document.getElementById('exp-badge');
const uiExpEval = document.getElementById('exp-eval');
const uiExpText = document.getElementById('exp-text');
const uiSvg = document.getElementById('arrow-svg');
const jsonInput = document.getElementById('json-input');
const btnCopyPrompt = document.getElementById('btn-copy-prompt');

const defaultLesson = {
    "pgn": "1.e4 e6 2.Nf3 d5 3.Nc3 c5 4.d4 Nc6 5.Bc4 dxc4 6.Bf4 Nxd4 7.Nxd4 cxd4 8.O-O dxc3 9.bxc3 Ne7 10.f3 h6 11.Bxh6 gxh6 12.f4 a6 13.Rf3 b5 14.a4 Qxd1+ 15.Kf2 Qxa1 16.f5 bxa4 17.fxe6 fxe6 18.e5 h5 19.Rxf8+ Rxf8+ 20.Kg3 Rg8+ 21.Kh3 Qxc3+ 22.Kh4 Rxg2 23.Kxh5 Qxe5+ 24.Kh6 Nf5+ 25.Kh7 Qg7#",
    "result": "0-1",
    "playerColor": "white",
    "mistakes": [
        {
            "moveNumber": 5,
            "side": "white",
            "played": "Bc4",
            "better": "Bb5",
            "evaluationAfter": "-0.8",
            "arrows": [
                { "from": "f1", "to": "c4", "color": "red" },
                { "from": "c4", "to": "b5", "color": "green" }
            ],
            "explanation": "Bc4 allows Black to gain tempo with ...dxc4 and then ...Nxd4. The bishop becomes a tactical target and White loses central control. Bb5 develops safely and increases pressure on the knight."
        },
        {
            "moveNumber": 11,
            "side": "white",
            "played": "Bxh6",
            "better": "O-O",
            "evaluationAfter": "-3.5",
            "arrows": [
                { "from": "c1", "to": "h6", "color": "red" },
                { "from": "e1", "to": "g1", "color": "green" }
            ],
            "explanation": "The sacrifice on h6 is unsound. White does not have enough developed pieces to justify giving up a bishop. Castling instead would improve king safety and connect rooks."
        },
        {
            "moveNumber": 14,
            "side": "white",
            "played": "a4",
            "better": "Qe2",
            "evaluationAfter": "-5.0",
            "arrows": [
                { "from": "a2", "to": "a4", "color": "red" },
                { "from": "d1", "to": "e2", "color": "green" }
            ],
            "explanation": "a4 ignores the tactical threat to the queen. After ...Qxd1+ and ...Qxa1, Black wins a rook. Qe2 would defend the queen and prevent material loss."
        },
        {
            "moveNumber": 16,
            "side": "white",
            "played": "f5",
            "better": "Kg3",
            "evaluationAfter": "-6.0",
            "arrows": [
                { "from": "f4", "to": "f5", "color": "red" },
                { "from": "f2", "to": "g3", "color": "green" }
            ],
            "explanation": "White continues attacking while down material and with an exposed king. Improving king safety was necessary. The pawn push opens more lines for Black's rooks."
        }
    ]
};

function init() {
    board = Chessboard('board', {
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });
    jsonInput.value = JSON.stringify(defaultLesson, null, 2);
}

function loadLesson() {
    stopAutoPlay();

    let lessonData;
    try {
        lessonData = JSON.parse(jsonInput.value);
    } catch (e) {
        alert("Invalid JSON format. Please check for syntax errors.");
        return;
    }

    game.reset();
    let loaded = game.load_pgn(lessonData.pgn);
    if (!loaded) {
        alert("Invalid PGN. Chess.js failed to parse.");
        return;
    }

    const history = game.history({ verbose: true });

    game.reset();
    mainLine = [{ fen: game.fen(), move: null }];

    for (let i = 0; i < history.length; i++) {
        game.move(history[i].san);
        mainLine.push({ fen: game.fen(), move: history[i] });
    }

    mistakeMap = {};
    visitedCheckpoint = {};

    if (lessonData.mistakes) {
        lessonData.mistakes.forEach(mistake => {
            let tempGame = new Chess();
            tempGame.load_pgn(lessonData.pgn);
            let pgnHistory = tempGame.history();

            let moveIndex = (mistake.moveNumber - 1) * 2 + (mistake.side.toLowerCase() === 'white' ? 0 : 1);

            let checkGame = new Chess();
            for (let i = 0; i < moveIndex; i++) {
                if (pgnHistory[i]) checkGame.move(pgnHistory[i]);
            }

            let correctStr = mistake.correctMove || mistake.better;

            let redArrow = null;
            let playedMove = checkGame.move(mistake.played, { sloppy: true });
            if (playedMove) {
                redArrow = { from: playedMove.from, to: playedMove.to, color: 'red' };
                checkGame.undo();
            }

            let greenArrow = null;
            let greenMove = checkGame.move(correctStr, { sloppy: true });
            if (greenMove) {
                greenArrow = { from: greenMove.from, to: greenMove.to, color: 'green' };
                checkGame.undo();
            }

            mistake.arrows = [];
            if (redArrow) mistake.arrows.push(redArrow);
            if (greenArrow) mistake.arrows.push(greenArrow);

            let cLine = [];
            let mBetter = checkGame.move(correctStr, { sloppy: true });
            if (mBetter) {
                cLine.push({ fen: checkGame.fen(), move: mBetter });

                if (mistake.continuation) {
                    mistake.continuation.forEach(cMove => {
                        let cleanMove = cMove.replace(/^\d+\.?\.*\s*/, '');
                        let mCont = checkGame.move(cleanMove, { sloppy: true });
                        if (mCont) cLine.push({ fen: checkGame.fen(), move: mCont });
                    });
                }
            }

            mistake.correctionLine = cLine;

            let absIndex = moveIndex + 1;
            mistakeMap[absIndex] = mistake;
        });
    }

    if (lessonData.playerColor.toLowerCase() === 'black' && board.orientation() !== 'black') {
        board.orientation('black');
    } else if (lessonData.playerColor.toLowerCase() !== 'black' && board.orientation() === 'black') {
        board.orientation('white');
    }

    currentMoveIndex = 0;
    mode = 'main';
    board.position('start');
    clearArrows();
    hideExplanation();
}

function toggleAutoPlay() {
    if (isAutoPlaying) {
        stopAutoPlay();
    } else {
        isAutoPlaying = true;
        uiRunBtn.textContent = "Pause Lesson";
        autoPlayInterval = setInterval(nextMove, 1500);
        nextMove();
    }
}

function stopAutoPlay() {
    if (!isAutoPlaying) return;
    isAutoPlaying = false;
    uiRunBtn.textContent = "Run Lesson";
    clearInterval(autoPlayInterval);
}

function nextMove() {
    if (mode === 'main') {
        if (mistakeMap[currentMoveIndex] && !visitedCheckpoint[currentMoveIndex]) {
            mode = 'correction';
            correctionIndex = 0;
            board.position(mistakeMap[currentMoveIndex].correctionLine[correctionIndex].fen);

            clearArrows();
            uiExpBadge.textContent = "Exploring better line";
            uiExpBadge.style.backgroundColor = "var(--green)";
            uiExpTitle.innerHTML = `Correction Line <span class="badge" id="exp-badge" style="background-color: var(--green); color: #000; font-weight: 600;">Exploring Better Move</span>`;

            return;
        }

        if (currentMoveIndex < mainLine.length - 1) {
            currentMoveIndex++;
            board.position(mainLine[currentMoveIndex].fen);

            if (mistakeMap[currentMoveIndex] && !visitedCheckpoint[currentMoveIndex]) {
                stopAutoPlay();
                showCheckpoint(mistakeMap[currentMoveIndex]);
            } else {
                clearArrows();
                hideExplanation();
            }
        } else {
            stopAutoPlay();
        }
    } else if (mode === 'correction') {
        let mistake = mistakeMap[currentMoveIndex];
        if (correctionIndex < mistake.correctionLine.length - 1) {
            correctionIndex++;
            board.position(mistake.correctionLine[correctionIndex].fen);
        } else {
            mode = 'main';
            visitedCheckpoint[currentMoveIndex] = true;
            board.position(mainLine[currentMoveIndex].fen);
            clearArrows();
            hideExplanation();

        }
    }
}

function prevMove() {
    stopAutoPlay();
    if (mode === 'main') {
        if (currentMoveIndex > 0) {
            if (mistakeMap[currentMoveIndex]) {
                visitedCheckpoint[currentMoveIndex] = false;
            }

            currentMoveIndex--;
            board.position(mainLine[currentMoveIndex].fen);

            if (mistakeMap[currentMoveIndex] && !visitedCheckpoint[currentMoveIndex]) {
                showCheckpoint(mistakeMap[currentMoveIndex]);
            } else {
                clearArrows();
                hideExplanation();
            }
        }
    } else if (mode === 'correction') {
        if (correctionIndex > 0) {
            correctionIndex--;
            board.position(mistakeMap[currentMoveIndex].correctionLine[correctionIndex].fen);
        } else {
            mode = 'main';
            board.position(mainLine[currentMoveIndex].fen);
            showCheckpoint(mistakeMap[currentMoveIndex]);
        }
    }
}

function showCheckpoint(mistake) {
    uiExpTitle.innerHTML = `Checkpoint: Move ${mistake.moveNumber} (${mistake.side}) <span class="badge" id="exp-badge" style="background-color: var(--red);">Mistake</span>`;
    uiExpEval.textContent = mistake.evaluationAfter ? `Evaluation after move: ${mistake.evaluationAfter}` : '';
    uiExpText.textContent = mistake.explanation;
    uiExplanation.style.display = 'block';

    drawArrows(mistake.arrows);
}

function updateExplanationTitle(title) {
    uiExpTitle.textContent = title;
}

function hideExplanation() {
    uiExplanation.style.display = 'none';
}

function clearArrows() {
    uiSvg.innerHTML = `
<defs>
        <marker id="arrowhead-red" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
  <polygon points="0 0, 4 2, 0 4" fill="rgba(239, 68, 68, 0.9)" />
</marker>
<marker id="arrowhead-green" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
  <polygon points="0 0, 4 2, 0 4" fill="rgba(34, 197, 94, 0.9)" />
</marker>
</defs>`;
    currentArrows = [];
}

function drawArrows(arrows) {
    clearArrows();
    if (!arrows || arrows.length === 0) return;

    currentArrows = arrows;

    let orientation = board.orientation();

    arrows.forEach(arrow => {
        let fromPt = getSquareCenter(arrow.from, orientation);
        let toPt = getSquareCenter(arrow.to, orientation);

        let dx = toPt.x - fromPt.x;
        let dy = toPt.y - fromPt.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return;

        let ux = dx / dist;
        let uy = dy / dist;

        let startX = fromPt.x + ux * 2.5;
        let startY = fromPt.y + uy * 2.5;
        let endX = toPt.x - ux * 3.5;
        let endY = toPt.y - uy * 3.5;

        let colorObj = {
            'red': { stroke: 'rgba(239, 68, 68, 0.9)', marker: 'url(#arrowhead-red)' },
            'green': { stroke: 'rgba(34, 197, 94, 0.9)', marker: 'url(#arrowhead-green)' }
        };

        let style = colorObj[arrow.color] || colorObj['red'];

        let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', style.stroke);
        line.setAttribute('stroke-width', '1.2');
        line.setAttribute('marker-end', style.marker);

        uiSvg.appendChild(line);
    });
}

function getSquareCenter(sq, orientation) {
    let files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    let fileIdx = files.indexOf(sq[0]);
    let rankIdx = ranks.indexOf(sq[1]);

    if (orientation === 'black') {
        fileIdx = 7 - fileIdx;
        rankIdx = 7 - rankIdx;
    }

    return {
        x: fileIdx * 12.5 + 6.25,
        y: rankIdx * 12.5 + 6.25
    };
}

const PROMPT_TEMPLATE = `I will provide a full chess PGN.

**Your task:**
Analyze the entire game carefully and generate a structured lesson JSON using EXACTLY the format shown below.

- Do NOT change field names.
- Do NOT add extra fields.
- Do NOT remove fields.
- Do NOT output anything except valid JSON.

### REQUIRED JSON FORMAT:

\`\`\`json
{
  "pgn": "",
  "result": "",
  "playerColor": "",
  "mistakes": [
    {
      "moveNumber": 0,
      "side": "",
      "played": "",
      "correctMove": "",
      "evaluationAfter": "",
      "explanation": "",
      "arrows": [
        { "from": "", "to": "", "color": "red" },
        { "from": "", "to": "", "color": "green" }
      ],
      "continuation": []
    }
  ]
}
\`\`\`

### Analysis Rules:

**Identify ALL meaningful mistakes:**
- Blunders (losing material or forced mate)
- Tactical mistakes
- Strategic errors
- Missed winning tactics
- Major inaccuracies
- *Only include moves that clearly worsen the position.*
- *Do NOT include minor engine-only inaccuracies.*

**For each mistake:**
- Provide \`moveNumber\` and \`side\` correctly.
- Provide the exact SAN notation of the played move.
- Provide the best practical correction move.
- Give a clear \`evaluationAfter\` (example: "-2.4").
- Write a teaching explanation in simple but precise language.
- The explanation must explain **WHY** the move is wrong and **WHAT** principle is violated.

**For arrows:**
- Red arrow = played move
- Green arrow = correctMove
- Compute correct from/to squares based on the actual board state.
- Do NOT guess squares.

**For continuation:**
- If the correction has a forcing line, include 3–6 follow-up moves.
- If no clear continuation is needed, use an empty array.

**Keep explanations instructional, not robotic.**
Teach concepts like:
- Development
- King safety
- Material balance
- Tactical motifs
- Pawn structure
- Initiative

**Return ONLY valid JSON inside a single code block.**
- Wrap the JSON in triple backticks with `json`.
- No text before or after the code block.
- No comments.
- No explanation outside JSON.

I will now provide the PGN. Analyze it deeply and generate the full lesson JSON.`;

async function copyPrompt() {
    try {
        await navigator.clipboard.writeText(PROMPT_TEMPLATE);

        let originalContent = btnCopyPrompt.innerHTML;
        btnCopyPrompt.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Copied!
        `;
        btnCopyPrompt.classList.add('success');

        setTimeout(() => {
            btnCopyPrompt.innerHTML = originalContent;
            btnCopyPrompt.classList.remove('success');
        }, 2000);

    } catch (err) {
        console.error('Failed to copy prompt:', err);
        alert('Failed to copy the prompt template to clipboard.');
    }
}

uiLoadBtn.addEventListener('click', loadLesson);
uiRunBtn.addEventListener('click', toggleAutoPlay);
uiNextBtn.addEventListener('click', nextMove);
uiPrevBtn.addEventListener('click', prevMove);
if (btnCopyPrompt) btnCopyPrompt.addEventListener('click', copyPrompt);

$(window).resize(() => {
    if (board) {
        board.resize();
        if (currentArrows.length > 0) {
            let arrowsToDraw = [...currentArrows];
            drawArrows(arrowsToDraw);
        }
    }
});

$(document).ready(() => {
    init();
    loadLesson();
});

