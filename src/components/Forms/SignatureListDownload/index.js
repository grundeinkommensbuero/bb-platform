import React, { useEffect, useState, useContext } from 'react';
import { Form, Field } from 'react-final-form';
import { TextInputWrapped } from '../TextInput';
import { validateEmail, addActionTrackingId, trackEvent } from '../../utils';
import s from './style.module.less';
import cN from 'classnames';
import { CTAButton, CTAButtonContainer } from '../../Layout/CTAButton';
import { LinkButton, InlineButton } from '../Button';
import { FinallyMessage } from '../FinallyMessage';
import { StepListItem } from '../../StepList';
import { useCreateSignatureList } from '../../../hooks/Api/Signatures/Create';
import { useSignUp } from '../../../hooks/Authentication';
import AuthContext from '../../../context/Authentication';
import AuthInfo from '../../AuthInfo';
import DownloadListsNextSteps from '../DownloadListsNextSteps';
import { useSignatureListCount } from '../../../hooks/Api/Signatures/Get';

const trackingCategory = 'ListDownload';

export default ({ signaturesId }) => {
  const [state, pdf, anonymous, createPdf] = useCreateSignatureList();
  const [signUpState, signUp] = useSignUp();
  const [email, setEmail] = useState();
  const { userId } = useContext(AuthContext);
  const listCount = useSignatureListCount();

  useEffect(() => {
    // If user was registered proceed by creating list
    if (signUpState === 'success') {
      createPdf({ email, campaignCode: signaturesId });
    } else if (signUpState === 'userExists') {
      createPdf({
        email,
        campaignCode: signaturesId,
      });
    }
  }, [signUpState]);

  if (state === 'creating' || signUpState === 'loading') {
    return (
      <FinallyMessage state="progress">
        Liste wird generiert, bitte einen Moment Geduld...
      </FinallyMessage>
    );
  }

  if (state === 'error') {
    trackEvent({
      category: trackingCategory,
      action: addActionTrackingId('downloadCreationError', signaturesId),
    });

    return (
      <FinallyMessage state="error">
        Da ist was schief gegangen. Melde dich bitte bei uns{' '}
        <a href="mailto:support@brandenburg-mitbestimmen.de">
          support@brandenburg-mitbestimmen.de
        </a>
        .
      </FinallyMessage>
    );
  }

  if (state === 'created') {
    return (
      <>
        {!anonymous ? (
          <p>
            Die Unterschriftslisten und unser Sammelleitfaden sind in deinem
            Postfach. Du kannst sie dir auch{' '}
            <a target="_blank" rel="noreferrer" href={pdf.url}>
              direkt im Browser herunterladen
            </a>{' '}
            - alle weiteren Infos findest du dort!
          </p>
        ) : (
          <p>
            <a target="_blank" rel="noreferrer" href={pdf.url}>
              Hier
            </a>{' '}
            kannst du die Unterschriftslisten samt Leitfaden herunterladen!
          </p>
        )}
        <DownloadListsNextSteps>
          {!anonymous && signUpState !== 'userExists' && (
            <StepListItem icon="mail">
              Schau in deine Mails und klick den Link, damit du dabei bist.
            </StepListItem>
          )}
          {anonymous && (
            <StepListItem icon="download">
              <LinkButton target="_blank" href={pdf.url}>
                Listen herunterladen
              </LinkButton>
            </StepListItem>
          )}
        </DownloadListsNextSteps>
      </>
    );
  }

  return (
    <>
      <Form
        onSubmit={e => {
          // If user is identified
          if (userId !== undefined) {
            // If user is authenticated
            createPdf({ campaignCode: signaturesId });
            return;
          }

          // If user is not identified, attempt to create user
          setEmail(e.email);
          signUp({ newsletterConsent: true, ...e });
        }}
        validate={values => validate(values, userId)}
        render={({ handleSubmit }) => {
          return (
            <form onSubmit={handleSubmit} className={s.form}>
              <FinallyMessage
                className={cN(s.amountOfDownloads)}
                preventScrolling={true}
              >
                <p>
                  Bisher wurden schon{' '}
                  {listCount && listCount[signaturesId].total.downloads} Listen
                  heruntergeladen!
                </p>
              </FinallyMessage>
              <div className={s.inputWrapper}>
                {!userId ? (
                  <>
                    <p>
                      Schickt mir die Unterschriftenlisten, erinnert mich an das
                      Zurücksenden und haltet mich über den Erfolg auf dem
                      Laufenden.
                    </p>
                    <div className={s.textInputContainer}>
                      <Field
                        name="email"
                        label="E-Mail"
                        placeholder="E-Mail"
                        component={TextInputWrapped}
                      ></Field>
                    </div>
                  </>
                ) : (
                  <FinallyMessage className={s.hint} preventScrolling={true}>
                    <p>
                      <AuthInfo />
                    </p>
                  </FinallyMessage>
                )}
                <CTAButtonContainer>
                  <CTAButton type="submit" className={s.downloadButton}>
                    Schickt mir die Listen
                  </CTAButton>
                </CTAButtonContainer>
              </div>
              <p className={s.anonymousDownload}>
                Du willst deine E-Mail-Adresse nicht angeben? Du kannst die
                Listen{' '}
                <InlineButton
                  onClick={() => {
                    createPdf({ campaignCode: signaturesId });
                  }}
                  type="button"
                >
                  hier auch anonym herunterladen.
                </InlineButton>{' '}
                Allerdings können wir dich dann nicht informieren, wie es weiter
                geht!
              </p>
            </form>
          );
        }}
      />
    </>
  );
};

const validate = (values, userId) => {
  const errors = {};

  if (!userId) {
    if (values.email && values.email.includes('+')) {
      errors.email = 'Zurzeit unterstützen wir kein + in E-Mails';
    }

    if (!validateEmail(values.email)) {
      errors.email = 'Wir benötigen eine valide E-Mail Adresse';
    }
  }

  return errors;
};
