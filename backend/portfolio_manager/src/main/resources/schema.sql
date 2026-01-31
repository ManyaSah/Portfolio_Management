CREATE TABLE IF NOT EXISTS stock (
                                     ticker VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100)
    );

CREATE TABLE IF NOT EXISTS asset (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     ticker VARCHAR(10),
    quantity INT,
    buy_price DECIMAL(10,2),
    buy_date DATE,
    FOREIGN KEY (ticker) REFERENCES stock(ticker)
    );

CREATE TABLE IF NOT EXISTS stock_price (
                                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                           ticker VARCHAR(10),
    price_date DATE,
    close_price DECIMAL(10,2),
    FOREIGN KEY (ticker) REFERENCES stock(ticker)
    );

CREATE TABLE IF NOT EXISTS price_target (
                                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                            ticker VARCHAR(10),
    target_price DECIMAL(10,2),
    action VARCHAR(10),
    triggered BOOLEAN
    );
