# PuzzleLab

🎮 **Play PuzzleLab:** https://puzzlelab.onrender.com/

**PuzzleLab: Target Number** is a browser-based number puzzle game built with FastAPI, JavaScript, HTML, and CSS.

Players receive four numbers and a target. The goal is to create an equation that reaches the target while using every number exactly once.

The project includes both unlimited puzzle generation and a shared Daily Puzzle, along with hints, statistics, timers, multiple challenge levels, and several ways to play.

## Features

### Unlimited Mode
- Generate and play as many puzzles as you want
- Choose between Easy, Medium, Hard, and Mixed challenges
- Each generated puzzle is verified to have a valid solution
- Start a new puzzle whenever you want

### Daily Puzzle
- One Daily Puzzle for the day
- Daily progress is preserved if the player leaves and returns
- Dedicated Daily result screen
- Daily streak tracking
- Countdown to the next Daily Puzzle

### Puzzle Gameplay
- Use all four numbers exactly once
- Supports addition, subtraction, multiplication, division, and parentheses
- Up to 6 valid attempts per puzzle
- Invalid equations do not consume an attempt
- Three progressive hint levels
- Give Up option with solution reveal

### Controls
PuzzleLab supports multiple input methods:

- Mouse clicking
- Touch controls
- Drag-and-drop
- Full keyboard equation entry
- Keyboard navigation through the equation

Keyboard shortcuts include:

- `1–9` — use an available number
- `+` — addition
- `-` — subtraction
- `*`, `x`, or `X` — multiplication
- `/` — division
- `(` and `)` — parentheses
- `Backspace` — remove the last tile
- `Enter` — submit the equation
- `←` / `→` — move through equation tiles
- `Ctrl + ←` / `Ctrl + →` — reorder the selected equation tile

### Timer and Pause
- Puzzle timer
- Hide or show the timer
- Pause and resume gameplay
- Timer state survives refreshes and mode changes
- Solve times are included in player statistics

### Statistics
Statistics are stored separately for Unlimited and Daily play.

They include:

- Games played
- Win percentage
- Current streak
- Maximum streak
- Average solve time
- Best solve time
- Solve distribution
- Hint distribution

Unlimited statistics can also be viewed by:

- Selected Challenge
- Actual puzzle Difficulty

### Appearance
- Light mode
- Dark mode
- System theme
- Responsive layout for different screen sizes

### Accessibility
PuzzleLab is designed so that gameplay does not depend on a single input method.

Players can use mouse, touch, drag-and-drop, or keyboard controls. Interactive elements include keyboard focus support, and important game actions can be completed without dragging.

## Technology

### Backend
- Python
- FastAPI
- Jinja2

### Frontend
- HTML
- CSS
- JavaScript

### Storage
Player progress, preferences, and statistics are currently stored locally in the browser using `localStorage`.

## Running PuzzleLab Locally

### 1. Clone the repository

```bash
git clone https://github.com/rayansuan-eng/PuzzleLab.git
```

### 2. Enter the project folder

```bash
cd PuzzleLab
```

### 3. Create a virtual environment

```bash
python -m venv .venv
```

### 4. Activate the virtual environment

On Windows:

```bash
.venv\Scripts\activate
```

### 5. Install the dependencies

```bash
pip install -r requirements.txt
```

### 6. Start the server

```bash
python -m uvicorn main:app --reload --port 8001
```

### 7. Open PuzzleLab

Open:

```text
http://127.0.0.1:8001
```

in your browser.

## Project Structure

```text
PuzzleLab/
├── main.py
├── target_number.py
├── requirements.txt
├── static/
│   ├── script.js
│   └── style.css
└── templates/
    └── index.html
```

## Future Development

PuzzleLab is designed as a foundation for a larger collection of browser-based puzzle games.

Potential future additions include:

- Shareable Daily results
- Online deployment
- Additional PuzzleLab games
- User accounts
- Cross-device progress
- Cloud-based statistics

## Author

**Rayan Suan**

Computer Engineering student with an interest in software development, algorithms, digital systems, and problem solving.