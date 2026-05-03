import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import * as functions from "firebase-functions/v1";


// google drive
import { google } from "googleapis"; // Add this at the top


// Ensure these match your firebase secrets:set names
const driveClientId = defineSecret("DRIVE_CLIENT_ID");
const driveClientSecret = defineSecret("DRIVE_CLIENT_SECRET");
const driveRefreshToken = defineSecret("DRIVE_REFRESH_TOKEN");


admin.initializeApp();

// 🔐 Secret




// ✅ INVITE USER FUNCTION
// ✅ SMART INVITE USER FUNCTION (Manual Link Edition)
export const inviteUser = onCall(
  {
    cors: true,
    timeoutSeconds: 30,
    // Note: Resend secret removed as we are doing manual emails for the demo
  },
  async (request) => {
    try {
      // 1. Auth check
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Not authenticated");
      }

      const { email, role } = request.data;
      if (!email) {
        throw new HttpsError("invalid-argument", "Email required");
      }

      // 2. Verify caller role (Only Super Devs)
      const callerSnap = await admin.firestore().collection("users").doc(request.auth.uid).get();
      if (callerSnap.data()?.role !== "super-dev") {
        throw new HttpsError("permission-denied", "Only Super Devs can invite users.");
      }

      // 3. Sanitize role
      const allowedRoles = ["user", "admin"];
      const safeRole = allowedRoles.includes(role) ? role : "user";

      let userRecord;
      let isNewUser = false;

      // 4. SMART LOGIC: Check if account exists or create it
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        console.log("Existing user found, generating reset link.");
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          // Create new user with a random temporary password
          userRecord = await admin.auth().createUser({
            email,
            password: Math.random().toString(36).slice(-12),
            emailVerified: false,
          });
          isNewUser = true;
          console.log("New user created.");
        } else {
          throw err;
        }
      }

      // 5. Always set/refresh the role in Custom Claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: safeRole,
      });

      // 6. Generate the link (Use your GH Pages URL in production!)
      const setupLink = await admin.auth().generatePasswordResetLink(email, {
        url: "https://trudaclowflow.github.io/login", 
      });

      // 7. Store or update the invite record in Firestore
      await admin.firestore().collection("invites").doc(userRecord.uid).set({
        email,
        role: safeRole,
        invitedBy: request.auth.uid,
        status: isNewUser ? "initial_invite" : "re_invited",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 8. RETURN THE LINK
      // This allows your frontend to show the link or open a 'mailto:' window
      return { 
        success: true, 
        setupLink, 
        email, 
        isNewUser 
      };

    } catch (error: any) {
      console.error("Invite failed:", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", error.message);
    }
  }
);

// ✅ CREATE USER PROFILE (NO RACE CONDITIONS)
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  // Get claims (source of truth)
  const userData = await admin.auth().getUser(user.uid);
  const role = userData.customClaims?.role || "user";

  // Create profile
  await db.collection("users").doc(user.uid).set({
    email: user.email,
    role,
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Mark invite as accepted (if exists)
  const inviteRef = db.collection("invites").doc(user.uid);
  const inviteSnap = await inviteRef.get();

  if (inviteSnap.exists) {
    await inviteRef.update({
      status: "accepted",
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});



export const syncStorageToDrive = onCall(
  {
    cors: true,
    secrets: [driveClientId, driveClientSecret, driveRefreshToken],
    timeoutSeconds: 120, // Increased for 50MB files
    memory: "512MiB",    // Increased to ensure buffer stability
  },
  async (request) => {
    try {
      // 1. Auth & Role Check
      if (!request.auth) throw new HttpsError("unauthenticated", "Not authenticated");

      const callerSnap = await admin.firestore().collection("users").doc(request.auth.uid).get();
      const role = callerSnap.data()?.role;
      if (role !== "super-dev" && role !== "admin") {
        throw new HttpsError("permission-denied", "Unauthorized.");
      }

      const { fileUrl, fileName, month, year } = request.data;
      const folderId = "1vH1ZcuCWrsCrs9jJcSQ_iHzhRk0audnz";

      // 2. Setup Google Drive Auth
      const oauth2Client = new google.auth.OAuth2(
        driveClientId.value(),
        driveClientSecret.value()
      );
      oauth2Client.setCredentials({ refresh_token: driveRefreshToken.value() });
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // 3. GET FILE FROM STORAGE AS A STREAM
      // We use axios to get a readable stream from the downloadURL provided by the frontend
      const response = await axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream'
      });

      // 4. UPLOAD STREAM TO DRIVE
      const driveFile = await drive.files.create({
        requestBody: {
          name: `TRUDA_DEBTORS_${month.toUpperCase()}_${year}_${fileName}`,
          parents: [folderId],
        },
        media: {
          // Detect mimeType based on extension or keep generic
          mimeType: fileName.endsWith('.pdf') ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          body: response.data, // This is the stream from Storage
        },
        fields: "id, webViewLink",
      });

      const driveId = driveFile.data.id;
      const viewLink = driveFile.data.webViewLink;

      // 5. UPDATE FIRESTORE
      const reportId = `${year}_${month.toLowerCase()}_${Date.now()}`; 
      await admin.firestore().collection("reports").doc(reportId).set({
        month,
        year: parseInt(year),
        driveFileId: driveId,
        viewLink: viewLink,
        fileName: fileName,
        status: "Verified",
        uploadedBy: request.auth.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 6. CLEANUP (Optional)
      // Delete the temporary file from Firebase Storage to save space
      const bucket = admin.storage().bucket();
      const filePath = decodeURIComponent(fileUrl.split('/o/')[1].split('?')[0]);
      await bucket.file(filePath).delete().catch(e => console.error("Cleanup failed:", e));

      return { success: true, driveId };

    } catch (error: any) {
      console.error("Sync Error:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);


export const deleteReport = onCall(
  {
    cors: true,
    secrets: [driveClientId, driveClientSecret, driveRefreshToken],
  },
  async (request) => {
    try {
      // 1. Basic Auth Check
      if (!request.auth) throw new HttpsError("unauthenticated", "Not authenticated");

      // 2. Permission Check (Same as your upload)
      const callerSnap = await admin.firestore().collection("users").doc(request.auth.uid).get();
      const role = callerSnap.data()?.role;
      if (role !== "super-dev" && role !== "admin") {
        throw new HttpsError("permission-denied", "Unauthorized to delete reports.");
      }

      const { fileId, reportDocId } = request.data;

      // 3. OAuth2 Setup (Identical to your upload logic)
      const oauth2Client = new google.auth.OAuth2(
        driveClientId.value(),
        driveClientSecret.value()
      );
      oauth2Client.setCredentials({ refresh_token: driveRefreshToken.value() });
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // 4. THE DIFFERENCE: Delete from Google Drive
      // Instead of .create(), we use .delete()
      await drive.files.delete({
        fileId: fileId,
      });

      // 5. Delete from Firestore
      // This removes the card from the UI
      await admin.firestore().collection("reports").doc(reportDocId).delete();

      return { success: true };

    } catch (error: any) {
      console.error("Delete Error:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);