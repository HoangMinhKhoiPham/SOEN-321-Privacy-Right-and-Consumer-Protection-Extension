// apiUtils.ts

export const categories = [
    "dataCollection",
    "dataSharing",
    "userChoice",
    "dataSecurity",
    "dataDeletion",
    "policyUpdate",
    "dataRetention",
    "internationalAudiences",
    "children",
    "miscellaneous",
    "doNotTrack",
    "contactInformation",
] as const;

export type Category = (typeof categories)[number];

export const labels: Record<Category, string> = {
    dataCollection: "Data Collection",
    dataSharing: "Data Sharing",
    userChoice: "User Choice",
    dataSecurity: "Data Security",
    dataDeletion: "Data Deletion",
    policyUpdate: "Policy Update",
    dataRetention: "Data Retention",
    internationalAudiences: "International Audiences",
    children: "Children",
    miscellaneous: "Miscellaneous",
    doNotTrack: "Do Not Track",
    contactInformation: "Contact Information",
};

export const generatePrompt = (text: string) => `
  You are an assistant designed to analyze privacy policies. Analyze the following privacy policy text and provide a JSON output.
  
  Score the following categories (1-10) and provide detailed descriptions for each category:
  1. Data Collection
  2. Data Sharing
  3. User Choice
  4. Data Security
  5. Data Deletion
  6. Policy Update
  7. Data Retention
  8. International Audiences
  9. Children
  10. Miscellaneous
  11. Do Not Track
  12. Contact Information
  
  Output format:
  {
    "scores": {
      "dataCollection": 10,
      "dataSharing": 8,
      "userChoice": 7,
      ...
    },
    "description": {
      "dataCollection": "Explanation for Data Collection score.",
      "dataSharing": "Explanation for Data Sharing score.",
      ...
    }
  }
  
  Analyze this text:
  "${text}"
  Return only valid JSON and nothing else.
`;

export const fetchApi = async (text: string): Promise<IResponse | null> => {
    // @HoangMinhKhoiPham: You will need to call it in chunks since the data is too large

    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_APP_GROQ_API_KEY}`,
    };
    console.log("Text API: ", text)
    const body = JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
            {
                role: "user",
                content: generatePrompt(text),
            },
        ],
    });

    try {
        const response = await fetch(apiUrl, { method: "POST", headers, body });
        const data = await response.json();
        console.log("Data", data)
        const responseContent = data.choices[0]?.message?.content || "";
        let parsedJson: IResponse | null = null;
        try {
            parsedJson = JSON.parse(responseContent);
            console.log("ParsedJson", parsedJson);
        } catch {
            console.warn("Response is not valid JSON. Attempting manual parsing...");
            parsedJson = manualParseResponse(responseContent);
        }

        return parsedJson;
    } catch (error) {
        console.error("Error fetching API:", error);
        return null;
    }
};

export const manualParseResponse = (response: string): IResponse | null => {
    try {
        let lines = response.split("\n").filter((line) => line.trim());
        console.log(lines);
        const jsonStr = lines.join(" ").replace(/```/g, "");
        let sanitizedJsonStr = jsonStr.replace(/"(\w+)":\s*"N\/A"/g, '"$1": null');
        sanitizedJsonStr = sanitizedJsonStr.replace(/"(\w+)":\s*["']N\/A["']/g, '"$1": null');
        const jsonData = sanitizedJsonStr.match(/{.*}/s);
        if (!jsonData) {
            throw new Error("JSON data not found.");
        }
        const parsedData = JSON.parse(jsonData[0]);
        const scores = parsedData.scores as Record<Category, number>;
        const descriptions = parsedData.description as Record<Category, string>;
        const mappedScores: Record<Category, number> = {} as Record<Category, number>;
        const mappedDescriptions: Record<Category, string> = {} as Record<Category, string>;
        categories.forEach((category) => {
            mappedScores[category] = scores[category] || 0;
            mappedDescriptions[category] = descriptions[category] || "No details provided.";
        });

        console.log(mappedScores);
        return { scores: mappedScores, description: mappedDescriptions };

    } catch (error) {
        console.error("Error during manual parsing:", error);
        return null;
    }
};

export const extractTextFromPrivacyPage = async (): Promise<string | null> => {
    return new Promise<string>((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab || !tab.id) {
                reject("No active tab found.");
                return;
            }

            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    func: () => {
                        console.log("Executing script on the page...");

                        let privacyPolicyURL: string | any;
                        const links = document.querySelectorAll("a");
                        links.forEach((link) => {
                            const href = link.getAttribute("href");
                            if (href && href.toLowerCase().includes("privacy")) {
                                privacyPolicyURL = href;
                            }
                        });

                        console.log("Extracted Privacy Policy URL:", privacyPolicyURL);

                        if (!privacyPolicyURL) {
                            console.warn("No privacy policy link found.");
                            return null; // Return null if no privacy link is found
                        }

                        // Resolve relative URL to absolute URL if necessary
                        if (!privacyPolicyURL.startsWith("http")) {
                            const baseUrl = window.location.origin; // Get the base URL of the current page
                            privacyPolicyURL = new URL(privacyPolicyURL, baseUrl).href; // Resolve to absolute URL
                        }
                        // Fetch the privacy policy page
                        return fetch(privacyPolicyURL)
                            .then((response) => {
                                console.log("Fetch response:", response); // Log the response
                                if (!response.ok) {
                                    throw new Error("Failed to fetch the page");
                                }
                                return response.text();
                            })
                            .then((pageText) => {
                                console.log("Page text fetched:", pageText); // Log the page content

                                // Parse the page text to HTML
                                const parsedDoc = new DOMParser().parseFromString(pageText, "text/html");

                                // Remove any script and style tags that might have been included
                                const scriptsAndStyles = parsedDoc.querySelectorAll("script, style");
                                scriptsAndStyles.forEach((el) => el.remove());

                                // Extract the text from the body of the parsed document
                                const bodyText = parsedDoc.body.innerText;
                                console.log("Extracted body text from privacy page:", bodyText); // Log the extracted body text
                                return bodyText;
                            })
                            .catch((error) => {
                                console.error("Failed to fetch privacy policy page:", error);
                                return null;
                            });
                    },
                },
                (results) => {
                    if (chrome.runtime.lastError || !results || !results[0]?.result) {
                        reject("Failed to extract privacy policy page content.");
                        return;
                    }

                    const pageText = results[0].result;
                    if (!pageText) {
                        reject("Failed to fetch privacy policy page content.");
                        return;
                    }

                    resolve(pageText);
                }
            );
        });
    });
};
// Define the IResponse interface here for typescript consistency
export interface IResponse {
    scores: Record<Category, number>;
    description: Record<Category, string>;
}
