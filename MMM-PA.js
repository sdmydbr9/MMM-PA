Module.register("MMM-PA", {
    defaults: {
        openWeatherApiKey: "",
        geminiApiKey: "",
        nytimesApiKey: "",
        latitude: "",
        longitude: ""
    },

    start: function () {
        console.log("[MMM-PA] Module started...");
        this.sendSocketNotification("FETCH_DATA", this.config);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "SEND_TTS") {
            console.log("[MMM-PA] Gemini Response Data:", payload);

            try {
                // Ensure the payload is properly formatted
                const rawResponse = typeof payload === "string" ? payload : JSON.stringify(payload);

                console.log("[MMM-PA] Parsed Text Content:", rawResponse);

                // Send the global TTS_SAY notification with the plain text content
                this.sendNotification("TTS_SAY", {
                    content: rawResponse, // Plain text content
                    type: "text", // Indicating that the content is plain text
                    voiceName: "en-US-Journey-O", // Customize as per preference
                    languageCode: "en-US", // Adjust language as needed
                    ssmlGender: "FEMALE", // Specify gender
                    callback: (error) => {
                        if (error) {
                            console.error("[MMM-PA] Error in TTS callback:", error);
                        } else {
                            console.log("[MMM-PA] Message is spoken.");
                        }
                    }
                });
            } catch (error) {
                console.error("[MMM-PA] Error parsing Gemini response:", error);
                this.sendNotification("TTS_SAY", {
                    content: "Unable to generate a summary at this time.",
                    type: "text",
                    voiceName: "en-GB-Journey-F", // Fallback voice
                    languageCode: "en-GB", // Fallback language
                    ssmlGender: "FEMALE"
                });
            }
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = "MMM-PA Module is Running...";
        return wrapper;
    }
});
