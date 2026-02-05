INSERT IGNORE INTO stock (ticker, company_name) VALUES
('AAPL', 'Apple Inc'),
('TSLA', 'Tesla Inc'),
('AMZN', 'Amazon.com Inc'),
('GOOGL', 'Alphabet Inc'),
('MSFT', 'Microsoft Corporation'),
('NFLX', 'Netflix Inc'),
('META', 'Meta Platforms Inc'),
('NVDA', 'NVIDIA Corporation'),
('AMD', 'Advanced Micro Devices Inc'),
('INTC', 'Intel Corporation');

INSERT IGNORE INTO asset (ticker, quantity, buy_price, buy_date) VALUES
('AAPL', 10, 150.00, '2024-06-01'),
('TSLA', 5, 220.00, '2024-07-10'),
('AMZN', 3, 180.00, '2024-05-15'),
('GOOGL', 8, 135.00, '2024-08-01'),
('MSFT', 6, 280.00, '2024-06-20'),
('NFLX', 4, 420.00, '2024-09-05'),
('META', 7, 310.00, '2024-03-15'),
('NVDA', 12, 420.00, '2024-01-15'),
('AMD', 20, 95.00, '2024-02-01'),
('INTC', 15, 28.00, '2024-01-20');

INSERT IGNORE INTO stock_price (ticker, price_date, close_price) VALUES
-- Apple
('AAPL', '2025-01-01', 170.00),
('AAPL', '2025-01-02', 172.50),
('AAPL', '2025-01-03', 171.20),

-- Tesla
('TSLA', '2025-01-01', 250.00),
('TSLA', '2025-01-02', 255.40),
('TSLA', '2025-01-03', 252.10),

-- Amazon
('AMZN', '2025-01-01', 195.00),
('AMZN', '2025-01-02', 198.50),

-- Google
('GOOGL', '2025-01-01', 142.00),
('GOOGL', '2025-01-02', 144.10),

-- Microsoft
('MSFT', '2025-01-01', 310.00),
('MSFT', '2025-01-02', 312.50),

-- Netflix
('NFLX', '2025-01-01', 421.00),

-- NVIDIA
('NVDA', '2025-01-01', 560.00),
('NVDA', '2025-01-02', 565.50),

-- AMD
('AMD', '2025-01-01', 125.00),
('AMD', '2025-01-02', 128.30),

-- Intel
('INTC', '2025-01-01', 35.50),
('INTC', '2025-01-02', 36.20),

-- Meta
('META', '2025-01-01', 340.00),
('META', '2025-01-02', 345.50);


INSERT IGNORE INTO price_target (ticker, target_price, action, triggered) VALUES
('AAPL', 180.00, 'SELL', false),
('TSLA', 270.00, 'SELL', false),
('AMZN', 220.00, 'SELL', false),
('GOOGL', 150.00, 'BUY', false),
('MSFT', 320.00, 'SELL', false),
('NFLX', 450.00, 'BUY', false),
('META', 380.00, 'SELL', false),
('NVDA', 620.00, 'SELL', false),
('AMD', 140.00, 'SELL', false),
('INTC', 40.00, 'BUY', false);



