/**
 * This file holds several hook functions regarding everything concerning authentication
 */
import { getRandomString } from '../../components/utils';
import { sleep, getReferral } from '../utils';
import { useContext, useState } from 'react';
import querystring from 'query-string';
import { navigate } from '@reach/router';
import AuthContext from '../../context/Authentication';
import { createUser } from '../Api/Users/Create';

export { useAnswerChallenge } from './AnswerChallenge';
export { useVerification } from './Verification';
export { useLocalStorageUser } from './LocalStorageUser';

export const useSignUp = () => {
  const [state, setState] = useState();

  //get global context
  const context = useContext(AuthContext);

  return [state, data => startSignInProcess(data, setState, context), setState];
};

export const useSignIn = () => {
  const [state, setState] = useState();

  const { tempEmail, ...context } = useContext(AuthContext);

  return [
    state,
    () => {
      setState('loading');

      signIn({ email: tempEmail }, context)
        .then(() => {
          setState('success');
        })
        .catch(error => {
          if (error.code === 'UserNotFoundException') {
            setState('userNotFound');
          } else {
            setState('error');
            console.log('Error while signing in', error);
          }
        });
    },
  ];
};

// hook for signing out
// in comparison to other hooks we only return the function, no state
export const useSignOut = () => {
  //get global context
  const context = useContext(AuthContext);

  return () => signOut(context);
};

const startSignInProcess = async (data, setState, context) => {
  try {
    setState('loading');

    await signUp(data, context);

    // User did not exist
    await signIn(data, context);

    setState('success');
  } catch (error) {
    // We have to check, if the error happened due to the user already existing.
    // If that's the case we call signIn() anyway.
    if (error.code === 'UsernameExistsException') {
      try {
        await signIn(data, context);

        setState('success');
      } catch (error) {
        console.log('Error while signing in', error);
        setState('error');
      }
    } else if (
      error.code === 'TooManyRequestsException' ||
      error.code === 'ThrottlingException'
    ) {
      // If the limit of cognito requests was reached we want to wait shortly and try again
      await sleep(1500);
      return signUp(data.email);
    } else {
      console.log('Error while signing up', error);
      setState('error');
    }
  }
};

// Amplifys Auth class is used to sign up user
const signUp = async (data, { setUserId }) => {
  const { default: Auth } = await import(
    /* webpackChunkName: "Amplify" */ '@aws-amplify/auth'
  );

  // We have to “generate” a password for them, because a password is required by Amazon Cognito when users sign up
  const { userSub: userId } = await Auth.signUp({
    username: data.email.toLowerCase(),
    password: getRandomString(30),
    attributes: {
      'custom:source': 'bb-platform',
    },
  });

  const extendedData = {
    ...data,
    referral: getReferral(),
    source: 'bb-platform',
  };

  // After we signed up via cognito, we want to create the user in dynamo
  await createUser({ userId, ...extendedData });

  //we want to set the newly generated id
  setUserId(userId);
};

// Sign in user through AWS Cognito (passwordless)
const signIn = async ({ email }, { setCognitoUser, userId }) => {
  console.trace('signing in');
  const { default: Auth } = await import(
    /* webpackChunkName: "Amplify" */ '@aws-amplify/auth'
  );

  // If no email was passed we use the userId from context
  const param = email ? email.toLowerCase() : userId;

  // This will initiate the custom flow, which will lead to the user receiving a mail.
  // The code will timeout after 3 minutes (enforced server side by AWS Cognito).
  const user = await Auth.signIn(param);

  // We already set the user here in the global context,
  // because we need the object in answerCustomChallenge()
  setCognitoUser(user);
};

//Function, which uses the amplify api to sign out user
export const signOut = async ({
  setCognitoUser,
  setUserId,
  setIsAuthenticated,
  setToken,
}) => {
  try {
    const { default: Auth } = await import(
      /* webpackChunkName: "Amplify" */ '@aws-amplify/auth'
    );

    await Auth.signOut();

    // Remove URL params if existing
    const params = querystring.parse(window.location.search);
    if (params.userId) {
      params.userId = undefined;
      const newUrl = `?${querystring.stringify(params)}`;
      navigate(newUrl, { replace: true });
    }

    // Update user state
    setCognitoUser(null);
    setUserId(undefined);
    setToken(undefined);
    setIsAuthenticated(false);
    return;
  } catch (error) {
    console.log('Error while signing out', error);
  }
};
