package com.portfolio.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Stock {

    @Id
    private String ticker;

    private String companyName;

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
