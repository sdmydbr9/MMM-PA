const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
    start: function () {
        console.log("[MMM-PA] Node helper started...");
    },

    socketNotificationReceived: async function (notification, payload) {
        if (notification === "FETCH_DATA") {
            console.log("[MMM-PA] Received FETCH_DATA notification with config:", payload);

            try {
                const news = await this.getTopNews(payload.nytimesApiKey);
                const weather = await this.getWeather(payload.openWeatherApiKey, payload.latitude, payload.longitude);
                const summary = await this.summarizeData(payload.geminiApiKey, news, weather);

                console.log("[MMM-PA] Final summarized content:", summary);

                // Send the summarized content back to the MMM-PA module to handle the TTS_SAY notification
                this.sendSocketNotification("SEND_TTS", summary);
            } catch (error) {
                console.error("[MMM-PA] Error in processing:", error);
            }
        }
    },

    async getTopNews(apiKey) {
        try {
            const url = "https://api.nytimes.com/svc/topstories/v2/home.json";
            const response = await axios.get(url, {
                params: { "api-key": apiKey }
            });

            const articles = response.data.results.slice(0, 10).map(article => ({
                section: article.section,
                title: article.title,
                abstract: article.abstract
            }));

            let newsSummary = "Here are the top news headlines:\n";
            articles.forEach((article, index) => {
                newsSummary += `${index + 1}. ${article.title} - ${article.abstract}\n`;
            });

            return newsSummary;
        } catch (error) {
            console.error("[MMM-PA] Error fetching NYT news:", error.message);
            return "Unable to fetch news.";
        }
    },

    async getWeather(apiKey, latitude, longitude) {
        try {
            const url = "https://api.openweathermap.org/data/3.0/onecall";
            const response = await axios.get(url, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    exclude: "minutely,hourly",
                    appid: apiKey,
                    units: "metric"
                }
            });

            const current = response.data.current;
            const today = response.data.daily[0];

            return `Current weather: ${current.weather[0].description}, ${current.temp}°C. Today's forecast: ${today.weather[0].description}, High: ${today.temp.max}°C, Low: ${today.temp.min}°C.`;
        } catch (error) {
            console.error("[MMM-PA] Error fetching weather:", error.message);
            return "Unable to fetch weather.";
        }
    },

    async summarizeData(apiKey, news, weather) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `
                        you are a news anchor and we are in a dystopian world, after third world war, and we are in a nuclear winter now, you will cover everything in details, use introduction and conclusions just like in the news. 
			Summarize the following information in plain text:

                        News Headlines:
                        ${news}

                        Weather Information:
                        ${weather}
                        `
                    }]
                }],
                generationConfig: {
                    temperature: 1,
                    topP: 0.95,
                    maxOutputTokens: 8192
                }
            };

            const response = await axios.post(url, requestBody, {
                headers: { "Content-Type": "application/json" }
            });

            const candidates = response.data.candidates || [];
            if (candidates.length > 0) {
                return candidates[0].content.parts[0].text || "No summary generated.";
            }

            return "No summary generated.";
        } catch (error) {
            console.error("[MMM-PA] Error summarizing data:", error.message);
            return "Unable to summarize data.";
        }
    }
});
