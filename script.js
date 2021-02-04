"use strict";

require("dotenv").config();
const { default: axios } = require("axios");

console.log(process.env.GITHUB_TOKEN);

(async function () {
  const exclusions = process.env.EXCLUDE;

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
          .filter((pr) => !exclusions.includes(pr.author.login))
          .map((pr) => pr.author.login)
      ),
    ];

    console.log(contributors);
  } catch (err) {
    console.log(err);
  }
})();
