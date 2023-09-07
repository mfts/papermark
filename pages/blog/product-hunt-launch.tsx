import Footer from "@/components/web/footer";
import Navbar from "@/components/web/navbar";
import Head from "next/head";

function BlogPost() {
  return (
    <>
      <Head>
        <title>
          Papermark | How to launch Open Source project on Product Hunt?
        </title>
        <meta
          name="description"
          content="How to launch Open Source project on Product Hunt? Best tips to launch on Product Hunt and get first place"
        />
        <meta
          property="og:title"
          content="How to launch Open Source project on Product Hunt?"
        />
        <meta
          property="og:description"
          content="How to launch Open Source project on Product Hunt? Best tips to launch on Product Hunt and get first place"
        />
        <meta
          property="og:image"
          content="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fejivoe3vst4rsdzjblo.png"
        />
        <meta property="og:url" content="https://www.papermark.io" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Navbar />

      <div className="bg-gray-100 p-8 mt-16">
        <div className="max-w-3xl mx-auto space-y-6 bg-white text-black p-6 rounded-lg shadow-md">
          <h1 className="text-4xl font-bold ">
            How to launch Open Source project on Product Hunt?
          </h1>
          <p className="mb-4">
            There are already many articles describing Product Hunt launches. So
            we decided to write one more:)
          </p>
          <p className="mb-4">
            So, here is our story,{" "}
            <a
              href="https://www.producthunt.com/posts/papermark-3"
              className="text-blue-600 underline"
            >
              Papermark
            </a>{" "}
            story.
          </p>
          <p className="mb-4">
            Except the general tips, I am adding launch tips for Open Source
            projects.
          </p>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fejivoe3vst4rsdzjblo.png"
            alt="How to launch on PH"
            className="my-4"
          />
          <h2 className="text-2xl font-bold mb-4">
            In this article you will find:
          </h2>
          <ul className="list-disc list-inside mb-4">
            <li className="font-bold">Before launch preparation</li>
            <li className="font-bold">Launch Day</li>
            <li className="font-bold">Special to Open Source launch</li>
            <li className="font-bold">Open Source companies PH launches</li>
            <li className="font-bold">Results and Stats</li>
          </ul>
          <p>Plus: Happy to share my launch checklist</p>
          <h2 className="text-2xl font-bold mb-4">Before the launch</h2>
          {/* 1. Draft the messaging */}
          <h3 className="text-xl font-semibold mb-2">1. Draft the messaging</h3>
          <p>One liners and message for groups or social.</p>
          <p>
            I like to have 2-4 versions of it, so I can select best for
            different places.
          </p>
          <blockquote className="border-l-4 border-gray-500 pl-4 my-4">
            <p>Because launch is a test.</p>
            <p>
              So I use the opportunity to test messaging in different groups.
            </p>
          </blockquote>
          <p>
            <strong>One-liners for us:</strong>
          </p>
          <img
            className="my-4"
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ey010727vbqru86xq0qe.png"
            alt="One liners Papermark"
          />
          <p>
            <strong>Direct messages</strong>
          </p>
          <p>
            Good to have around 3-5 prepared similar messages I could easily use
          </p>
          <img
            className="my-4"
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/g2v8fn5lm6vvpw3584yq.png"
            alt="Draft messages"
          />
          {/* 2. Warm up your audience */}
          <h3 className="text-xl font-semibold mb-2">
            2. Warm up your audience
          </h3>
          <p>
            We took part into <strong>Product Hunt discussion</strong>, wrote a
            bit on <strong>Twitter</strong>,{" "}
            <strong>Linkedin and Reddit</strong> about the launch.
          </p>
          <p>
            Some companies also send the email in advance with your coming soon
            page for people to follow, but we did not.
          </p>
          {/* 3. Create list of your supporters */}
          <h3 className="text-xl font-semibold mb-2">
            3. Create list of your supporters
          </h3>
          <p>
            Our list was quite small like 20-30 people, and I kept in mind all
            my friends in twitter and linkedin who could be interested in the
            launch.
          </p>
          <blockquote className="border-l-4 border-gray-500 pl-4 my-4">
            <p>Quality over quantity</p>
          </blockquote>
          <p>
            Which means only meaningful connections will be helpful, not random
            reach outs and asking for the vote:)
          </p>
          {/* 4. Create the list of places where to post */}
          <h3 className="text-xl font-semibold mb-2">
            4. Create the list of places where to post
          </h3>
          <p>
            This is important one, as everyone has the groups they want to reach
            people in. <br />
          </p>
          <p>
            <strong>We used 3 types of groups:</strong>
          </p>
          <ol>
            <li>
              - PH support groups (Discord, Slack, WhatsApp, Telegram, Reddit)
              <br />
              The best output was in WhatsApp and Telegram
            </li>
            <li>- Building in public/indihacker places</li>
            <li>- Places for open source</li>
          </ol>
          <h3 className="text-xl font-semibold mb-2">
            5. Prepare visuals: video, images, gif
          </h3>
          <p>
            🤓 Of course, you need them for the PH page.
            <br />
            But I found it useful to send them also in the groups, that people
            see small video or GIF straight and decide if it is interesting to
            click.
          </p>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2vlv3fv3fhcdimqnt7xr.gif"
            alt="Making photos"
          />
          <p>We created quickly a banner in Canva for Twitter and Linkedin</p>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uq71oh23os3t9nq1zksy.png"
            alt="Papermakr banner"
          />
          <h3 className="text-xl font-semibold mb-2">
            6. Reach 10-20 people in advance for feedback
          </h3>
          <p>
            One more thing I kind of doing before every launch is finding test
            users, so send a couple of people a link to the product, mentioning
            you plan to launch.
          </p>
          <p>
            Works especially well for new products which don&apos;t have any
            feedback.
          </p>
          <p>
            We started preparing <strong>1 week</strong> before launch.
          </p>
          <h2 className="text-2xl font-bold mb-4 pt-6">
            During the launch day
          </h2>
          <p>
            Launch day is mostly about <strong>sharing</strong> that you launch
            on social and then continuously <strong>engaging</strong>.
          </p>
          <h3 className="text-xl font-semibold mb-2">1. Launch your tweet</h3>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4ri6ggskhpwzm2xjrmxa.gif"
            alt="Pareto principle"
          />
          <blockquote className="border-l-4 border-gray-500 pl-4 my-4">
            <p>20% of efforts bring 80% of result. Pareto also works here</p>
          </blockquote>
          <p>
            I think the most important is a tweet. I got previous
            recommendations about it from{" "}
            <a href="https://twitter.com/heyeaslo">Easlo</a>. This tip I still
            follow. One core tweet which you share with people.
          </p>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zzgcnjne6f1gonc4uule.png"
            alt="Launch tweet"
            width="500"
            height="300"
          />
          <p>
            Even if you don&apos;t have a community and a big following on
            Twitter, I would aim to make the tweet interesting and focus on it.
          </p>
          <h3 className="text-xl font-semibold mb-2">
            2. Post on other social platforms: LinkedIn, Devto
          </h3>
          <p>
            Only recommend this if you have a following or activity on LinkedIn.
            Maybe if you never post there, it will not work.
          </p>
          <blockquote>
            First, do something which can be done quickly.
          </blockquote>
          <h3 className="text-xl font-semibold mb-2">
            3. Engage in PH comments
          </h3>
          <p>
            The priority is to engage in comments after you shared about the
            launch. You will sometimes feel like a bot in these comments, but I
            feel like everyone deserves a response who wrote to you on PH :)
          </p>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k5nwq03arkjx9x5erb2g.gif"
            alt="Bots"
          />
          <p>
            I don&apos;t know how currently PH count it, I think they are
            looking only at upvotes but I still find that important.
          </p>
          <h3 className="text-xl font-semibold mb-2">
            4. Send email to your users
          </h3>
          <p>Make it clean with one call to action.</p>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ql9tyzttu2x74ds20ucy.png"
            alt="Email"
          />
          <h3 className="text-xl font-semibold mb-2">6. Add launch branding</h3>
          <p>
            Your and your company profiles are styled and linked to the PH
            launch. Banner, link leading to launch, embeds on the website.
          </p>
          <p>
            <a
              href="https://twitter.com/shnai0/status/1607829567821221890"
              className="text-blue-600 underline"
            >
              Here are my 10 tips from other launches
            </a>
          </p>
          <h2 className="text-2xl font-bold mb-4 pt-8">
            Open source projects launch tips ⭐️
          </h2>
          <p>If your product is open source, where to look for support?</p>
          <p>
            Use the Open Source channels, I am sure if you are building
            something in Open Source and planning to launch, you know other
            popular projects, communities in the space, and people.
          </p>
          <p>But let&apos;s say not, where could you start?</p>
          <p>There are some Open Source places where you can get support.</p>
          <p>
            <strong>Open Source channels:</strong>
          </p>
          <ul>
            <li>Reddit (Open Source, Self Hosted, Github Projects)</li>
            <li>Twitter Open Source lists</li>
            <li>COSS community on Discord</li>
            <li>Developer marketing group</li>
            <li>GitHub groups</li>
          </ul>
          <p>
            {" "}
            <strong>
              Among other things, if your project is open source:{" "}
            </strong>
          </p>
          <ul>
            <li>Add in the description that it is Open Source</li>
            <li>Add tags that it is Open Source</li>
            <li>Add GitHub link</li>
          </ul>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6g71ch2strxdklrewyll.png"
            alt="Open source project guidance"
          />
          <p>
            <strong>Go Open Source</strong>🚀🚀🚀
          </p>
          <h2 className="text-2xl font-bold mb-4 pt-8">
            Top 🥇 Open Source launches in 2022-23
          </h2>
          <p>
            I listed OS companies launched recently and successfully and reached
            the first spot. ☄️ - the one who launched for the first time
          </p>
          <ol>
            <li>
              <a
                href="https://www.producthunt.com/products/supabase/launches"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase
              </a>
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/n8n-io/launches"
                target="_blank"
                rel="noopener noreferrer"
              >
                n8n
              </a>
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/tiptap#tiptap-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                TipTap
              </a>{" "}
              ☄️
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/medusa/launches"
                target="_blank"
                rel="noopener noreferrer"
              >
                Medusa
              </a>{" "}
              ☄️
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/cal-com/launches"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cal.com
              </a>
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/appwrite/launches"
                target="_blank"
                rel="noopener noreferrer"
              >
                Appwrite
              </a>
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/lotus-4/launches"
                target="_blank"
                rel="noopener noreferrer"
              >
                Lotus
              </a>{" "}
              ☄️
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/lago/launches"
                target="_blank"
                rel="noopener noreferrer"
              >
                Lago
              </a>{" "}
              ☄️
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/documenso/launches"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documenso
              </a>{" "}
              ☄️
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/langfuse/launches"
                target="_blank"
                rel="noopener noreferrer"
              >
                Langfuse
              </a>{" "}
              ☄️
            </li>
            <li>
              <a
                href="https://www.producthunt.com/products/papermark-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Papermark
              </a>{" "}
              ☄️
            </li>
            <li>
              <a
                href="https://www.producthunt.com/posts/keep-8"
                target="_blank"
                rel="noopener noreferrer"
              >
                Keep
              </a>
            </li>
          </ol>
          <h2 className="text-2xl font-bold pt-6">
            Results from our launch 📈
          </h2>
          <ul>
            <li>Amount of upvotes: 850</li>
            <li>Amount of comments: 250</li>
            <li>Amount of website visitors: 4k</li>
            <li>Unique visitors: 2k</li>
            <li>
              <a href="https://github.com/mfts/papermark">GitHub stars</a>: 250
            </li>
            <li>Amount of signups: 300</li>
          </ul>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/os57cafu835hj27v81dc.png"
            alt="Website visitors"
          />
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vx2966hpmjmi17k58rhz.png"
            alt="Sources of visitors"
          />
          <h3 className="text-xl font-semibold mb-2 pt-8">
            Amount of impressions on other platforms:
          </h3>
          <ul>
            <li>Twitter: 130k</li>
            <li>Reddit: 20k </li>
            <li>Dev.to: 1k </li>
            <li>LinkedIn: 4k</li>
          </ul>
          <img
            src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qorzurj4rfj32f3nbtjl.png"
            alt="Papermark launch"
          />
          <p>
            I think it is best if you connect with people in advance and build
            meaningful connections.
          </p>
          <h3 className="text-xl font-semibold mb-2 pt-8">
            My guesses on how votes distributed:
          </h3>
          <ul>
            <li>5% of people from Product Hunt support groups</li>
            <li>5% friends and family</li>
            <li>40% open-source community</li>
            <li>30% building in public community</li>
            <li>20% product hunt community community</li>
          </ul>
          <h2 className="text-2xl font-bold mb-4">
            Q&A Have some questions? ❓
          </h2>
          <p>
            Some questions I kind of ask myself and maybe will be interesting to
            anyone who is reading this:
          </p>
          <h3 className="text-xl font-semibold mb-2">
            Can you reengineer a successful launch?
          </h3>
          <p>
            No, I think no. It is similar to re-engineering a viral post. There
            is always a combination of different factors.
          </p>
          <h3 className="text-xl font-semibold mb-2">
            Can someone guarantee you success?
          </h3>
          <p>
            There are people selling votes, or the first place. I received
            offers like that. My personal recommendation is not to engage, for 5
            reasons:
          </p>
          <ol>
            <li>It can be easily tracked</li>
            <li>PH can &quot;punish&quot; you for that</li>
            <li>You will damage your company brand if people find out</li>
            <li>You will not see your real supporters and community around</li>
            <li>Fewer people will hear about your brand</li>
          </ol>
          <h3 className="text-xl font-semibold mb-2">
            Is building in public helping me launch?
          </h3>
          <p>
            I think this is the main helper. Building in public, writing about
            your project no matter if it&apos;s open-source or not is a
            long-term game.
          </p>
          <h3 className="text-xl font-semibold mb-2">Can my launch fail?</h3>
          <p>
            To me, no. I will give you an example. I missed the launch of
            another product I built. I scheduled it and forgot, just was doing
            something else, I realized it in one week, one weeeeek!
            <br />
            So yes, some may say it was a failure, but no, I can always relaunch
            it, and this one was just a PURE Product Hunt LAUNCH, like in the
            good old days :))
          </p>
          <p>
            If you want to know how Papermark started, check this cool article
            on Dev.to, with all the coding journey:
            <a
              href="https://dev.to/papermark/from-tweet-to-launch-my-open-source-journey-199l"
              className="text-blue-600 underline"
            >
              &quot;Papermark journey from tweet to launch&quot;
            </a>
          </p>
          <p className="mb-4">
            Happy to share with you{" "}
            <a
              href="https://iuliia2.marbleflows.com/flows/7838/link"
              className="text-blue-600 underline"
            >
              Papermark checklist
            </a>{" "}
            with all todos and places where to post.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default BlogPost;
