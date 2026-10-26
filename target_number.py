import re
import ast
import random
import hashlib
from fractions import Fraction
from typing import TypedDict


class HintStep(TypedDict):
    expression: str
    result: Fraction
    operation_name: str
    numbers_used: int


def evaluate_expression(expression: str) -> Fraction:
    tree = ast.parse(expression, mode="eval")

    def evaluate(node: ast.AST) -> Fraction:
        if isinstance(node, ast.Constant):
            value = node.value

            if isinstance(value, int):
                return Fraction(value)

            raise ValueError("Invalid constant")

        if isinstance(node, ast.BinOp):
            left = evaluate(node.left)
            right = evaluate(node.right)

            if isinstance(node.op, ast.Add):
                return left + right

            if isinstance(node.op, ast.Sub):
                return left - right

            if isinstance(node.op, ast.Mult):
                return left * right

            if isinstance(node.op, ast.Div):
                if right == 0:
                    raise ValueError("Division by zero")

                return left / right

        raise ValueError("Invalid expression")

    return evaluate(tree.body)


def check_solution(
    numbers: list[int],
    target: int,
    expression: str
) -> tuple[bool, str, Fraction | None]:
    used_numbers = [
        int(num)
        for num in re.findall(r"\d+", expression)
    ]

    if sorted(used_numbers) != sorted(numbers):
        return False, "You must use every number exactly once.", None

    try:
        result = evaluate_expression(expression)

        if result == target:
            return True, "Correct!", result

        return False, "Not quite!", result

    except (ValueError, SyntaxError):
        return False, "Invalid expression.", None


def search_solution(
    items: list[tuple[Fraction, str]],
    target: Fraction
) -> str | None:
    if len(items) == 1:
        value, expression = items[0]

        if value == target:
            return expression

        return None

    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            value1, expression1 = items[i]
            value2, expression2 = items[j]

            remaining = [
                items[k]
                for k in range(len(items))
                if k != i and k != j
            ]

            possibilities: list[tuple[Fraction, str]] = [
                (
                    value1 + value2,
                    f"({expression1} + {expression2})"
                ),
                (
                    value1 - value2,
                    f"({expression1} - {expression2})"
                ),
                (
                    value2 - value1,
                    f"({expression2} - {expression1})"
                ),
                (
                    value1 * value2,
                    f"({expression1} * {expression2})"
                )
            ]

            if value2 != 0:
                possibilities.append(
                    (
                        value1 / value2,
                        f"({expression1} / {expression2})"
                    )
                )

            if value1 != 0:
                possibilities.append(
                    (
                        value2 / value1,
                        f"({expression2} / {expression1})"
                    )
                )

            for new_value, new_expression in possibilities:
                new_items = remaining + [
                    (new_value, new_expression)
                ]

                solution = search_solution(
                    new_items,
                    target
                )

                if solution is not None:
                    return solution

    return None


def _search_solution_for_level(
    items: list[tuple[Fraction, str]],
    target: Fraction,
    level: str
) -> str | None:
    if len(items) == 1:
        value, expression = items[0]

        if value == target:
            return expression

        return None

    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            value1, expression1 = items[i]
            value2, expression2 = items[j]

            remaining = [
                items[k]
                for k in range(len(items))
                if k != i and k != j
            ]

            possibilities: list[
                tuple[Fraction, str]
            ] = [
                (
                    value1 + value2,
                    f"({expression1} + {expression2})"
                ),
                (
                    value1 * value2,
                    f"({expression1} * {expression2})"
                )
            ]

            if level != "easy":
                possibilities.extend([
                    (
                        value1 - value2,
                        f"({expression1} - {expression2})"
                    ),
                    (
                        value2 - value1,
                        f"({expression2} - {expression1})"
                    )
                ])

                if value2 != 0:
                    possibilities.append(
                        (
                            value1 / value2,
                            f"({expression1} / {expression2})"
                        )
                    )

                if value1 != 0:
                    possibilities.append(
                        (
                            value2 / value1,
                            f"({expression2} / {expression1})"
                        )
                    )

            seen_values: set[Fraction] = set()

            for new_value, new_expression in possibilities:
                if level != "hard":
                    if (
                        new_value.denominator != 1 or
                        new_value < 0
                    ):
                        continue

                if new_value in seen_values:
                    continue

                seen_values.add(new_value)

                new_items = remaining + [
                    (
                        new_value,
                        new_expression
                    )
                ]

                solution = _search_solution_for_level(
                    new_items,
                    target,
                    level
                )

                if solution is not None:
                    return solution

    return None


def find_solution_with_difficulty(
    numbers: list[int],
    target: int
) -> tuple[str | None, str | None]:
    items = [
        (
            Fraction(number),
            str(number)
        )
        for number in numbers
    ]

    target_value = Fraction(target)

    easy_solution = _search_solution_for_level(
        items,
        target_value,
        "easy"
    )

    if easy_solution is not None:
        return easy_solution, "easy"

    medium_solution = _search_solution_for_level(
        items,
        target_value,
        "medium"
    )

    if medium_solution is not None:
        return medium_solution, "medium"

    hard_solution = search_solution(
        items,
        target_value
    )

    if hard_solution is not None:
        return hard_solution, "hard"

    return None, None


def find_solution(
    numbers: list[int],
    target: int
) -> str | None:
    solution, _ = find_solution_with_difficulty(
        numbers,
        target
    )

    return solution


def _operator_name(operator: ast.AST) -> str:
    if isinstance(operator, ast.Add):
        return "Addition"

    if isinstance(operator, ast.Sub):
        return "Subtraction"

    if isinstance(operator, ast.Mult):
        return "Multiplication"

    if isinstance(operator, ast.Div):
        return "Division"

    raise ValueError("Unsupported operator")


def _apply_operator(
    left: Fraction | int,
    right: Fraction | int,
    operator: ast.AST
) -> Fraction:
    left_fraction = Fraction(left)
    right_fraction = Fraction(right)

    if isinstance(operator, ast.Add):
        return left_fraction + right_fraction

    if isinstance(operator, ast.Sub):
        return left_fraction - right_fraction

    if isinstance(operator, ast.Mult):
        return left_fraction * right_fraction

    if isinstance(operator, ast.Div):
        if right_fraction == 0:
            raise ValueError("Division by zero")

        return left_fraction / right_fraction

    raise ValueError("Unsupported operator")


def _format_fraction(value: Fraction) -> str:
    if value.denominator == 1:
        return str(value.numerator)

    return f"{value.numerator}/{value.denominator}"


def _evaluate_hint_node(node: ast.AST) -> Fraction:
    if isinstance(node, ast.Constant):
        value = node.value

        if isinstance(value, int):
            return Fraction(value)

        raise ValueError("Invalid constant")

    if isinstance(node, ast.BinOp):
        left = _evaluate_hint_node(node.left)
        right = _evaluate_hint_node(node.right)

        return _apply_operator(
            left,
            right,
            node.op
        )

    raise ValueError("Invalid hint expression")


def _count_hint_numbers(node: ast.AST) -> int:
    if isinstance(node, ast.Constant):
        value = node.value

        if isinstance(value, int):
            return 1

        return 0

    if isinstance(node, ast.BinOp):
        return (
            _count_hint_numbers(node.left) +
            _count_hint_numbers(node.right)
        )

    return 0


def _format_hint_expression(node: ast.AST) -> str:
    expression = ast.unparse(node)

    return (
        expression
        .replace("*", "×")
        .replace("/", "÷")
        .replace(" - ", " − ")
    )


def _find_partial_steps(
    node: ast.AST,
    is_root: bool = True
) -> list[HintStep]:
    if not isinstance(node, ast.BinOp):
        return []

    steps: list[HintStep] = []

    # Do not include the root expression because that would
    # reveal the complete solution.
    if not is_root:
        result = _evaluate_hint_node(node)
        operation_name = _operator_name(node.op)

        steps.append({
            "expression": _format_hint_expression(node),
            "result": result,
            "operation_name": operation_name,
            "numbers_used": _count_hint_numbers(node)
        })

    steps.extend(
        _find_partial_steps(
            node.left,
            False
        )
    )

    steps.extend(
        _find_partial_steps(
            node.right,
            False
        )
    )

    return steps


def generate_hints(
    numbers: list[int],
    target: int
) -> list[str]:
    solution = find_solution(
        numbers,
        target
    )

    if solution is None:
        return []

    try:
        tree = ast.parse(
            solution,
            mode="eval"
        )

        partial_steps = _find_partial_steps(
            tree.body
        )

    except (SyntaxError, ValueError):
        return []

    if not partial_steps:
        return []

    given_values = {
        Fraction(number)
        for number in numbers
    }

    target_value = Fraction(target)

    # Prefer a partial result that:
    # 1. is not already the target,
    # 2. creates a genuinely new value,
    # 3. is a clean integer,
    # 4. is positive,
    # 5. uses as few numbers as possible.
    partial_steps.sort(
        key=lambda candidate: (
            candidate["result"] == target_value,
            candidate["result"] in given_values,
            candidate["result"].denominator != 1,
            candidate["result"] <= 0,
            candidate["numbers_used"],
            candidate["operation_name"] == "Addition"
        )
    )

    chosen_step = partial_steps[0]

    result_text = _format_fraction(
        chosen_step["result"]
    )

    if chosen_step["result"] in given_values:
        second_hint = (
            f"A useful intermediate step produces "
            f"{result_text}, even though that value "
            "is already available."
        )

    else:
        second_hint = (
            f"A useful intermediate result is "
            f"{result_text}."
        )

    return [
        f"{chosen_step['operation_name']} may be useful.",

        second_hint,

        (
            "One useful partial calculation is: "
            f"{chosen_step['expression']} = {result_text}."
        )
    ]


def _generate_puzzle_with_rng(
    difficulty: str,
    rng: random.Random
) -> tuple[list[int], int, str, str]:
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
        raise ValueError(
            "Invalid difficulty."
        )

    while True:
        numbers = rng.sample(
            range(1, 10),
            4
        )

        target = rng.randint(
            15,
            100
        )

        (
            solution,
            actual_difficulty
        ) = find_solution_with_difficulty(
            numbers,
            target
        )

        if (
            solution is None or
            actual_difficulty is None
        ):
            continue

        if (
            requested_difficulty != "mixed" and
            actual_difficulty != requested_difficulty
        ):
            continue

        return (
            numbers,
            target,
            solution,
            actual_difficulty
        )


def generate_puzzle(
    difficulty: str = "mixed"
) -> tuple[list[int], int, str, str]:
    rng = random.Random()

    return _generate_puzzle_with_rng(
        difficulty,
        rng
    )


def generate_daily_puzzle(
    date_key: str
) -> tuple[list[int], int, str, str]:
    seed_source = (
        f"PuzzleLab-TargetNumber-{date_key}"
    )

    seed_bytes = hashlib.sha256(
        seed_source.encode("utf-8")
    ).digest()

    seed = int.from_bytes(
        seed_bytes,
        byteorder="big"
    )

    rng = random.Random(
        seed
    )

    return _generate_puzzle_with_rng(
        "mixed",
        rng
    )


def _run_demo() -> None:
    (
        demo_numbers,
        demo_target,
        computer_solution,
        demo_difficulty
    ) = generate_puzzle()

    print(
        "Numbers:",
        demo_numbers
    )

    print(
        "Target:",
        demo_target
    )

    print(
        "Computer solution:",
        computer_solution
    )

    print(
        "Difficulty:",
        demo_difficulty
    )

    valid, message, calculated_result = check_solution(
        demo_numbers,
        demo_target,
        computer_solution
    )

    print(
        "Verified:",
        valid
    )

    print(
        "Message:",
        message
    )

    print(
        "Result:",
        calculated_result
    )


if __name__ == "__main__":
    _run_demo()