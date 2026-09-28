from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from Back.func import generate_random_chars, get_random_words


app = FastAPI()
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "Front"

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


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
