DROP TABLE IF EXISTS price_target;
DROP TABLE IF EXISTS stock_price;
DROP TABLE IF EXISTS asset;
DROP TABLE IF EXISTS stock;
CREATE TABLE IF NOT EXISTS stock (
                       ticker VARCHAR(10) PRIMARY KEY,
                       company_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS asset (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       ticker VARCHAR(10) NOT NULL,
                       quantity INT NOT NULL,
                       buy_price DECIMAL(10,2),
                       buy_date DATE,
                       CONSTRAINT fk_asset_stock
                           FOREIGN KEY (ticker)
                               REFERENCES stock(ticker)
                               ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock_price (
                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                             ticker VARCHAR(10) NOT NULL,
                             price_date DATE NOT NULL,
                             close_price DECIMAL(10,2) NOT NULL,
                             CONSTRAINT fk_price_stock
                                 FOREIGN KEY (ticker)
                                     REFERENCES stock(ticker)
                                     ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_target (
                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                              ticker VARCHAR(10) NOT NULL,
                              target_price DECIMAL(10,2) NOT NULL,
                              action VARCHAR(10) NOT NULL,
                              triggered BOOLEAN DEFAULT FALSE,
                              CONSTRAINT fk_target_stock
                                  FOREIGN KEY (ticker)
                                      REFERENCES stock(ticker)
                                      ON DELETE CASCADE
);