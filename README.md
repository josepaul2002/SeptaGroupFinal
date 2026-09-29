# Septa Group website

This package contains the complete React frontend, FastAPI backend, deployment files, compiled site and installer. Read `UPDATE-NOTES.md` for the current release.

For Jose's current Mac installation, download and extract `septa-profiles-security-update.zip` into Downloads, then stop the old server and run:

```bash
bash ~/Downloads/septa-profiles-security-update/update-and-run.sh ~/Downloads/septa-polish-update/site
```

The installer keeps the selected site's `.env`, MongoDB, local uploads and Python environment. The final path must point to the site with your working `.env` and media files. Leave Terminal open and visit http://localhost:8000/admin.

For a fresh local install, run `bash launch-local.sh` from inside the extracted `site` folder. It creates local configuration and connects to localhost MongoDB. Public deployment requires the Google Workspace, persistent database and cloud media configuration in `DEPLOYMENT.md`. Never commit `.env` or credentials.
