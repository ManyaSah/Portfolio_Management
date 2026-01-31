INSERT INTO stock (ticker, company_name) VALUES
                                             ('AAPL', 'Apple Inc'),
                                             ('TSLA', 'Tesla Inc'),
                                             ('AMZN', 'Amazon.com');

INSERT INTO stock_price (ticker, price_date, close_price) VALUES
                                                              ('AAPL', '2025-01-01', 170.00),
                                                              ('AAPL', '2025-01-02', 172.50),
                                                              ('AAPL', '2025-01-03', 171.00),

                                                              ('TSLA', '2025-01-01', 250.00),
                                                              ('TSLA', '2025-01-02', 255.00),
                                                              ('TSLA', '2025-01-03', 252.00);

INSERT INTO asset (ticker, quantity, buy_price, buy_date) VALUES
    ('AAPL', 10, 150.00, '2024-06-01');

INSERT INTO price_target (ticker, target_price, action, triggered) VALUES
    ('AAPL', 180.00, 'SELL', false);
