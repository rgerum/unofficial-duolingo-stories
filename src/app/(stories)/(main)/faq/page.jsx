import React from "react";
import Link from "next/link";
import Script from "next/script";
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
      <h1>Frequently Asked Questions</h1>
      <h2>Can I support this project financially?</h2>
      <p>
        Yes, we have a page on{" "}
        <Link href={"https://opencollective.com/duostories"}>
          OpenCollective
        </Link>
        . We use the money to cover the hosting costs and for the TTS services.
        <Link
          href="https://opencollective.com/duostories/contribute"
          target="_blank"
        >
          <img
            src="https://opencollective.com/duostories/contribute/button@2x.png?color=blue"
            height="48"
          />
        </Link>
        or
        <Link
          href="https://opencollective.com/duostories/donate"
          target="_blank"
        >
          <img
            src="https://opencollective.com/duostories/donate/button@2x.png?color=blue"
            height="48"
          />
        </Link>
        <Script src="https://opencollective.com/:collectiveSlug/banner.js"></Script>
      </p>
      <h2>Is this website open source?</h2>
      <p>
        Yes it is! The code is hosted on Github{" "}
        <Link href="https://github.com/rgerum/unofficial-duolingo-stories">
          rgerum/unofficial-duolingo-stories
        </Link>
      </p>
      <p>
        If you like it you can give it a star.{" "}
        <Link href="https://github.com/rgerum/unofficial-duolingo-stories">
          <img
            alt="GitHub Repo stars"
            src="https://img.shields.io/github/stars/rgerum/unofficial-duolingo-stories?style=social"
          />
        </Link>
      </p>

      <h2>When will these stories be on the official Duolingo website?</h2>
      <p>
        Probably never. This project is not linked to Duolingo in any way.
        Duolingo has in the past worked with volunteers but they stopped the
        volunteer program. Therefore, it is highly unlikely that Duolingo will
        adopt these stories.
      </p>

      <h2>Are you allowed to use the material of Duolingo?</h2>
      <p>
        Yes, we asked Duolingo for permission and came to an agreement that we
        are allowed to use the story material for this purpose. If you want to
        use Duolingo material, please ask them. Our licence agreement only
        covers this website.
      </p>

      <h2>Can I contribute?</h2>
      <p>
        Yes! The project is run by volunteers that want to bring the Duolingo
        stories to new languages. You can join us on{" "}
        <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.
      </p>

      <h2>Will you add a course in language X?</h2>
      <p>
        If we have a volunteer, or better yet, a group of volunteers, then yes.
        Maybe you can spread the word, find some native speakers in your target
        language, and bring them to our{" "}
        <Link href="https://discord.gg/4NGVScARR3">Discord</Link> server.
      </p>

      <h3 style={{ marginLeft: "30px" }}>
        What about a dialect or regionally-specific language?
      </h3>
      <p style={{ marginLeft: "30px" }}>
        We are hesitant to support languages that are too regionally-specific
        because at times they are not well-defined enough that a course would
        even make sense to learners. Applications for dialects/regional
        languages will be considered against a set of factors on a case-by-case
        basis. It might be a “yes” if your language:
      </p>
      <ul style={{ marginLeft: "30px" }}>
        <li>Is classified as an “endangered” language</li>
        <li>Has a well-defined written form and spelling</li>
        <li>Has an ISO code</li>
        <li>Has a language foundation or association to support it</li>
        <li>Has a broad body of published literature</li>
      </ul>

      <h3 style={{ marginLeft: "30px" }}>
        What about a constructed language (conlang) or auxiliary language
        (auxlang)?
      </h3>
      <p style={{ marginLeft: "30px" }}>
        While the primary focus of this project is to feature natural languages,
        we acknowledge that some conlangs/auxlangs are used to a similar extent
        as some minor natural languages. Esperanto is a well-known example with
        thousands of speakers worldwide. Especially because it is also taught on
        Duolingo, it makes sense to include it here.{" "}
      </p>

      <p style={{ marginLeft: "30px" }}>
        In order to maximize the benefits to learners, we will be more
        interested in featuring a conlang/auxlang when we see some of these
        factors, so please be sure to discuss them in your application.
      </p>
      <ul style={{ marginLeft: "30px" }}>
        <li>
          There are a significant number of speakers/learners of the language
          (e.g. &gt; 100)
        </li>
        <li>
          The language has been in development for a significant period of time
          (e.g. 10+ years)
        </li>
        <li>
          There are other websites or texts that provide material on the
          language (e.g. an official dictionary)
        </li>
        <li>
          The language has received some degree of notoriety in the
          conlang/auxlang community (e.g. received awards, featured in
          articles/videos)
        </li>
        <li>
          The language has its own Wikipedia edition (e.g.{" "}
          <Link href="https://eo.wikipedia.org/">Esperanto Wikipedia</Link>,{" "}
          <Link href="https://en.wikipedia.org/wiki/List_of_Wikipedias">
            List of Wikipedias
          </Link>
          ) and/or an ISO code (e.g. Esperanto, “epo”)
        </li>
      </ul>
      <p style={{ marginLeft: "30px" }}>
        If your language is a personal conlang/auxlang project or a very new
        project from a small group, we are hesitant to support the language as
        we do not see clear value for our community of learners. When we do
        allow these smaller languages access to the project, we will not feature
        them on the main page of Duostories.org. The course contributor would be
        given a direct link to share with interested learners.
      </p>

      <h2>Can I write my own stories as a contributor?</h2>
      <p>
        Our current goal is to create good translations of the existing Duolingo
        stories. Duolingo has put great effort into developing stories that help
        learners to learn a new language using stories. We do not have the
        resources to create similar high quality stories, nor do we see the need
        to go beyond the current stories. Maybe when we have finished
        translating all of them ;-).
      </p>

      <h2>I found a mistake!</h2>
      <p>
        Yes, despite our continuous efforts, there might be mistakes in the
        translations. You can reach us on{" "}
        <Link href="https://discord.gg/4NGVScARR3">Discord</Link> to report
        mistakes.
      </p>

      <h2>I found a bug on the page or want to suggest a new feature.</h2>
      <p>
        We have a{" "}
        <Link
          href={"https://github.com/rgerum/unofficial-duolingo-stories/issues"}
        >
          bugtracker
        </Link>{" "}
        on Github where you can report issues or feature requests. Or again
        discuss them with us on{" "}
        <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.
      </p>

      <h2>Who runs this website?</h2>
      <p>
        The website was developed by me, "randrian". You can find me on{" "}
        <Link href="https://www.duolingo.com/profile/Randriano">Duolingo</Link>{" "}
        or on <Link href="https://github.com/rgerum">Github</Link>. Some people
        did minor contributions to the website, see the Github repository. You
        are welcome to be part of them.
      </p>
      <p>I am in no way associated with Duolingo.</p>
      <p>
        But of course this website would be nothing without its active group of
        contributors! Meet them on{" "}
        <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.
      </p>
      <FooterLinks />
    </div>
  );
}
