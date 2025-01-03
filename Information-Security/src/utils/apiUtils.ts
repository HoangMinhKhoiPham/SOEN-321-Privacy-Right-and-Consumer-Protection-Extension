import { categories, Category, generatePrompt } from "../prompt/prompt";


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
    pros: string[];
    cons: string[];
  };
}
