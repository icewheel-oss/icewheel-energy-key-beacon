# Icewheel Energy Key Beacon

**Important Notice:** For a more streamlined and up-to-date experience, we highly recommend using the Cloud Run function-based alternative available at [https://github.com/icewheel-oss/icewheel-energy-key-beacon-function](https://github.com/icewheel-oss/icewheel-energy-key-beacon-function). This alternative is significantly easier to deploy and includes the latest functionality.

---

# Icewheel Energy Key Beacon

**Live Demo:** [https://key-beacon.icewheel.dev/](https://key-beacon.icewheel.dev/)

*Note: This is a development environment and may be down due to ongoing development activities. Please try again later if it's unavailable.*

This project is for users of the **icewheel-energy** application who run it on a local device (like a PC, Mac, or Raspberry Pi).

To connect with Tesla's Fleet API, you need a publicly accessible web address to host a special public key. Since your `icewheel-energy` app runs locally, it doesn't have a public address. This project solves that problem.

It provides a simple, secure, and easy-to-deploy web application that acts as a public "beacon" for your key, making it visible to Tesla at the required `/.well-known/appspecific/com.tesla.3p.public-key.pem` path.

---

## How it Works

The process is simple:

1.  You generate a special public/private key pair on your own computer.
2.  You deploy this application to your Google Cloud account.
3.  You securely tell the deployed application what your **public key** is using Google's Secret Manager.
4.  The application serves the key at the required URL.
5.  You use the built-in tools to register your domain in **both of Tesla's regions (NA & EU)** and verify the registration was successful.

---

## Disclaimer

**IMPORTANT: Use at Your Own Risk.**

This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

By using this application, you acknowledge and agree that:

*   You are solely responsible for educating yourself on the proper and secure use of the Tesla Fleet API and any associated credentials.
*   You are responsible for the security of your Tesla API keys and client secrets. Do not expose them publicly or share them with unauthorized parties.
*   You understand the implications of interacting with the Tesla Fleet API and accept all risks associated with its use.
*   Icewheel LLC and its developers are not responsible for any loss, damage, or security breaches that may occur as a result of your use of this software or the Tesla Fleet API.

Always act responsibly and ensure you comply with all applicable laws and Tesla's terms of service.

---

## Before You Begin: Prerequisites

*   You must have a **Tesla Developer Account**. If you don't, you can create one at [developer.tesla.com](https://developer.tesla.com).
*   You need a **Google Cloud Account** with billing enabled. This project is designed to be deployed on Google Cloud Run, which has a generous free tier, but a billing account is required.
*   **Google Cloud SDK (`gcloud`)** (Optional): You only need this if you want to deploy the application from your command line. The instructions in this guide focus on deploying through the Google Cloud website, which does not require the `gcloud` SDK.
*   **Node.js and npm** (Optional): You only need this if you want to run the application locally for development or testing.

---

## Important: Configure Your Tesla App Correctly

In your Tesla Developer Portal, you must add URLs for **both** your local computer (for testing) and your final deployed app.

*   **Allowed Origin(s):**
    *   `http://localhost:8081`
    *   `https://your-final-cloud-run-url.a.run.app` (replace with your actual URL)
*   **Allowed Redirect URI(s):**
    *   `http://localhost:8081/api/tesla/fleet/auth/callback`
    *   `https://your-final-cloud-run-url.a.run.app/api/tesla/fleet/auth/callback`
*   **Allowed Returned URL(s):**
    *   `http://localhost:8081`
    *   `https://your-final-cloud-run-url.a.run.app` (replace with your actual URL)

---

## Part 1: Preparing Your Google Cloud Project

(This section is complete and correct)

---

## Configuring the Public Key

There are two ways to provide your `TESLA_PUBLIC_KEY` to the application:

**Option 1: Environment Variable (Simple)**

This is the simplest method and is suitable for most users. When you deploy the application, you will set an environment variable named `TESLA_PUBLIC_KEY` with your public key as the value.

**Option 2: Secret Manager (Recommended for Production)**

This method is more secure and is recommended for production environments. It involves storing your public key as a secret in Google Cloud's Secret Manager and then granting the Cloud Run service access to it.

While a public key is not a secret, using Secret Manager provides a centralized way to manage your configuration and is a good practice for production environments.

1.  **Create a new Google Cloud Project:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.
2.  **Enable the required APIs:**
    *   In your project, go to the "APIs & Services" dashboard.
    *   Enable the **Cloud Run API** and the **Secret Manager API**.
3.  **Create a Service Account:**
    *   Go to "IAM & Admin" > "Service Accounts".
    *   Create a new service account.
    *   Grant the service account the **Cloud Run Invoker** and **Secret Manager Secret Accessor** roles.

---

## Part 2: Deployment using the Google Cloud Website

This section explains how to deploy the application using the Google Cloud web interface. This method does not require the `gcloud` SDK.

1.  **Go to Cloud Run:**
    *   In the Google Cloud Console, navigate to "Cloud Run".
2.  **Create a new service:**
    *   Click "Create service".
    *   Select "Deploy one revision from an existing container image".
    *   For the container image, use the Docker image provided in this project's repository, or build and push your own.
    *   Give your service a name (e.g., `icewheel-energy-key-beacon`).
    *   Select the region where you want to deploy your service. It is recommended to choose the region closest to you to minimize latency.
3.  **Configure the service:**
    *   Under "Authentication", select "Allow unauthenticated invocations".
    *   Under "Container, Variables & Secrets", you need to provide your `TESLA_PUBLIC_KEY`. Choose one of the following methods:

        **Option 1: Using an Environment Variable**
        1.  Go to the "Variables & Secrets" tab.
        2.  Click "Add Variable".
        3.  Set the **Name** to `TESLA_PUBLIC_KEY`.
        4.  Set the **Value** to your Tesla public key.

        **Option 2: Using Secret Manager**
        1.  Go to the "Secrets" tab.
        2.  Click "Add Secret".
        3.  Grant the service account the **Secret Manager Secret Accessor** role if you haven't already.
        4.  Select the secret containing your `TESLA_PUBLIC_KEY`.
        5.  In the "Reference as" field, select "Exposed as environment variable".
        6.  For the environment variable name, enter `TESLA_PUBLIC_KEY`.

    *   Click "Create".

---

## Part 3: Post-Deployment Steps

### Step 1: Get Your Partner Authentication Token(s)

To interact with the Tesla API, you need a **Partner Authentication Token**. Because Tesla has separate regions (North America and Europe), you may need a separate token for each region, as the `audience` for the token is region-specific.

The application's UI provides two `curl` commands to generate these tokens. You will need to run these on your own computer.

**Important:**
*   Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with your actual credentials from the Tesla Developer Portal.
*   For registering or verifying in a specific region, it's best to use a token generated for that region's audience.

**North America Token:**
```bash
curl --request POST \
  --url 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=YOUR_CLIENT_ID' \
  --data-urlencode 'client_secret=YOUR_CLIENT_SECRET' \
  --data-urlencode 'scope=openid user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds energy_device_data energy_cmds offline_access' \
  --data-urlencode 'audience=https://fleet-api.prd.na.vn.cloud.tesla.com'
```

**Europe Token:**
```bash
curl --request POST \
  --url 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=YOUR_CLIENT_ID' \
  --data-urlencode 'client_secret=YOUR_CLIENT_SECRET' \
  --data-urlencode 'scope=openid user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds energy_device_data energy_cmds offline_access' \
  --data-urlencode 'audience=https://fleet-api.prd.eu.vn.cloud.tesla.com'
```

The command will return a JSON object. The value of the `access_token` field is the token you will copy and paste into the forms on the web app.

### Step 2: Using the Application

After deploying, navigate to the main URL of your application. The index page provides a complete workflow:

1.  **View Your Public Key:** Confirm that the application is correctly configured and serving your public key.
2.  **Register Your Domain:**
    *   Use the checkboxes to select the regions you want to register in (both are selected by default).
    *   Enter your domain and a valid Partner Token.
    *   Click "Register". The app will attempt to register your domain in all selected regions and show you the result for each.
3.  **Verify Registration:**
    *   Use the checkboxes to select the regions you want to verify (both are selected by default).
    *   Enter your domain and a valid Partner Token.
    *   Click "Verify". The app will check the status for all selected regions and show you the results.

### Step 3: Final URL

Your public key is available at: `https://[your-service-url]/.well-known/appspecific/com.tesla.3p.public-key.pem`

---

## A Note on Logging and Costs

*   **Logging:** This application does not produce any logs by default. However, you can view the request logs in the Google Cloud Console under "Cloud Run" > "Logs".
*   **Costs:** This application is designed to be very lightweight and should fall within the free tier of Google Cloud Run. However, be aware that you may incur small charges for network egress and other resources if you exceed the free tier.

---

## SSL Certificate

Google Cloud Run automatically provides and manages SSL certificates for your deployed services. This means that your application will be served over HTTPS, which is a requirement for registering your redirect URIs with Tesla.

---

## Resource Allocation

This application is very lightweight and does not require significant resources. When deploying to Google Cloud Run, you can configure the resources as follows:

*   **CPU:** By default, Cloud Run is configured to only allocate CPU during request processing. This is the most cost-effective option for this application, as it will be idle most of the time. You can select the lowest available CPU option (e.g., 1 vCPU).
*   **Memory:** 256 MiB is sufficient for this application.
