# System UML Models - Automated Library System

This document provides the UML models and diagrams resolving the Phase 1 documentation gaps, adhering to clean architecture principles and focusing on our microservice implementation.

## 1. Entity-Relationship (E-R) Diagram

This diagram reflects the normalized 3NF schema across the three independent microservice databases (`users_db`, `books_db`, `loans_db`). Logical constraints across microservices are shown as logical foreign keys.

```mermaid
erDiagram
    %% users_db
    users {
        UUID user_id PK
        TEXT email UK "NOT NULL"
        TEXT password_hash "NOT NULL"
        TEXT role "CHECK (role IN ('STUDENT','STAFF','LIBRARIAN','EXTERNAL'))"
        TEXT status "CHECK (status IN ('ACTIVE','SUSPENDED'))"
        TIMESTAMPTZ created_at
    }
    profiles {
        UUID profile_id PK
        UUID user_id FK "REFERENCES users.user_id"
        TEXT full_name "NOT NULL"
        TEXT member_type "CHECK (member_type IN ('STUDENT','STAFF','EXTERNAL'))"
        TEXT matric_no UK "NULLABLE"
        TEXT staff_id UK "NULLABLE"
        TEXT card_number UK "NOT NULL"
        TEXT phone
    }
    users ||--o| profiles : "has"

    %% books_db
    books {
        UUID book_id PK
        TEXT isbn UK "NOT NULL"
        TEXT title "NOT NULL"
        TEXT author "NOT NULL"
        TEXT category
    }
    book_copies {
        UUID copy_id PK
        UUID book_id FK "REFERENCES books.book_id"
        TEXT barcode UK "NOT NULL"
        TEXT status "CHECK (status IN ('AVAILABLE','LOANED','LOST'))"
        TEXT location
    }
    books ||--o{ book_copies : "has copies"

    %% loans_db
    loans {
        UUID loan_id PK
        UUID user_id FK "Logical ref to users_db.users"
        UUID copy_id FK "Logical ref to books_db.book_copies"
        TIMESTAMPTZ borrow_date "NOT NULL"
        TIMESTAMPTZ due_date "NOT NULL"
        TIMESTAMPTZ return_date "NULLABLE"
        TEXT status "CHECK (status IN ('BORROWED','RETURNED'))"
        NUMERIC fine_amount "NULLABLE"
    }
    
    %% Logical Relationships spanning across services
    users ||--o{ loans : "places (logical)"
    book_copies ||--o{ loans : "is part of (logical)"
```

## 2. Use Case Diagram

Highlights primary interactions for Members and Librarians.

```mermaid
flowchart LR
    %% Actors
    Member([Member])
    Librarian([Librarian])

    %% System Boundary
    subgraph Library System
        UC1(Borrow a book copy)
        UC2(Return a book copy)
        UC3(View active loans)
        UC4(Suspend a user)
        UC5(Add a book to catalog)
        UC6(Add a physical copy)
        UC7(View overdue loans)
    end

    %% Member Interactions
    Member --> UC1
    Member --> UC2
    Member --> UC3

    %% Librarian Interactions
    Librarian --> UC4
    Librarian --> UC5
    Librarian --> UC6
    Librarian --> UC7
    Librarian --> UC3
```

## 3. Activity Diagram

Details the workflow for returning a book and processing an overdue fine.

```mermaid
stateDiagram-v2
    [*] --> StartReturn: Member requests return
    StartReturn --> CheckLoan: Fetch loan details
    
    CheckLoan --> CalculateDays: Check due_date vs now()
    
    state CalculateDays {
        [*] --> DaysLate
        DaysLate --> Overdue : days_late > 0
        DaysLate --> OnTime : days_late <= 0
        
        Overdue --> ComputeFine: fine = days_late * DAILY_RATE
        OnTime --> ComputeFine: fine = 0
    }
    
    CalculateDays --> UpdateLoan
    UpdateLoan --> UpdateCopy: Update loan status = 'RETURNED', set fine_amount
    UpdateCopy --> Finish: PATCH copy status = 'AVAILABLE'
    
    Finish --> [*]: Return Success Response
```

## 4. Sequence Diagram

Illustrates the inter-service communication when a Member initiates a book loan.

```mermaid
sequenceDiagram
    actor Member
    participant LS as loan-service (8083)
    participant US as user-service (8081)
    participant BS as book-service (8082)
    participant DB as loans_db

    Member->>LS: POST /api/loans {copy_id} (Bearer JWT)
    
    %% Validate User
    LS->>US: GET /api/users/{user_id} (Forward JWT)
    US-->>LS: 200 OK {status: "ACTIVE"}
    
    %% Validate Copy
    LS->>BS: GET /api/copies/{copy_id} (Forward JWT)
    BS-->>LS: 200 OK {status: "AVAILABLE"}
    
    %% Mutate Copy Status
    LS->>BS: PATCH /api/copies/{copy_id}/status {status: "LOANED"} (X-Service-Token)
    BS-->>LS: 200 OK
    
    %% Persist Loan
    LS->>DB: Insert loan row (BORROWED, borrow_date, due_date)
    DB-->>LS: Success
    
    LS-->>Member: 201 Created (Loan details)
```

## 5. Class Diagram (Backend Architecture)

Models the static relationship between Entities, DTOs, and Services within a typical Spring Boot microservice (using `loan-service` as an example) adhering to clean architecture.

```mermaid
classDiagram
    class LoanController {
        -LoanService loanService
        +borrowBook(LoanRequest request, UUID userId) LoanResponse
        +returnBook(UUID loanId) LoanResponse
    }

    class LoanService {
        -LoanRepository loanRepository
        -RestClient userServiceClient
        -RestClient bookServiceClient
        +borrow(UUID userId, UUID copyId) Loan
        +returnCopy(UUID loanId) Loan
    }

    class LoanRepository {
        <<interface>>
        +findById(UUID loanId) Optional~Loan~
        +findByUserIdAndStatus(UUID userId, String status) List~Loan~
        +save(Loan loan) Loan
    }

    class Loan {
        <<Entity>>
        +UUID loanId
        +UUID userId
        +UUID copyId
        +ZonedDateTime borrowDate
        +ZonedDateTime dueDate
        +ZonedDateTime returnDate
        +String status
        +BigDecimal fineAmount
    }

    class LoanRequest {
        <<DTO>>
        +UUID copyId
    }

    class LoanResponse {
        <<DTO>>
        +UUID loanId
        +String status
        +BigDecimal fineAmount
    }

    %% Relationships
    LoanController --> LoanService : depends on
    LoanController --> LoanRequest : receives
    LoanController --> LoanResponse : returns

    LoanService --> LoanRepository : depends on
    LoanService --> Loan : creates / updates

    LoanRepository --> Loan : persists
```
