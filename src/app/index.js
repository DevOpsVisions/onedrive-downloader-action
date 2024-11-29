const core = require("@actions/core");
const axios = require("axios");
const fs = require("fs");

/**
 * Retrieves an access token from Azure AD using client credentials.
 * 
 * @param {string} clientId - The Azure AD client ID.
 * @param {string} clientSecret - The Azure AD client secret.
 * @param {string} tenantId - The Azure AD tenant ID.
 * @returns {Promise<string>} - A promise that resolves to the access token.
 * @throws {Error} - Throws an error if the token retrieval fails.
 */
async function getAccessToken(clientId, clientSecret, tenantId) {
    try {
        const authResponse = await axios.post(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: clientId,
                scope: "https://graph.microsoft.com/.default",
                client_secret: clientSecret,
                grant_type: "client_credentials",
            })
        );
        return authResponse.data.access_token;
    } catch (error) {
        throw new Error(`Failed to retrieve the access token: ${error.message}`);
    }
}

/**
 * Fetches metadata for a file from OneDrive using Microsoft Graph API.
 * 
 * @param {string} token - The access token for Microsoft Graph API.
 * @param {string} onedriveLink - The OneDrive link to the file.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the download URL and file name.
 * @throws {Error} - Throws an error if the metadata retrieval fails.
 */
async function getFileMetadata(token, onedriveLink) {
    try {
        const encodedUrl = Buffer.from(onedriveLink)
            .toString("base64")
            .replace(/\//g, "_")
            .replace(/\+/g, "-")
            .replace(/=+$/, "");
        const metadataResponse = await axios.get(
            `https://graph.microsoft.com/v1.0/shares/u!${encodedUrl}/driveItem`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return {
            downloadUrl: metadataResponse.data["@microsoft.graph.downloadUrl"],
            fileName: metadataResponse.data.name,
        };
    } catch (error) {
        throw new Error(`Failed to retrieve file metadata: ${error.message}`);
    }
}

/**
 * Downloads a file from the given URL and saves it locally.
 * 
 * @param {string} downloadUrl - The URL to download the file from.
 * @param {string} fileName - The name to save the file as.
 * @returns {Promise<void>} - A promise that resolves when the file is downloaded.
 * @throws {Error} - Throws an error if the file download fails.
 */
async function downloadFile(downloadUrl, fileName) {
    try {
        const writer = fs.createWriteStream(fileName);
        const fileResponse = await axios.get(downloadUrl, { responseType: "stream" });
        fileResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    } catch (error) {
        throw new Error(`Failed to download the file: ${error.message}`);
    }
}

/**
 * Main function to run the GitHub Action.
 * 
 * @returns {Promise<void>} - A promise that resolves when the action completes.
 */
async function run() {
    try {
        // Get inputs
        const clientId = core.getInput("azure_client_id");
        const clientSecret = core.getInput("azure_client_secret");
        const tenantId = core.getInput("azure_tenant_id");
        const onedriveLink = core.getInput("onedrive_link");

        // Validate inputs
        if (!clientId || !clientSecret || !tenantId || !onedriveLink) {
            throw new Error("Missing required inputs.");
        }

        // Step 1: Authenticate and get token
        const token = await getAccessToken(clientId, clientSecret, tenantId);
        core.info("Access token retrieved successfully.");

        // Step 2: Fetch file metadata
        const { downloadUrl, fileName } = await getFileMetadata(token, onedriveLink);
        if (!downloadUrl) {
            throw new Error("Failed to retrieve download URL.");
        }
        core.info(`File name: ${fileName}`);

        // Step 3: Download the file
        await downloadFile(downloadUrl, fileName);
        core.info("File downloaded successfully.");
        core.setOutput("file_name", fileName); // Provide output for file name
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();