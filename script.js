"use strict";

require("dotenv").config();
const { getInitialPullRequests, getPreviousPage } = require("./query");

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
      .map((pr) => {
        return {
          author: pr.author.login,
          title: pr.title,
          mergedAt: pr.mergedAt,
        };
      });

    // if there's more pages, get the next page
    let cursor = startCursor;
    let morePages = hasPreviousPage;
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
        Array.from(nodes)
          .filter((pr) => pr.author && !exclusions.includes(pr.author.login))
          .map((pr) => {
            return {
              author: pr.author.login,
              title: pr.title,
              mergedAt: pr.mergedAt,
            };
          })
      );
    }

    // add results to contributor list again
    console.log(hasPreviousPage, startCursor);
    console.log(contributors);
  } catch (err) {
    console.log(err.stack);
  }
})();
