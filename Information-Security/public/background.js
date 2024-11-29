chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showPrivacyPolicy") {
        console.log("Received privacy policy message:", message.text);
        // Here, you can do something with the message, like display the text in the popup or background
        sendResponse({ status: "success" });
    }
});
