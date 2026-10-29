# One-time Azure provisioning for VidyaVerse (App Service on Linux, Node 22).
# Usage:  az login ; ./infra/provision-azure.ps1 [-Location centralindia] [-AppName vidyaverse]
param(
  [string]$AppName = "vidyaverse",
  [string]$ResourceGroup = "vidyaverse-rg",
  [string]$Plan = "vidyaverse-plan",
  [string]$Location = "centralindia",
  [string]$Sku = "B1"
)
# az writes warnings to stderr, which PowerShell 5.1 treats as errors under "Stop"; rely on exit codes instead
$ErrorActionPreference = "Continue"
function az { & az.cmd @args; if ($LASTEXITCODE -ne 0) { throw "az $($args[0..2] -join ' ') failed" } }

az group create --name $ResourceGroup --location $Location | Out-Null
az appservice plan create --name $Plan --resource-group $ResourceGroup --is-linux --sku $Sku | Out-Null
az webapp create --name $AppName --resource-group $ResourceGroup --plan $Plan --runtime "NODE:22-lts" | Out-Null
az webapp config set --name $AppName --resource-group $ResourceGroup --startup-file "node server.js" --always-on true --http20-enabled true --min-tls-version 1.2 --ftps-state Disabled | Out-Null
az webapp update --name $AppName --resource-group $ResourceGroup --https-only true | Out-Null

# Non-secret settings; add the secrets (MONGODB_URI, AUTH_SECRET, ...) in the portal or with `az webapp config appsettings set`
az webapp config appsettings set --name $AppName --resource-group $ResourceGroup --settings `
  NODE_ENV=production HOSTNAME=0.0.0.0 WEBSITES_PORT=8080 PORT=8080 AUTH_TRUST_HOST=true `
  "APP_DOMAIN=$AppName.azurewebsites.net" SCM_DO_BUILD_DURING_DEPLOYMENT=false | Out-Null

# Basic-auth publishing credentials are required for the publish-profile deploy used by CI
az resource update --resource-group $ResourceGroup --namespace Microsoft.Web --resource-type basicPublishingCredentialsPolicies --parent "sites/$AppName" --name scm --set properties.allow=true | Out-Null

Write-Host "`nApp:      https://$AppName.azurewebsites.net"
Write-Host "Publish profile (paste into the GitHub secret AZURE_WEBAPP_PUBLISH_PROFILE):"
az webapp deployment list-publishing-profiles --name $AppName --resource-group $ResourceGroup --xml
