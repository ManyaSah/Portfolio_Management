package com.portfolio.backend.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Stock {

    @Id
    private String ticker;

    private String companyName;
    // One stock → many prices
    @OneToMany(mappedBy = "stock", cascade = CascadeType.ALL)
    private List<StockPrice> prices = new ArrayList<>();

    // One stock → many targets
    @OneToMany(mappedBy = "stock", cascade = CascadeType.ALL)
    private List<PriceTarget> targets = new ArrayList<>();

    public String getTicker() {
        return ticker;
    }

    public void setTicker(String ticker) {
        this.ticker = ticker;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
}
