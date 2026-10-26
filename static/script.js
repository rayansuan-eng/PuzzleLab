let currentPuzzle = null;
let equationTokens = [];

let draggedEquationIndex = null;
let selectedEquationIndex = null;


const MAX_ATTEMPTS = 6;
const MAX_HINTS = 3;

const savedDifficulty =
    localStorage.getItem(
        "puzzleLabDifficulty"
    );


let selectedDifficulty =
    [
        "easy",
        "medium",
        "hard",
        "mixed"
    ].includes(savedDifficulty)
        ? savedDifficulty
        : "mixed";

const savedAppearance =
    localStorage.getItem(
        "puzzleLabAppearance"
    );


let selectedAppearance =
    [
        "light",
        "dark",
        "system"
    ].includes(savedAppearance)
        ? savedAppearance
        : "system";


const systemThemeQuery =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );


const savedMode =
    localStorage.getItem(
        "puzzleLabMode"
    );

let currentMode =
    savedMode === "daily"
        ? "daily"
        : "random";

let selectedStatsMode =
    currentMode;

let puzzleRequestId = 0;
let puzzleLoading = false;

const UNLIMITED_STATE_KEY =
    "puzzleLabUnlimitedState";

const DAILY_ACTIVE_STATE_KEY =
    "puzzleLabActiveDailyState";

const TIMER_VISIBLE_KEY =
    "puzzleLabTimerVisible";

const HINT_STATS_RULE_VERSION_KEY =
    "puzzleLabHintStatsRuleVersion";

const HINT_STATS_RULE_VERSION =
    "wins-only-v1";

const UNLIMITED_BREAKDOWN_KEY =
    "puzzleLabUnlimitedBreakdownV1";

const STATS_GROUPING_KEY =
    "puzzleLabStatsGrouping";

let selectedStatsGrouping =
    localStorage.getItem(STATS_GROUPING_KEY) === "difficulty"
        ? "difficulty"
        : "challenge";

let selectedStatsFilter = "all";

let timerVisible =
    localStorage.getItem(TIMER_VISIBLE_KEY) !== "false";

let attempts = 0;
let hintLevel = 0;
let submitInProgress = false;
let hintInProgress = false;
let solutionInProgress = false;

const SUBMIT_COOLDOWN_MS = 600;
let lastSubmitTime = 0;

let streak =
    Number(localStorage.getItem("puzzleLabStreak")) || 0;

let maxStreak =
    Number(localStorage.getItem("puzzleLabMaxStreak")) || 0;

let gamesPlayed =
    Number(localStorage.getItem("puzzleLabPlayed")) || 0;

let gamesWon =
    Number(localStorage.getItem("puzzleLabWins")) || 0;

let solveDistribution =
    JSON.parse(
        localStorage.getItem("puzzleLabDistribution")
    ) || [0, 0, 0, 0, 0, 0];

let unlimitedHintDistribution =
    JSON.parse(
        localStorage.getItem(
            "puzzleLabUnlimitedHintDistribution"
        )
    ) || [0, 0, 0, 0];

let unlimitedSolveTimeTotalMs =
    Number(
        localStorage.getItem(
            "puzzleLabUnlimitedSolveTimeTotalMs"
        )
    ) || 0;

let unlimitedTimedWins =
    Number(
        localStorage.getItem(
            "puzzleLabUnlimitedTimedWins"
        )
    ) || 0;

let unlimitedBestSolveTimeMs =
    Number(
        localStorage.getItem(
            "puzzleLabUnlimitedBestSolveTimeMs"
        )
    ) || 0;


let dailyStreak =
    Number(
        localStorage.getItem(
            "puzzleLabDailyStreak"
        )
    ) || 0;

let dailyMaxStreak =
    Number(
        localStorage.getItem(
            "puzzleLabDailyMaxStreak"
        )
    ) || 0;

let dailyGamesPlayed =
    Number(
        localStorage.getItem(
            "puzzleLabDailyPlayed"
        )
    ) || 0;

let dailyGamesWon =
    Number(
        localStorage.getItem(
            "puzzleLabDailyWins"
        )
    ) || 0;

let dailySolveDistribution =
    JSON.parse(
        localStorage.getItem(
            "puzzleLabDailyDistribution"
        )
    ) || [0, 0, 0, 0, 0, 0];

let dailyHintDistribution =
    JSON.parse(
        localStorage.getItem(
            "puzzleLabDailyHintDistribution"
        )
    ) || [0, 0, 0, 0];


// The first Hint Distribution build also counted losses.
// Reset that new statistic once so it now means exactly:
// "How many hints did I use on puzzles I solved?"
if (
    localStorage.getItem(
        HINT_STATS_RULE_VERSION_KEY
    ) !== HINT_STATS_RULE_VERSION
) {
    unlimitedHintDistribution = [0, 0, 0, 0];
    dailyHintDistribution = [0, 0, 0, 0];

    localStorage.setItem(
        "puzzleLabUnlimitedHintDistribution",
        JSON.stringify(unlimitedHintDistribution)
    );

    localStorage.setItem(
        "puzzleLabDailyHintDistribution",
        JSON.stringify(dailyHintDistribution)
    );

    localStorage.setItem(
        HINT_STATS_RULE_VERSION_KEY,
        HINT_STATS_RULE_VERSION
    );
}

let dailySolveTimeTotalMs =
    Number(
        localStorage.getItem(
            "puzzleLabDailySolveTimeTotalMs"
        )
    ) || 0;

let dailyTimedWins =
    Number(
        localStorage.getItem(
            "puzzleLabDailyTimedWins"
        )
    ) || 0;

let dailyBestSolveTimeMs =
    Number(
        localStorage.getItem(
            "puzzleLabDailyBestSolveTimeMs"
        )
    ) || 0;

let dailyLastCompletedDate =
    localStorage.getItem(
        "puzzleLabDailyLastCompletedDate"
    ) || "";


function createEmptyStatsBucket() {

    return {
        played: 0,
        wins: 0,
        streak: 0,
        maxStreak: 0,
        distribution: [0, 0, 0, 0, 0, 0],
        hintDistribution: [0, 0, 0, 0],
        solveTimeTotalMs: 0,
        timedWins: 0,
        bestSolveTimeMs: 0
    };
}


function normalizeStatsBucket(value) {

    const base = createEmptyStatsBucket();

    if (!value || typeof value !== "object") {
        return base;
    }

    base.played = Number(value.played) || 0;
    base.wins = Number(value.wins) || 0;
    base.streak = Number(value.streak) || 0;
    base.maxStreak = Number(value.maxStreak) || 0;

    if (Array.isArray(value.distribution)) {
        base.distribution =
            base.distribution.map(
                (_, index) =>
                    Number(value.distribution[index]) || 0
            );
    }

    if (Array.isArray(value.hintDistribution)) {
        base.hintDistribution =
            base.hintDistribution.map(
                (_, index) =>
                    Number(value.hintDistribution[index]) || 0
            );
    }

    base.solveTimeTotalMs =
        Number(value.solveTimeTotalMs) || 0;

    base.timedWins =
        Number(value.timedWins) || 0;

    base.bestSolveTimeMs =
        Number(value.bestSolveTimeMs) || 0;

    return base;
}


function createEmptyUnlimitedBreakdown() {

    return {
        challenge: {
            easy: createEmptyStatsBucket(),
            medium: createEmptyStatsBucket(),
            hard: createEmptyStatsBucket(),
            mixed: createEmptyStatsBucket()
        },
        difficulty: {
            easy: createEmptyStatsBucket(),
            medium: createEmptyStatsBucket(),
            hard: createEmptyStatsBucket()
        }
    };
}


function loadUnlimitedBreakdownStats() {

    const empty = createEmptyUnlimitedBreakdown();
    const raw = localStorage.getItem(
        UNLIMITED_BREAKDOWN_KEY
    );

    if (!raw) {
        return empty;
    }

    try {
        const parsed = JSON.parse(raw);

        Object.keys(empty.challenge).forEach(key => {
            empty.challenge[key] =
                normalizeStatsBucket(
                    parsed?.challenge?.[key]
                );
        });

        Object.keys(empty.difficulty).forEach(key => {
            empty.difficulty[key] =
                normalizeStatsBucket(
                    parsed?.difficulty?.[key]
                );
        });

        return empty;

    } catch (error) {
        console.error(
            "Could not load Unlimited statistics breakdown.",
            error
        );

        return empty;
    }
}


let unlimitedBreakdownStats =
    loadUnlimitedBreakdownStats();

let puzzleSolved = false;
let puzzleLost = false;
let puzzleGivenUp = false;

let puzzleStarted = false;
let puzzleElapsedMs = 0;
let timerAnchorMs = null;
let timerIntervalId = null;
let puzzleManuallyPaused = false;
let dailyRolloverIntervalId = null;

// --------------------------------------------------
// Elements
// --------------------------------------------------

const gameCard =
    document.querySelector(".game-card");

const targetElement =
    document.getElementById("target");

const numbersContainer =
    document.getElementById("numbers");

const equationElement =
    document.getElementById("equation");

const feedbackElement =
    document.getElementById("feedback");


const attemptsElement =
    document.getElementById("attempts-count");

const streakElement =
    document.getElementById("streak-count");

const submitButton =
    document.getElementById("submit-button");

const clearButton =
    document.getElementById("clear-button");

const backspaceButton =
    document.getElementById("backspace-button");

const newPuzzleButton =
    document.getElementById("new-puzzle-button");

const giveUpButton =
    document.getElementById("give-up-button");

const hintButton =
    document.getElementById("hint-button");

const hintRevealElement =
    document.getElementById("hint-reveal");

const solutionRevealElement =
    document.getElementById("solution-reveal");

const equationTileControls =
    document.getElementById(
        "equation-tile-controls"
    );

const moveEquationLeftButton =
    document.getElementById(
        "move-equation-left"
    );

const moveEquationRightButton =
    document.getElementById(
        "move-equation-right"
    );

const removeEquationTileButton =
    document.getElementById(
        "remove-equation-tile"
    );

const accessibilityAnnouncer =
    document.getElementById(
        "accessibility-announcer"
    );

const operatorButtons =
    document.querySelectorAll(".operator-tile");

const difficultyButtons =
    document.querySelectorAll(
        ".difficulty-button"
    );

const appearanceButtons =
    document.querySelectorAll(
        ".appearance-button"
    );

const difficultyBadge =
    document.getElementById(
        "difficulty-badge"
    );

const modeButtons =
    document.querySelectorAll(
        ".mode-button"
    );


const helpButton =
    document.getElementById(
        "help-button"
    );

const helpModal =
    document.getElementById(
        "help-modal"
    );

const closeHelpButton =
    document.getElementById(
        "close-help-button"
    );


const settingsButton =
    document.getElementById(
        "settings-button"
    );

const settingsModal =
    document.getElementById(
        "settings-modal"
    );

const closeSettingsButton =
    document.getElementById(
        "close-settings-button"
    );

const giveUpModal =
    document.getElementById("give-up-modal");

const keepTryingButton =
    document.getElementById("keep-trying-button");

const confirmGiveUpButton =
    document.getElementById("confirm-give-up-button");

// Statistics modal

const statsButton =
    document.getElementById("stats-button");

const statsModal =
    document.getElementById("stats-modal");

const closeStatsButton =
    document.getElementById("close-stats-button");

const playedStat =
    document.getElementById("played-stat");

const winPercentStat =
    document.getElementById("win-percent-stat");

const modalStreakStat =
    document.getElementById("modal-streak-stat");

const modalMaxStreakStat =
    document.getElementById("modal-max-streak-stat");

const hintsUsedStat =
    document.getElementById("hints-used-stat");

const puzzlesUsingHintsStat =
    document.getElementById(
        "puzzles-using-hints-stat"
    );

const statsModeButtons =
    document.querySelectorAll(
        ".stats-mode-button"
    );

let timeElement = null;
let averageSolveTimeStat = null;
let bestSolveTimeStat = null;
let dailyStartPanel = null;
let dailyStartDateElement = null;
let startDailyButton = null;
let timerControls = null;
let pauseToggleButton = null;
let timerVisibilityButton = null;
let puzzlePausePanel = null;
let newDailyAvailablePanel = null;
let playNewDailyButton = null;
let dailyStartCountdownElement = null;
let dailyFinishedCountdownElement = null;

let dailyResultPanel = null;
let dailyResultStatusElement = null;
let dailyResultAttemptsElement = null;
let dailyResultTimeElement = null;
let dailyResultHintsElement = null;
let dailyResultStreakElement = null;
let dailyResultCountdownElement = null;
let dailyResultViewPuzzleButton = null;
let dailyResultStatsButton = null;
let dailyResultPlayNewButton = null;
let backToDailyResultButton = null;

let dailyFinishedView = "result";

let activeModal = null;
let modalReturnFocus = null;


// --------------------------------------------------
// Accessibility helpers
// --------------------------------------------------

function announceAccessibility(message) {

    if (!accessibilityAnnouncer) {
        return;
    }

    accessibilityAnnouncer.textContent = "";

    window.setTimeout(
        () => {
            accessibilityAnnouncer.textContent =
                message;
        },
        10
    );
}


function getFocusableElements(container) {

    if (!container) {
        return [];
    }

    return [
        ...container.querySelectorAll(
            [
                "button:not(:disabled)",
                "[href]",
                "input:not(:disabled)",
                "select:not(:disabled)",
                "textarea:not(:disabled)",
                "[tabindex]:not([tabindex='-1'])"
            ].join(",")
        )
    ].filter(element => {
        const styles = getComputedStyle(element);

        return (
            !element.hidden &&
            styles.display !== "none" &&
            styles.visibility !== "hidden" &&
            element.getClientRects().length > 0
        );
    });
}


function openAccessibleModal(
    modal,
    preferredFocus = null
) {

    if (!modal) {
        return;
    }

    modalReturnFocus =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

    if (
        modalReturnFocus &&
        modalReturnFocus.getAttribute(
            "aria-controls"
        ) === modal.id
    ) {
        modalReturnFocus.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    activeModal = modal;

    modal.classList.add("open");
    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    updateBodyModalLock();

    requestAnimationFrame(() => {
        const focusTarget =
            preferredFocus ||
            getFocusableElements(modal)[0];

        if (focusTarget) {
            focusTarget.focus();
        }
    });
}


function closeAccessibleModal(
    modal,
    restoreFocus = true
) {

    if (
        !modal ||
        !modal.classList.contains("open")
    ) {
        return;
    }

    modal.classList.remove("open");
    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (activeModal === modal) {
        activeModal = null;
    }

    updateBodyModalLock();

    if (
        modalReturnFocus &&
        modalReturnFocus.getAttribute(
            "aria-controls"
        ) === modal.id
    ) {
        modalReturnFocus.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    if (
        restoreFocus &&
        modalReturnFocus &&
        modalReturnFocus.isConnected
    ) {
        const returnTarget =
            modalReturnFocus;

        requestAnimationFrame(
            () => returnTarget.focus()
        );
    }

    modalReturnFocus = null;
}


function closeActiveModal() {

    if (!activeModal) {
        return;
    }

    if (activeModal === statsModal) {
        closeStatistics();
    } else if (activeModal === helpModal) {
        closeHelp();
    } else if (activeModal === settingsModal) {
        closeSettings();
    } else if (activeModal === giveUpModal) {
        closeGiveUpModal();
    }
}


document.addEventListener(
    "keydown",
    event => {

        if (
            !activeModal ||
            !activeModal.classList.contains(
                "open"
            )
        ) {
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closeActiveModal();
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const focusable =
            getFocusableElements(
                activeModal
            );

        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }

        const first =
            focusable[0];

        const last =
            focusable[
                focusable.length - 1
            ];

        if (
            !activeModal.contains(
                document.activeElement
            )
        ) {
            event.preventDefault();

            (
                event.shiftKey
                    ? last
                    : first
            ).focus();

            return;
        }

        if (
            event.shiftKey &&
            document.activeElement === first
        ) {
            event.preventDefault();
            last.focus();

        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            first.focus();
        }
    }
);


// --------------------------------------------------
// Player-facing terminology / typography
// --------------------------------------------------

function ensureManropeFont() {

    if (
        document.getElementById(
            "puzzlelab-manrope-font"
        )
    ) {
        return;
    }

    const link =
        document.createElement("link");

    link.id = "puzzlelab-manrope-font";
    link.rel = "stylesheet";
    link.href =
        "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";

    document.head.appendChild(link);
}


function applyPlayerFacingTerminology() {

    modeButtons.forEach(button => {
        if (button.dataset.mode === "random") {
            button.textContent = "Unlimited";
        }
    });

    statsModeButtons.forEach(button => {
        if (button.dataset.statsMode === "random") {
            button.textContent = "Unlimited";
        }
    });

    if (difficultyBadge) {
        difficultyBadge.title =
            "Change challenge";
    }

    if (settingsModal) {
        const challengeGroup =
            [...settingsModal.querySelectorAll(
                ".settings-group"
            )].find(group =>
                group.querySelector(
                    ".difficulty-options"
                )
            );

        if (challengeGroup) {
            const heading =
                challengeGroup.querySelector("h3");

            if (heading) {
                heading.textContent = "Challenge";
            }

            const paragraphs =
                [...challengeGroup.querySelectorAll(
                    ":scope > p"
                )];

            const description =
                paragraphs.find(
                    paragraph =>
                        !paragraph.classList.contains(
                            "settings-note"
                        )
                );

            if (description) {
                description.textContent =
                    "Choose the challenge level for Unlimited puzzles.";
            }

            const note =
                challengeGroup.querySelector(
                    ".settings-note"
                );

            if (note) {
                note.textContent =
                    "Your Challenge choice applies to Unlimited. Daily has its own challenge for the day.";
            }
        }
    }

    if (helpModal) {
        const helpContent =
            helpModal.querySelector(
                ".help-content"
            );

        if (helpContent) {
            helpContent.innerHTML = `
                <div class="help-rule">
                    <strong>1</strong>
                    <span>
                        <b>Reach the target.</b>
                        Build an equation that equals the target number.
                    </span>
                </div>

                <div class="help-rule">
                    <strong>2</strong>
                    <span>
                        <b>Use all four numbers.</b>
                        Each number must be used exactly once.
                    </span>
                </div>

                <div class="help-rule">
                    <strong>3</strong>
                    <span>
                        <b>Choose your operations.</b>
                        Use addition, subtraction, multiplication, division, and parentheses however you need. On a computer, you can also type the puzzle numbers and operators.
                    </span>
                </div>

                <div class="help-rule">
                    <strong>4</strong>
                    <span>
                        <b>You have 6 attempts.</b>
                        Only valid equations use an attempt.
                    </span>
                </div>
            `;

            helpModal
                .querySelectorAll(".help-tip")
                .forEach(tip => tip.remove());

            helpContent.insertAdjacentHTML(
                "afterend",
                `
                <div class="help-tip">
                    <strong>Need a hint?</strong>
                    <span>
                        Hints begin with a small nudge and reveal a little more each time.
                    </span>
                </div>

                <div class="help-tip">
                    <strong>Unlimited</strong>
                    <span>
                        Play as many puzzles as you like and choose the Challenge that suits you.
                    </span>
                </div>

                <div class="help-tip">
                    <strong>Daily Puzzle</strong>
                    <span>
                        Take on today’s shared challenge, compare your result, and come back tomorrow for a new one.
                    </span>
                </div>

                <div class="help-tip">
                    <strong>Play your way</strong>
                    <span>
                        Keep the timer visible, hide it, or pause whenever you need a break.
                    </span>
                </div>
                `
            );

            const helpTips =
                [...helpModal.querySelectorAll(".help-tip")];

            if (helpTips.length) {
                const oldGrid =
                    helpModal.querySelector(
                        ".help-tips-grid"
                    );

                if (oldGrid) {
                    oldGrid.remove();
                }

                const helpTipsGrid =
                    document.createElement("div");

                helpTipsGrid.className =
                    "help-tips-grid";

                helpContent.insertAdjacentElement(
                    "afterend",
                    helpTipsGrid
                );

                helpTips.forEach(
                    tip => helpTipsGrid.appendChild(tip)
                );
            }
        }
    }
}

// --------------------------------------------------
// Unlimited statistics breakdown UI
// --------------------------------------------------

let statsBreakdownControls = null;
let statsGroupingButtons = [];
let statsFilterContainer = null;
let statsGroupingExplanation = null;


function ensureStatsBreakdownUi() {

    if (!statsModal) {
        return;
    }

    statsBreakdownControls =
        document.getElementById(
            "stats-breakdown-controls"
        );

    if (!statsBreakdownControls) {
        statsBreakdownControls =
            document.createElement("section");

        statsBreakdownControls.id =
            "stats-breakdown-controls";
        statsBreakdownControls.className =
            "stats-breakdown-controls";

        statsBreakdownControls.innerHTML = `
            <div class="stats-breakdown-heading">
                View Unlimited statistics by
            </div>

            <div class="stats-grouping-switch"
                 role="group"
                 aria-label="Statistics grouping">
                <button class="stats-grouping-button"
                        data-stats-grouping="challenge"
                        type="button">
                    Challenge
                </button>
                <button class="stats-grouping-button"
                        data-stats-grouping="difficulty"
                        type="button">
                    Difficulty
                </button>
            </div>

            <div id="stats-filter-options"
                 class="stats-filter-options">
            </div>

            <p id="stats-grouping-explanation"
               class="stats-grouping-explanation">
            </p>
        `;

        const summaryStats =
            statsModal.querySelector(
                ".summary-stats"
            );

        if (summaryStats) {
            summaryStats.insertAdjacentElement(
                "beforebegin",
                statsBreakdownControls
            );
        }
    }

    statsGroupingButtons =
        [...statsBreakdownControls.querySelectorAll(
            ".stats-grouping-button"
        )];

    statsFilterContainer =
        statsBreakdownControls.querySelector(
            "#stats-filter-options"
        );

    statsGroupingExplanation =
        statsBreakdownControls.querySelector(
            "#stats-grouping-explanation"
        );

    statsGroupingButtons.forEach(button => {
        if (button.dataset.bound) {
            return;
        }

        button.dataset.bound = "true";

        button.addEventListener(
            "click",
            () => {
                selectedStatsGrouping =
                    button.dataset.statsGrouping;

                selectedStatsFilter = "all";

                localStorage.setItem(
                    STATS_GROUPING_KEY,
                    selectedStatsGrouping
                );

                updateStatsBreakdownControls();
                updateStatisticsPanel();
            }
        );
    });

    updateStatsBreakdownControls();
}


function updateStatsBreakdownControls() {

    if (!statsBreakdownControls) {
        return;
    }

    const show =
        selectedStatsMode === "random";

    statsBreakdownControls.hidden =
        !show;

    if (!show) {
        return;
    }

    statsGroupingButtons.forEach(button => {
        const isActive =
            button.dataset.statsGrouping ===
                selectedStatsGrouping;

        button.classList.toggle(
            "active",
            isActive
        );

        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    });

    if (statsGroupingExplanation) {
        statsGroupingExplanation.textContent =
            selectedStatsGrouping === "challenge"
                ? "Challenge groups games by the option you selected."
                : "Difficulty groups games by the puzzle’s actual difficulty, including puzzles generated in Mixed.";
    }

    const options =
        selectedStatsGrouping === "challenge"
            ? ["all", "easy", "medium", "hard", "mixed"]
            : ["all", "easy", "medium", "hard"];

    if (!options.includes(selectedStatsFilter)) {
        selectedStatsFilter = "all";
    }

    if (!statsFilterContainer) {
        return;
    }

    statsFilterContainer.innerHTML = "";

    options.forEach(value => {
        const button =
            document.createElement("button");

        button.type = "button";
        button.className =
            "stats-filter-button";
        button.dataset.statsFilter = value;
        button.textContent =
            value.charAt(0).toUpperCase() +
            value.slice(1);

        const isActive =
            value === selectedStatsFilter;

        button.classList.toggle(
            "active",
            isActive
        );

        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );

        button.addEventListener(
            "click",
            () => {
                selectedStatsFilter = value;
                updateStatsBreakdownControls();
                updateStatisticsPanel();
            }
        );

        statsFilterContainer.appendChild(
            button
        );
    });
}


// --------------------------------------------------
// Enhanced timer / Daily UI
// --------------------------------------------------

function ensureEnhancedUi() {

    const liveStats =
        document.querySelector(".live-stats");

    if (
        liveStats &&
        !document.getElementById("time-count")
    ) {
        const timeStat =
            document.createElement("div");

        timeStat.className = "live-stat";
        timeStat.innerHTML = `
            <span class="live-stat-label">Time</span>
            <strong id="time-count">0:00</strong>
        `;

        liveStats.appendChild(timeStat);
    }

    timeElement =
        document.getElementById("time-count");


    if (
        liveStats &&
        !document.getElementById("timer-controls")
    ) {
        timerControls =
            document.createElement("div");

        timerControls.id = "timer-controls";
        timerControls.className = "timer-controls";

        timerControls.innerHTML = `
            <button id="timer-visibility-button"
                    class="timer-control-button"
                    type="button">
                Hide Timer
            </button>
            <button id="pause-toggle-button"
                    class="timer-control-button timer-pause-button"
                    type="button">
                Pause
            </button>
        `;

        liveStats.insertAdjacentElement(
            "afterend",
            timerControls
        );
    } else {
        timerControls =
            document.getElementById("timer-controls");
    }

    pauseToggleButton =
        document.getElementById(
            "pause-toggle-button"
        );

    timerVisibilityButton =
        document.getElementById(
            "timer-visibility-button"
        );

    if (
        pauseToggleButton &&
        !pauseToggleButton.dataset.bound
    ) {
        pauseToggleButton.dataset.bound = "true";
        pauseToggleButton.addEventListener(
            "click",
            toggleManualPause
        );
    }

    if (
        timerVisibilityButton &&
        !timerVisibilityButton.dataset.bound
    ) {
        timerVisibilityButton.dataset.bound = "true";
        timerVisibilityButton.addEventListener(
            "click",
            toggleTimerVisibility
        );
    }


    const oldHintSummary =
        document.querySelector(
            ".hint-summary-stats"
        );

    if (oldHintSummary) {
        oldHintSummary.innerHTML = `
            <div class="hint-summary-stat">
                <span id="average-solve-time-stat"
                      class="summary-value">—</span>
                <span class="summary-label">
                    Average Solve Time
                </span>
            </div>

            <div class="hint-summary-stat">
                <span id="best-solve-time-stat"
                      class="summary-value">—</span>
                <span class="summary-label">
                    Best Solve Time
                </span>
            </div>
        `;
    }

    averageSolveTimeStat =
        document.getElementById(
            "average-solve-time-stat"
        );

    bestSolveTimeStat =
        document.getElementById(
            "best-solve-time-stat"
        );


    const solveDistributionElement =
        document.getElementById(
            "distribution"
        );

    if (
        solveDistributionElement &&
        !document.getElementById(
            "hint-distribution"
        )
    ) {
        const hintTitle =
            document.createElement("h3");

        hintTitle.className =
            "distribution-title hint-distribution-title";
        hintTitle.textContent =
            "Hint Distribution";


        const hintDistributionElement =
            document.createElement("div");

        hintDistributionElement.id =
            "hint-distribution";
        hintDistributionElement.className =
            "distribution hint-distribution";


        for (let i = 0; i <= MAX_HINTS; i++) {
            const row =
                document.createElement("div");

            row.className =
                "distribution-row";

            row.innerHTML = `
                <span class="attempt-number">${i}</span>
                <div class="distribution-track">
                    <div id="hint-distribution-${i}"
                         class="distribution-bar">
                        0
                    </div>
                </div>
            `;

            hintDistributionElement.appendChild(
                row
            );
        }


        solveDistributionElement.insertAdjacentElement(
            "afterend",
            hintDistributionElement
        );

        hintDistributionElement.insertAdjacentElement(
            "beforebegin",
            hintTitle
        );
    }


    // Keep Solve Distribution and Hint Distribution
    // side by side inside the Statistics modal.
    if (
        solveDistributionElement &&
        !document.getElementById(
            "stats-distributions-grid"
        )
    ) {
        const hintDistributionElement =
            document.getElementById(
                "hint-distribution"
            );

        const solveTitle =
            solveDistributionElement
                .previousElementSibling;

        const hintTitle =
            hintDistributionElement
                ? hintDistributionElement
                    .previousElementSibling
                : null;

        if (
            solveTitle &&
            hintTitle &&
            hintDistributionElement
        ) {
            const grid =
                document.createElement("div");

            grid.id =
                "stats-distributions-grid";
            grid.className =
                "stats-distributions-grid";


            const solveGroup =
                document.createElement("section");

            solveGroup.className =
                "stats-distribution-group";


            const hintGroup =
                document.createElement("section");

            hintGroup.className =
                "stats-distribution-group";


            solveTitle.parentNode.insertBefore(
                grid,
                solveTitle
            );

            solveGroup.appendChild(
                solveTitle
            );

            solveGroup.appendChild(
                solveDistributionElement
            );

            hintGroup.appendChild(
                hintTitle
            );

            hintGroup.appendChild(
                hintDistributionElement
            );

            grid.appendChild(
                solveGroup
            );

            grid.appendChild(
                hintGroup
            );
        }
    }


    if (!document.getElementById("daily-start-panel")) {
        dailyStartPanel =
            document.createElement("section");

        dailyStartPanel.id =
            "daily-start-panel";
        dailyStartPanel.className =
            "daily-start-panel";
        dailyStartPanel.hidden = true;

        dailyStartPanel.innerHTML = `
            <div class="daily-start-kicker">DAILY PUZZLE</div>
            <h3 id="daily-start-date">Today</h3>
            <p>Ready for today’s challenge?</p>
            <div class="daily-start-meta">
                6 attempts · Up to 3 hints · Timed
            </div>
            <button id="start-daily-button"
                    class="start-daily-button"
                    type="button">
                Start Daily Puzzle
            </button>
            <div id="daily-start-countdown"
                 class="daily-countdown">
                Next Daily in --:--:--
            </div>
        `;


        const modeSwitch =
            document.querySelector(
                ".mode-switch"
            );

        if (modeSwitch) {
            modeSwitch.insertAdjacentElement(
                "afterend",
                dailyStartPanel
            );
        } else {
            const targetSection =
                document.querySelector(
                    ".target-section"
                );

            gameCard.insertBefore(
                dailyStartPanel,
                targetSection || gameCard.firstChild
            );
        }
    } else {
        dailyStartPanel =
            document.getElementById(
                "daily-start-panel"
            );
    }


    dailyStartDateElement =
        document.getElementById(
            "daily-start-date"
        );

    startDailyButton =
        document.getElementById(
            "start-daily-button"
        );

    dailyStartCountdownElement =
        document.getElementById(
            "daily-start-countdown"
        );

    if (
        startDailyButton &&
        !startDailyButton.dataset.bound
    ) {
        startDailyButton.dataset.bound = "true";

        startDailyButton.addEventListener(
            "click",
            startDailyPuzzle
        );
    }


    if (!document.getElementById("puzzle-pause-panel")) {
        puzzlePausePanel =
            document.createElement("section");

        puzzlePausePanel.id =
            "puzzle-pause-panel";
        puzzlePausePanel.className =
            "puzzle-pause-panel";
        puzzlePausePanel.hidden = true;

        puzzlePausePanel.innerHTML = `
            <h3>Paused</h3>
            <p class="pause-message">Ready when you are.</p>
            <button id="resume-puzzle-button"
                    class="resume-puzzle-button"
                    type="button">
                Resume Puzzle
            </button>
        `;

        const targetSection =
            document.querySelector(".target-section");

        gameCard.insertBefore(
            puzzlePausePanel,
            targetSection || null
        );
    } else {
        puzzlePausePanel =
            document.getElementById(
                "puzzle-pause-panel"
            );
    }


    const resumePuzzleButton =
        document.getElementById(
            "resume-puzzle-button"
        );

    if (
        resumePuzzleButton &&
        !resumePuzzleButton.dataset.bound
    ) {
        resumePuzzleButton.dataset.bound = "true";
        resumePuzzleButton.addEventListener(
            "click",
            toggleManualPause
        );
    }


    ensureStatsBreakdownUi();


    if (!document.getElementById("daily-result-panel")) {
        dailyResultPanel =
            document.createElement("section");

        dailyResultPanel.id =
            "daily-result-panel";
        dailyResultPanel.className =
            "daily-result-panel";
        dailyResultPanel.hidden = true;
        dailyResultPanel.tabIndex = -1;
        dailyResultPanel.setAttribute(
            "role",
            "region"
        );
        dailyResultPanel.setAttribute(
            "aria-label",
            "Daily puzzle result"
        );

        dailyResultPanel.innerHTML = `
            <div id="daily-result-kicker" class="daily-result-kicker">Daily Puzzle</div>
            <h3 id="daily-result-status"
                class="daily-result-status">
                Complete
            </h3>

            <div class="daily-result-metrics">
                <div class="daily-result-metric">
                    <span>Attempts</span>
                    <strong id="daily-result-attempts">—</strong>
                </div>

                <div class="daily-result-metric">
                    <span>Time</span>
                    <strong id="daily-result-time">—</strong>
                </div>

                <div class="daily-result-metric">
                    <span>Hints</span>
                    <strong id="daily-result-hints">—</strong>
                </div>

                <div class="daily-result-metric">
                    <span>Streak</span>
                    <strong id="daily-result-streak">—</strong>
                </div>
            </div>

            <div id="daily-result-countdown"
                 class="daily-result-countdown">
                Next Daily in --:--:--
            </div>

            <div class="daily-result-actions">
                <button id="daily-result-view-puzzle"
                        class="daily-result-secondary-button"
                        type="button">
                    View Puzzle
                </button>

                <button id="daily-result-stats"
                        class="daily-result-secondary-button"
                        type="button"
                        aria-controls="stats-modal"
                        aria-expanded="false">
                    Statistics
                </button>

                <button id="daily-result-play-new"
                        class="daily-result-primary-button"
                        type="button"
                        hidden>
                    Play New Daily
                </button>
            </div>
        `;

        const modeSwitch =
            document.querySelector(".mode-switch");

        if (modeSwitch) {
            modeSwitch.insertAdjacentElement(
                "afterend",
                dailyResultPanel
            );
        } else {
            gameCard.insertBefore(
                dailyResultPanel,
                gameCard.firstChild
            );
        }
    } else {
        dailyResultPanel =
            document.getElementById(
                "daily-result-panel"
            );
    }


    dailyResultStatusElement =
        document.getElementById(
            "daily-result-status"
        );

    dailyResultAttemptsElement =
        document.getElementById(
            "daily-result-attempts"
        );

    dailyResultTimeElement =
        document.getElementById(
            "daily-result-time"
        );

    dailyResultHintsElement =
        document.getElementById(
            "daily-result-hints"
        );

    dailyResultStreakElement =
        document.getElementById(
            "daily-result-streak"
        );

    dailyResultCountdownElement =
        document.getElementById(
            "daily-result-countdown"
        );

    dailyResultViewPuzzleButton =
        document.getElementById(
            "daily-result-view-puzzle"
        );

    dailyResultStatsButton =
        document.getElementById(
            "daily-result-stats"
        );

    dailyResultPlayNewButton =
        document.getElementById(
            "daily-result-play-new"
        );


    if (
        dailyResultViewPuzzleButton &&
        !dailyResultViewPuzzleButton.dataset.bound
    ) {
        dailyResultViewPuzzleButton.dataset.bound =
            "true";

        dailyResultViewPuzzleButton.addEventListener(
            "click",
            () => {
                dailyFinishedView = "puzzle";
                updateDailyFinishedView();

                requestAnimationFrame(() => {
                    if (
                        backToDailyResultButton &&
                        !backToDailyResultButton.hidden
                    ) {
                        backToDailyResultButton.focus();
                    }
                });
            }
        );
    }


    if (
        dailyResultStatsButton &&
        !dailyResultStatsButton.dataset.bound
    ) {
        dailyResultStatsButton.dataset.bound =
            "true";

        dailyResultStatsButton.addEventListener(
            "click",
            openStatistics
        );
    }


    if (
        dailyResultPlayNewButton &&
        !dailyResultPlayNewButton.dataset.bound
    ) {
        dailyResultPlayNewButton.dataset.bound =
            "true";

        dailyResultPlayNewButton.addEventListener(
            "click",
            playNewestDailyPuzzle
        );
    }


    if (!document.getElementById("back-to-daily-result-button")) {
        backToDailyResultButton =
            document.createElement("button");

        backToDailyResultButton.id =
            "back-to-daily-result-button";

        backToDailyResultButton.className =
            "back-to-daily-result-button";

        backToDailyResultButton.type =
            "button";

        backToDailyResultButton.textContent =
            "Back to Result";

        backToDailyResultButton.hidden =
            true;

        const bottomActions =
            document.querySelector(".bottom-actions");

        if (bottomActions) {
            bottomActions.insertAdjacentElement(
                "afterend",
                backToDailyResultButton
            );
        } else {
            gameCard.appendChild(
                backToDailyResultButton
            );
        }
    } else {
        backToDailyResultButton =
            document.getElementById(
                "back-to-daily-result-button"
            );
    }


    if (
        backToDailyResultButton &&
        !backToDailyResultButton.dataset.bound
    ) {
        backToDailyResultButton.dataset.bound =
            "true";

        backToDailyResultButton.addEventListener(
            "click",
            () => {
                dailyFinishedView = "result";
                updateDailyFinishedView();

                requestAnimationFrame(() => {
                    if (
                        dailyResultViewPuzzleButton &&
                        !dailyResultViewPuzzleButton.hidden
                    ) {
                        dailyResultViewPuzzleButton.focus();
                    }
                });
            }
        );
    }


    if (!document.getElementById("new-daily-available-panel")) {
        newDailyAvailablePanel =
            document.createElement("section");

        newDailyAvailablePanel.id =
            "new-daily-available-panel";
        newDailyAvailablePanel.className =
            "new-daily-available-panel";
        newDailyAvailablePanel.hidden = true;

        newDailyAvailablePanel.innerHTML = `
            <strong>A new Daily Puzzle is available.</strong>
            <button id="play-new-daily-button"
                    class="play-new-daily-button"
                    type="button">
                Play New Daily
            </button>
        `;

        const bottomActions =
            document.querySelector(".bottom-actions");

        if (bottomActions) {
            bottomActions.insertAdjacentElement(
                "afterend",
                newDailyAvailablePanel
            );
        } else {
            gameCard.appendChild(
                newDailyAvailablePanel
            );
        }
    } else {
        newDailyAvailablePanel =
            document.getElementById(
                "new-daily-available-panel"
            );
    }


    if (!document.getElementById("daily-finished-countdown")) {
        dailyFinishedCountdownElement =
            document.createElement("div");

        dailyFinishedCountdownElement.id =
            "daily-finished-countdown";

        dailyFinishedCountdownElement.className =
            "daily-finished-countdown";

        dailyFinishedCountdownElement.hidden =
            true;

        dailyFinishedCountdownElement.textContent =
            "Next Daily in --:--:--";

        if (newDailyAvailablePanel) {
            newDailyAvailablePanel.insertAdjacentElement(
                "beforebegin",
                dailyFinishedCountdownElement
            );
        } else {
            gameCard.appendChild(
                dailyFinishedCountdownElement
            );
        }
    } else {
        dailyFinishedCountdownElement =
            document.getElementById(
                "daily-finished-countdown"
            );
    }


    playNewDailyButton =
        document.getElementById(
            "play-new-daily-button"
        );

    if (
        playNewDailyButton &&
        !playNewDailyButton.dataset.bound
    ) {
        playNewDailyButton.dataset.bound = "true";
        playNewDailyButton.addEventListener(
            "click",
            playNewestDailyPuzzle
        );
    }
}


function formatDailyDate(dateText) {

    if (!dateText) {
        return "Today";
    }

    const date =
        new Date(`${dateText}T00:00:00Z`);

    return date.toLocaleDateString(
        undefined,
        {
            month: "long",
            day: "numeric",
            timeZone: "UTC"
        }
    );
}


function setDailyGameplayHidden(hidden) {

    const selectors = [
        ".live-stats",
        ".timer-controls",
        ".target-section",
        ".instruction",
        "#numbers",
        ".equation-section",
        "#equation-tile-controls",
        ".operators-container",
        ".edit-buttons",
        "#submit-button",
        "#feedback",
        "#hint-reveal",
        "#solution-reveal",
        ".bottom-actions"
    ];

    selectors.forEach(selector => {
        const element =
            document.querySelector(selector);

        if (element) {
            element.hidden = hidden;
            element.classList.toggle(
                "daily-gameplay-hidden",
                hidden
            );
        }
    });
}


function isDailyWaitingToStart() {

    return (
        currentMode === "daily" &&
        currentPuzzle &&
        !puzzleStarted &&
        !puzzleSolved &&
        !puzzleLost
    );
}


function updateDailyStartPanel() {

    if (!dailyStartPanel) {
        return;
    }

    const waiting =
        isDailyWaitingToStart();

    dailyStartPanel.hidden =
        !waiting;

    setDailyGameplayHidden(
        waiting
    );

    if (
        waiting &&
        dailyStartDateElement
    ) {
        dailyStartDateElement.textContent =
            formatDailyDate(
                currentPuzzle.date
            );
    }

    updateDailyCountdown();
}


function setDailyFinishedGameplayHidden(hidden) {

    const selectors = [
        ".live-stats",
        ".timer-controls",
        ".target-section",
        ".instruction",
        "#numbers",
        ".equation-section",
        "#equation-tile-controls",
        ".operators-container",
        ".edit-buttons",
        "#submit-button",
        "#feedback",
        "#hint-reveal",
        "#solution-reveal",
        ".bottom-actions",
        "#daily-finished-countdown",
        "#new-daily-available-panel"
    ];

    selectors.forEach(selector => {
        const element =
            document.querySelector(selector);

        if (element) {
            element.classList.toggle(
                "daily-result-hidden",
                hidden
            );
        }
    });
}


function updateDailyResultContent() {

    if (
        !dailyResultPanel ||
        currentMode !== "daily" ||
        !currentPuzzle ||
        !(puzzleSolved || puzzleLost)
    ) {
        return;
    }


    dailyResultPanel.classList.toggle(
        "solved",
        puzzleSolved
    );

    dailyResultPanel.classList.toggle(
        "lost",
        puzzleLost && !puzzleGivenUp
    );

    dailyResultPanel.classList.toggle(
        "given-up",
        puzzleLost && puzzleGivenUp
    );


    const resultKicker =
        document.getElementById(
            "daily-result-kicker"
        );

    if (resultKicker) {
        resultKicker.textContent =
            `Daily Puzzle · ${formatDailyDate(
                currentPuzzle.date
            )}`;
    }


    if (dailyResultStatusElement) {
        if (puzzleSolved) {
            dailyResultStatusElement.textContent =
                "Solved ✓";

        } else if (puzzleGivenUp) {
            dailyResultStatusElement.textContent =
                "Gave up";

        } else {
            dailyResultStatusElement.textContent =
                "Not solved";
        }
    }


    if (dailyResultAttemptsElement) {
        dailyResultAttemptsElement.textContent =
            `${attempts} / ${MAX_ATTEMPTS}`;
    }


    if (dailyResultTimeElement) {
        dailyResultTimeElement.textContent =
            formatDuration(puzzleElapsedMs);
    }


    if (dailyResultHintsElement) {
        dailyResultHintsElement.textContent =
            hintLevel === 0
                ? "No hints"
                : `${hintLevel} / ${MAX_HINTS}`;
    }


    if (dailyResultStreakElement) {
        if (puzzleSolved) {
            dailyResultStreakElement.textContent =
                dailyStreak === 1
                    ? "1 day"
                    : `${dailyStreak} days`;

        } else {
            dailyResultStreakElement.textContent =
                "Ended";
        }
    }


    const expired =
        currentDailyHasExpired();


    if (dailyResultCountdownElement) {
        dailyResultCountdownElement.hidden =
            false;

        dailyResultCountdownElement.textContent =
            expired
                ? "A new Daily is ready."
                : `Next Daily in ${formatDailyCountdown(
                    millisecondsUntilNextDaily()
                )}`;
    }


    if (dailyResultPlayNewButton) {
        dailyResultPlayNewButton.hidden =
            !expired;
    }
}


function updateDailyFinishedView() {

    const finishedDaily =
        Boolean(
            currentMode === "daily" &&
            currentPuzzle &&
            (puzzleSolved || puzzleLost)
        );

    const showResult =
        finishedDaily &&
        dailyFinishedView === "result";

    const showPuzzle =
        finishedDaily &&
        dailyFinishedView === "puzzle";


    if (dailyResultPanel) {
        dailyResultPanel.hidden =
            !showResult;
    }


    if (showResult) {
        updateDailyResultContent();
    }


    setDailyFinishedGameplayHidden(
        showResult
    );


    if (backToDailyResultButton) {
        backToDailyResultButton.hidden =
            !showPuzzle;
    }


    // The old finished-Daily countdown and rollover panel
    // have been replaced by the dedicated Result screen.
    if (dailyFinishedCountdownElement) {
        dailyFinishedCountdownElement.hidden =
            true;
    }

    if (newDailyAvailablePanel) {
        newDailyAvailablePanel.hidden =
            true;
    }
}


function showDailyResult() {

    if (
        currentMode !== "daily" ||
        !currentPuzzle ||
        !(puzzleSolved || puzzleLost)
    ) {
        return;
    }

    dailyFinishedView = "result";

    updateDailyFinishedView();

    requestAnimationFrame(() => {
        if (
            dailyResultPanel &&
            !dailyResultPanel.hidden
        ) {
            dailyResultPanel.focus();
        }
    });
}


function setCoreGameplayHidden(hidden) {

    const selectors = [
        ".target-section",
        ".instruction",
        "#numbers",
        ".equation-section",
        "#equation-tile-controls",
        ".operators-container",
        ".edit-buttons",
        "#submit-button",
        "#feedback",
        "#hint-reveal",
        "#solution-reveal",
        ".bottom-actions"
    ];

    selectors.forEach(selector => {
        const element =
            document.querySelector(selector);

        if (element) {
            element.classList.toggle(
                "manual-pause-hidden",
                hidden
            );
        }
    });
}


function utcDateKeyNow() {
    return new Date()
        .toISOString()
        .slice(0, 10);
}


function currentDailyHasExpired() {

    return Boolean(
        currentMode === "daily" &&
        currentPuzzle &&
        currentPuzzle.date &&
        currentPuzzle.date !== utcDateKeyNow()
    );
}


function updateTimerControls() {

    const gameFinished =
        puzzleSolved || puzzleLost;

    const waiting =
        isDailyWaitingToStart();

    if (timerControls) {
        timerControls.hidden =
            !currentPuzzle ||
            waiting ||
            !puzzleStarted;
    }

    if (pauseToggleButton) {
        pauseToggleButton.hidden =
            gameFinished ||
            waiting ||
            !puzzleStarted ||
            puzzleManuallyPaused;

        pauseToggleButton.textContent =
            "Pause";
    }

    if (timerVisibilityButton) {
        timerVisibilityButton.hidden =
            gameFinished ||
            waiting ||
            !puzzleStarted;

        timerVisibilityButton.textContent =
            timerVisible
                ? "Hide Timer"
                : "Show Timer";
    }
}


function updateManualPauseUi() {

    const shouldShow =
        Boolean(
            puzzleManuallyPaused &&
            currentPuzzle &&
            puzzleStarted &&
            !puzzleSolved &&
            !puzzleLost &&
            !isDailyWaitingToStart()
        );

    if (puzzlePausePanel) {
        puzzlePausePanel.hidden =
            !shouldShow;
    }

    setCoreGameplayHidden(
        shouldShow
    );

    updateTimerControls();
}


function toggleManualPause() {

    if (
        !currentPuzzle ||
        !puzzleStarted ||
        puzzleSolved ||
        puzzleLost ||
        puzzleLoading ||
        isDailyWaitingToStart()
    ) {
        return;
    }

    if (puzzleManuallyPaused) {
        puzzleManuallyPaused = false;
        updateManualPauseUi();
        resumeTimerIfNeeded();

        requestAnimationFrame(() => {
            if (
                pauseToggleButton &&
                !pauseToggleButton.hidden
            ) {
                pauseToggleButton.focus();
            }
        });

    } else {
        pauseTimer();
        puzzleManuallyPaused = true;
        updateManualPauseUi();

        requestAnimationFrame(() => {
            const resumeButton =
                document.getElementById(
                    "resume-puzzle-button"
                );

            if (resumeButton) {
                resumeButton.focus();
            }
        });
    }

    updateGameState();
    saveCurrentModeState();
}


function toggleTimerVisibility() {

    timerVisible =
        !timerVisible;

    localStorage.setItem(
        TIMER_VISIBLE_KEY,
        String(timerVisible)
    );

    updateTimerDisplay();
    updateTimerControls();
}


function millisecondsUntilNextDaily() {

    const now = new Date();

    const nextDaily =
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0,
            0,
            0,
            0
        );

    return Math.max(
        0,
        nextDaily - now.getTime()
    );
}


function formatDailyCountdown(milliseconds) {

    const totalSeconds =
        Math.max(
            0,
            Math.ceil(milliseconds / 1000)
        );

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");
}


function updateDailyCountdown() {

    if (
        currentMode === "daily" &&
        currentPuzzle &&
        currentPuzzle.date &&
        currentDailyHasExpired() &&
        !puzzleStarted &&
        !puzzleSolved &&
        !puzzleLost &&
        !puzzleLoading
    ) {
        checkDailyRollover();
        return;
    }

    const countdownText =
        `Next Daily in ${formatDailyCountdown(
            millisecondsUntilNextDaily()
        )}`;

    if (dailyStartCountdownElement) {
        dailyStartCountdownElement.textContent =
            countdownText;

        dailyStartCountdownElement.hidden =
            !isDailyWaitingToStart();
    }

    if (dailyFinishedCountdownElement) {
        dailyFinishedCountdownElement.hidden =
            true;
    }

    if (
        dailyResultCountdownElement &&
        currentMode === "daily" &&
        currentPuzzle &&
        (puzzleSolved || puzzleLost)
    ) {
        const expired =
            currentDailyHasExpired();

        dailyResultCountdownElement.hidden =
            false;

        dailyResultCountdownElement.textContent =
            expired
                ? "A new Daily is ready."
                : countdownText;

        if (dailyResultPlayNewButton) {
            dailyResultPlayNewButton.hidden =
                !expired;
        }
    }
}


function updateNewDailyAvailablePanel() {

    // The dedicated Daily Result screen now owns the
    // countdown and "Play New Daily" action.
    if (newDailyAvailablePanel) {
        newDailyAvailablePanel.hidden =
            true;
    }

    updateDailyCountdown();
    updateDailyResultContent();
}


function playNewestDailyPuzzle() {

    if (
        currentMode !== "daily" ||
        puzzleLoading ||
        !(puzzleSolved || puzzleLost) ||
        !currentDailyHasExpired()
    ) {
        return;
    }

    pauseTimer();
    puzzleManuallyPaused = false;

    localStorage.removeItem(
        DAILY_ACTIVE_STATE_KEY
    );

    loadPuzzle(true);
}


function dailyCompletionTail() {

    return currentDailyHasExpired()
        ? "A new Daily Puzzle is available."
        : "Come back tomorrow.";
}


function checkDailyRollover() {

    if (
        currentMode !== "daily" ||
        !currentPuzzle ||
        !currentPuzzle.date ||
        puzzleLoading
    ) {
        return;
    }

    if (!currentDailyHasExpired()) {
        updateNewDailyAvailablePanel();
        return;
    }

    // If the old Daily was never started, replace it with
    // the new Daily automatically. Once started, it belongs
    // to the player until they finish or give up.
    if (
        !puzzleStarted &&
        !puzzleSolved &&
        !puzzleLost
    ) {
        localStorage.removeItem(
            DAILY_ACTIVE_STATE_KEY
        );
        loadPuzzle(true);
        return;
    }

    updateNewDailyAvailablePanel();
}


function startDailyPuzzle() {

    if (
        currentMode !== "daily" ||
        !currentPuzzle ||
        puzzleStarted ||
        puzzleSolved ||
        puzzleLost ||
        puzzleLoading
    ) {
        return;
    }

    puzzleStarted = true;
    puzzleElapsedMs = 0;
    timerAnchorMs = null;
    puzzleManuallyPaused = false;

    updateDailyStartPanel();
    updateGameState();
    updateTimerDisplay();
    resumeTimerIfNeeded();

    requestAnimationFrame(() => {
        const firstNumberButton =
            numbersContainer.querySelector(
                "button:not(:disabled)"
            );

        if (firstNumberButton) {
            firstNumberButton.focus();
        }
    });

    saveCurrentModeState();
}


// --------------------------------------------------
// Timer
// --------------------------------------------------

function formatDuration(milliseconds) {

    const totalSeconds =
        Math.max(
            0,
            Math.floor(
                milliseconds / 1000
            )
        );

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}


function getElapsedMs() {

    if (timerAnchorMs === null) {
        return puzzleElapsedMs;
    }

    return (
        puzzleElapsedMs +
        (Date.now() - timerAnchorMs)
    );
}


function syncTimerElapsed() {

    if (timerAnchorMs === null) {
        return;
    }

    puzzleElapsedMs =
        getElapsedMs();

    timerAnchorMs =
        Date.now();
}


function updateTimerDisplay() {

    if (!timeElement) {
        return;
    }

    const gameFinished =
        puzzleSolved || puzzleLost;

    if (
        !timerVisible &&
        puzzleStarted &&
        !gameFinished
    ) {
        timeElement.textContent =
            "Hidden";
    } else {
        timeElement.textContent =
            formatDuration(
                getElapsedMs()
            );
    }

    updateTimerControls();
}


function timerCanRun() {

    return Boolean(
        currentPuzzle &&
        puzzleStarted &&
        !puzzleSolved &&
        !puzzleLost &&
        !puzzleLoading &&
        !puzzleManuallyPaused &&
        !document.hidden
    );
}


function resumeTimerIfNeeded() {

    if (
        !timerCanRun() ||
        timerAnchorMs !== null
    ) {
        updateTimerDisplay();
        return;
    }

    timerAnchorMs =
        Date.now();

    updateTimerDisplay();
}


function pauseTimer() {

    if (timerAnchorMs !== null) {
        puzzleElapsedMs =
            getElapsedMs();

        timerAnchorMs = null;
    }

    updateTimerDisplay();
}


function finishTimer() {

    pauseTimer();

    return puzzleElapsedMs;
}


function formatHintResult() {

    return hintLevel === 0
        ? "No hints"
        : `${hintLevel}/${MAX_HINTS} hints`;
}


// --------------------------------------------------
// Puzzle state helpers
// --------------------------------------------------

function getDailyStateKey(date) {

    return `puzzleLabDailyState-${date}`;
}


function getFeedbackType() {

    for (
        const type of
        ["success", "error", "ended"]
    ) {
        if (
            feedbackElement.classList.contains(
                type
            )
        ) {
            return type;
        }
    }

    return "";
}


function buildSavedState() {

    if (!currentPuzzle) {
        return null;
    }

    syncTimerElapsed();


    return {
        puzzle: currentPuzzle,
        selectedDifficulty: selectedDifficulty,
        equationTokens: equationTokens,
        attempts: attempts,
        hintLevel: hintLevel,
        puzzleSolved: puzzleSolved,
        puzzleLost: puzzleLost,
        puzzleGivenUp: puzzleGivenUp,
        puzzleStarted: puzzleStarted,
        puzzleElapsedMs: puzzleElapsedMs,
        puzzleManuallyPaused: puzzleManuallyPaused,
        feedback: feedbackElement.textContent,
        feedbackType: getFeedbackType(),
        hintText: hintRevealElement.textContent,
        solutionText:
            solutionRevealElement.textContent
    };
}


function applySavedState(
    state,
    puzzle
) {

    equationTokens =
        Array.isArray(
            state.equationTokens
        )
            ? state.equationTokens
            : [];

    attempts =
        Number.isInteger(state.attempts)
            ? state.attempts
            : 0;

    hintLevel =
        Number.isInteger(state.hintLevel)
            ? state.hintLevel
            : 0;

    puzzleSolved =
        Boolean(state.puzzleSolved);

    puzzleLost =
        Boolean(state.puzzleLost);

    puzzleGivenUp =
        Boolean(state.puzzleGivenUp);

    // Older saved puzzles were already visible, so if
    // the field does not exist we treat them as started.
    puzzleStarted =
        typeof state.puzzleStarted === "boolean"
            ? state.puzzleStarted
            : true;

    puzzleElapsedMs =
        Number.isFinite(state.puzzleElapsedMs)
            ? Math.max(0, state.puzzleElapsedMs)
            : 0;

    timerAnchorMs = null;

    puzzleManuallyPaused =
        Boolean(state.puzzleManuallyPaused);

    draggedEquationIndex = null;
    selectedEquationIndex = null;


    currentPuzzle =
        puzzle;

    targetElement.textContent =
        currentPuzzle.target;


    feedbackElement.textContent =
        state.feedback || "";

    feedbackElement.className =
        "feedback";

    if (state.feedbackType) {
        feedbackElement.classList.add(
            state.feedbackType
        );
    }


    hintRevealElement.textContent =
        state.hintText || "";

    hintRevealElement.classList.toggle(
        "visible",
        Boolean(state.hintText)
    );


    solutionRevealElement.textContent =
        state.solutionText || "";

    solutionRevealElement.classList.toggle(
        "visible",
        Boolean(state.solutionText)
    );
}


function saveUnlimitedState() {

    if (
        currentMode !== "random" ||
        !currentPuzzle ||
        currentPuzzle.mode !== "random"
    ) {
        return;
    }


    const state =
        buildSavedState();


    if (!state) {
        return;
    }


    localStorage.setItem(
        UNLIMITED_STATE_KEY,
        JSON.stringify(state)
    );
}


function restoreUnlimitedState() {

    const rawState =
        localStorage.getItem(
            UNLIMITED_STATE_KEY
        );


    if (!rawState) {
        return false;
    }


    try {

        const state =
            JSON.parse(rawState);

        const puzzle =
            state.puzzle;


        const validPuzzle =
            puzzle &&
            puzzle.mode === "random" &&
            Array.isArray(puzzle.numbers) &&
            puzzle.numbers.length === 4 &&
            Number.isInteger(puzzle.target);


        const sameSelectedDifficulty =
            state.selectedDifficulty ===
                selectedDifficulty;


        if (
            !validPuzzle ||
            !sameSelectedDifficulty
        ) {
            return false;
        }


        applySavedState(
            state,
            puzzle
        );

        return true;

    } catch (error) {

        console.error(
            "Could not restore Unlimited puzzle state.",
            error
        );

        return false;
    }
}


function saveDailyState() {

    if (
        currentMode !== "daily" ||
        !currentPuzzle ||
        currentPuzzle.mode !== "daily" ||
        !currentPuzzle.date
    ) {
        return;
    }


    const state =
        buildSavedState();


    if (!state) {
        return;
    }


    localStorage.setItem(
        getDailyStateKey(
            currentPuzzle.date
        ),
        JSON.stringify(state)
    );

    localStorage.setItem(
        DAILY_ACTIVE_STATE_KEY,
        JSON.stringify(state)
    );
}


function restoreActiveDailyState() {

    const rawState =
        localStorage.getItem(
            DAILY_ACTIVE_STATE_KEY
        );

    if (!rawState) {
        return false;
    }

    try {
        const state =
            JSON.parse(rawState);

        const puzzle =
            state.puzzle;

        const validPuzzle =
            puzzle &&
            puzzle.mode === "daily" &&
            puzzle.date &&
            Array.isArray(puzzle.numbers) &&
            puzzle.numbers.length === 4 &&
            Number.isInteger(puzzle.target);

        if (!validPuzzle) {
            return false;
        }

        const sameAsCurrentDaily =
            puzzle.date === utcDateKeyNow();

        const unfinishedStartedDaily =
            Boolean(state.puzzleStarted) &&
            !state.puzzleSolved &&
            !state.puzzleLost;

        // A started Daily survives rollover until finished.
        // A completed Daily is restored only while it is still
        // today's Daily.
        if (
            !sameAsCurrentDaily &&
            !unfinishedStartedDaily
        ) {
            return false;
        }

        applySavedState(
            state,
            puzzle
        );

        return true;

    } catch (error) {
        console.error(
            "Could not restore active Daily Puzzle state.",
            error
        );
        return false;
    }
}


function restoreDailyState(puzzle) {

    const rawState =
        localStorage.getItem(
            getDailyStateKey(
                puzzle.date
            )
        );


    if (!rawState) {
        return false;
    }


    try {

        const state =
            JSON.parse(rawState);


        // Support both the new saved-state shape
        // and the older Daily-only shape.
        const storedPuzzle =
            state.puzzle || {
                mode: "daily",
                date: state.date,
                numbers: state.numbers,
                target: state.target,
                difficulty: state.difficulty
            };


        const samePuzzle =
            storedPuzzle.date ===
                puzzle.date &&
            storedPuzzle.target ===
                puzzle.target &&
            JSON.stringify(
                storedPuzzle.numbers
            ) ===
                JSON.stringify(
                    puzzle.numbers
                );


        if (!samePuzzle) {
            return false;
        }


        applySavedState(
            state,
            puzzle
        );

        return true;

    } catch (error) {

        console.error(
            "Could not restore Daily Puzzle state.",
            error
        );

        return false;
    }
}


function saveCurrentModeState() {

    if (currentMode === "daily") {
        saveDailyState();

    } else {
        saveUnlimitedState();
    }
}


function previousUtcDate(dateText) {

    const date =
        new Date(
            `${dateText}T00:00:00Z`
        );

    date.setUTCDate(
        date.getUTCDate() - 1
    );

    return date
        .toISOString()
        .slice(0, 10);
}


function normalizeDailyStreak(
    dateText
) {

    if (
        !dailyLastCompletedDate ||
        dailyStreak === 0
    ) {
        return;
    }


    const yesterday =
        previousUtcDate(dateText);


    if (
        dailyLastCompletedDate !==
            dateText &&
        dailyLastCompletedDate !==
            yesterday
    ) {
        dailyStreak = 0;
        saveDailyStats();
    }
}


// --------------------------------------------------
// Load puzzle
// --------------------------------------------------

async function loadPuzzle(
    forceNew = false
) {

    pauseTimer();

    const requestId =
        ++puzzleRequestId;

    if (currentMode === "daily") {
        // A completed Daily always reopens on its Result
        // screen after refresh or after returning from
        // Unlimited. "View Puzzle" is intentionally
        // session-only.
        dailyFinishedView = "result";
    }


    // Unlimited can restore immediately without
    // asking the backend for another puzzle.
    if (
        currentMode === "random" &&
        !forceNew &&
        restoreUnlimitedState()
    ) {
        puzzleLoading = false;

        updateModeButtons();
        updateDifficultyButtons();
        updateStats();
        updateGameState();

        renderNumbers();
        renderEquation();

        updateDailyStartPanel();
        updateManualPauseUi();
        updateTimerDisplay();
        resumeTimerIfNeeded();
        updateNewDailyAvailablePanel();

        return;
    }


    // If a Daily was already started before UTC rollover,
    // restore that exact puzzle instead of replacing it.
    if (
        currentMode === "daily" &&
        !forceNew &&
        restoreActiveDailyState()
    ) {
        puzzleLoading = false;

        updateModeButtons();
        updateDifficultyButtons();
        updateStats();
        updateGameState();

        renderNumbers();
        renderEquation();

        updateDailyStartPanel();
        updateManualPauseUi();
        updateTimerDisplay();
        resumeTimerIfNeeded();
        updateNewDailyAvailablePanel();

        return;
    }


    puzzleLoading = true;

    updateGameState();


    try {

        const endpoint =
            currentMode === "daily"
                ? "/daily-puzzle"
                : `/puzzle?difficulty=${selectedDifficulty}`;


        const response =
            await fetch(endpoint);


        if (!response.ok) {
            throw new Error(
                "Puzzle request failed."
            );
        }


        const puzzle =
            await response.json();


        if (
            requestId !==
            puzzleRequestId
        ) {
            return;
        }


        currentPuzzle =
            puzzle;


        if (
            currentMode === "daily"
        ) {
            normalizeDailyStreak(
                currentPuzzle.date
            );
        }


        const restored =
            currentMode === "daily" &&
            !forceNew &&
            restoreDailyState(
                currentPuzzle
            );


        if (!restored) {

            equationTokens = [];

            attempts = 0;
            hintLevel = 0;

            puzzleSolved = false;
            puzzleLost = false;
            puzzleGivenUp = false;

            puzzleStarted =
                currentMode !== "daily";

            puzzleElapsedMs = 0;
            timerAnchorMs = null;
            puzzleManuallyPaused = false;

            draggedEquationIndex = null;
            selectedEquationIndex = null;


            targetElement.textContent =
                currentPuzzle.target;


            feedbackElement.textContent = "";
            feedbackElement.className =
                "feedback";

            clearHintReveal();
            clearRevealedSolution();
        }


        puzzleLoading = false;


        updateModeButtons();
        updateDifficultyButtons();
        updateStats();
        updateGameState();

        renderNumbers();
        renderEquation();

        updateDailyStartPanel();
        updateManualPauseUi();
        updateTimerDisplay();
        resumeTimerIfNeeded();
        updateNewDailyAvailablePanel();

        saveCurrentModeState();


    } catch (error) {

        if (
            requestId !==
            puzzleRequestId
        ) {
            return;
        }


        puzzleLoading = false;

        console.error(error);

        updateGameState();

        setFeedback(
            "Could not load a new puzzle.",
            "error"
        );
    }
}

// --------------------------------------------------
// Difficulty
// --------------------------------------------------

function updateDifficultyButtons() {

    difficultyButtons.forEach(
        button => {

            const isActive =
                button.dataset.difficulty ===
                    selectedDifficulty;

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );

            button.disabled =
                submitInProgress ||
                hintInProgress ||
                solutionInProgress ||
                puzzleLoading ||
                currentMode === "daily";
        }
    );


    if (difficultyBadge) {

        difficultyBadge.hidden =
            currentMode === "daily";

        if (
            currentMode === "random"
        ) {
            difficultyBadge.textContent =
                selectedDifficulty
                    .charAt(0)
                    .toUpperCase() +
                selectedDifficulty.slice(1);
        }
    }
}


function updateModeButtons() {

    modeButtons.forEach(
        button => {

            const isActive =
                button.dataset.mode ===
                    currentMode;

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );

            button.disabled =
                submitInProgress ||
                hintInProgress ||
                solutionInProgress ||
                puzzleLoading;
        }
    );
}

difficultyButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const newDifficulty =
                    button.dataset.difficulty;


                if (
                    currentMode !== "random" ||
                    submitInProgress ||
                    puzzleLoading ||
                    newDifficulty ===
                    selectedDifficulty
                ) {
                    return;
                }


                // Changing difficulty abandons an
                // unfinished puzzle, just like
                // choosing New Puzzle.
                if (
                    !puzzleSolved &&
                    !puzzleLost
                ) {

                    streak = 0;

                    saveStats();
                    updateStats();
                }


                selectedDifficulty =
                    newDifficulty;


                localStorage.setItem(
                    "puzzleLabDifficulty",
                    selectedDifficulty
                );


                pauseTimer();

                localStorage.removeItem(
                    UNLIMITED_STATE_KEY
                );


                updateDifficultyButtons();

                closeSettings();

                loadPuzzle(true);
            }
        );
    }
);

// --------------------------------------------------
// Game mode
// --------------------------------------------------

modeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const newMode =
                    button.dataset.mode;


                if (
                    submitInProgress ||
                    hintInProgress ||
                    solutionInProgress ||
                    puzzleLoading ||
                    newMode === currentMode
                ) {
                    return;
                }


                // Switching modes pauses the current
                // puzzle exactly where it is.
                pauseTimer();
                saveCurrentModeState();


                currentMode =
                    newMode;


                localStorage.setItem(
                    "puzzleLabMode",
                    currentMode
                );


                closeStatistics();
                closeSettings();
                closeHelp();


                updateModeButtons();
                updateDifficultyButtons();
                updateStats();

                loadPuzzle();
            }
        );
    }
);


// --------------------------------------------------
// Appearance
// --------------------------------------------------

function getEffectiveAppearance() {

    if (selectedAppearance === "system") {

        return systemThemeQuery.matches
            ? "dark"
            : "light";
    }


    return selectedAppearance;
}


function applyAppearance() {

    document.documentElement.dataset.theme =
        getEffectiveAppearance();
}


function updateAppearanceButtons() {

    appearanceButtons.forEach(
        button => {

            const isActive =
                button.dataset.appearance ===
                    selectedAppearance;

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        }
    );
}


appearanceButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                selectedAppearance =
                    button.dataset.appearance;


                localStorage.setItem(
                    "puzzleLabAppearance",
                    selectedAppearance
                );


                updateAppearanceButtons();

                applyAppearance();
            }
        );
    }
);


systemThemeQuery.addEventListener(
    "change",
    () => {

        if (
            selectedAppearance ===
            "system"
        ) {
            applyAppearance();
        }
    }
);

// --------------------------------------------------
// Stats shown during game
// --------------------------------------------------

function updateStats() {

    attemptsElement.textContent =
        `${attempts} / ${MAX_ATTEMPTS}`;

    streakElement.textContent =
        currentMode === "daily"
            ? dailyStreak
            : streak;

    updateTimerDisplay();
}


// --------------------------------------------------
// Save statistics
// --------------------------------------------------

function saveUnlimitedBreakdownStats() {

    localStorage.setItem(
        UNLIMITED_BREAKDOWN_KEY,
        JSON.stringify(
            unlimitedBreakdownStats
        )
    );
}


function updateBreakdownBucket(
    bucket,
    won
) {

    bucket.played++;

    if (!won) {
        bucket.streak = 0;
        return;
    }

    bucket.wins++;
    bucket.streak++;
    bucket.maxStreak =
        Math.max(
            bucket.maxStreak,
            bucket.streak
        );

    const attemptIndex =
        Math.min(
            Math.max(attempts - 1, 0),
            MAX_ATTEMPTS - 1
        );

    bucket.distribution[attemptIndex]++;

    const hintIndex =
        Math.min(
            Math.max(hintLevel, 0),
            MAX_HINTS
        );

    bucket.hintDistribution[hintIndex]++;

    const solveTime =
        Math.max(
            0,
            Math.round(puzzleElapsedMs)
        );

    bucket.solveTimeTotalMs +=
        solveTime;

    bucket.timedWins++;

    if (
        bucket.bestSolveTimeMs === 0 ||
        solveTime < bucket.bestSolveTimeMs
    ) {
        bucket.bestSolveTimeMs =
            solveTime;
    }
}


function recordUnlimitedBreakdown(won) {

    if (
        currentMode !== "random" ||
        !currentPuzzle
    ) {
        return;
    }

    const challengeKey =
        ["easy", "medium", "hard", "mixed"]
            .includes(selectedDifficulty)
            ? selectedDifficulty
            : null;

    const actualDifficulty =
        String(
            currentPuzzle.difficulty || ""
        ).toLowerCase();

    const difficultyKey =
        ["easy", "medium", "hard"]
            .includes(actualDifficulty)
            ? actualDifficulty
            : null;

    if (challengeKey) {
        updateBreakdownBucket(
            unlimitedBreakdownStats
                .challenge[challengeKey],
            won
        );
    }

    if (difficultyKey) {
        updateBreakdownBucket(
            unlimitedBreakdownStats
                .difficulty[difficultyKey],
            won
        );
    }

    saveUnlimitedBreakdownStats();
}


function getDisplayedUnlimitedStats() {

    if (selectedStatsFilter === "all") {
        return null;
    }

    const group =
        unlimitedBreakdownStats[
            selectedStatsGrouping
        ];

    return group?.[selectedStatsFilter] ||
        createEmptyStatsBucket();
}


function saveStats() {

    localStorage.setItem(
        "puzzleLabStreak",
        streak
    );

    localStorage.setItem(
        "puzzleLabMaxStreak",
        maxStreak
    );

    localStorage.setItem(
        "puzzleLabPlayed",
        gamesPlayed
    );

    localStorage.setItem(
        "puzzleLabWins",
        gamesWon
    );

    localStorage.setItem(
        "puzzleLabDistribution",
        JSON.stringify(
            solveDistribution
        )
    );

    localStorage.setItem(
        "puzzleLabUnlimitedHintDistribution",
        JSON.stringify(
            unlimitedHintDistribution
        )
    );

    localStorage.setItem(
        "puzzleLabUnlimitedSolveTimeTotalMs",
        unlimitedSolveTimeTotalMs
    );

    localStorage.setItem(
        "puzzleLabUnlimitedTimedWins",
        unlimitedTimedWins
    );

    localStorage.setItem(
        "puzzleLabUnlimitedBestSolveTimeMs",
        unlimitedBestSolveTimeMs
    );
}


function saveDailyStats() {

    localStorage.setItem(
        "puzzleLabDailyStreak",
        dailyStreak
    );

    localStorage.setItem(
        "puzzleLabDailyMaxStreak",
        dailyMaxStreak
    );

    localStorage.setItem(
        "puzzleLabDailyPlayed",
        dailyGamesPlayed
    );

    localStorage.setItem(
        "puzzleLabDailyWins",
        dailyGamesWon
    );

    localStorage.setItem(
        "puzzleLabDailyDistribution",
        JSON.stringify(
            dailySolveDistribution
        )
    );

    localStorage.setItem(
        "puzzleLabDailyHintDistribution",
        JSON.stringify(
            dailyHintDistribution
        )
    );

    localStorage.setItem(
        "puzzleLabDailySolveTimeTotalMs",
        dailySolveTimeTotalMs
    );

    localStorage.setItem(
        "puzzleLabDailyTimedWins",
        dailyTimedWins
    );

    localStorage.setItem(
        "puzzleLabDailyBestSolveTimeMs",
        dailyBestSolveTimeMs
    );

    localStorage.setItem(
        "puzzleLabDailyLastCompletedDate",
        dailyLastCompletedDate
    );
}


function recordHintUsage() {

    // Hint totals are no longer stored as ever-growing
    // counters. The completed puzzle is recorded once in
    // the 0–3 Hint Distribution instead.
}


function recordCompletedHintUsage() {

    const index =
        Math.min(
            Math.max(hintLevel, 0),
            MAX_HINTS
        );

    if (currentMode === "daily") {
        dailyHintDistribution[index]++;

    } else {
        unlimitedHintDistribution[index]++;
    }
}


function recordSolveTime() {

    const solveTime =
        Math.max(
            0,
            Math.round(puzzleElapsedMs)
        );

    if (currentMode === "daily") {
        dailySolveTimeTotalMs +=
            solveTime;

        dailyTimedWins++;

        if (
            dailyBestSolveTimeMs === 0 ||
            solveTime < dailyBestSolveTimeMs
        ) {
            dailyBestSolveTimeMs =
                solveTime;
        }

    } else {
        unlimitedSolveTimeTotalMs +=
            solveTime;

        unlimitedTimedWins++;

        if (
            unlimitedBestSolveTimeMs === 0 ||
            solveTime < unlimitedBestSolveTimeMs
        ) {
            unlimitedBestSolveTimeMs =
                solveTime;
        }
    }
}


function recordWin() {

    recordCompletedHintUsage();
    recordSolveTime();

    if (
        currentMode === "daily"
    ) {
        const yesterday =
            previousUtcDate(
                currentPuzzle.date
            );


        if (
            dailyLastCompletedDate ===
                yesterday
        ) {
            dailyStreak++;

        } else {
            dailyStreak = 1;
        }


        dailyMaxStreak =
            Math.max(
                dailyMaxStreak,
                dailyStreak
            );

        dailyGamesPlayed++;
        dailyGamesWon++;

        dailySolveDistribution[
            attempts - 1
        ]++;

        dailyLastCompletedDate =
            currentPuzzle.date;

        saveDailyStats();

    } else {

        streak++;

        gamesPlayed++;
        gamesWon++;

        solveDistribution[
            attempts - 1
        ]++;

        if (
            streak > maxStreak
        ) {
            maxStreak = streak;
        }

        recordUnlimitedBreakdown(true);
        saveStats();
    }
}


function recordLoss() {

    if (
        currentMode === "daily"
    ) {
        dailyStreak = 0;

        dailyGamesPlayed++;

        dailyLastCompletedDate =
            currentPuzzle.date;

        saveDailyStats();

    } else {

        streak = 0;

        gamesPlayed++;

        recordUnlimitedBreakdown(false);
        saveStats();
    }
}


// --------------------------------------------------
// Statistics panel
// --------------------------------------------------

function updateStatsModeButtons() {

    statsModeButtons.forEach(
        button => {

            const isActive =
                button.dataset.statsMode ===
                    selectedStatsMode;

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        }
    );
}


function updateStatisticsPanel() {

    if (!playedStat) {
        return;
    }


    const usingDaily =
        selectedStatsMode === "daily";

    const filteredUnlimited =
        usingDaily
            ? null
            : getDisplayedUnlimitedStats();


    const played =
        usingDaily
            ? dailyGamesPlayed
            : filteredUnlimited
                ? filteredUnlimited.played
                : gamesPlayed;

    const won =
        usingDaily
            ? dailyGamesWon
            : filteredUnlimited
                ? filteredUnlimited.wins
                : gamesWon;

    const shownStreak =
        usingDaily
            ? dailyStreak
            : filteredUnlimited
                ? filteredUnlimited.streak
                : streak;

    const shownMaxStreak =
        usingDaily
            ? dailyMaxStreak
            : filteredUnlimited
                ? filteredUnlimited.maxStreak
                : maxStreak;

    const distribution =
        usingDaily
            ? dailySolveDistribution
            : filteredUnlimited
                ? filteredUnlimited.distribution
                : solveDistribution;

    const hintDistribution =
        usingDaily
            ? dailyHintDistribution
            : filteredUnlimited
                ? filteredUnlimited.hintDistribution
                : unlimitedHintDistribution;

    const solveTimeTotal =
        usingDaily
            ? dailySolveTimeTotalMs
            : filteredUnlimited
                ? filteredUnlimited.solveTimeTotalMs
                : unlimitedSolveTimeTotalMs;

    const timedWins =
        usingDaily
            ? dailyTimedWins
            : filteredUnlimited
                ? filteredUnlimited.timedWins
                : unlimitedTimedWins;

    const bestSolveTime =
        usingDaily
            ? dailyBestSolveTimeMs
            : filteredUnlimited
                ? filteredUnlimited.bestSolveTimeMs
                : unlimitedBestSolveTimeMs;


    playedStat.textContent =
        played;


    const winPercent =
        played === 0
            ? 0
            : Math.round(
                (won / played) * 100
            );


    winPercentStat.textContent =
        winPercent;

    modalStreakStat.textContent =
        shownStreak;

    modalMaxStreakStat.textContent =
        shownMaxStreak;


    if (averageSolveTimeStat) {
        averageSolveTimeStat.textContent =
            timedWins === 0
                ? "—"
                : formatDuration(
                    solveTimeTotal / timedWins
                );
    }

    if (bestSolveTimeStat) {
        bestSolveTimeStat.textContent =
            bestSolveTime > 0
                ? formatDuration(
                    bestSolveTime
                )
                : "—";
    }


    const highest =
        Math.max(
            ...distribution,
            1
        );


    distribution.forEach(
        (count, index) => {

            const bar =
                document.getElementById(
                    `distribution-${index + 1}`
                );


            if (!bar) {
                return;
            }


            let width = 8;


            if (count > 0) {

                width =
                    Math.max(
                        12,
                        (count / highest) * 100
                    );
            }


            bar.style.width =
                `${width}%`;

            bar.textContent =
                count;

            bar.setAttribute(
                "aria-label",
                `${count} solved ${
                    count === 1
                        ? "puzzle"
                        : "puzzles"
                } in ${index + 1} ${
                    index === 0
                        ? "attempt"
                        : "attempts"
                }`
            );
        }
    );


    const highestHints =
        Math.max(
            ...hintDistribution,
            1
        );


    hintDistribution.forEach(
        (count, index) => {

            const bar =
                document.getElementById(
                    `hint-distribution-${index}`
                );

            if (!bar) {
                return;
            }

            let width = 8;

            if (count > 0) {
                width =
                    Math.max(
                        12,
                        (count / highestHints) * 100
                    );
            }

            bar.style.width =
                `${width}%`;

            bar.textContent =
                count;

            bar.setAttribute(
                "aria-label",
                `${count} solved ${
                    count === 1
                        ? "puzzle"
                        : "puzzles"
                } with ${index} ${
                    index === 1
                        ? "hint"
                        : "hints"
                }`
            );
        }
    );

    updateStatsBreakdownControls();
}


statsModeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                selectedStatsMode =
                    button.dataset.statsMode;

                updateStatsModeButtons();
                updateStatsBreakdownControls();
                updateStatisticsPanel();
            }
        );
    }
);


function updateBodyModalLock() {

    const statisticsOpen =
        statsModal &&
        statsModal.classList.contains("open");

    const giveUpOpen =
        giveUpModal &&
        giveUpModal.classList.contains("open");

    const helpOpen =
        helpModal &&
        helpModal.classList.contains("open");

    const settingsOpen =
        settingsModal &&
        settingsModal.classList.contains("open");


    document.body.classList.toggle(
        "modal-open",
        statisticsOpen ||
        giveUpOpen ||
        helpOpen ||
        settingsOpen
    );
}


function openStatistics() {

    if (!statsModal) {
        return;
    }

    selectedStatsMode =
        currentMode;

    updateStatsModeButtons();
    updateStatsBreakdownControls();
    updateStatisticsPanel();

    openAccessibleModal(
        statsModal,
        closeStatsButton
    );
}


function closeStatistics() {

    if (!statsModal) {
        return;
    }

    closeAccessibleModal(
        statsModal
    );
}

// --------------------------------------------------
// Statistics modal events
// --------------------------------------------------

if (statsButton) {

    statsButton.addEventListener(
        "click",
        openStatistics
    );
}


if (closeStatsButton) {

    closeStatsButton.addEventListener(
        "click",
        closeStatistics
    );
}


if (statsModal) {

    statsModal.addEventListener(
        "click",
        event => {

            if (event.target === statsModal) {
                closeStatistics();
            }
        }
    );
}

// --------------------------------------------------
// Help modal
// --------------------------------------------------

function openHelp() {

    openAccessibleModal(
        helpModal,
        closeHelpButton
    );
}


function closeHelp() {

    closeAccessibleModal(
        helpModal
    );
}


helpButton.addEventListener(
    "click",
    openHelp
);


closeHelpButton.addEventListener(
    "click",
    closeHelp
);


helpModal.addEventListener(
    "click",
    event => {

        if (event.target === helpModal) {
            closeHelp();
        }
    }
);


// --------------------------------------------------
// Settings modal
// --------------------------------------------------

function openSettings() {

    updateDifficultyButtons();
    updateAppearanceButtons();

    openAccessibleModal(
        settingsModal,
        closeSettingsButton
    );
}


function closeSettings() {

    closeAccessibleModal(
        settingsModal
    );
}


settingsButton.addEventListener(
    "click",
    openSettings
);


difficultyBadge.addEventListener(
    "click",
    openSettings
);


closeSettingsButton.addEventListener(
    "click",
    closeSettings
);


settingsModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            settingsModal
        ) {
            closeSettings();
        }
    }
);

// --------------------------------------------------
// Game solved / lost / locked state
// --------------------------------------------------

function updateGameState() {

    const gameFinished =
        puzzleSolved || puzzleLost;

    const waitingForDailyStart =
        isDailyWaitingToStart();

    const editingLocked =
        gameFinished ||
        waitingForDailyStart ||
        puzzleManuallyPaused ||
        submitInProgress ||
        puzzleLoading;


    gameCard.classList.toggle(
        "solved",
        puzzleSolved
    );

    gameCard.classList.toggle(
        "lost",
        puzzleLost && !puzzleGivenUp
    );

    gameCard.classList.toggle(
        "given-up",
        puzzleLost && puzzleGivenUp
    );


    equationElement.classList.toggle(
        "locked",
        gameFinished
    );


    submitButton.disabled =
        editingLocked;

    clearButton.disabled =
        editingLocked;

    backspaceButton.disabled =
        editingLocked;

    giveUpButton.disabled =
        editingLocked ||
        hintInProgress ||
        solutionInProgress;

    hintButton.disabled =
        editingLocked ||
        hintInProgress ||
        solutionInProgress ||
        hintLevel >= MAX_HINTS;


    // There is only one Daily puzzle per day.
    newPuzzleButton.hidden =
        currentMode === "daily";

    newPuzzleButton.disabled =
        submitInProgress ||
        hintInProgress ||
        solutionInProgress ||
        puzzleLoading;

    settingsButton.disabled =
        submitInProgress ||
        hintInProgress ||
        solutionInProgress ||
        puzzleLoading;

    difficultyBadge.disabled =
        submitInProgress ||
        hintInProgress ||
        solutionInProgress ||
        puzzleLoading;


    difficultyButtons.forEach(
        button => {

            button.disabled =
                submitInProgress ||
                hintInProgress ||
                solutionInProgress ||
                puzzleLoading ||
                currentMode === "daily";
        }
    );


    modeButtons.forEach(
        button => {

            button.disabled =
                submitInProgress ||
                hintInProgress ||
                solutionInProgress ||
                puzzleLoading;
        }
    );


    operatorButtons.forEach(
        button => {

            button.disabled =
                editingLocked;

            button.draggable =
                !editingLocked;
        }
    );


    if (hintLevel === 0) {

        hintButton.textContent =
            "Hint";

    } else if (
        hintLevel < MAX_HINTS
    ) {

        hintButton.textContent =
            "Next Hint";

    } else {

        hintButton.textContent =
            "All Hints Used";
    }


    if (puzzleSolved) {

        submitButton.textContent =
            "Solved ✓";

        newPuzzleButton.textContent =
            "Next Puzzle";

        newPuzzleButton.classList.add(
            "next-puzzle"
        );

    } else if (puzzleLost) {

        submitButton.textContent =
            puzzleGivenUp
                ? "Puzzle Ended"
                : "No Attempts Left";

        newPuzzleButton.textContent =
            "Next Puzzle";

        newPuzzleButton.classList.add(
            "next-puzzle"
        );

    } else {

        submitButton.textContent =
            puzzleLoading
                ? "Loading Puzzle..."
                : "Submit Answer";

        newPuzzleButton.textContent =
            "New Puzzle";

        newPuzzleButton.classList.remove(
            "next-puzzle"
        );
    }


    updateEquationSelectionControls();

    updateModeButtons();
    updateDifficultyButtons();
    updateDailyStartPanel();
    updateManualPauseUi();
    updateTimerDisplay();
    updateNewDailyAvailablePanel();
    updateDailyFinishedView();
}


// --------------------------------------------------
// Number tiles
// --------------------------------------------------

function renderNumbers() {

    numbersContainer.innerHTML = "";


    currentPuzzle.numbers.forEach(number => {

        const button =
            document.createElement("button");


        button.className =
            "tile number-tile";

        button.type = "button";

        button.textContent =
            number;

        button.dataset.token =
            number;

        button.setAttribute(
            "aria-label",
            `Add number ${number} to equation`
        );


        const gameFinished =
            puzzleSolved ||
            puzzleLost ||
            submitInProgress ||
            puzzleLoading;

        button.draggable =
            !gameFinished;


        const used =
            equationTokens.some(
                token =>
                    token.type === "number" &&
                    token.value === String(number)
            );


        button.disabled =
            gameFinished || used;


        // Click = add to end

        button.addEventListener(
            "click",
            () => {

                if (
                    gameFinished ||
                    button.disabled
                ) {
                    return;
                }


                insertToken(
                    {
                        type: "number",
                        value: String(number),
                        display: String(number)
                    },
                    equationTokens.length
                );
            }
        );


        // Drag = insert anywhere

        button.addEventListener(
            "dragstart",
            event => {

                if (
                    puzzleSolved ||
                    puzzleLost
                ) {

                    event.preventDefault();

                    return;
                }


                const dragData = {

                    source: "palette",

                    token: {
                        type: "number",
                        value: String(number),
                        display: String(number)
                    }
                };


                event.dataTransfer.setData(
                    "text/plain",
                    JSON.stringify(dragData)
                );


                event.dataTransfer.effectAllowed =
                    "copy";
            }
        );


        numbersContainer.appendChild(
            button
        );
    });
}


// --------------------------------------------------
// Operator tiles
// --------------------------------------------------

operatorButtons.forEach(button => {

    button.type = "button";
    button.draggable = true;

    const spokenOperatorNames = {
        "+": "addition",
        "-": "subtraction",
        "*": "multiplication",
        "/": "division",
        "(": "open parenthesis",
        ")": "close parenthesis"
    };

    button.setAttribute(
        "aria-label",
        `Add ${spokenOperatorNames[
            button.dataset.token
        ] || button.textContent.trim()} to equation`
    );


    // Click = add to end

    button.addEventListener(
        "click",
        () => {

            if (
                puzzleSolved ||
                puzzleLost
            ) {
                return;
            }


            insertToken(
                {
                    type: "operator",
                    value: button.dataset.token,
                    display: button.textContent.trim()
                },
                equationTokens.length
            );
        }
    );


    // Drag = insert anywhere

    button.addEventListener(
        "dragstart",
        event => {

            if (
                puzzleSolved ||
                puzzleLost
            ) {

                event.preventDefault();

                return;
            }


            const dragData = {

                source: "palette",

                token: {
                    type: "operator",
                    value: button.dataset.token,
                    display: button.textContent.trim()
                }
            };


            event.dataTransfer.setData(
                "text/plain",
                JSON.stringify(dragData)
            );


            event.dataTransfer.effectAllowed =
                "copy";
        }
    );
});


// --------------------------------------------------
// Direct keyboard gameplay
// --------------------------------------------------

function keyboardGameplayAvailable() {

    return Boolean(
        currentPuzzle &&
        !puzzleSolved &&
        !puzzleLost &&
        !submitInProgress &&
        !hintInProgress &&
        !solutionInProgress &&
        !puzzleLoading &&
        !puzzleManuallyPaused &&
        !isDailyWaitingToStart() &&
        !(
            activeModal &&
            activeModal.classList.contains("open")
        )
    );
}


function addNumberFromKeyboard(key) {

    const number =
        Number(key);

    if (
        !Number.isInteger(number) ||
        !currentPuzzle.numbers.includes(number)
    ) {
        return false;
    }

    const alreadyUsed =
        equationTokens.some(
            token =>
                token.type === "number" &&
                token.value === String(number)
        );

    if (alreadyUsed) {
        return false;
    }

    insertToken(
        {
            type: "number",
            value: String(number),
            display: String(number)
        },
        equationTokens.length
    );

    return true;
}


function addOperatorFromKeyboard(key) {

    const operatorMap = {
        "+": {
            value: "+",
            display: "+"
        },
        "-": {
            value: "-",
            display: "−"
        },
        "*": {
            value: "*",
            display: "×"
        },
        "x": {
            value: "*",
            display: "×"
        },
        "X": {
            value: "*",
            display: "×"
        },
        "/": {
            value: "/",
            display: "÷"
        },
        "(": {
            value: "(",
            display: "("
        },
        ")": {
            value: ")",
            display: ")"
        }
    };

    const operator =
        operatorMap[key];

    if (!operator) {
        return false;
    }

    insertToken(
        {
            type: "operator",
            value: operator.value,
            display: operator.display
        },
        equationTokens.length
    );

    return true;
}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            !keyboardGameplayAvailable()
        ) {
            return;
        }

        const target =
            event.target;

        const typingTarget =
            target instanceof HTMLElement &&
            (
                target.matches(
                    "input, textarea, select"
                ) ||
                target.isContentEditable
            );

        if (typingTarget) {
            return;
        }

        // Left / Right arrows can enter and move through
        // the equation even when no equation tile currently
        // has focus. If a normal control has focus, leave its
        // keyboard behavior alone.
        if (
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight"
        ) {
            const equationTileFocused =
                target instanceof HTMLElement &&
                target.classList.contains(
                    "equation-tile"
                );

            const otherButtonFocused =
                target instanceof HTMLElement &&
                Boolean(target.closest("button")) &&
                !equationTileFocused;

            if (
                !equationTileFocused &&
                !otherButtonFocused &&
                equationTokens.length > 0
            ) {
                event.preventDefault();

                navigateEquationSelection(
                    event.key === "ArrowLeft"
                        ? -1
                        : 1
                );
            }

            return;
        }

        // Number keys use only numbers that belong to the
        // current puzzle and have not already been used.
        if (/^[1-9]$/.test(event.key)) {
            if (addNumberFromKeyboard(event.key)) {
                event.preventDefault();
            }
            return;
        }

        // + - * / ( ) build the same operator tiles as
        // clicking the on-screen controls. x/X is accepted
        // as a convenient multiplication shortcut too.
        if (
            [
                "+", "-", "*", "/",
                "(", ")", "x", "X"
            ].includes(event.key)
        ) {
            if (addOperatorFromKeyboard(event.key)) {
                event.preventDefault();
            }
            return;
        }

        // When an equation tile itself has focus, its own
        // Backspace/Delete handler removes that selected tile.
        const equationTileFocused =
            target instanceof HTMLElement &&
            target.classList.contains(
                "equation-tile"
            );

        if (
            event.key === "Backspace" &&
            !equationTileFocused
        ) {
            event.preventDefault();

            if (equationTokens.length > 0) {
                equationTokens.pop();
                selectedEquationIndex = null;

                renderEquation();
                renderNumbers();
                setFeedback("");
            }

            return;
        }

        // Enter submits only when the user is not currently
        // focused on another button. Buttons keep their normal
        // keyboard behavior when focused with Tab.
        if (event.key === "Enter") {
            const buttonFocused =
                target instanceof HTMLElement &&
                Boolean(target.closest("button"));

            if (!buttonFocused) {
                event.preventDefault();
                submitButton.click();
            }
        }
    }
);


// --------------------------------------------------
// Insert token
// --------------------------------------------------

function insertToken(token, index) {

    if (
        puzzleSolved ||
        puzzleLost ||
        submitInProgress ||
        puzzleLoading
    ) {
        return;
    }


    if (token.type === "number") {

        const alreadyUsed =
            equationTokens.some(
                existing =>
                    existing.type === "number" &&
                    existing.value === token.value
            );


        if (alreadyUsed) {
            return;
        }
    }


    equationTokens.splice(
        index,
        0,
        token
    );

    selectedEquationIndex = null;


    renderEquation();
    renderNumbers();

    setFeedback("");
}


// --------------------------------------------------
// Render equation
// --------------------------------------------------

function updateEquationSelectionControls() {

    const editingLocked =
        puzzleSolved ||
        puzzleLost ||
        submitInProgress ||
        puzzleLoading ||
        puzzleManuallyPaused ||
        isDailyWaitingToStart();

    const validSelection =
        Number.isInteger(
            selectedEquationIndex
        ) &&
        selectedEquationIndex >= 0 &&
        selectedEquationIndex <
            equationTokens.length;

    if (
        !equationTileControls ||
        editingLocked ||
        !validSelection
    ) {
        if (equationTileControls) {
            equationTileControls.hidden =
                true;
        }

        return;
    }

    equationTileControls.hidden =
        false;

    if (moveEquationLeftButton) {
        moveEquationLeftButton.disabled =
            selectedEquationIndex === 0;
    }

    if (moveEquationRightButton) {
        moveEquationRightButton.disabled =
            selectedEquationIndex ===
                equationTokens.length - 1;
    }
}


function focusSelectedEquationTile() {

    if (
        !Number.isInteger(
            selectedEquationIndex
        )
    ) {
        return;
    }

    requestAnimationFrame(() => {
        const tile =
            equationElement.querySelector(
                `[data-equation-index="${selectedEquationIndex}"]`
            );

        if (tile) {
            tile.focus();
        }
    });
}


function selectEquationTile(
    index,
    focusTile = false
) {

    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= equationTokens.length ||
        puzzleSolved ||
        puzzleLost ||
        submitInProgress ||
        puzzleLoading ||
        puzzleManuallyPaused ||
        isDailyWaitingToStart()
    ) {
        return;
    }

    selectedEquationIndex =
        index;

    equationElement
        .querySelectorAll(
            ".equation-tile"
        )
        .forEach(
            (tile, tileIndex) => {
                const selected =
                    tileIndex ===
                        selectedEquationIndex;

                tile.classList.toggle(
                    "selected",
                    selected
                );

                tile.setAttribute(
                    "aria-pressed",
                    String(selected)
                );
            }
        );

    updateEquationSelectionControls();

    if (focusTile) {
        focusSelectedEquationTile();
    }
}


function navigateEquationSelection(direction) {

    if (equationTokens.length === 0) {
        return;
    }

    let currentIndex =
        Number.isInteger(selectedEquationIndex)
            ? selectedEquationIndex
            : null;

    const focusedTile =
        document.activeElement instanceof HTMLElement &&
        document.activeElement.classList.contains(
            "equation-tile"
        )
            ? document.activeElement
            : null;

    if (focusedTile) {
        const focusedIndex =
            Number(
                focusedTile.dataset.equationIndex
            );

        if (Number.isInteger(focusedIndex)) {
            currentIndex = focusedIndex;
        }
    }

    let nextIndex;

    if (!Number.isInteger(currentIndex)) {
        nextIndex =
            direction < 0
                ? equationTokens.length - 1
                : 0;
    } else {
        nextIndex =
            Math.min(
                Math.max(
                    currentIndex + direction,
                    0
                ),
                equationTokens.length - 1
            );
    }

    selectEquationTile(
        nextIndex,
        true
    );

    const token =
        equationTokens[nextIndex];

    announceAccessibility(
        `Selected ${token.display}, position ${nextIndex + 1} of ${equationTokens.length}.`
    );
}


function moveSelectedEquationTile(direction) {

    if (
        !Number.isInteger(
            selectedEquationIndex
        )
    ) {
        return;
    }

    const oldIndex =
        selectedEquationIndex;

    const newIndex =
        oldIndex + direction;

    if (
        newIndex < 0 ||
        newIndex >= equationTokens.length
    ) {
        return;
    }

    const movedToken =
        equationTokens.splice(
            oldIndex,
            1
        )[0];

    equationTokens.splice(
        newIndex,
        0,
        movedToken
    );

    selectedEquationIndex =
        newIndex;

    renderEquation();
    renderNumbers();

    setFeedback("");

    announceAccessibility(
        `Moved ${movedToken.display} ${
            direction < 0
                ? "left"
                : "right"
        }.`
    );

    focusSelectedEquationTile();
}


function removeSelectedEquationTile() {

    if (
        !Number.isInteger(
            selectedEquationIndex
        ) ||
        selectedEquationIndex < 0 ||
        selectedEquationIndex >=
            equationTokens.length
    ) {
        return;
    }

    const removedIndex =
        selectedEquationIndex;

    const removedToken =
        equationTokens.splice(
            removedIndex,
            1
        )[0];

    if (equationTokens.length === 0) {
        selectedEquationIndex = null;

    } else {
        selectedEquationIndex =
            Math.min(
                removedIndex,
                equationTokens.length - 1
            );
    }

    renderEquation();
    renderNumbers();

    setFeedback("");

    announceAccessibility(
        `Removed ${removedToken.display} from the equation.`
    );

    if (
        Number.isInteger(
            selectedEquationIndex
        )
    ) {
        focusSelectedEquationTile();
    } else {
        equationElement.focus();
    }
}


if (moveEquationLeftButton) {
    moveEquationLeftButton.addEventListener(
        "click",
        () => moveSelectedEquationTile(-1)
    );
}


if (moveEquationRightButton) {
    moveEquationRightButton.addEventListener(
        "click",
        () => moveSelectedEquationTile(1)
    );
}


if (removeEquationTileButton) {
    removeEquationTileButton.addEventListener(
        "click",
        removeSelectedEquationTile
    );
}


// --------------------------------------------------
// Render equation
// --------------------------------------------------

function renderEquation() {

    equationElement.innerHTML = "";

    if (
        Number.isInteger(
            selectedEquationIndex
        ) &&
        selectedEquationIndex >=
            equationTokens.length
    ) {
        selectedEquationIndex = null;
    }


    if (equationTokens.length === 0) {

        const placeholder =
            document.createElement("span");


        placeholder.className =
            "placeholder";

        placeholder.textContent =
            "Click, tap, drag, or type";


        equationElement.appendChild(
            placeholder
        );

        updateEquationSelectionControls();

        return;
    }


    equationTokens.forEach(
        (token, index) => {

            const tile =
                document.createElement("button");


            tile.type = "button";

            tile.className =
                "equation-tile";

            tile.dataset.equationIndex =
                String(index);


            if (token.type === "number") {

                tile.classList.add(
                    "equation-number"
                );

            } else {

                tile.classList.add(
                    "equation-operator"
                );
            }


            tile.textContent =
                token.display;


            const editingLocked =
                puzzleSolved ||
                puzzleLost ||
                submitInProgress ||
                puzzleLoading ||
                puzzleManuallyPaused ||
                isDailyWaitingToStart();

            tile.disabled =
                editingLocked;

            tile.draggable =
                !editingLocked;


            const selected =
                index ===
                    selectedEquationIndex;

            tile.classList.toggle(
                "selected",
                selected
            );

            tile.setAttribute(
                "aria-pressed",
                String(selected)
            );

            tile.setAttribute(
                "aria-describedby",
                "equation-keyboard-help"
            );

            tile.setAttribute(
                "aria-label",
                `${token.type === "number"
                    ? "Number"
                    : "Operator"} ${token.display}, position ${index + 1} of ${equationTokens.length}`
            );


            // Tap/click selects the tile and shows
            // Move / Remove controls.
            tile.addEventListener(
                "click",
                () => {
                    selectEquationTile(
                        index
                    );
                }
            );


            // Plain arrows move the keyboard cursor through
            // the equation. Ctrl + arrows reorder the
            // currently selected tile without dragging.
            tile.addEventListener(
                "keydown",
                event => {

                    if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        event.stopPropagation();

                        selectedEquationIndex =
                            index;

                        if (event.ctrlKey) {
                            moveSelectedEquationTile(
                                -1
                            );
                        } else {
                            navigateEquationSelection(
                                -1
                            );
                        }

                    } else if (
                        event.key === "ArrowRight"
                    ) {
                        event.preventDefault();
                        event.stopPropagation();

                        selectedEquationIndex =
                            index;

                        if (event.ctrlKey) {
                            moveSelectedEquationTile(
                                1
                            );
                        } else {
                            navigateEquationSelection(
                                1
                            );
                        }

                    } else if (
                        event.key === "Delete" ||
                        event.key === "Backspace"
                    ) {
                        event.preventDefault();
                        event.stopPropagation();

                        selectedEquationIndex =
                            index;

                        removeSelectedEquationTile();
                    }
                }
            );


            tile.addEventListener(
                "focus",
                () => {
                    selectEquationTile(
                        index
                    );
                }
            );


            // Move existing tile by drag-and-drop.

            tile.addEventListener(
                "dragstart",
                event => {

                    if (editingLocked) {

                        event.preventDefault();

                        return;
                    }


                    draggedEquationIndex =
                        index;


                    const dragData = {
                        source: "equation",
                        index: index
                    };


                    event.dataTransfer.setData(
                        "text/plain",
                        JSON.stringify(dragData)
                    );


                    event.dataTransfer.effectAllowed =
                        "move";


                    setTimeout(
                        () => {

                            tile.classList.add(
                                "dragging"
                            );

                        },
                        0
                    );
                }
            );


            tile.addEventListener(
                "dragend",
                () => {

                    tile.classList.remove(
                        "dragging"
                    );


                    draggedEquationIndex =
                        null;


                    removeDropIndicator();


                    equationElement.classList.remove(
                        "drag-over",
                        "delete-mode"
                    );
                }
            );


            equationElement.appendChild(
                tile
            );
        }
    );


    updateEquationSelectionControls();

    resizeEquationTiles();
}


// --------------------------------------------------
// Automatically resize equation tiles
// --------------------------------------------------

function resizeEquationTiles() {

    const tiles = [
        ...equationElement.querySelectorAll(
            ".equation-tile"
        )
    ];


    if (tiles.length === 0) {
        return;
    }


    const numberTiles =
        tiles.filter(
            tile =>
                tile.classList.contains(
                    "equation-number"
                )
        );


    const operatorTiles =
        tiles.length -
        numberTiles.length;


    const styles =
        getComputedStyle(
            equationElement
        );


    const availableWidth =
        equationElement.clientWidth -
        parseFloat(styles.paddingLeft) -
        parseFloat(styles.paddingRight);


    let gap = 8;


    if (tiles.length >= 8) {
        gap = 5;
    }


    if (tiles.length >= 11) {
        gap = 3;
    }


    const totalGap =
        gap *
        (tiles.length - 1);


    const estimatedOperatorWidth =
        operatorTiles * 20;


    let tileSize = 42;


    if (numberTiles.length > 0) {

        tileSize =
            (
                availableWidth -
                totalGap -
                estimatedOperatorWidth
            )
            /
            numberTiles.length;
    }


    tileSize =
        Math.min(
            tileSize,
            42
        );


    tileSize =
        Math.max(
            tileSize,
            28
        );


    let fontSize = 20;


    if (tileSize < 38) {
        fontSize = 18;
    }


    if (tileSize < 32) {
        fontSize = 16;
    }


    equationElement.style.gap =
        `${gap}px`;


    tiles.forEach(tile => {

        tile.style.height =
            `${tileSize}px`;

        tile.style.fontSize =
            `${fontSize}px`;


        if (
            tile.classList.contains(
                "equation-number"
            )
        ) {

            tile.style.width =
                `${tileSize}px`;

            tile.style.minWidth =
                `${tileSize}px`;

            tile.style.padding =
                "0";

        } else {

            tile.style.width =
                "auto";

            tile.style.minWidth =
                "18px";

            tile.style.padding =
                "0 2px";
        }
    });
}


window.addEventListener(
    "resize",
    resizeEquationTiles
);


// --------------------------------------------------
// Find drop position
// --------------------------------------------------

function getDropIndex(mouseX) {

    const tiles = [
        ...equationElement.querySelectorAll(
            ".equation-tile"
        )
    ];


    for (
        let i = 0;
        i < tiles.length;
        i++
    ) {

        const rect =
            tiles[i]
                .getBoundingClientRect();


        const middle =
            rect.left +
            rect.width / 2;


        if (mouseX < middle) {
            return i;
        }
    }


    return tiles.length;
}


// --------------------------------------------------
// Drop indicator
// --------------------------------------------------

function showDropIndicator(index) {

    removeDropIndicator();


    const indicator =
        document.createElement("span");


    indicator.className =
        "drop-indicator";


    const tiles = [
        ...equationElement.querySelectorAll(
            ".equation-tile"
        )
    ];


    if (index >= tiles.length) {

        equationElement.appendChild(
            indicator
        );

    } else {

        equationElement.insertBefore(
            indicator,
            tiles[index]
        );
    }
}


function removeDropIndicator() {

    const indicator =
        equationElement.querySelector(
            ".drop-indicator"
        );


    if (indicator) {
        indicator.remove();
    }
}


// --------------------------------------------------
// Drag over equation
// --------------------------------------------------

equationElement.addEventListener(
    "dragover",
    event => {

        if (
            puzzleSolved ||
            puzzleLost ||
            puzzleLoading
        ) {
            return;
        }


        event.preventDefault();
        event.stopPropagation();


        equationElement.classList.remove(
            "delete-mode"
        );


        equationElement.classList.add(
            "drag-over"
        );


        const dropIndex =
            getDropIndex(
                event.clientX
            );


        showDropIndicator(
            dropIndex
        );
    }
);


// --------------------------------------------------
// Drop inside equation
// --------------------------------------------------

equationElement.addEventListener(
    "drop",
    event => {

        if (
            puzzleSolved ||
            puzzleLost
        ) {
            return;
        }


        event.preventDefault();
        event.stopPropagation();


        removeDropIndicator();


        equationElement.classList.remove(
            "drag-over",
            "delete-mode"
        );


        try {

            const data =
                JSON.parse(
                    event.dataTransfer.getData(
                        "text/plain"
                    )
                );


            const dropIndex =
                getDropIndex(
                    event.clientX
                );


            // New tile

            if (data.source === "palette") {

                insertToken(
                    data.token,
                    dropIndex
                );
            }


            // Move existing tile

            else if (
                data.source === "equation"
            ) {

                const oldIndex =
                    data.index;


                let newIndex =
                    dropIndex;


                const movedToken =
                    equationTokens.splice(
                        oldIndex,
                        1
                    )[0];


                if (oldIndex < newIndex) {
                    newIndex--;
                }


                equationTokens.splice(
                    newIndex,
                    0,
                    movedToken
                );

                selectedEquationIndex =
                    newIndex;


                renderEquation();
                renderNumbers();

                setFeedback("");
            }


        } catch (error) {

            console.error(
                "Invalid drag data.",
                error
            );
        }


        draggedEquationIndex =
            null;
    }
);


// --------------------------------------------------
// Drag outside equation = delete mode
// --------------------------------------------------

document.addEventListener(
    "dragover",
    event => {

        if (
            puzzleSolved ||
            puzzleLost ||
            draggedEquationIndex === null
        ) {
            return;
        }


        event.preventDefault();


        const rect =
            equationElement
                .getBoundingClientRect();


        const insideEquation =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;


        if (insideEquation) {

            equationElement.classList.remove(
                "delete-mode"
            );

        } else {

            removeDropIndicator();


            equationElement.classList.remove(
                "drag-over"
            );


            equationElement.classList.add(
                "delete-mode"
            );
        }
    }
);


// --------------------------------------------------
// Drop outside equation = delete
// --------------------------------------------------

document.addEventListener(
    "drop",
    event => {

        if (
            puzzleSolved ||
            puzzleLost ||
            draggedEquationIndex === null
        ) {
            return;
        }


        const rect =
            equationElement
                .getBoundingClientRect();


        const insideEquation =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;


        if (!insideEquation) {

            event.preventDefault();


            equationTokens.splice(
                draggedEquationIndex,
                1
            );

            selectedEquationIndex =
                null;


            draggedEquationIndex =
                null;


            equationElement.classList.remove(
                "drag-over",
                "delete-mode"
            );


            removeDropIndicator();


            renderEquation();
            renderNumbers();

            setFeedback("");
        }
    }
);


// --------------------------------------------------
// Backspace
// --------------------------------------------------

backspaceButton.addEventListener(
    "click",
    () => {

        if (
            puzzleSolved ||
            puzzleLost ||
            equationTokens.length === 0
        ) {
            return;
        }


        equationTokens.pop();

        selectedEquationIndex = null;


        renderEquation();
        renderNumbers();

        setFeedback("");
    }
);


// --------------------------------------------------
// Clear
// --------------------------------------------------

clearButton.addEventListener(
    "click",
    () => {

        if (
            puzzleSolved ||
            puzzleLost
        ) {
            return;
        }


        equationTokens = [];
        selectedEquationIndex = null;


        renderEquation();
        renderNumbers();

        setFeedback("");
    }
);

// --------------------------------------------------
// Hints
// --------------------------------------------------

async function requestHint() {

    if (
        puzzleSolved ||
        puzzleLost ||
        submitInProgress ||
        hintInProgress ||
        solutionInProgress ||
        puzzleLoading ||
        isDailyWaitingToStart() ||
        hintLevel >= MAX_HINTS
    ) {
        return;
    }


    const nextLevel =
        hintLevel + 1;

    const puzzleAtRequest =
        currentPuzzle;

    const modeAtRequest =
        currentMode;


    hintInProgress = true;

    updateGameState();


    try {

        const response =
            await fetch(
                "/hint",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        numbers:
                            puzzleAtRequest.numbers,

                        target:
                            puzzleAtRequest.target,

                        level:
                            nextLevel
                    })
                }
            );


        if (!response.ok) {
            throw new Error(
                "Hint request failed."
            );
        }


        const data =
            await response.json();


        if (
            currentPuzzle !==
                puzzleAtRequest ||
            currentMode !==
                modeAtRequest
        ) {
            return;
        }


        const firstHintForPuzzle =
            hintLevel === 0;


        hintLevel =
            data.level;


        recordHintUsage(
            firstHintForPuzzle
        );


        hintRevealElement.textContent =
            `Hint ${hintLevel} of ${MAX_HINTS}: ${data.hint}`;


        hintRevealElement.classList.add(
            "visible"
        );


        setFeedback("");


    } catch (error) {

        console.error(error);

        setFeedback(
            "Could not load a hint.",
            "error"
        );

    } finally {

        hintInProgress = false;

        updateGameState();

        saveCurrentModeState();
    }
}


function clearHintReveal() {

    hintRevealElement.textContent = "";

    hintRevealElement.classList.remove(
        "visible"
    );
}


hintButton.addEventListener(
    "click",
    requestHint
);



// --------------------------------------------------
// Reveal solution
// --------------------------------------------------

async function revealSolution() {

    if (
        solutionInProgress ||
        !currentPuzzle
    ) {
        return;
    }


    const puzzleAtRequest =
        currentPuzzle;

    const modeAtRequest =
        currentMode;


    solutionInProgress = true;

    updateGameState();


    try {

        const response =
            await fetch(
                "/solution",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        numbers:
                            puzzleAtRequest.numbers,

                        target:
                            puzzleAtRequest.target
                    })
                }
            );


        const data =
            await response.json();


        if (
            currentPuzzle !==
                puzzleAtRequest ||
            currentMode !==
                modeAtRequest
        ) {
            return;
        }


        if (!data.solution) {

            solutionRevealElement.textContent =
                "No solution could be found.";

            solutionRevealElement.classList.add(
                "visible"
            );

            saveCurrentModeState();

            return;
        }


        const displaySolution =
            data.solution
                .replaceAll("*", "×")
                .replaceAll("/", "÷");


        solutionRevealElement.textContent =
            `One solution: ${displaySolution} = ${puzzleAtRequest.target}`;


        solutionRevealElement.classList.add(
            "visible"
        );

        saveCurrentModeState();


    } catch (error) {

        console.error(error);

        solutionRevealElement.textContent =
            "Could not load the solution.";

        solutionRevealElement.classList.add(
            "visible"
        );

        saveCurrentModeState();

    } finally {

        solutionInProgress = false;

        updateGameState();
    }
}


function clearRevealedSolution() {

    solutionRevealElement.textContent = "";

    solutionRevealElement.classList.remove(
        "visible"
    );
}

// --------------------------------------------------
// Submit
// --------------------------------------------------

submitButton.addEventListener(
    "click",
    async () => {

        const now =
            Date.now();

        if (
            puzzleSolved ||
            puzzleLost ||
            submitInProgress ||
            hintInProgress ||
            solutionInProgress ||
            puzzleLoading ||
            isDailyWaitingToStart() ||
            now - lastSubmitTime < SUBMIT_COOLDOWN_MS
        ) {
            return;
        }

        lastSubmitTime =
            now;


        if (equationTokens.length === 0) {

            setFeedback(
                "Build an equation first.",
                "error"
            );

            return;
        }


        const expression =
            equationTokens
                .map(
                    token =>
                        token.value
                )
                .join(" ");


        submitInProgress = true;

        updateGameState();
        renderNumbers();
        renderEquation();


        try {

            const response =
                await fetch(
                    "/check",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                {
                                    expression:
                                        expression,

                                    numbers:
                                        currentPuzzle.numbers,

                                    target:
                                        currentPuzzle.target
                                }
                            )
                    }
                );


            const result =
                await response.json();


            // --------------------------------------------------
            // Correct valid attempt
            // --------------------------------------------------

            if (result.correct) {

                attempts++;

                puzzleSolved = true;
                puzzleManuallyPaused = false;

                finishTimer();

                recordWin();

                updateStats();
                updateGameState();


                renderNumbers();
                renderEquation();


                const solvedMessage =
                    currentMode === "daily"
                        ? `Solved in ${attempts} ${attempts === 1 ? "attempt" : "attempts"} ✓`
                        : `Solved in ${attempts} ${attempts === 1 ? "attempt" : "attempts"} ✓ · ${formatDuration(puzzleElapsedMs)} · ${formatHintResult()}`;


                setFeedback(
                    solvedMessage,
                    "success"
                );


                if (currentMode === "daily") {
                    showDailyResult();
                }


                return;
            }


            // --------------------------------------------------
            // Valid but wrong attempt
            // --------------------------------------------------

            if (result.result !== null) {

                attempts++;


                updateStats();


                if (
                    attempts >= MAX_ATTEMPTS
                ) {

                    puzzleLost = true;
                    puzzleManuallyPaused = false;

                    finishTimer();

                    recordLoss();

                    updateStats();
                    updateGameState();


                    renderNumbers();
                    renderEquation();


                    setFeedback(
                        currentMode === "daily"
                            ? `Your result: ${result.result} — No attempts left.`
                            : `Your result: ${result.result} — No attempts left! · ${formatDuration(puzzleElapsedMs)} · ${formatHintResult()}`,
                        "error"
                    );

                    await revealSolution();

                    if (currentMode === "daily") {
                        showDailyResult();
                    }

                    return;
                }


                setFeedback(
                    `Your result: ${result.result} — Target: ${currentPuzzle.target}`,
                    "error"
                );


                return;
            }


            // --------------------------------------------------
            // Invalid / incomplete
            // Does NOT count as attempt
            // --------------------------------------------------

            setFeedback(
                result.message,
                "error"
            );


        } catch (error) {

            setFeedback(
                "Something went wrong.",
                "error"
            );


            console.error(
                error
            );

        } finally {

            submitInProgress = false;

            updateGameState();
            renderNumbers();
            renderEquation();
        }
    }
);


// --------------------------------------------------
// Feedback
// --------------------------------------------------

function setFeedback(
    message,
    type = ""
) {

    feedbackElement.textContent =
        message;


    feedbackElement.className =
        "feedback";


    if (type) {

        feedbackElement.classList.add(
            type
        );
    }


    saveCurrentModeState();
}


// --------------------------------------------------
// New / Next Puzzle
// --------------------------------------------------

newPuzzleButton.addEventListener(
    "click",
    () => {

        if (
            currentMode === "daily" ||
            submitInProgress ||
            hintInProgress ||
            solutionInProgress ||
            puzzleLoading
        ) {
            return;
        }


        // Skipping an unfinished Unlimited puzzle
        // breaks the current streak,
        // but does NOT count as a played game.

        if (
            !puzzleSolved &&
            !puzzleLost
        ) {

            streak = 0;

            saveStats();
            updateStats();
        }


        pauseTimer();
        puzzleManuallyPaused = false;

        localStorage.removeItem(
            UNLIMITED_STATE_KEY
        );


        closeStatistics();

        loadPuzzle(true);
    }
);


// --------------------------------------------------
// Give Up Modal
// --------------------------------------------------

function openGiveUpModal() {

    openAccessibleModal(
        giveUpModal,
        keepTryingButton
    );
}


function closeGiveUpModal() {

    closeAccessibleModal(
        giveUpModal
    );
}


giveUpButton.addEventListener(
    "click",
    () => {

        if (
            puzzleSolved ||
            puzzleLost ||
            submitInProgress ||
            hintInProgress ||
            solutionInProgress ||
            puzzleLoading ||
            isDailyWaitingToStart()
        ) {
            return;
        }


        openGiveUpModal();
    }
);


keepTryingButton.addEventListener(
    "click",
    closeGiveUpModal
);


giveUpModal.addEventListener(
    "click",
    event => {

        if (event.target === giveUpModal) {

            closeGiveUpModal();
        }
    }
);


// --------------------------------------------------
// Confirm Give Up
// --------------------------------------------------

confirmGiveUpButton.addEventListener(
    "click",
    async () => {

        closeGiveUpModal();


        puzzleLost = true;
        puzzleGivenUp = true;
        puzzleManuallyPaused = false;

        finishTimer();

        recordLoss();

        updateStats();
        updateGameState();


        renderNumbers();
        renderEquation();


        setFeedback(
            currentMode === "daily"
                ? "Puzzle given up."
                : `Puzzle given up · ${formatDuration(puzzleElapsedMs)} · ${formatHintResult()}`,
            "ended"
        );


        await revealSolution();

        if (currentMode === "daily") {
            showDailyResult();
        }

        // Unlimited keeps the completed board visible.
        // Daily moves to its dedicated Result screen.
    }
);

// --------------------------------------------------
// Timer lifecycle
// --------------------------------------------------

document.addEventListener(
    "visibilitychange",
    () => {

        if (document.hidden) {
            pauseTimer();
            saveCurrentModeState();

        } else {
            resumeTimerIfNeeded();
        }
    }
);


window.addEventListener(
    "pagehide",
    () => {
        pauseTimer();
        saveCurrentModeState();
    }
);


// --------------------------------------------------
// Start game
// --------------------------------------------------

ensureManropeFont();
applyPlayerFacingTerminology();
applyAppearance();
ensureEnhancedUi();

if (!timerIntervalId) {
    timerIntervalId =
        window.setInterval(
            () => {
                updateTimerDisplay();
                updateDailyCountdown();
            },
            250
        );
}


if (!dailyRolloverIntervalId) {
    dailyRolloverIntervalId =
        window.setInterval(
            checkDailyRollover,
            30000
        );
}

updateModeButtons();
updateDifficultyButtons();
updateAppearanceButtons();
updateStatsModeButtons();

updateStats();
updateStatisticsPanel();
updateTimerDisplay();
updateDailyCountdown();

loadPuzzle();