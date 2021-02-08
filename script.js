"use strict";

require("dotenv").config();
const fs = require("fs");
const { getInitialPullRequests, getPreviousPage } = require("./query");
const cliProgress = require("cli-progress");

console.log(process.env.GITHUB_TOKEN);

(async function () {
  const exclusions = process.env.EXCLUDE;

  try {
    const {
      data: {
        data: {
          repository: {
            pullRequests: {
              nodes,
              pageInfo: { hasPreviousPage, startCursor },
            },
          },
        },
      },
    } = await getInitialPullRequests();

    // get contributor list from PR's
    let contributors = Array.from(nodes)
      .filter((pr) => !exclusions.includes(pr.author.login))
      .filter((pr) => pr.mergedAt.indexOf("2020-", 0) >= 0)
      .map((pr) => {
        return {
          author: pr.author.login,
          title: pr.title,
          mergedAt: pr.mergedAt,
        };
      });

    // if there's more pages, get the previous page
    let cursor = startCursor;
    let morePages = hasPreviousPage;
    const progressBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    progressBar.start(140, 0);
    while (morePages) {
      const {
        data: {
          data: {
            repository: {
              pullRequests: {
                nodes,
                pageInfo: { hasPreviousPage, startCursor },
              },
            },
          },
        },
      } = await getPreviousPage(cursor);

      cursor = startCursor;
      morePages = hasPreviousPage;

      contributors.push(
        ...Array.from(nodes)
          .filter((pr) => pr.author && !exclusions.includes(pr.author.login))
          .filter((pr) => pr.mergedAt.indexOf("2020-", 0) >= 0)
          .map((pr) => {
            return {
              author: pr.author.login,
              title: pr.title,
              mergedAt: pr.mergedAt,
            };
          })
      );
      progressBar.increment();
    }

    progressBar.stop();

    const uniqueAuthors = new Set(contributors.map((c) => c.author));

    console.info(
      `🎉 There were a total of ${contributors.length} PR's merged from ${uniqueAuthors.size} open source contributors in 2020 for ${process.env.GITHUB_REPO} ${process.env.GITHUB_OWNER}`
    );

    try {
      contributors.forEach((c) => {
        fs.appendFile(
          "./contributors.txt",
          `${c.author},${c.title},${c.mergedAt}\r\n`,
          (err, _) => {
            if (err) console.error(`🔥 something went wrong: ${err.message}`);
          }
        );
      });
    } catch (err) {
      console.log(
        `💩 there was a problem creating the contributors file: ${err.message}`
      );
    }
  } catch (err) {
    console.log(err.stack);
  }
})();
