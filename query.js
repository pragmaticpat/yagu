require("dotenv").config();
const { default: axios } = require("axios");

module.exports = {
  getAvatar: async function (avatarUrl) {
    try {
      return axios
        .get(avatarUrl, { responseType: "arraybuffer" })
        .then((response) => Buffer.from(response.data, "base64"));
    } catch (error) {
      return Promise.reject(
        `An error occurred getting avatar from ${avatarUrl}: ${error}`
      );
    }

    return Promise.resolve(avatarUrl);
  },
  getInitialPullRequests: async function () {
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
                avatarUrl
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
  getPreviousPage: async function (cursor) {
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
              avatarUrl
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
