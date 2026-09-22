# 🚀 Deploying Brain Cloud License Hub to Vercel (100% Free)

This guide walks you through deploying your **Brain Cloud License Hub** to Vercel in **less than 2 minutes**, allowing you to monitor and manage all 10+ client workstations from your phone or laptop.

---

## ⚡ Option 1: Fast Deploy via Vercel CLI (Recommended)

Since the Vercel CLI is already installed on your machine, you can deploy directly from your terminal:

1. Open PowerShell or Command Prompt.
2. Navigate to the portal directory:
   ```powershell
   cd "E:\D & H\DP\cloud_license_portal"
   ```
3. Run the Vercel deploy command:
   ```powershell
   vercel
   ```
4. Follow the 4 quick prompts:
   - *Set up and deploy?* $\rightarrow$ **Y**
   - *Which scope?* $\rightarrow$ Select your Vercel account
   - *Link to existing project?* $\rightarrow$ **N**
   - *What's your project's name?* $\rightarrow$ `brain-license-hub` (or your choice)
   - *In which directory is your code located?* $\rightarrow$ `./`
5. Vercel will output your live URL:
   ```text
   🎉 Production: https://brain-license-hub.vercel.app
   ```

---

## 🌐 Option 2: Deploy via GitHub + Vercel Dashboard

1. Push the `cloud_license_portal` directory to a new private GitHub repository (e.g. `brain-license-hub`).
2. Log into [vercel.com](https://vercel.com).
3. Click **"Add New..." $\rightarrow$ "Project"**.
4. Select your `brain-license-hub` repository and click **Deploy**.
5. Your live URL is generated automatically in 60 seconds!

---

## 🗄️ Setting Up Free Supabase PostgreSQL Database (Optional but Recommended)

By default, the portal runs with a built-in local store. Connecting a free Supabase database gives you permanent, high-availability cloud storage:

1. Go to [supabase.com](https://supabase.com) and create a **Free Account**.
2. Click **"New Project"** (e.g. `Brain-Licensing`).
3. In Supabase, go to **SQL Editor $\rightarrow$ New Query**:
   - Open and copy the SQL code from [`supabase_schema.sql`](file:///E:/D%20&%20H/DP/cloud_license_portal/supabase_schema.sql).
   - Paste it into the editor and click **Run**.
4. Go to **Project Settings $\rightarrow$ API**:
   - Copy **Project URL**
   - Copy **service_role secret key** (under Project API Keys)
5. In your Vercel Project Settings $\rightarrow$ **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = *(Your Supabase URL)*
   - `SUPABASE_SERVICE_ROLE_KEY` = *(Your Supabase service_role key)*
   - `VENDOR_SECRET` = `DH_MEDISURG_SECURE_KERNEL_NODE_LOCK_2026_X91A_OFFLINE`
   - `ADMIN_PASSWORD` = *(Your chosen dashboard password)*

Click **Save** and redeploy. All client records and heartbeats are now backed up in the cloud forever.

---

## 🔗 Connecting Brain Workstations to Your Cloud Server

Once your Vercel URL is live (e.g. `https://brain-license-hub.vercel.app`):

### In Brain Workstation (Settings UI):
1. On the client machine or server, open Brain.
2. Go to **Settings $\rightarrow$ License**.
3. Under **Cloud Sync Endpoint**, enter your Vercel URL:
   `https://brain-license-hub.vercel.app`
4. Click **"Save & Test Sync"**.

### Automatic Background Operation:
* Brain will ping your Vercel server every 6 hours silently.
* When you extend a client's license on your phone via the Vercel dashboard, their workstation automatically receives the renewal key and updates `license.lic` on disk.
* If a workstation is offline, it continues running without interruption using the local license.
