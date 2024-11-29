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

export type Category = typeof categories[number];

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
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_APP_OPENAI_API_KEY}`,
    };

    const body = JSON.stringify({
        model: "gpt-4",
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
        const responseContent = data.choices[0]?.message?.content || "";
        let parsedJson: IResponse | null = null;

        try {
            parsedJson = JSON.parse(responseContent);
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
        const lines = response.split("\n").filter((line) => line.trim());
        const scores: Record<Category, number> = {} as Record<Category, number>;
        const descriptions: Record<Category, string> = {} as Record<Category, string>;
        let currentCategory: Category | null = null;

        lines.forEach((line) => {
            const scoreMatch = line.match(/^(\d+)\.\s+([\w\s]+):\s+(\d+)\/10/);
            if (scoreMatch) {
                const [, , categoryName, score] = scoreMatch;
                currentCategory = categoryName
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "") as Category;
                scores[currentCategory] = parseInt(score, 10);
                return;
            }

            if (currentCategory) {
                descriptions[currentCategory] = (descriptions[currentCategory] || "") + " " + line.trim();
            }
        });

        const mappedScores: Record<Category, number> = {} as Record<Category, number>;
        const mappedDescriptions: Record<Category, string> = {} as Record<Category, string>;

        categories.forEach((category) => {
            mappedScores[category] = scores[category] || 0;
            mappedDescriptions[category] = descriptions[category] || "No details provided.";
        });

        return { scores: mappedScores, description: mappedDescriptions };
    } catch (error) {
        console.error("Error during manual parsing:", error);
        return null;
    }
};

export const extractTextFromPage = async (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs[0]?.id) return reject("No active tab found.");

            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: () => document.body.innerText || "",
                },
                (results) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        return reject("Failed to extract text from the page.");
                    }
                    resolve(results[0]?.result || "");
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
