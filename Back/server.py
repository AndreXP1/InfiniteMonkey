from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from func import generate_random_chars


app = FastAPI()

@app.get("/health")
async def root():
    return {"message":"ok"}


@app.get("/gen")
def generate(ammount: int = 5000):
    return StreamingResponse(
        generate_random_chars(size=ammount),
        media_type="text/plain"
    )

