import React from "react";
import Link from "next/link";
import FooterLinks from "../footer_links";

export const metadata = {
  title: "Duostories FAQ",
  description: "Information about the duostories project.",
  alternates: {
    canonical: "https://duostories.org/faq",
  },
};

export default async function Page() {
  return (
    <div style={{ padding: "0 15px" }}>
      <h1>Privacy Policy for duostories.org</h1>

      <p>
        <strong>Effective Date: Nov 16, 2023</strong>
      </p>

      <h2>Welcome to duostories.org!</h2>
      <p>
        {`Your privacy is critically important to us. At duostories.org, we are
        committed to protecting your personal data and ensuring transparency
        about how it's used. This Privacy Policy outlines the types of
        information we collect, how it's used, and the measures we take to
        protect it. If you have any questions, contact us on `}
        <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.
      </p>

      <h3>1. Data Collection:</h3>
      <p>
        When you register on duostories.org, we collect the following
        information:
      </p>
      <ul>
        <li>
          <strong>Username:</strong> To create a unique identity on our
          platform.
        </li>
        <li>
          <strong>Email Address:</strong> For account verification,
          communication, and password recovery.
        </li>
        <li>
          <strong>Hashed Password:</strong> To securely manage access to your
          account.
        </li>
      </ul>
      <p>
        For both registered and non-registered users, we track story completion
        to analyze readership trends and improve our services. This data is
        collected anonymously for users who are not logged in.
      </p>

      <h3>2. Use of Data:</h3>
      <p>The data we collect is used for the following purposes:</p>
      <ul>
        <li>To analyze the popularity and readership of our stories.</li>
        <li>
          To provide registered users with a personalized track of stories they
          have read.
        </li>
      </ul>

      <h3>3. Consent and User Choice:</h3>
      <p>
        By registering on duostories.org, you consent to the collection and use
        of your personal data as described in this policy. If you choose to use
        our website anonymously, we only collect non-personal data related to
        story completions.
      </p>

      <h3>4. Data Storage and Security:</h3>
      <p>
        Your personal data is stored in a secure MySQL database. We use advanced
        security measures, including password hashing with salt, to protect your
        data from unauthorized access.
      </p>

      <h3>5. User Rights:</h3>
      <p>
        You have the right to request the deletion of your personal data. To do
        so, please contact us via our Discord channel at{" "}
        <Link href="https://discord.gg/4NGVScARR3">
          https://discord.gg/4NGVScARR3
        </Link>
        . We will typically delete your username and email address upon request.
      </p>

      <h3>6. Changes to the Privacy Policy:</h3>
      <p>
        We may update this Privacy Policy from time to time. We will notify you
        of any changes by posting the new Privacy Policy on this page and
        updating the "Effective Date" at the top.
      </p>

      <h3>7. Contact Information:</h3>
      <p>
        For any questions or concerns regarding your privacy, please contact us
        at:
      </p>
      <ul>
        <li>
          Discord:{" "}
          <Link href="https://discord.gg/4NGVScARR3">
            https://discord.gg/4NGVScARR3
          </Link>
        </li>
        <li>
          Email:{" "}
          <Link href="mailto:google.compel855@passinbox.com">
            google.compel855@passinbox.com
          </Link>
        </li>
      </ul>
      <h3>8. Use of Cookies and Tracking:</h3>
      <p>
        At duostories.org, we value your privacy and aim for transparency in all
        our data practices. In line with this commitment:
      </p>
      <ul>
        <li>
          <strong>Use of Cookies:</strong> We use cookies solely for the purpose
          of maintaining user sessions. These cookies enable you to stay logged
          in to your account, providing a seamless experience as you navigate
          through our stories.
        </li>
        <li>
          <strong>No Cross-Website Tracking:</strong> We do not engage in
          cross-website tracking or analytics. Your activity on duostories.org
          is not monitored across other websites.
        </li>
        <li>
          <strong>No Third-Party Cookies:</strong> We do not use third-party
          cookies. All cookies on our site are strictly limited to the
          functionalities of duostories.org and enhancing your user experience.
        </li>
      </ul>
      <p>
        You can manage cookies through your browser settings, though please note
        that disabling cookies may impact your experience on our site.
      </p>
      <hr />
      <p>
        Thank you for being a part of duostories.org. We are committed to
        protecting your privacy and creating a safe and enjoyable experience for
        all of our users.
      </p>
      <FooterLinks />
    </div>
  );
}
