const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';

async function fetchAPI(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}/${endpoint}`, options);
    if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`API request failed with status ${res.status}${errorText ? ': ' + errorText : ''}`);
    }
    return res.json();
}

// 
export async function getAssets() {
    return fetchAPI('assets');
}

export async function addAsset(asset) {
    return fetchAPI('assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
    });
}

export async function sellAsset(payload) {
    return fetchAPI('assets/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function deleteAsset(id) {
    const res = await fetch(`${BASE_URL}/assets/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        throw new Error(`Failed to delete asset ${id}`);
    }
    return true;
}

export async function fetchAssets() {
    return getAssets();
}

export async function getAllAlerts() {
    return fetchAPI('alerts');
}

export async function getActiveAlerts() {
    return fetchAPI('alerts/active');
}

export async function getPortfolio() {
    return fetchAPI('portfolio');
}

export async function getAiSummary() {
    return fetchAPI('ai/summary');
}

export async function getXirr(ticker) {
    return fetchAPI(`portfolio/xirr/${ticker}`);
}

export async function getTargets() {
    return fetchAPI('targets');
}

export async function addTarget(target) {
    return fetchAPI('targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target),
    });
}

export async function getPriceHistory(ticker) {
    return fetchAPI(`prices/${ticker}`);
}

export async function addPrice(ticker, price) {
    return fetchAPI('prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, price }),
    });
}


export async function getHome() {
    return fetch(`${BASE_URL.replace('/api', '')}`)
        .then(res => res.json());
}