# Microsoft Entra ID SAML SSO and SCIM Directory Sync

This guide shows workspace admins how to configure SAML Single Sign-On (SSO) and SCIM Directory Sync in Microsoft Entra ID (formerly Azure AD).

## Prerequisites

- You are a workspace admin in Papermark.
- Your workspace has SAML/SCIM configured in **Settings → Security**.
- You have Microsoft Entra ID admin access.

---

## 1) Configure SAML SSO in Microsoft Entra ID

### 1. Create an Enterprise Application

1. Open **Microsoft Entra admin center**.
2. Go to **Enterprise applications**.
3. Select **New application**.
4. Choose **Create your own application** and name it.

### 2. Set up SAML

1. Open the new Enterprise Application.
2. Go to **Single sign-on**.
3. Select **SAML**.
4. In **Basic SAML Configuration**, set:
   - **Identifier (Entity ID)**: value shown in Papermark Security settings
   - **Reply URL (ACS URL)**: value shown in Papermark Security settings

### 3. Verify claim mappings

Ensure these claims are present:

| Claim | Value |
| --- | --- |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` | `user.mail` |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname` | `user.givenname` |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name` | `user.userprincipalname` |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname` | `user.surname` |

### 4. Copy App Federation Metadata URL

From the SAML setup page, copy the **App Federation Metadata URL**.

### 5. Complete SAML setup in Papermark

1. Go to **Settings → Security → SAML Single Sign-On**.
2. Click **Configure**.
3. Select **Microsoft Entra ID**.
4. Paste the App Federation Metadata URL and save.

---

## 2) Configure SCIM Directory Sync in Microsoft Entra ID

### 1. Create SCIM credentials in Papermark

1. Go to **Settings → Security → Directory Sync**.
2. Click **Configure**.
3. Select **Microsoft Entra ID**.
4. Save and copy:
   - **SCIM 2.0 Base URL**
   - **OAuth Bearer Token**

### 2. Configure provisioning in Entra

1. Open your Enterprise Application in Entra.
2. Go to **Provisioning**.
3. Set **Provisioning Mode** to **Automatic**.
4. Set:
   - **Tenant URL** = SCIM 2.0 Base URL
   - **Secret Token** = OAuth Bearer Token
5. Click **Test Connection**.
6. Click **Save**.

### 3. Enable user/group provisioning

1. In **Mappings**, verify Users (and optionally Groups) are enabled.
2. Set provisioning **Status** to **On**.
3. Save.
4. Assign users/groups to the app.

---

## Notes

- Initial Entra provisioning sync can take **20–40 minutes**.
- If you rotate the SCIM token, re-run **Test Connection** in Entra.
- For SAML sign-in errors, confirm Entity ID, ACS URL, and metadata are current.
