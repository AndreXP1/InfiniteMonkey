import os
from contextlib import contextmanager

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

load_dotenv()

def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")
    return database_url


@contextmanager
def database_connection():
    with psycopg.connect(
        get_database_url(),
        row_factory=dict_row,
    )as connection:
        yield connection