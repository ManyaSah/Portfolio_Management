package com.portfolio.backend.service;

import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.PriceTargetRepository;
import com.portfolio.backend.repo.StockPriceRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AlertService {

    private final PriceTargetRepository priceTargetRepository;
    private final StockPriceRepository stockPriceRepository;

    public AlertService(PriceTargetRepository priceTargetRepository,
                        StockPriceRepository stockPriceRepository) {
        this.priceTargetRepository = priceTargetRepository;
        this.stockPriceRepository = stockPriceRepository;
    }

    /**
     * Runs every 10 seconds and evaluates all untriggered alerts.
     */
    @Scheduled(fixedRate = 10000)
    public void checkAlerts() {

        List<PriceTarget> targets =
                priceTargetRepository.findByTriggeredFalse();

        for (PriceTarget target : targets) {

            StockPrice latestPrice =
                    stockPriceRepository.findLatestPrice(target.getTicker());

            if (latestPrice == null) {
                continue; // no price data, skip safely
            }

            BigDecimal currentPrice = latestPrice.getClosePrice();
            BigDecimal targetPrice = target.getTargetPrice();

            boolean shouldTrigger = false;

            if ("SELL".equalsIgnoreCase(target.getAction())) {
                shouldTrigger = currentPrice.compareTo(targetPrice) >= 0;
            }

            if ("BUY".equalsIgnoreCase(target.getAction())) {
                shouldTrigger = currentPrice.compareTo(targetPrice) <= 0;
            }

            if (shouldTrigger) {
                target.setTriggered(true);
                priceTargetRepository.save(target);

                System.out.println(
                        "ALERT TRIGGERED → "
                                + target.getTicker()
                                + " | Action: " + target.getAction()
                                + " | Price: " + currentPrice
                );
            }
        }
    }
}
