from datetime import datetime, timezone

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from target_number import (
    generate_puzzle,
    generate_daily_puzzle,
    check_solution,
    find_solution,
    generate_hints
)


app = FastAPI()

templates = Jinja2Templates(
    directory="templates"
)

app.mount(
    "/static",
    StaticFiles(
        directory="static"
    ),
    name="static"
)


class SolutionRequest(BaseModel):
    expression: str
    numbers: list[int]
    target: int


class RevealRequest(BaseModel):
    numbers: list[int]
    target: int


class HintRequest(BaseModel):
    numbers: list[int]
    target: int
    level: int


@app.get(
    "/",
    response_class=HTMLResponse
)
def home(
    request: Request
):
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


@app.get("/puzzle")
def get_puzzle(
    difficulty: str = "mixed"
):
    requested_difficulty = (
        difficulty
        .lower()
        .strip()
    )

    if requested_difficulty not in {
        "mixed",
        "easy",
        "medium",
        "hard"
    }:
        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty."
        )

    (
        numbers,
        target,
        _,
        actual_difficulty
    ) = generate_puzzle(
        requested_difficulty
    )

    return {
        "mode": "random",
        "numbers": numbers,
        "target": target,
        "difficulty": actual_difficulty
    }


@app.get("/daily-puzzle")
def get_daily_puzzle():
    daily_date = (
        datetime
        .now(timezone.utc)
        .date()
        .isoformat()
    )

    (
        numbers,
        target,
        _,
        actual_difficulty
    ) = generate_daily_puzzle(
        daily_date
    )

    return {
        "mode": "daily",
        "date": daily_date,
        "numbers": numbers,
        "target": target,
        "difficulty": actual_difficulty
    }


@app.post("/check")
def check_answer(
    data: SolutionRequest
):
    (
        correct,
        message,
        result
    ) = check_solution(
        data.numbers,
        data.target,
        data.expression
    )

    if result is None:
        result_text = None

    elif result.denominator == 1:
        result_text = str(
            result.numerator
        )

    else:
        result_text = (
            f"{result.numerator}/"
            f"{result.denominator}"
        )

    return {
        "correct": correct,
        "message": message,
        "result": result_text
    }


@app.post("/hint")
def get_hint(
    data: HintRequest
):
    if (
        data.level < 1 or
        data.level > 3
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Hint level must be "
                "between 1 and 3."
            )
        )

    hints = generate_hints(
        data.numbers,
        data.target
    )

    if len(hints) < data.level:
        raise HTTPException(
            status_code=404,
            detail=(
                "No hint is available "
                "for this puzzle."
            )
        )

    return {
        "level": data.level,
        "hint": hints[
            data.level - 1
        ]
    }


@app.post("/solution")
def reveal_solution(
    data: RevealRequest
):
    solution = find_solution(
        data.numbers,
        data.target
    )

    return {
        "solution": solution
    }