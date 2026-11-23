# EcoRoute server

The API persists user profiles and journeys in Cloud Firestore through the Firebase Admin SDK.

## Configure Firestore

1. Create a Firebase project and create its Firestore database.
2. Create a service account with permission to read and write Firestore.
3. Configure the server environment using one of these options:
   - Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (Render and other managed hosts). Preserve the private key's newlines as `\n`.
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON file path for local development.
   - Set `FIRESTORE_EMULATOR_HOST` and `GCLOUD_PROJECT` to use the local Firestore emulator.
4. Set `JWT_SECRET` and the Mappls variables as before, then run `npm install` and `npm start`.

The Admin SDK accesses Firestore from the server; service-account credentials must never be placed in the React client's environment.

The server stores profiles in `users`, email uniqueness records in `userEmails`, and journeys in `journeys`. Existing MongoDB records are not copied automatically; migrate them separately before removing the old database if they need to be retained.
