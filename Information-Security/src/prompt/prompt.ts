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
    dataUsage: "Data Usage",
    dataSharing: "User Sharing",
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
        "A clear positive aspect of a specific category, explained with an example or reason.",
        "A focused, specific strength tied to a high score in a category.",
        "Any additional detail that stands out"
      ],
      "cons": [
        "A specific weakness tied to a low score in a category",
        "Clear, actionable feedback on what could improve the policy.",
        "Any noticeable omissions or areas lacking detail."
      ],
      },
    }
      This is just an example and you can have more or fewer lists of pros and cons based on the policy.
      The response should be a complete and valid JSON object. Do not provide the score in the description part. If there is any issue with the formatting or missing brackets, please ensure the JSON is well-formed and contains all necessary closing brackets. Return **only** the JSON output and nothing else.
  
    Analyze this text:
    "${text}"
    
    Return only valid JSON and nothing else.
  `;
