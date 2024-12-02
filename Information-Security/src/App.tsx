import { useState } from "react";
import "./App.css";
import {
  extractTextFromPrivacyPage,
  fetchApi,
  extractTextFromPrivacyUrl,
  IResponse,
} from "./utils/apiUtils";

import { categories, labels } from "./prompt/prompt";
function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [state, setState] = useState<
    "error" | "found" | "not found" | "links found" | ""
  >("");
  const [response, setResponse] = useState<IResponse | null>(null);
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("scan");
  const [total, setTotal] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

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
        const totalScore = categories.reduce(
          (sum, category) => sum + parsedJson.scores[category],
          0
        );
        setTotal(
          Math.ceil(
            (totalScore / categories.length).toFixed(2) as unknown as number
          )
        );
      } else {
        setState("error");
        setErrorMessage(
          "An unexpected error occurred. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error analyzing page:", error);
      setState("error");
      console.log("ErrorMessage Set:", errorMessage); // Log right after setting

      setErrorMessage("An unexpected error occurred. Please try again later.");
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
      setErrorMessage("An unexpected error occurred. Please try again later.");

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
            {(state === "found" && response !== null) ||
              (state === "error" && (
                <button className="back-button" onClick={() => setState("")}>
                  ← Back
                </button>
              ))}
            <h1>Policy Check Extension</h1>
            <p>Analyze privacy policies effortlessly!</p>
          </header>

          <div className="main-content">
            {state === "error" && (
              <div className="error-message">
                <p>{errorMessage}</p>
              </div>
            )}
            {state === "found" && response && total !== null ? (
              <div className="result-container">
                <div className="top-metrics">
                  <div className="circle-metric">
                    <div
                      className="circle"
                      style={{
                        borderColor:
                          total <= 4
                            ? "#f44336"
                            : total < 8
                            ? "#ff9800"
                            : "#4caf50",
                      }}
                    >
                      <strong>{total}/10</strong>
                    </div>
                    <div className="summary">
                      <p>
                        <strong>Overall Evaluation:</strong>{" "}
                        {response.summary?.overallEvaluation}
                      </p>
                      <p>
                        <strong>Pros:</strong>
                      </p>
                      <ul>
                        {response.summary?.pros?.map((pro, index) => (
                          <li key={index}>
                            <p>{pro}</p>
                          </li>
                        ))}
                      </ul>
                      <p>
                        <strong>Cons:</strong>
                      </p>
                      <ul>
                        {response.summary?.cons?.map((con, index) => (
                          <li key={index}>
                            <p>{con}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="metrics-grid">
                  {categories.map((category) => (
                    <div
                      key={category}
                      className="metric-item"
                      style={{
                        borderColor:
                          response.scores[category] <= 4
                            ? "#f44336"
                            : response.scores[category] < 8
                            ? "#ff9800"
                            : "#4caf50",
                      }}
                    >
                      <div className="circle-metric">
                        <div
                          className="circle"
                          style={{
                            borderColor:
                              response.scores[category] <= 4
                                ? "#f44336"
                                : response.scores[category] < 8
                                ? "#ff9800"
                                : "#4caf50",
                          }}
                        >
                          <span className="circle-text">
                            <strong>{response.scores[category]}</strong>
                            <strong>/10</strong>
                          </span>
                        </div>
                        <strong>
                          <p className="circle-label">{labels[category]}</p>
                        </strong>
                      </div>
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
                    Analyze Current Page
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
              </div>
            )}
          </div>

          <nav className="bottom-nav">
            <button onClick={() => setActiveTab("scan")}>🔍 Analyze</button>
            <button onClick={() => setActiveTab("url")}>🌐 URL</button>
          </nav>
        </>
      )}
    </div>
  );
}

export default App;
