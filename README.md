# SimpliFeed

## An RSS reader without distractions

## Live at [simplifeed.org](https://simplifeed.org)

### Contributing

If you would like to contribute to SimpliFeed, please follow these steps:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them
4. Push your changes to your forked repository
5. Open a pull request to the main repository

We appreciate all contributions to the project and will review your pull request as soon as possible.

## Self Hosting

### Prerequisites

*   [Appwrite](https://appwrite.io/docs/installation) instance (Self-hosted or Cloud)
*   [Appwrite CLI](https://appwrite.io/docs/command-line#installation) installed and authenticated
*   Node.js installed

### Backend Setup (Appwrite)

1.  **Create a Project**: Create a new project in your Appwrite console. Note the **Project ID** and your **API Endpoint**.
2.  **Update Configuration**:
    *   Open `appwrite.json` and change `projectId` to your new Project ID. Change `endpoint` to your Appwrite endpoint.
    *   SimpliFeed uses hardcoded IDs for configuration. You will need to update these to match your environment.
    *   **Find and Replace**: Search the entire project for the default Project ID `67cccd44002cccfc9ae0` and replace it with your new Project ID.
    *   **Find and Replace**: Search the entire project for the default Endpoint `https://appwrite.liammasters.space/v1` and replace it with your Appwrite Endpoint.
3.  **Deploy Resources**:
    Run the following command to deploy the database, collections, buckets, and functions:
    ```bash
    appwrite push
    ```
    *Note: The Database, Collection, and Function IDs are defined in `appwrite.json` and `util/constants.js`. As long as you use `appwrite push` with the provided `appwrite.json`, these IDs will be preserved and do not need to be changed.*

4.  **Configure Function Environment Variables**:
    The functions require an API Key to interact with the database.
    *   Go to your Appwrite Console -> **Overview** -> **API Keys** and create a new API Key with read and write acess to database, functions, and storage.
    *   Go to **Functions**. For *each* function deployed:
        *   Go to **Settings** -> **Configuration** (or Environment Variables).
        *   Add a new variable: `APPWRITE_API_KEY` with the value of the API Key you just created.
        *   Redeploy the function to apply changes.
    
    Makefile contains targets for deploying each of the functions via CLI when you make updates. Make sure the IDs in the Makefile match the IDs in `appwrite.json` and throughout your project.

### Frontend Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Locally**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see your app.

3.  **Deploy to Your Preferred Platform**
    *   Push your updated code (with your Project ID and Endpoint) to a Git repository.
    *   Import the project into your preferred platform (e.g., Vercel, Netlify, GitHub Pages, etc.).
    *   Deploy!

