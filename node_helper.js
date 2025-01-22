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

                // Generate SSML and Text summaries separately
                const ssmlSummary = await this.summarizeDataSSML(payload.geminiApiKey, news, weather);
                const textSummary = await this.summarizeDataTEXT(payload.geminiApiKey, news, weather);

                console.log("[MMM-PA] ✅ Generated SSML Summary:\n", ssmlSummary);
                console.log("[MMM-PA] ✅ Generated Plain Text Summary:\n", textSummary);

                // Send the SSML notification globally with extra parameters
                this.sendSocketNotification("SEND_GLOBAL_NOTIFICATION", {
                    text1: ssmlSummary,  // SSML summary
                    text2: textSummary,  // Plain text summary
                    voiceName: "Lily",   // Voice configuration
                    stream: true          // Streaming enabled
                });



            } catch (error) {
                console.error("[MMM-PA] ❌ Error in processing:", error);
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

            console.log("[MMM-PA] ✅ Fetched news data.");
            return newsSummary;
        } catch (error) {
            console.error("[MMM-PA] ❌ Error fetching NYT news:", error.message);
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

            console.log("[MMM-PA] ✅ Fetched weather data.");
            return `Current weather: ${current.weather[0].description}, ${current.temp}°C. Today's forecast: ${today.weather[0].description}, High: ${today.temp.max}°C, Low: ${today.temp.min}°C.`;
        } catch (error) {
            console.error("[MMM-PA] ❌ Error fetching weather:", error.message);
            return "Unable to fetch weather.";
        }
    },


    

    async summarizeDataSSML(apiKey, news, weather) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const now = new Date();
            const dateString = now.toLocaleDateString('en-US', {
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            });
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true
            });
    
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `
                        You are a news anchor in a dystopian world after a third world war. We are in a nuclear winter now.
                        Provide the news and weather report in the style of a news anchor, add emotions and breaks and output the results in ssml.

                         current date is Date: ${dateString} and time is  Time: ${timeString}
                       

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

            console.log("[MMM-PA] 🔄 Sending SSML request to Gemini API...");
            const response = await axios.post(url, requestBody, {
                headers: { "Content-Type": "application/json" }
            });

            const candidates = response.data.candidates || [];
            if (candidates.length > 0) {
                const generatedText = candidates[0].content.parts[0].text || "No SSML summary generated.";
                const ssmlContent = `<speak>${generatedText.replace(/\n/g, '<break time="1s"/>')}</speak>`;
                return ssmlContent;
            }

            console.warn("[MMM-PA] ⚠️ No SSML summary generated.");
            return "<speak>No SSML summary generated.</speak>";
        } catch (error) {
            console.error("[MMM-PA] ❌ Error generating SSML summary:", error.message);
            return "<speak>Unable to generate SSML summary.</speak>";
        }
    },

    async summarizeDataTEXT(apiKey, news, weather) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

            const now = new Date();
            const dateString = now.toLocaleDateString('en-US', {
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            });
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true
            });
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `
                        You are a news anchor in a dystopian world after a third world war. We are in a nuclear winter now.
                        these are todays news headlines, give me the news in the style of news anchor in plain text
                         current date is Date: ${dateString} and time is  Time: ${timeString}

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

            console.log("[MMM-PA] 🔄 Sending Text request to Gemini API...");
            const response = await axios.post(url, requestBody, {
                headers: { "Content-Type": "application/json" }
            });

            const candidates = response.data.candidates || [];
            if (candidates.length > 0) {
                const generatedText = candidates[0].content.parts[0].text || "No text summary generated.";
                return generatedText;
            }

            console.warn("[MMM-PA] ⚠️ No text summary generated.");
            return "No text summary generated.";
        } catch (error) {
            console.error("[MMM-PA] ❌ Error generating text summary:", error.message);
            return "Unable to generate text summary.";
        }
    }
});
