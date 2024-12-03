# SOEN-321 Privacy Right and Consumer Protection Extension
## Project Description
The SOEN-321 Privacy Right and Consumer Protection Extension is a Chrome extension that helps users quickly understand website privacy policies. It analyzes policies across eight key areas, like how data is collected, shared, and secured, and gives clear scores and summaries.

Powered by the LLaMA3-8B-8192 AI model, the extension simplifies complex privacy policies, showing users what things like whether their data can be sold or deleted and if they have opt-out options.

## Demo
place demo here

## Team Members
| Name                               | Student ID            |
|------------------------------------|-----------------------|
| Hoang Minh Khoi Pham               | 40162551              |
| Michaël Gugliandolo                | 40213419              |
| Jessey Thach                       | 40210440              |
| Mahanaim Rubin Yo                  | 40178119              |
| Ahmad Elmahallawy                  | 40193418              |
| Clara Gagnon                       | 40208598              |
| Jean-Nicolas Sabatini-Ouellet      | 40207926              |


# How to run extension
1. Clone the repo
2. Go to https://console.groq.com/keys and register if you dont have an account.
3. After registering/sigining in, create a new API key and place it in a `.env` file inside `Information-Security` folder. The API key inside the `.env` file should be as follows
   - `VITE_APP_GROQ_API_KEY=YOUR_API_KEY`
5. Go into the Information-Security folder
6. Run the following commands
```
npm i
```
then, after the node_modules are installed, 
```
npm run build
```
6. Go to chrome extension website and click on "load unpacked" in the top left corner
7. load the `dist` folder - which is generated after the build command
8. Click on the Extension icon on the browser to test it out
9. Click on "Analyze Current Page" to analyze a page OR pass a url to scan it
