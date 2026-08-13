import sqlite3

def dump_schema():
    conn = sqlite3.connect('dev.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table'")
    for row in cursor.fetchall():
        print(f"--- Table: {row[0]} ---")
        print(row[1])
        print()
    conn.close()

if __name__ == "__main__":
    dump_schema()
