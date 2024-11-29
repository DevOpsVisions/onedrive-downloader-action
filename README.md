# Download Backup File

This action downloads a file from OneDrive and outputs its file name.

## Inputs

### `azure_client_id`

**Required** The Azure Client ID.

### `azure_client_secret`

**Required** The Azure Client Secret.

### `azure_tenant_id`

**Required** The Azure Tenant ID.

### `onedrive_link`

**Required** The OneDrive shareable link for the file to be downloaded.

## Outputs

### `file_name`

The name of the downloaded file.

## Example usage

```yaml
uses: DevOpsVisions/onedrive-downloader-action@v1
with:
  azure_client_id: ${{ secrets.AZURE_CLIENT_ID }}
  azure_client_secret: ${{ secrets.AZURE_CLIENT_SECRET }}
  azure_tenant_id: ${{ secrets.AZURE_TENANT_ID }}
  onedrive_link: ${{ secrets.ONEDRIVE_LINK }}
