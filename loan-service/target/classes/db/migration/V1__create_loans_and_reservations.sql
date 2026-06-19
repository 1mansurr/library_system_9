CREATE TABLE loans (
    loan_id     UUID PRIMARY KEY,
    user_id     UUID NOT NULL,
    copy_id     UUID NOT NULL,
    borrow_date TIMESTAMPTZ NOT NULL,
    due_date    TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ,
    status      TEXT NOT NULL CHECK (status IN ('BORROWED','RETURNED')),
    fine_amount NUMERIC(10,2)
);

CREATE INDEX idx_loans_user_status ON loans (user_id, status);
CREATE INDEX idx_loans_status_due  ON loans (status, due_date);

CREATE TABLE reservations (
    reservation_id UUID PRIMARY KEY,
    user_id        UUID NOT NULL,
    book_id        UUID NOT NULL,
    request_date   TIMESTAMPTZ NOT NULL DEFAULT now(),
    status         TEXT NOT NULL DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING','FULFILLED','CANCELLED'))
);
