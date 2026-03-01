I will provide a full chess PGN.

**Your task:**
Analyze the entire game carefully and generate a structured lesson JSON using EXACTLY the format shown below.

- Do NOT change field names.
- Do NOT add extra fields.
- Do NOT remove fields.
- Do NOT output anything except a valid JSON code block.

### REQUIRED JSON FORMAT:

```json
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
```

### Analysis Rules:

**Identify the HUMAN player:**
- Look at the PGN headers (White and Black).
- If one player has "AI", "bot", "Stockfish", or "computer" in their name, or if it is obvious they are an engine, the HUMAN is the other player.
- You must ONLY analyze and extract mistakes made by the HUMAN player. Do NOT point out mistakes made by the bot.

**Identify ALL meaningful mistakes:**
- Blunders (losing material or forced mate)
- Tactical mistakes
- Strategic errors
- Missed winning tactics
- Major inaccuracies
- *Only include moves that clearly worsen the position.*
- *Do NOT include minor engine-only inaccuracies.*

**For each mistake:**
- Provide `moveNumber` and `side` correctly.
- Provide the exact SAN notation of the played move.
- Provide the best practical correction move.
- Give a clear `evaluationAfter` (example: "-2.4").
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

**Return ONLY valid JSON enclosed in a ```json code block.**
- No explanation outside the code block.
- No comments.

I will now provide the PGN. Analyze it deeply and generate the full lesson JSON.
