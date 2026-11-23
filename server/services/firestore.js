const crypto = require('crypto');
const admin = require('firebase-admin');

const firestore = () => admin.firestore();

const timestampToISO = (value) => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    return new Date(value).toISOString();
};

const documentData = (snapshot) => {
    if (!snapshot.exists) return null;
    const data = snapshot.data();
    return {
        ...data,
        _id: snapshot.id,
        createdAt: timestampToISO(data.createdAt),
        updatedAt: timestampToISO(data.updatedAt)
    };
};

const users = () => firestore().collection('users');
const journeys = () => firestore().collection('journeys');

async function findUserByEmail(email) {
    const result = await users().where('email', '==', email.toLowerCase()).limit(1).get();
    return result.empty ? null : documentData(result.docs[0]);
}

async function getUser(id) {
    return documentData(await users().doc(id).get());
}

async function createUser(values) {
    const ref = users().doc();
    const emailKey = crypto.createHash('sha256').update(values.email.toLowerCase()).digest('hex');
    const emailRef = firestore().collection('userEmails').doc(emailKey);
    const now = new Date();
    const user = {
        ...values,
        email: values.email.toLowerCase(),
        travelPreference: values.travelPreference || 'balanced',
        savedPlaces: values.savedPlaces || [],
        createdAt: now,
        updatedAt: now
    };
    await firestore().runTransaction(async (transaction) => {
        const existingEmail = await transaction.get(emailRef);
        if (existingEmail.exists) {
            const error = new Error('User already exists');
            error.code = 'EMAIL_EXISTS';
            throw error;
        }
        transaction.create(ref, user);
        transaction.create(emailRef, { userId: ref.id });
    });
    return { ...user, _id: ref.id, createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

async function updateUser(id, values) {
    const ref = users().doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return null;
    await ref.update({ ...values, updatedAt: new Date() });
    return getUser(id);
}

async function createJourney(values) {
    const ref = journeys().doc();
    const now = new Date();
    const journey = {
        ...Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)),
        carbonSaved: values.carbonSaved ?? 0,
        preference: values.preference || 'balanced',
        legs: values.legs || [],
        createdAt: now,
        updatedAt: now
    };
    await ref.create(journey);
    return { ...journey, _id: ref.id, createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

async function getUserJourneys(userId) {
    const result = await journeys().where('user', '==', userId).get();
    return result.docs
        .map(documentData)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function deleteUserJourney(id, userId) {
    const ref = journeys().doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.data().user !== userId) return false;
    await ref.delete();
    return true;
}

module.exports = {
    findUserByEmail,
    getUser,
    createUser,
    updateUser,
    createJourney,
    getUserJourneys,
    deleteUserJourney
};
