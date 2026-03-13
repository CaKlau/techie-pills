import numpy as np

def heron(x: float, initial_guess=42, get_history=False, iterations: int = 8):

    guess = initial_guess
    history = list()

    for _ in range(iterations):

        # print(f"👉 {guess}")
        history.append(guess)
        new_guess = 0.5 * (guess + x / guess)

        delta = abs(new_guess - guess)
        if delta < 1e-7:
            pass # break
        guess = new_guess

    if get_history:
        return history
    else:
        return guess

if __name__ == "__main__":
    n = 25
    res = heron(x=n, initial_guess=n, get_history=True, iterations=10)
    print(res)