const { default: axios } = require("axios");

module.exports = {
  getInitialPullRequests: function () {
    return axios.post(
      process.env.GITHUB_API,
      {
        query: `
      query {
        repository(owner: "gatsbyjs", name: "gatsby") {
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
      repository(owner: "gatsbyjs", name: "gatsby") {
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

    console.log(`Cursor: ${cursor}`);
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
