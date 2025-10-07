# Google Cloud Platform Setup for omX

This guide explains how to set up Google Cloud Platform integration for omX, including creating a service account and configuring OAuth authentication.

## Overview

omX integrates with Google Cloud Platform to allow users to:
- Connect their Google accounts via OAuth 2.0
- Browse their accessible GCP projects and storage buckets
- Link buckets to omX projects for data management
- Use omX service account for secure bucket operations

## Prerequisites

- A Google Cloud Platform account with appropriate permissions
- Access to the Google Cloud Console
- Admin access to your omX deployment

## Step 1: Create omX Service Account

1. Open the [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project for hosting the omX service account
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Fill in the details:
   - **Service account name**: `omx-service`
   - **Service account ID**: `omx-service` (will become `omx-service@your-project.iam.gserviceaccount.com`)
   - **Description**: `Service account for omX data synchronization`
6. Click **Create and Continue**
7. Skip the optional role assignment (we'll handle this per-project)
8. Click **Done**

## Step 2: Generate Service Account Key

1. Find your newly created service account in the list
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON** format
6. Click **Create**
7. Save the downloaded JSON file securely - this contains your private key

## Step 3: Set up Google OAuth 2.0

1. In the Google Cloud Console, navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in required fields:
     - App name: `omX`
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/cloud-platform.read-only`
     - `https://www.googleapis.com/auth/devstorage.read_only`
4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `omX OAuth Client`
   - Authorized redirect URIs:
     - `http://localhost:8000/api/auth/google/callback` (development)
     - `https://your-domain.com/api/auth/google/callback` (production)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## Step 4: Configure omX Backend

Create or update your `.env` file with the following configuration:

```bash
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# omX Service Account Configuration
OMX_SERVICE_ACCOUNT_EMAIL=omx-service@your-project.iam.gserviceaccount.com
OMX_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account-key.json

# Existing GCS configuration (keep for backward compatibility)
GCS_PROJECT_ID=your-default-project-id
GCS_CREDENTIALS_PATH=/path/to/service-account-key.json

# Frontend service account display (optional but recommended)
VITE_OMX_SERVICE_ACCOUNT_EMAIL=omx-service@your-project.iam.gserviceaccount.com

# Token storage
# Google OAuth access/refresh tokens are stored encrypted using SECRET_KEY. Rotate SECRET_KEY to
# invalidate stored tokens if necessary.
```

## Step 5: Install Required Dependencies

Make sure your backend has the required Python packages:

```bash
pip install google-cloud-storage google-auth google-auth-oauthlib google-cloud-resource-manager google-api-python-client
```

## Step 6: User Workflow for Connecting Buckets

When users want to connect a bucket to omX:

1. **User Authentication**: Users sign in with their Google account via OAuth
2. **Project Selection**: omX displays their accessible GCP projects
3. **Bucket Selection**: omX shows storage buckets in the selected project
4. **Service Account Permission**: Users must grant access to omX service account:
   - Go to GCP Console → **IAM & Admin** → **IAM**
   - Click **Grant Access**
   - Add principal: `omx-service@your-project.iam.gserviceaccount.com`
   - Assign role: **Storage Admin** (or **Storage Object Admin** for read-only)
   - Click **Save**
5. **Verification**: omX verifies the service account has proper access
6. **Connection**: Bucket is linked to the omX project

## Security Considerations

### Service Account Security
- Store the service account key file securely with restricted access
- Use environment variables for configuration, never commit keys to source control
- Consider using Google Cloud Secret Manager for production deployments
- Regularly rotate service account keys

### OAuth Security
- Use HTTPS in production for OAuth redirect URIs
- Validate OAuth state parameters to prevent CSRF attacks
- Store OAuth tokens securely and implement proper refresh logic
- Consider token expiration and refresh token rotation

### Access Control
- The omX service account should only be granted access to buckets users explicitly authorize
- Users maintain full control over which projects/buckets omX can access
- Implement audit logging for service account operations

## Troubleshooting

### Common Issues

1. **OAuth redirect mismatch**
   - Ensure redirect URIs in Google Console match your backend configuration
   - Check for trailing slashes and protocol (http vs https)

2. **Service account permission denied**
   - Verify the service account email is correct
   - Ensure users have granted Storage Admin role to the service account
   - Check that the service account key file is accessible and valid

3. **API quota exceeded**
   - Enable required APIs in Google Cloud Console:
     - Cloud Resource Manager API
     - Cloud Storage API
   - Check API quotas and limits

4. **Invalid credentials**
   - Verify service account key file format and permissions
   - Ensure OAuth client credentials are correct
   - Check that APIs are enabled for your project

### Testing the Setup

1. Start your omX backend
2. Open the frontend and navigate to project data view
3. Click "Connect GCP"
4. Test the OAuth flow by signing in with Google
5. Verify you can see your projects and buckets
6. Test linking a bucket after granting service account access

## Production Deployment

For production deployments:

1. Use a dedicated GCP project for the omX service account
2. Set up proper DNS and SSL certificates
3. Update OAuth redirect URIs to use your production domain
4. Store sensitive configuration in secure secret management
5. Set up monitoring and logging for OAuth and API operations
6. Implement proper backup and disaster recovery procedures

## Support

If you encounter issues during setup:

1. Check the omX backend logs for detailed error messages
2. Verify all configuration values are correct
3. Test OAuth flow manually using Google's OAuth playground
4. Ensure all required GCP APIs are enabled
5. Check IAM permissions for both users and service accounts

For additional support, please refer to the omX documentation or contact the development team.
