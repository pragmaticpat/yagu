require("dotenv").config();
const { default: axios } = require("axios");

module.exports = {
  getInitialPullRequests: function () {
    return axios.post(
      process.env.GITHUB_API,
      {
        query: `
      query {
        repository(owner: "${process.env.GITHUB_OWNER}", name: "${process.env.GITHUB_REPO}") {
          pullRequests(last: 100, states: MERGED) {
            pageInfo{
              hasPreviousPage,
              startCursor
            }
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
  },
  getPreviousPage: function (cursor) {
    let prQuery = `query {
      repository(owner: "${process.env.GITHUB_OWNER}", name: "${process.env.GITHUB_REPO}") {
        pullRequests(last: 100, states: MERGED, before: "${cursor}") {
          pageInfo{
            hasPreviousPage,
            startCursor
          }
          nodes {
            author{
              login
            }
            title
            mergedAt
          }
        }
      }
    }`;

    return axios.post(
      process.env.GITHUB_API,
      {
        query: prQuery,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      }
    );
  },
};
