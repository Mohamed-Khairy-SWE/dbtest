
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'student'
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1 CHECK (available_copies >= 0)
);

CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    book_id INT REFERENCES books(id),
    borrow_date DATE DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT CURRENT_DATE + INTERVAL '14 days',
    return_date DATE,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE fines (
    id SERIAL PRIMARY KEY,
    loan_id INT REFERENCES loans(id),
    amount DECIMAL(10, 2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE
);


CREATE OR REPLACE FUNCTION calculate_overdue_fine(p_loan_id INT) 
RETURNS DECIMAL AS $$
DECLARE
    v_due_date DATE;
    v_return_date DATE;
    v_days_overdue INT;
    v_fine DECIMAL := 0.0;
BEGIN
    SELECT due_date, COALESCE(return_date, CURRENT_DATE) 
    INTO v_due_date, v_return_date
    FROM loans WHERE id = p_loan_id;

    IF v_return_date > v_due_date THEN
        v_days_overdue := v_return_date - v_due_date;
        v_fine := v_days_overdue * 1.00; 
    END IF;

    RETURN v_fine;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_stock_func() RETURNS TRIGGER AS $$
BEGIN
    
    IF (TG_OP = 'INSERT') THEN
        UPDATE books SET available_copies = available_copies - 1 
        WHERE id = NEW.book_id;
    
    ELSIF (TG_OP = 'UPDATE' AND OLD.return_date IS NULL AND NEW.return_date IS NOT NULL) THEN
        UPDATE books SET available_copies = available_copies + 1 
        WHERE id = NEW.book_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock
AFTER INSERT OR UPDATE ON loans
FOR EACH ROW EXECUTE FUNCTION update_stock_func();

CREATE OR REPLACE PROCEDURE borrow_book_procedure(
    p_user_id INT, 
    p_book_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock INT;
BEGIN
    -- Check stock
    SELECT available_copies INTO v_stock FROM books WHERE id = p_book_id;
    
    IF v_stock > 0 THEN
        INSERT INTO loans (user_id, book_id) VALUES (p_user_id, p_book_id);
    ELSE
        RAISE EXCEPTION 'Book out of stock';
    END IF;
END;
$$;


CREATE VIEW dashboard_loans_view AS
SELECT 
    l.id AS loan_id,
    u.name AS student_name,
    b.title AS book_title,
    l.due_date,
    l.status,
    calculate_overdue_fine(l.id) as potential_fine
FROM loans l
JOIN users u ON l.user_id = u.id
JOIN books b ON l.book_id = b.id
WHERE l.return_date IS NULL;

-- 7. SEED DATA (To verify it works)
INSERT INTO users (name, email) VALUES ('John Doe', 'john@college.edu');
INSERT INTO books (title, author, total_copies, available_copies) 
VALUES ('Database Internals', 'Alex Petrov', 5, 5), ('The Art of SQL', 'Stephane Faroult', 3, 3);