INSERT IGNORE INTO stock (ticker, company_name) VALUES
('AAPL', 'Apple Inc'),
('TSLA', 'Tesla Inc'),
('AMZN', 'Amazon.com Inc'),
('GOOGL', 'Alphabet Inc'),
('MSFT', 'Microsoft Corporation'),
('NFLX', 'Netflix Inc');

INSERT IGNORE INTO asset (ticker, quantity, buy_price, buy_date) VALUES
('AAPL', 10, 150.00, '2024-06-01'),
('TSLA', 5, 220.00, '2024-07-10'),
('AMZN', 3, 3100.00, '2024-05-15'),
('GOOGL', 8, 135.00, '2024-08-01'),
('MSFT', 6, 280.00, '2024-06-20'),
('NFLX', 4, 420.00, '2024-09-05');

INSERT IGNORE INTO stock_price (ticker, price_date, close_price) VALUES
-- Apple
('AAPL', '2026-02-01', 170.00),
('AAPL', '2026-02-02', 172.50),
('AAPL', '2026-02-03', 171.20),

-- Tesla
('TSLA', '2026-02-01', 250.00),
('TSLA', '2026-02-02', 255.40),
('TSLA', '2026-02-03', 252.10),

-- Amazon
('AMZN', '2026-02-01', 3300.00),
('AMZN', '2026-02-02', 3325.00),
('AMZN', '2026-02-03', 3310.00),

-- Google
('GOOGL', '2026-02-01', 142.00),
('GOOGL', '2026-02-02', 144.10),
('GOOGL', '2026-02-03', 143.50),

-- Microsoft
('MSFT', '2026-02-01', 310.00),
('MSFT', '2026-02-02', 312.50),
('MSFT', '2026-02-03', 311.00),

-- Netflix
('NFLX', '2026-02-01', 450.00),
('NFLX', '2026-02-02', 455.00),
('NFLX', '2026-02-03', 452.00);


INSERT IGNORE INTO price_target (ticker, target_price, action, triggered) VALUES
('AAPL', 180.00, 'SELL', false),
('TSLA', 270.00, 'SELL', false),
('AMZN', 3500.00, 'SELL', false),
('GOOGL', 150.00, 'BUY', false),
('MSFT', 320.00, 'SELL', false),
('NFLX', 450.00, 'BUY', false);



