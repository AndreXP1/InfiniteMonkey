import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from Back.func import find_word_indices, generate_game_grid


app = FastAPI()
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "Front"

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

games_db = {}

class GuessPayload(BaseModel):
    game_id:str
    word: str

@app.get("/")
async def frontend():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/health")
async def root():
    return {"message": "ok"}


@app.get("/gen")
def generate(ammount: int = 5000):
    return StreamingResponse(
        generate_random_chars(size=ammount),
        media_type="text/plain"
    )


@app.get("/words")
def words():
    return {"words": get_random_words()}

@app.get("/api/game/new")
def create_game(amount: int = 100):
    if amount < 1 or amount > 5000:
        raise HTTPException(
            satus_code=400, detail="Amount must be between 1 and 5000"
        )

    grid_string, placed_words = generate_game_grid(amount)

    game_id = str(uuid.uuid4())

    games_db[game_id] = {
        "characters": grid_string,
        "placed_words": set(placed_words),
    }

    return {"game_id": game_id, "characters": grid_string}

@app.post("/api/game/guess")
def check_guess(payload: GuessPayload):
    game = games_db.get(payload.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Session not found")

    word = payload.word.strip().upper()
    if not word:
        raise HTTPException(status_code=400, detail="Invalid word")

    indices = find_word_indices(word, game["characters"])
    is_official = word in game["placed_words"]

    if indices:
        return {
            "found": True,
            "indices": indices,
            "is_official": is_official,
            "message": (
                f'"{word}" was found!'
                if is_official
                else f'"{word}" found (similar in grid)!'
            ),
        }

    return {
        "found": False,
        "indices": [],
        "message": f'"{word}" was not found in grid',
    }