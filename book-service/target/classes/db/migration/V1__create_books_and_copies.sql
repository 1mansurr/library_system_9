CREATE TABLE books (
    book_id  UUID PRIMARY KEY,
    isbn     TEXT UNIQUE NOT NULL,
    title    TEXT NOT NULL,
    author   TEXT NOT NULL,
    category TEXT
);

CREATE TABLE book_copies (
    copy_id  UUID PRIMARY KEY,
    book_id  UUID NOT NULL REFERENCES books(book_id),
    barcode  TEXT UNIQUE NOT NULL,
    status   TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','LOANED','LOST')),
    location TEXT
);
