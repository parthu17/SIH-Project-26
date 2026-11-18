import argparse
import os
from pathlib import Path

from sqlalchemy import MetaData, create_engine, func, select
from sqlalchemy.engine import make_url


def postgres_url_from_environment():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("Set DATABASE_URL to the destination PostgreSQL connection URL")

    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    if make_url(database_url).get_backend_name() != "postgresql":
        raise ValueError("DATABASE_URL must point to a PostgreSQL database")
    return database_url


def main():
    parser = argparse.ArgumentParser(description="Copy tables from the local SQLite database to PostgreSQL.")
    parser.add_argument(
        "--sqlite-path",
        type=Path,
        default=Path(__file__).with_name("inspectra.db"),
        help="SQLite source file (defaults to backend/inspectra.db)",
    )
    args = parser.parse_args()

    if not args.sqlite_path.is_file():
        parser.error(f"SQLite source database does not exist: {args.sqlite_path}")

    try:
        destination_url = postgres_url_from_environment()
    except ValueError as exc:
        parser.error(str(exc))

    source = create_engine(f"sqlite:///{args.sqlite_path.resolve()}")
    destination = create_engine(destination_url, pool_pre_ping=True)

    try:
        source_metadata = MetaData()
        source_metadata.reflect(bind=source)
        if not source_metadata.tables:
            parser.error(f"No tables found in SQLite source: {args.sqlite_path}")

        source_metadata.create_all(destination)

        with source.connect() as source_connection, destination.begin() as destination_connection:
            for table in source_metadata.sorted_tables:
                existing_rows = destination_connection.scalar(
                    select(func.count()).select_from(table)
                )
                if existing_rows:
                    raise ValueError(
                        f"Destination table '{table.name}' is not empty; refusing to duplicate data"
                    )

            for table in source_metadata.sorted_tables:
                result = source_connection.execute(select(table))
                copied = 0
                while rows := result.mappings().fetchmany(500):
                    destination_connection.execute(table.insert(), [dict(row) for row in rows])
                    copied += len(rows)
                print(f"Copied {copied} rows into {table.name}")
    finally:
        source.dispose()
        destination.dispose()

    print("SQLite to PostgreSQL migration completed.")


if __name__ == "__main__":
    main()