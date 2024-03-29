"use strict";

const createCollage = require("nf-photo-collage");
require("dotenv").config();
const fs = require("fs");
const dateFns = require("date-fns");

const {
  getInitialPullRequests,
  getPreviousPage,
  getAvatar,
} = require("./query");

const cliProgress = require("cli-progress");
const afterDate = new Date(process.env.AFTER_DATE);
// const { create } = require("domain");

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

    let mergedAt; //

    // get contributor list from PR's
    let contributors = Array.from(nodes)
      .filter((pr) => !exclusions.includes(pr.author.login))
      .filter((pr) => {
        mergedAt = new Date(pr.mergedAt);
        if (dateFns.isAfter(mergedAt, afterDate)) {
          return true;
        } else {
          return false;
        }
      })
      .map((pr) => {
        return {
          author: pr.author.login,
          avatarUrl: pr.author.avatarUrl,
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
          .filter((pr) => {
            mergedAt = new Date(pr.mergedAt);
            if (dateFns.isAfter(mergedAt, afterDate)) {
              return true;
            } else {
              return false;
            }
          })
          .map((pr) => {
            return {
              author: pr.author.login,
              avatarUrl: pr.author.avatarUrl,
              title: pr.title,
              mergedAt: pr.mergedAt,
            };
          })
      );
      progressBar.increment();
    }

    progressBar.stop();

    const uniqueAuthorsWithImages = {};

    contributors.map((c) => {
      if (uniqueAuthorsWithImages[c.author]) return;
      uniqueAuthorsWithImages[c.author] = c.avatarUrl;
    });

    console.info(
      `🎉 There were a total of ${contributors.length} PR's merged from ${
        Object.keys(uniqueAuthorsWithImages).length
      } open source contributors in 2021 for ${process.env.GITHUB_REPO} ${
        process.env.GITHUB_OWNER
      }`
    );

    // get avatars
    const uniqueAvatars = new Set(contributors.map((c) => c.avatarUrl));
    await saveAvatars(Array.from(uniqueAvatars));

    const imgDir = "./img";
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir);
    }
    await createCollageFrom(imgDir, "collage.png");

    const contributorsFilePath = `./contributors-${process.env.GITHUB_OWNER}-${
      process.env.GITHUB_REPO
    }-${Date.now()}.txt`;

    try {
      contributors.forEach((c) => {
        fs.appendFile(
          contributorsFilePath,
          `${c.author},${c.title},${c.mergedAt},${c.avatarUrl}\r\n`,
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

const createCollageFrom = async function (
  imageFolderPath,
  destinationCollageFileName
) {
  console.log("creating collage...");
  await fs.promises
    .readdir(imageFolderPath)
    .then((files) => {
      const images = [];
      files.forEach((file) => {
        const imagePath = `${imageFolderPath}/${file}`;
        images.push(imagePath);
      });
      return images;
    })
    .then((images) => {
      const imagesWide = 1.38 * Math.sqrt(images.length);
      const imagesHigh = images.length / imagesWide;
      const options = {
        sources: images,
        width: imagesWide, //imagesWide, //widescreen 16/25
        height: imagesHigh, //imagesHigh, //widescreen 9/25
        imageWidth: 50,
        imageHeight: 50,
      };
      createCollage(options).then((canvas) => {
        console.log(
          `creating a collage that is ${imagesHigh} images high by ${imagesWide} images across`
        );

        const src = canvas.jpegStream();

        const dest = fs.createWriteStream(destinationCollageFileName);
        src.pipe(dest);
      });
    })
    .catch((err) => console.log(`💩 uhhh... ${(err.message, err.stack)}`));
};

const saveAvatars = async function (listOfAvatarUrls) {
  console.log(`saving ${listOfAvatarUrls.length} avatars`);
  const progressAvatars = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );

  progressAvatars.start(listOfAvatarUrls.length, 0);
  for (let index = 0; index < listOfAvatarUrls.length; index++) {
    const avatar = listOfAvatarUrls[index];
    const buffer = await getAvatar(avatar);
    fs.writeFile(`./img/${Date.now()}.png`, buffer, () =>
      progressAvatars.increment()
    );
  }
  progressAvatars.stop();
};
