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

### Backend

SimpliFeed uses [appwrite](https://appwrite.io/) as the backend. 
In order to self host, you will have to sign up for an appwrite account or self host the appwrite backend.
Set up for self hosting appwrite is fairly simple and documentation can be [found here](https://appwrite.io/docs/advanced/self-hosting).

SimpliFeed uses 2 databases with the following schemas:
```
Feeds Database
|_
  News Collection 
  |_
    Feed Record
    |_ (String) user_id
    |_ (URL) url
```
```
Users Database
|_
  Pro Users Collection
  |_
    User Record
    |_ (String) user_id
```
It also uses 2 serverless functions, the code for each can be found in `functions`.
The AI summary function requires an appwrite API key and an OpenAI API key.
The appwrite API key can be generated from the project dashboard. You will need to
create an OpenAI account and then [generate a key here](https://platform.openai.com/api-keys).
These can then be entered as environment variables in the settings page for the serverless
function.

### Frontend

Once appwrite is correctly configured you will need to update the file `util/constants.js`.
The values should be assigned as follows:
```
export const APPWRITE_CONFIG = {
    ENDPOINT: The API URL where your appwrite backend is hosted (typically https://cloud.appwrite.io/v1,
    PROJECT: Your appwrite project ID,
    FEEDS_DB: Your feeds database ID,
    USERS_DB: Your users database ID,
    NEWS: Your news collection ID,
    FETCH_ARTICLES: Your get_articles serverless function ID,
    PRO_USERS: Your pro users collection ID,
    SUMMARIZE_ARTICLE: Your summarize_article serverless function ID,
};
```

### Hosting

With the application configured, you can now host your frontend however you prefer.
An easy option is [vercel](https://vercel.com). Once you've chosen your hosting
option, you will need to add it as a platform in you appwrite project. From your
project dashboard, under "Integrations" select "Add Platform" and enter the URL
where your frontend is hosted (eg. your-app.vercel.app or *.yourwebsite.com).
The wildcard is useful if you're using a custom domain and use multiple subdomains.

### You're done!

You should now be self hosting SimpliFeed! This guide is a work in progress, so if
you hit any snags in the process feel free to create an issue here in GitHub.
