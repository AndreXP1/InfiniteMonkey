import string
import math
import string
import numpy as np
import requests

CHAR_SET = np.frombuffer(string.ascii_uppercase.encode('ascii'), dtype = np.uint8)
rng = np.random.default_rng()

DIRECTIONS = [
    (0, 1),(0, -1),(1, 0),(-1, 0),
    (1, 1),(1, -1),(-1, 1),(-1, -1)
]

def generate_random_chars(size: int, size_block: int = 65536):
    generate = 0
    while generate < size:
        bytes_to_gen = min(size_block, size - generate)
        index = np.random.randint(0, len(CHAR_SET), size=bytes_to_gen)
        yield CHAR_SET[index].tobytes()
        generate += bytes_to_gen


def get_random_words():
    single_int = rng.integers(3, 10)
    length = rng.integers(3, 10)
    url = f"https://random-word-api.herokuapp.com/word?number={single_int}&length={length}"

    res = requests.get(url, timeout=10)
    res.raise_for_status()
    return [word.upper() for word in res.json()]


def get_grid_shape(length: int) -> tuple[int, int]:
    columns = max(4, min(16, math.ceil(math.sqrt(length))))
    rows = math.ceil(length/columns)
    return columns, rows

def generate_game_grid(amount: int) -> tuple[str, list[str]]:
    cols, rows = get_grid_shape(amount)
    total = rows*cols

    random_i = rng.integers(0, len(CHAR_SET), size=total)
    grid_1d = CHAR_SET[random_i].copy()
    grid = grid_1d.reshape((rows, cols))

    occupied = np.zeros((rows, cols), dtype=bool)

    words = get_random_words()
    placed_words = []

    for word in words:
        word_bytes = np.frombuffer(word.encode("ascii"), dtype=np.uint8)
        w_len = len(word_bytes)
        candidates = []

        for r in range(rows):
            for c in range(cols):
                for dr, dc in DIRECTIONS:
                    r_idx = r + np.arange(w_len) * dr
                    c_idx = c + np.arange(w_len) * dc

                    if np.all((0 <= r_idx) & (r_idx <rows) & (0<=c_idx) & (c_idx <cols)):
                        target_cells = grid[r_idx, c_idx]
                        is_occupied = occupied[r_idx, c_idx]

                        if not np.any(is_occupied & (target_cells != word_bytes)):
                            candidates.append((r_idx, c_idx))
        if candidates:
            chosen_idx = rng.integers(0, len(candidates))
            r_idx, c_idx = candidates[chosen_idx]

            grid[r_idx, c_idx] = word_bytes
            occupied[r_idx, c_idx] = True
            placed_words.append(word)

    grid_string = grid.tobytes().decode("ascii")
    return grid_string, placed_words



def find_word_indices(word:str, grid_string: str) -> list[int]:
    word_bytes = np.frombuffer(word.strip().upper().encode("ascii"), dtype=np.uint8)
    w_len = len(word_bytes)

    cols, rows = get_grid_shape(len(grid_string))
    grid_bytes = np.frombuffer(grid_string.encode("ascii"), dtype=np.uint8)
    grid = grid_bytes.reshape((rows, cols))

    matches = set()

    for r in range(rows):
        for c in range(cols):
            for dr, dc in DIRECTIONS:
                r_idx = r + np.arange(w_len) * dr
                c_idx = c + np.arange(w_len) * dc

                if np.all((0 <= r_idx) & (r_idx < rows) & (0 <= c_idx) & (c_idx < cols)):
                    if np.array_equal(grid[r_idx, c_idx], word_bytes):
                        flat_indices = r_idx * cols + c_idx
                        matches.update(flat_indices.tolist())

    return sorted(list(matches))