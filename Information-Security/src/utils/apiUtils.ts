// apiUtils.ts
export const categories = [
  "dataCollection",
  "dataUsage",
  "dataSharing",
  "dataSelling",
  "optOutOptions",
  "dataSecurity",
  "dataDeletion",
  "clarityOfPrivacyPolicy",
] as const;

export type Category = (typeof categories)[number];

export const labels: Record<Category, string> = {
  dataCollection: "Data Collection",
  dataUsage: "Data Sharing",
  dataSharing: "User Choice",
  dataSelling: "Data Selling",
  optOutOptions: "Opt-Out Options",
  dataSecurity: "Data Security",
  dataDeletion: "Data Deletion",
  clarityOfPrivacyPolicy: "Policy Clarity",
};
export const generatePrompt = (text: string) => `
  You are an assistant designed to analyze privacy policies. Analyze the following privacy policy text and provide a JSON output.
  
  Score the following categories (1-10) and provide detailed descriptions for each category:
  
  Scoring criteria:
  - 0-3: No mention or no specific details.
  - 4-6: Some details but lacking/too generic explanation.
  - 7-8: Good explanation and answers most questions.
  - 9-10: Exceptional, attention to detail.
  
  Categories:
  1. **Data Collection**: Identifies what types of information the website collects and how it is gathered (e.g., user-provided, automated tracking).
  
  2. **Data Usage**: Explains how the collected information is used, such as for service improvement, marketing, or compliance with legal obligations.
  
  3. **Data Sharing**: Details with whom the collected data is shared, including affiliates, service providers, or other third parties, and why.
  
  4. **Data Selling**: Specifies whether the website sells user data to third parties and for what purpose, if applicable.
  
  5. **Opt-Out Options**: Describes the choices users have to opt out of specific data practices, like data sharing or tracking.
  
  6. **Data Security**: Outlines the measures taken to protect user information, such as encryption or compliance with security standards.
  
  7. **Data Deletion**: Explains whether users can request to delete their data and the steps for doing so.
  
  8. **Clarity of the Privacy Policy**: Assesses how understandable and accessible the privacy policy is, focusing on the use of plain language and organization.
    
  Your output should include two parts:

  1. **Detailed JSON Output**: Provide the JSON object with scores for each category (1-10) and a detailed explanation for each category.

  2. **Structured Summary**: After the JSON, provide a **structured summary** with:
     - **Overall evaluation**: A sentence summarizing the policy (e.g., “This policy is comprehensive but may be overwhelming for some users.”)
     - **Pros**: A bullet point list of the positive aspects of the policy in terms of the categories and other important factors.
     - **Cons**: A bullet point list of the policy’s limitations about the categories and other factors that are important.
 
    Example of expected output:

  Detailed JSON Output:
  {
    "scores": {
      "dataCollection": 10,
      "dataUsage": 9,
      "dataSharing": 8,
      "dataSelling": 7,
      "optOutOptions": 6,
      "dataSecurity": 8,
      "dataDeletion": 7,
      "clarityOfPrivacyPolicy": 9,
    },
    "description": {
      "dataCollection": "Provide an Explanation for Data Collection score. A comprehensive summary of Data Collection should be present",
      "dataUsage": "Provide an Explanation for Data Usage score.  A comprehensive summary of Data Usage should be present",
      "dataSharing": "Provide an Explanation for Data Sharing score.  A comprehensive summary of Data Sharing should be present",
      "dataSelling": "Provide an Explanation for Data Selling score.  A comprehensive summary of Data Selling should be present",
      "optOutOptions": "Provide an Explanation for Opt-Out Options score.  A comprehensive summary of Opt-Out Options should be present",
      "dataSecurity": "Provide an Explanation for Data Security score.  A comprehensive summary of Data Security should be present",
      "dataDeletion": "Provide an Explanation for Data Deletion score.  A comprehensive summary of Data Deletion should be present",
      "clarityOfPrivacyPolicy": "Provide an Explanation for Clarity of the Privacy Policy score.  A comprehensive summary of Clarity of the Privacy Policy should be present",
    },
     "summary": {
    "overallEvaluation": "Evaluation of the categories and overall policy in a summary",
    "pros": [
      "list of the positive aspects of the 8 categories",
      "list of the positive aspects of the 8 categories",
      "list of the positive aspects of the 8 categories"
    ],
    "cons": [
      "list of the negative aspects of the 8 categories",
      "list of the positive aspects of the 8 categories"
    ],
    "overallScore": 5.5
    },
  }

    The response should be a complete and valid JSON object. Do not provide the score in the description part. If there is any issue with the formatting or missing brackets, please ensure the JSON is well-formed and contains all necessary closing brackets. Return **only** the JSON output and nothing else.

  Analyze this text:
  "${text}"
  
  Return only valid JSON and nothing else.
`;

export const fetchApi = async (text: string): Promise<IResponse | null> => {
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_APP_GROQ_API_KEY}`,
  };
  console.log("Text API: ", text);
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
    console.log("Data", data);
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
    console.log("Raw lines:", lines);

    // Join the lines into a single string and remove any code block markers (```)
    const jsonStr = lines.join(" ").replace(/```/g, "");

    // Sanitize the JSON string by replacing "N/A" with null
    let sanitizedJsonStr = jsonStr.replace(/"(\w+)":\s*"N\/A"/g, '"$1": null');
    sanitizedJsonStr = sanitizedJsonStr.replace(
      /"(\w+)":\s*["']N\/A["']/g,
      '"$1": null'
    );

    // Check if the JSON is potentially incomplete
    const openingBrackets = (sanitizedJsonStr.match(/{/g) || []).length;
    const closingBrackets = (sanitizedJsonStr.match(/}/g) || []).length;

    // If there's a mismatch in the bracket count, add the missing closing bracket
    if (openingBrackets > closingBrackets) {
      sanitizedJsonStr += "}";
    }

    // Extract the JSON data using a regular expression to match the full JSON object
    const jsonData = sanitizedJsonStr.match(/{.*}/s);
    if (!jsonData) {
      throw new Error("JSON data not found.");
    }

    // Parse the JSON data
    const parsedData = JSON.parse(jsonData[0]);

    // Extract and map the scores, descriptions, and summary
    const scores = parsedData.scores as Record<Category, number>;
    const descriptions = parsedData.description as Record<Category, string>;
    const summary = parsedData.summary;

    const mappedScores: Record<Category, number> = {} as Record<
      Category,
      number
    >;
    const mappedDescriptions: Record<Category, string> = {} as Record<
      Category,
      string
    >;

    categories.forEach((category) => {
      mappedScores[category] = scores[category] || 0;
      mappedDescriptions[category] =
        descriptions[category] || "No details provided for this category";
    });

    // Return the parsed result
    return {
      scores: mappedScores,
      description: mappedDescriptions,
      summary: summary,
    };
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
            const currentUrl = window.location.href.toLowerCase();
            if (currentUrl.includes("privacy")) {
              console.log(
                "Already on a privacy page, extracting content directly..."
              );
              return document.body.innerText;
            }
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
              return null;
            }
            if (!privacyPolicyURL.startsWith("http")) {
              const baseUrl = window.location.origin;
              privacyPolicyURL = new URL(privacyPolicyURL, baseUrl).href;
            }
            return fetch(privacyPolicyURL)
              .then((response) => {
                console.log("Fetch response:", response);
                if (!response.ok) {
                  throw new Error("Failed to fetch the page");
                }
                return response.text();
              })
              .then((pageText) => {
                console.log("Page text fetched:", pageText);
                const parsedDoc = new DOMParser().parseFromString(
                  pageText,
                  "text/html"
                );
                const scriptsAndStyles =
                  parsedDoc.querySelectorAll("script, style");
                scriptsAndStyles.forEach((el) => el.remove());
                const bodyText = parsedDoc.body.innerText;
                console.log("Extracted body text from privacy page:", bodyText);
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

export const extractTextFromPrivacyUrl = async (
  url: string
): Promise<string | null> => {
  try {
    if (url.toLowerCase().includes("privacy")) {
      console.log(
        "The provided URL already looks like a privacy page. Extracting content directly..."
      );

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch the page");
      }

      const pageText = await response.text();
      const parsedDoc = new DOMParser().parseFromString(pageText, "text/html");

      const scriptsAndStyles = parsedDoc.querySelectorAll("script, style");
      scriptsAndStyles.forEach((el) => el.remove());

      const bodyText = parsedDoc.body.innerText;
      console.log(
        "Extracted body text from the provided privacy policy page:",
        bodyText
      );
      return bodyText;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch the page");
    }

    const pageText = await response.text();
    const parsedDoc = new DOMParser().parseFromString(pageText, "text/html");

    let privacyPolicyURL: string | null = null;
    const links = parsedDoc.querySelectorAll("a");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.toLowerCase().includes("privacy")) {
        if (!href.startsWith("http")) {
          const baseUrl = new URL(url);
          privacyPolicyURL = new URL(href, baseUrl).href;
        } else {
          privacyPolicyURL = href;
        }
      }
    });

    if (!privacyPolicyURL) {
      console.warn("No privacy policy link found on the page.");
      return null;
    }

    const privacyResponse = await fetch(privacyPolicyURL);
    if (!privacyResponse.ok) {
      throw new Error("Failed to fetch the privacy policy page");
    }

    const privacyPageText = await privacyResponse.text();
    const privacyParsedDoc = new DOMParser().parseFromString(
      privacyPageText,
      "text/html"
    );

    const scriptsAndStylesPrivacy =
      privacyParsedDoc.querySelectorAll("script, style");
    scriptsAndStylesPrivacy.forEach((el) => el.remove());

    const bodyTextPrivacy = privacyParsedDoc.body.innerText;
    console.log(
      "Extracted body text from privacy policy page:",
      bodyTextPrivacy
    );
    return bodyTextPrivacy;
  } catch (error) {
    console.error("Error extracting privacy policy content:", error);
    return null;
  }
};
export interface IResponse {
  scores: Record<Category, number>;
  description: Record<Category, string>;
  summary: {
    overallEvaluation: string;
    overallScore: number;
    pros: string[];
    cons: string[];
  };
}
