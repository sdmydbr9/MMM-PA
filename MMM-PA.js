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
        if (notification === "SEND_GLOBAL_NOTIFICATION") {
            console.log("[MMM-PA] Broadcasting SSML notification globally with additional parameters...");

            // Send the SSML notification with required fields
            this.sendNotification("SSML", {
                text: payload.ssmlSummary, // SSML summary as text
                voiceName: "Lily",         // Specifying voice name
                stream: true               // Enable streaming
            });
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = "MMM-PA Module is Running...";
        return wrapper;
    }
});
