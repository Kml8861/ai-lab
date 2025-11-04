const WeatherApp = class {
    constructor(apiKey, resultBlockSelector) {
        this.apiKey = apiKey;
        this.resultBlock = document.querySelector(resultBlockSelector);
    }

    getCurrentWeather(query) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${this.apiKey}&units=metric`;

        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                console.log("Odpowiedź z API (bieżąca pogoda):", data);
                this.drawWeather(data, "current");
            } else {
                console.error("Błąd przy pobieraniu bieżącej pogody:", xhr.statusText);
            }
        };
        xhr.onerror = () => console.error("Błąd sieciowy przy pobieraniu danych pogodowych.");
        xhr.send();
    }

    getForecast(query) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${this.apiKey}&units=metric`;

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("Błąd sieciowy.");
                return response.json();
            })
            .then(data => {
                console.log("Odpowiedź z API (prognoza pogody):", data);
                this.drawWeather(data, "forecast");
            })
            .catch(error => console.error("Błąd przy pobieraniu prognozy pogody:", error));
    }

    getWeather(query) {
        this.getCurrentWeather(query);
        this.getForecast(query);
    }

    drawWeather(data, type) {
        let content = '';
        const resultContainer = type === "current" ? document.getElementById("currentWeather") : this.resultBlock;
    
        if (type === "current") {
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            const condition = data.weather[0].description;
            const feelsLike = data.main.feels_like;
    
            content += `
                <h2>Bieżąca pogoda dla ${data.name}</h2>
                <div class="weather-container">
                    <p class="weather-date">${new Date().toLocaleString()}</p>
                    <div class="weather-info">
                        <img src="${iconUrl}" alt="Ikona pogody">
                        <p class="weather-temp">${data.main.temp}°C</p>
                    </div>
                    <p class="weather-feels-like">Odczuwalna: ${feelsLike}°C</p>
                    <p class="weather-condition">${condition}</p>
                </div>
            `;
        } else if (type === "forecast") {
            content += `<h2>Prognoza pogody</h2>`;
            data.list.slice(0, 5).forEach(item => {
                const iconCode = item.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
                const condition = item.weather[0].description;
                const feelsLike = item.main.feels_like;
    
                content += `
                    <div class="weather-container">
                        <p class="weather-date">${item.dt_txt}</p>
                        <div class="weather-info">
                            <img src="${iconUrl}" alt="Ikona pogody">
                            <p class="weather-temp">${item.main.temp}°C</p>
                        </div>
                        <p class="weather-feels-like">Odczuwalna: ${feelsLike}°C</p>
                        <p class="weather-condition">${condition}</p>
                    </div>
                `;
            });
        }
    
        resultContainer.innerHTML = content;
        resultContainer.style.display = 'block';
    }
    
};

document.weatherApp = new WeatherApp("0f26094aa5280407c18effa0b2e6ac19", "#weather-results-container");

function getWeather() {
    const city = document.getElementById('cityInput').value;
    document.weatherApp.getWeather(city);
}
