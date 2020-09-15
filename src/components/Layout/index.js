import React from 'react';
import Header from './Header';
import Footer from './Footer';
import s from './style.module.less';
import '../style/base.less';
import Sections, { ContentfulSection, Section, SectionInner } from './Sections';
import { Helmet } from 'react-helmet-async';
import { useStaticQuery, graphql } from 'gatsby';
import { Overlay } from '../Overlay';
import { buildVisualisationsWithCrowdfunding } from '../../hooks/Api/Crowdfunding';
import Countdown from 'react-countdown';

function Template({ children, sections }) {
  const { contentfulGlobalStuff: globalStuff } = useStaticQuery(graphql`
    query SiteTitleQuery {
      contentfulGlobalStuff(contentful_id: { eq: "77De3ybaRfplngS9vkw7gS" }) {
        siteTitle
        siteDescription {
          siteDescription
        }
        ogimage {
          fixed(width: 1000) {
            src
          }
        }
        footerText
        footerMenu {
          slug
          title
        }
        mainMenu {
          ... on Node {
            ... on ContentfulStaticContent {
              __typename
              slug
              title
              shortTitle
            }
            ... on ContentfulMenuOberpunkt {
              __typename
              title
              internalLink
              externalLink
              contentfulchildren {
                title
                slug
                shortTitle
              }
            }
          }
        }
        overlayActive
        overlayDelay
        overlay {
          ... on Node {
            ... on ContentfulPageSection {
              __typename
              title
              titleShort
              campainVisualisations {
                campainCode
                goal
                startDate
                title
                minimum
                maximum
                addToSignatureCount
                ctaLink
                eyeCatcher {
                  json
                }
                goalUnbuffered
                goalInbetweenMultiple
                startnextId
                hint {
                  hint
                }
              }
              body {
                json
              }
              map
              callToActionLink
              callToActionText
              bodyTextSizeHuge
              signUpForm
              emailSignup
              pledgeId
              signaturesId
              callToActionReference {
                slug
                title
                shortTitle
              }
              teamMembers {
                image {
                  fluid(maxWidth: 200, quality: 80) {
                    ...GatsbyContentfulFluid
                  }
                }
                name
                twitter
                linkedin
                website
                role
              }
              twitterFeed
              backgroundIllustration
              socialMediaButtons
              blogTeaser
              questionUbi
              bodyAtTheEnd {
                json
              }
            }
          }
        }
      }
    }
  `);

  return (
    <>
      <Helmet
        defaultTitle={globalStuff.siteTitle}
        titleTemplate={`${globalStuff.siteTitle} - %s`}
      >
        <meta
          name="description"
          content={globalStuff.siteDescription.siteDescription}
        />
        <meta property="og:image" content={globalStuff.ogimage.fixed.src} />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <html lang="de" />
      </Helmet>
      <main className={s.main}>
        <Section>
          <SectionInner className={s.countdown}>
            Die Seite geht bald live!!{' '}
            <Countdown
              date={new Date('2020-09-16T12:00:00')}
              renderer={({ hours, minutes, seconds }) => (
                <div>
                  {hours}h {minutes}m {seconds}s
                </div>
              )}
            ></Countdown>
          </SectionInner>
        </Section>
      </main>
    </>
  );
}

export default Template;
