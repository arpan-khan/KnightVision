# KnightVision ♞

**KnightVision** is a minimal, interactive, entirely client-side web application designed to help chess players analyze and learn from their mistakes. By leveraging the power of AI to analyze your PGNs, KnightVision creates automated "Checkpoints" out of your blunders and inaccuracies, allowing you to replay games and explore the correct continuations.


## Features

- **Interactive Chessboard:** Powered by `chessboard.js` and `chess.js` for precise, rule-abiding movement and visualization.
- **Mistake Checkpoints:** Automatically flags key mistakes in a game, drawing SVG arrows directly on the board (Red for the played move, Green for the correct move).
- **Correction Lines:** Step seamlessly into "Correction Mode" to play through the optimal continuation, then seamlessly return to the main game.
- **Client-Side Only:** No backend, no databases, no server necessary. Just plain HTML, CSS, and JS.
- **Responsive Design:** A beautifully styled, dark-mode layout that acts fluidly and scales perfectly on mobile devices.

## How to Use

1. **Play a Game:** Go to [lichess.org](https://lichess.org/) > Play against a computer.
2. **Get the PGN:** After a match click **Analysis board** > **Share & export** > Copy or download the PGN.
3. **Copy the Prompt:** Click the "Copy AI Prompt" button on the UI to load the exact instructional template into your clipboard.
4. **Generate the Lesson:** Paste the Prompt and your PGN into any conversational AI (like ChatGPT, Claude, or Gemini).
5. **Load the Lesson:** Paste the generated JSON output back into KnightVision's text box and click **Load Lesson**.
6. **Learn:** Click **Run Lesson** and watch the game unfolds, pausing to teach you exactly where you went wrong!

## Local Development

Because KnightVision uses modern clipboard APIs, you may need to serve the directory locally if you wish to modify it natively, though simply opening `index.html` in your browser works perfectly for running the app itself!

Feel free to customize the CSS themes inside `styles.css` to match your preferences!

## AI Declaration

🤖 *This project was built with the structural, design, and coding assistance of Artificial Intelligence tools.*

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
