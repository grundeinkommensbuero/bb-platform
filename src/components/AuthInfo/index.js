import React, { useContext } from 'react';
import { InlineButton } from '../Forms/Button';
import { useSignOut } from '../../hooks/Authentication';
import AuthContext from '../../context/Authentication';

// The component can optionally take in a username, which will be shown
// If not, the default will be to get the email from context
export default () => {
  const { customUserData } = useContext(AuthContext);
  const signOut = useSignOut();

  return (
    <>
      {/* TODO: Improve the text so that it's clear for users */}
      Du wirst die Liste mit der E-Mail-Adresse{' '}
      {customUserData && customUserData.email} herunterladen.{' '}
      <InlineButton onClick={signOut} type="button">
        Hier klicken um eine andere E-Mail-Adresse zu benutzen.
      </InlineButton>
    </>
  );
};
