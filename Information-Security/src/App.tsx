import { useState } from "react";
import "./App.css";
import {
  categories,
  labels,
  extractTextFromPrivacyPage,
  fetchApi,
  extractTextFromPrivacyUrl,
  IResponse,
} from "./utils/apiUtils";

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [state, setState] = useState<"error" | "found" | "not found" | "links found" | "">("");
  const [response, setResponse] = useState<IResponse | null>(null);
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("scan");

  const analyzeContent = async (getPageText: () => Promise<string | null>) => {
    setIsScanning(true);
    try {
      const pageText = await getPageText();
      if (!pageText) {
        setState("not found");
        return;
      }

      console.log("API:", pageText);
      const parsedJson = await fetchApi(pageText);
      console.log(parsedJson);

      if (parsedJson) {
        setResponse(parsedJson);
        setState("found");
      } else {
        setState("error");
      }
    } catch (error) {
      console.error("Error analyzing page:", error);
      setState("error");
    } finally {
      setIsScanning(false);
    }
  };

  const analyzePage = async () => {
    await analyzeContent(extractTextFromPrivacyPage);
  };

  const analyzeUrl = async () => {
    if (!url) {
      setState("error");
      return;
    }
    await analyzeContent(() => extractTextFromPrivacyUrl(url));
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
            {state === "found" && response !== null ? (
              <div className="result-container">
                <button className="back-button" onClick={() => setState("")}>
                  Back
                </button>
                <div className="top-metrics">
                  <div className="circle-metric">
                    <div
                      className="circle"
                      style={{
                        borderColor: response.summary?.overallScore <= 4 ? "#f44336" : response.summary?.overallScore < 7 ? "#ff9800" : "#4caf50",
                      }}
                    >
                      {response.summary?.overallScore}
                    </div>
                    <div className="summary">
                      <p><strong>Overall Evaluation:</strong> {response.summary?.overallEvaluation}</p>
                      <p><strong>Pros:</strong></p>
                      <ul>
                        {response.summary?.pros?.map((pro, index) => (
                          <li key={index}>{pro}</li>
                        ))}
                      </ul>
                      <p><strong>Cons:</strong></p>
                      <ul>
                        {response.summary?.cons?.map((con, index) => (
                          <li key={index}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="metrics-grid">
                  {categories.map((category) => (
                    <div key={category} className="metric-item">
                      <h4>{labels[category]}</h4>
                      <p>Score: {response.scores[category]}</p>
                      <p>{response.description[category]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : state === "not found" ? (
              <p>No privacy policy found on this page.</p>
            ) : state === "links found" ? (
              <p>Privacy or Terms link found. Extracting content...</p>
            ) : (
              <div>
                {activeTab === "scan" && (
                  <button className="option-button" onClick={analyzePage}>
                    Scan Current Page
                  </button>
                )}
                {activeTab === "url" && (
                  <div className="input-container">
                    <input
                      type="url"
                      placeholder="Enter URL"
                      className="input-field"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <button className="input-button" onClick={analyzeUrl}>
                      Check URL
                    </button>
                  </div>
                )}
                {activeTab === "upload" && (
                  <div>
                    <input
                      type="file" />
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
