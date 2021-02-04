"use strict";

require("dotenv").config();
const { default: axios } = require("axios");

(async function () {
  console.log(`${process.env.TEST_STRING}`);

  const gatsbytes = process.env.GATSBYTES;

  try {
    const {
      data: {
        data: {
          repository: {
            pullRequests: { nodes },
          },
        },
      },
    } = await axios.post(
      process.env.GITHUB_API,
      {
        query: `
        query {
          repository(owner: "gatsbyjs", name: "gatsby") {
            pullRequests(last: 100, states: MERGED) {
              nodes {
                author{
                  login
                }
                title
                mergedAt
              }
            }
          }
        }
        `,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    const contributors = [
      ...new Set(
        Array.from(nodes)
          .filter((pr) => !gatsbytes.includes(pr.author.login))
          .map((pr) => pr.author.login)
      ),
    ];

    console.log(contributors);
  } catch (err) {
    console.error(`💩 Well THAT didn't work! : ${err.message}`);
  }
})();
