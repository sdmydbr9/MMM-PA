Module.register("MMM-PA", {
    defaults: {
        openWeatherApiKey: "",
        geminiApiKey: "",
        nytimesApiKey: "",
        latitude: "",
        longitude: ""
    },

    start: function () {
        console.log("[MMM-PA] Module started, waiting for DAY_BRIEF notification...");
        this.cachedText2 = ""; // Store text2 value for later use
    },

    notificationReceived: function (notification) {
        if (notification === "DAY_BRIEF") {
            console.log("[MMM-PA] DAY_BRIEF notification received. Sending FETCH_DATA...");
            this.sendSocketNotification("FETCH_DATA", this.config);
        } else if (notification === "SSML_FAILED") {
            console.log("[MMM-PA] SSML_FAILED received. Preparing to send TTS_SAY notification.");

            if (!this.cachedText2) {
                console.error("[MMM-PA] Error: No cached text2 available.");
                return;
            }

            console.log(`[MMM-PA] Sending TTS_SAY with payload: ${this.cachedText2}`);
            this.sendNotification("TTS_SAY", {
                content: this.cachedText2, // Use the cached plain text summary
                type: "text",
                voiceName: "en-GB-Journey-F",
                languageCode: "en-GB",
                ssmlGender: "FEMALE"
            });
        }
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "SEND_GLOBAL_NOTIFICATION") {
            console.log("[MMM-PA] Broadcasting SSML notification globally with additional parameters...");

            // Cache the plain text summary for later use
            this.cachedText2 = payload.text2 || "";

            // Send the SSML notification with required fields
            this.sendNotification("SSML", {
                text: payload.text1, // SSML summary as text
                voiceName: payload.voiceName || "Charlotte",
                stream: payload.stream || true
            });
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = "MMM-PA Module is Waiting for DAY_BRIEF...";
        return wrapper;
    }
});
