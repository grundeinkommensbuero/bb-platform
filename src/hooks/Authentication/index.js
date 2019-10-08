/**
 * This file holds several hook functions regarding everything concerning authentication
 */
import { Auth } from 'aws-amplify';
import { getRandomString } from '../../components/utils';
import { useContext } from 'react';
import AuthContext from '../../context/Authentication';

export const useAuthentication = () => {
  return [startSignInProcess, answerCustomChallenge];
};

export const useGlobalState = () => {
  return useContext(AuthContext);
};

// This functions calls signUp (which creates the user in aws user pool)
// and signIn (which starts the custom flow of sending the magic code to the mail address)
const startSignInProcess = async (mail, context) => {
  //const defaultMail = 'valentin@grundeinkommensbuero.de';
  const { state, setUser } = context;
  console.log('state', state);
  try {
    await signUp(mail);
    await signIn(mail, context);
  } catch (error) {
    //We have to check, if the error happened due to the user already existing
    //If that's the case we call signIn() anyway
    if (error.code === 'UsernameExistsException') {
      console.log('user already exists, signing in...');
      await signIn(mail, context);
    } else {
      //TODO: Error handling in UI?
      console.log('Error while signing up', error);
    }
  }
};

// Function to send login code to aws
const answerCustomChallenge = async (answer, context) => {
  // Send the answer to the User Pool
  try {
    //we want to get the user object, which we have saved in our global state,
    //because we need to pass it to sendCustomChallengeAnswer
    const { state, setUser, setIsAuthenticated } = context;
    console.log('state', state);
    // sendCustomChallengeAnswer() will throw an error if it’s the 3rd wrong answer
    const user = await Auth.sendCustomChallengeAnswer(state.user, answer);
    console.log('user after sending challenge', user);
    // It we get here, the answer was sent successfully,
    // but it might have been wrong (1st or 2nd time)
    // So we should test if the user is authenticated now
    try {
      // This will throw an error if the user is not yet authenticated:
      await Auth.currentSession();
      //User is now signed in
      //use context hook to set user in global state
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      //TODO: Error handling in UI: wrong code
      console.log('Apparently the user did not enter the right code', error);
    }
  } catch (error) {
    console.log(
      'User entered wrong code three times or user was never set',
      error
    );
  }
};

//Function, which uses the amplify api to sign out user
export const signOut = async () => {
  try {
    await Auth.signOut();
    //use context hook to set user in global state
    const { setUser, setIsAuthenticated } = useContext(AuthContext);
    setUser(null);
    setIsAuthenticated(false);
  } catch (error) {
    //TODO: Error handling in UI: Sign out error
    console.log('Error while signing out', error);
  }
};

// helper function Function to sign up user through AWS Cognito
// Tutorial: https://aws.amazon.com/de/blogs/mobile/implementing-passwordless-email-authentication-with-amazon-cognito/
const signUp = async email => {
  // We have to “generate” a password for them, because a password is required by Amazon Cognito when users sign up
  console.log(
    await Auth.signUp({
      username: email,
      password: getRandomString(30),
      attributes: {
        name: 'testperson2',
      },
    })
  );
};

// Sign in user through AWS Cognito (passwordless)
const signIn = async (email, context) => {
  try {
    // This will initiate the custom flow, which will lead to the user receiving a mail.
    // The code will timeout after 3 minutes (enforced server side by AWS Cognito).
    const user = await Auth.signIn(email);
    console.log('called Auth.signIn()', user);
    //we already set the user here, because we need the object in answerCustomChallenge()
    context.setUser(user);
    console.log('context', context);
  } catch (error) {
    //TODO: Error handling in UI?
    console.log('Error while signing in', error);
  }
};