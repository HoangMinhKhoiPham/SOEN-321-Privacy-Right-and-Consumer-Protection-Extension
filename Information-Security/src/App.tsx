import { useState } from "react";
import "./App.css";

const categories = [
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
];

const labels: Record<string, string> = {
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

const generatePrompt = (text: string) => `
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

interface IResponse {
  scores: Record<string, number>;
  description: Record<string, string>;
}

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [state, setState] = useState<"error" | "found" | "not found" | "">("");
  const [response, setResponse] = useState<IResponse>();
  const [total, setTotal] = useState<number>();
  const [activeTab, setActiveTab] = useState("scan");

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      analyzeText(text);
    } catch (error) {
      console.error("Failed to read the file:", error);
      setState("error");
    }
  };

  const analyzeText = async (text: string) => {
    setIsScanning(true);
    try {
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

      const response = await fetch(apiUrl, { method: "POST", headers, body });
      const data = await response.json();

      console.log("Raw OpenAI Response:", data);

      const responseContent = data.choices[0]?.message?.content || "";

      let parsedJson: IResponse | null = null;

      try {
        parsedJson = JSON.parse(responseContent);
      } catch {
        console.warn(
          "Response is not valid JSON. Attempting manual parsing..."
        );
        parsedJson = manualParseResponse(responseContent);
      }

      if (!parsedJson) {
        console.error("Failed to parse OpenAI response.");
        setState("error");
        return;
      }

      setResponse(parsedJson);
      setState("found");

      const total = parseFloat(
        (
          (categories.reduce((sum, c) => sum + parsedJson.scores[c], 0) /
            categories.length) *
          10
        ).toPrecision(3)
      );
      setTotal(total);
    } catch (error) {
      console.error("Error analyzing text:", error);
      setState("error");
    } finally {
      setIsScanning(false);
    }
  };

  const extractTextFromPage = async (): Promise<string> => {
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

  const manualParseResponse = (response: string): IResponse | null => {
    try {
      const lines = response.split("\n").filter((line) => line.trim());

      const scores: Record<string, number> = {};
      const descriptions: Record<string, string> = {};

      let currentCategory = "";

      for (const line of lines) {
        const scoreMatch = line.match(/^(\d+)\.\s+([\w\s]+):\s+(\d+)\/10/);
        if (scoreMatch) {
          const [, , categoryName, score] = scoreMatch;
          currentCategory = categoryName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "");
          scores[currentCategory] = parseInt(score, 10);
          continue;
        }

        if (currentCategory) {
          descriptions[currentCategory] =
            (descriptions[currentCategory] || "") + " " + line.trim();
        }
      }

      const mappedScores: Record<string, number> = {};
      const mappedDescriptions: Record<string, string> = {};

      for (const category of categories) {
        mappedScores[category] = scores[category] || 0;
        mappedDescriptions[category] =
          descriptions[category] || "No details provided.";
      }

      return {
        scores: mappedScores,
        description: mappedDescriptions,
      };
    } catch (error) {
      console.error("Error during manual parsing:", error);
      return null;
    }
  };

  const analyzePage = async () => {
    setIsScanning(true);
    try {
      const text = await extractTextFromPage();
      if (!text) {
        setState("not found");
        return;
      }

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

      const response = await fetch(apiUrl, { method: "POST", headers, body });
      const data = await response.json();

      console.log("Raw OpenAI Response:", data);

      const responseContent = data.choices[0]?.message?.content || "";

      let parsedJson: IResponse | null = null;

      try {
        parsedJson = JSON.parse(responseContent);
      } catch {
        console.warn(
          "Response is not valid JSON. Attempting manual parsing..."
        );
        parsedJson = manualParseResponse(responseContent);
      }

      if (!parsedJson) {
        console.error("Failed to parse OpenAI response.");
        setState("error");
        return;
      }

      setResponse(parsedJson);
      setState("found");

      const total = parseFloat(
        (
          (categories.reduce((sum, c) => sum + parsedJson.scores[c], 0) /
            categories.length) *
          10
        ).toPrecision(3)
      );
      setTotal(total);
    } catch (error) {
      console.error("Error analyzing page:", error);
      setState("error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="container">
      {isScanning ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Analyzing... Please wait.</p>
        </div>
      ) : (
        <>
          <header className="header">
            <h1>Policy Check Extension</h1>
            <p>Analyze privacy policies effortlessly!</p>
          </header>

          <div className="main-content">
            {state === "found" && response && total ? (
              <div className="result-container">
                <button className="back-button" onClick={() => setState("")}>
                  Back
                </button>
                <h2>Overall Score: {total}%</h2>
                <div className="metrics-grid">
                  {categories.map((c) => (
                    <div key={c} className="metric-item">
                      <h4>{labels[c]}</h4>
                      <p>Score: {response.scores[c]}</p>
                      <p>{response.description[c]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : state === "not found" ? (
              <p>No privacy policy found on this page.</p>
            ) : (
              <div>
                {activeTab === "scan" && (
                  <button className="option-button" onClick={analyzePage}>
                    Scan Current Page
                  </button>
                )}
                {activeTab === "upload" && (
                  <div>
                    <input
                      type="file"
                      accept=".txt,.docx,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {state === "" && (
            <nav className="bottom-nav">
              <button onClick={() => setActiveTab("scan")}>🔍 Analyze</button>
              <button onClick={() => setActiveTab("url")}>🌐 URL</button>
              <button onClick={() => setActiveTab("upload")}>📄 Upload</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default App;
