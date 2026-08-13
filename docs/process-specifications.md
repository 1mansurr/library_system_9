# Process Specifications

## Overdue Fines Calculation

| Days Overdue | Member Type | Base Fine Amount (GHS) | Additional Daily Rate (GHS) | Max Fine (GHS) |
|--------------|-------------|------------------------|-----------------------------|----------------|
| 1 - 7        | STUDENT     | 0.50                   | 0.50                        | 10.00          |
| 1 - 7        | STAFF       | 0.00                   | 0.00                        | 0.00           |
| 1 - 7        | EXTERNAL    | 1.00                   | 1.00                        | 20.00          |
| 8 - 30       | STUDENT     | 3.50                   | 1.00                        | 25.00          |
| 8 - 30       | STAFF       | 2.00                   | 0.50                        | 15.00          |
| 8 - 30       | EXTERNAL    | 7.00                   | 2.00                        | 50.00          |
| > 30         | STUDENT     | 25.00                  | -                           | 25.00 (Fixed)  |
| > 30         | STAFF       | 15.00                  | -                           | 15.00 (Fixed)  |
| > 30         | EXTERNAL    | 50.00                  | -                           | 50.00 (Fixed)  |

*Note: The specific fine amounts above are illustrative and can be adjusted as per exact library policies.*

## Loan Limits and Suspension Evaluation (Structured English)

```text
EVALUATE USER LOAN STATUS:
    READ user profile
    READ current active loans for user
    READ user unpaid fines balance

    IF member type is 'STUDENT' THEN
        SET MAX_LOANS to 5
    ELSE IF member type is 'STAFF' THEN
        SET MAX_LOANS to 10
    ELSE IF member type is 'EXTERNAL' THEN
        SET MAX_LOANS to 3
    END IF

    IF total count of active loans >= MAX_LOANS THEN
        DENY further borrowing
        NOTIFY user "Maximum loan limit reached."
    END IF

    CALCULATE overdue_count = number of active loans past their due date
    IF overdue_count > 3 THEN
        SUSPEND user account
        NOTIFY user "Account suspended due to excessive overdue books."
    END IF

    IF user unpaid fines balance > 50.00 THEN
        SUSPEND user account
        NOTIFY user "Account suspended due to excessive unpaid fines."
    END IF
```
