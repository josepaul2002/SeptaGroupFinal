# Septa standalone website for a Mac

This ZIP is a complete website source and compiled frontend. It runs directly. Do not use `apply-update.sh` for a fresh folder.

1. Download `septa-standalone-run-me.zip` into Downloads. Wait for the file to finish downloading before opening Terminal.
2. Stop any Septa server running in another terminal with Control-C.
3. Run:

```bash
unzip -o ~/Downloads/septa-standalone-run-me.zip -d ~/Downloads
bash ~/Downloads/septa-site/launch-local.sh
```

Keep that terminal open. Open http://localhost:8000/ to see the site or http://localhost:8000/admin to sign in.

The launcher creates `.env` only if you do not already have one. Its defaults connect to the existing local MongoDB database at `localhost:27017 / septa`. A previously created admin account and site content in that database remain intact. Sign in with that admin email and password. If MongoDB has no admin accounts, the launcher asks you to create an owner account privately in Terminal; it stores only the password hash in MongoDB.

The launcher uses Python 3.10–3.13 and installs the Python requirements in this folder’s `.venv` if needed. The compiled frontend is included, so Node and npm are not needed to view the site. Subsequent starts use the same command `bash ~/Downloads/septa-site/launch-local.sh`. The first start needs access to install Python dependencies.

If MongoDB was stopped, start your existing local MongoDB service, then rerun the launcher. If the old website used a different database address or name, edit the generated `.env` settings before starting; do not create a new account in the wrong database.

Site content and admin accounts stored in MongoDB survive deleting a source folder. Locally uploaded photos and videos live in the old folder’s `backend/uploads`, outside MongoDB. If that folder was deleted, recover it from Trash or a backup, or upload those files again in admin. This ZIP cannot recreate deleted media. Email delivery, password recovery and email-code login require the previous Resend configuration to be restored into `.env`; the new local file leaves them disabled by default.
