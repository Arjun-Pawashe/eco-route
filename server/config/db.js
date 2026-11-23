const admin = require('firebase-admin');

const connectDB = async () => {
    try {
        if (!admin.apps.length) {
            const {
                FIREBASE_PROJECT_ID,
                FIREBASE_CLIENT_EMAIL,
                FIREBASE_PRIVATE_KEY
            } = process.env;
            const hasServiceAccount = Boolean(
                FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY
            );
            const hasPartialServiceAccount = Boolean(
                FIREBASE_PROJECT_ID || FIREBASE_CLIENT_EMAIL || FIREBASE_PRIVATE_KEY
            );

            if (hasPartialServiceAccount && !hasServiceAccount) {
                throw new Error('Set all of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
            }

            if (hasServiceAccount) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: FIREBASE_PROJECT_ID,
                        clientEmail: FIREBASE_CLIENT_EMAIL,
                        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    }),
                    projectId: FIREBASE_PROJECT_ID
                });
            } else {
                if (
                    !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
                    !process.env.FIRESTORE_EMULATOR_HOST &&
                    !process.env.GCLOUD_PROJECT &&
                    !process.env.K_SERVICE &&
                    !process.env.GAE_ENV
                ) {
                    throw new Error(
                        'Firebase credentials are required. Set service account variables, GOOGLE_APPLICATION_CREDENTIALS, or configure the Firestore emulator.'
                    );
                }
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    ...(process.env.GCLOUD_PROJECT
                        ? { projectId: process.env.GCLOUD_PROJECT }
                        : {})
                });
            }
        }

        admin.firestore();
        console.log('Firebase Firestore initialized successfully!');
    } catch (error) {
        console.error('Firebase initialization failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;