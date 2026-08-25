from typing import Generator
from sqlmodel import Session, SQLModel, create_engine
from src.config import settings

# Engine configuration
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_db_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
