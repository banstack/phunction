import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../app/firebase";
import { UserService } from "@/application/services/UserService";
import { FirebaseUserRepository } from "@/infrastructure/repositories/FirebaseUserRepository";

const userService = new UserService(new FirebaseUserRepository());

export const registerUser = async (email: string, password: string, username: string) => {
  try {
    // First check if username exists
    const usernameExists = await userService.checkUsernameExists(username);
    if (usernameExists) {
      throw new Error('Username already taken');
    }

    // If username is available, create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await userService.createUser(userCredential.user.uid, username, email);
    
    return userCredential;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return await signOut(auth);
};
