import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"
import request from "request"
import dotenv from "dotenv"
dotenv.config()

const input = JSON.parse(
  fs.readFileSync(path.join("input", "ghost.json")).toString()
)
const replacers = JSON.parse(
  fs.readFileSync(path.join("input", "replacers.json")).toString()
)

const tag = {
  uuid: uuidv4(),
  content_type: "Tag",
  content: {
    title: "ghost-to-listed",
    references: [],
  },
}

const getPostFrontMatter = (post) => {
  const frontmatter = []
  frontmatter.push(["created_at", post.published_at])
  frontmatter.push(["published", post.status === "published"])
  frontmatter.push(["custom_path", post.slug])
  if (post.feature_image) {
    frontmatter.push(["image_url", post.feature_image])
  }
  if (post.custom_excerpt) {
    frontmatter.push(["desc", post.custom_excerpt])
  }
  if (post.featured) {
    frontmatter.push(["pinned", true])
  }
  if (post.canonical_url) {
    frontmatter.push(["canonical", post.canonical_url])
  }
  let frontString = ""
  frontmatter.forEach((matter, index) => {
    frontString += `${matter[0]}: ${matter[1]}`
    if (index < frontmatter.length - 1) {
      frontString += "\n"
    }
  })
  return frontString
}

const downloadPostImages = (html, feature_image) => {
  const prefix = 'img src="'
  const regex =
    /(img src="__GHOST_URL__\/[^"']*\.(?:png|jpg|jpeg|gif|png|svg))/g
  const matches = html.match(regex) || []

  const download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
      request(uri)
        .pipe(fs.createWriteStream(filename, { recursive: true }))
        .on("close", callback)
    })
  }

  const ensureDirectoryExistence = (filePath) => {
    var dirname = path.dirname(filePath)
    if (fs.existsSync(dirname)) {
      return true
    }
    ensureDirectoryExistence(dirname)
    fs.mkdirSync(dirname)
  }

  const urls = []
  if (feature_image) {
    urls.push(feature_image.replace("__GHOST_URL__", process.env.GHOST_URL))
  }

  for (const match of matches) {
    const cleanedUrl = match.replace(prefix, "")
    const absoluteUrl = cleanedUrl.replace(
      "__GHOST_URL__",
      process.env.GHOST_URL
    )
    urls.push(absoluteUrl)
  }

  for (const url of urls) {
    if (!url.includes(process.env.GHOST_URL)) {
      continue
    }
    console.log("Downloading image:", url)
    const savePath = path.join(
      "output",
      "images",
      url.replace(`${process.env.GHOST_URL}/content/images`, "")
    )
    ensureDirectoryExistence(savePath)
    download(url, savePath, function () {
      console.log(`Downloaded image ${savePath}`)
    })
  }
}

const notes = []
const posts = input.db[0].data.posts
for (const post of posts) {
  const frontmatter = getPostFrontMatter(post)
  const html = post.html
  downloadPostImages(html, post.feature_image)
  let text = `---
${frontmatter}
---

${html}
  `
  for (const replacer of replacers) {
    text = text.replaceAll(replacer.replace, replacer.with)
  }
  const note = {
    uuid: post.uuid,
    content_type: "Note",
    created_at: post.created_at,
    updated_at: post.updated_at,
    content: {
      title: post.title,
      text: text,
      appData: {
        "org.standardnotes.sn": {
          client_updated_at: post.updated_at,
        },
      },
    },
  }
  notes.push(note)
  tag.content.references.push({
    content_type: "Note",
    uuid: note.uuid,
  })
}

const output = {
  items: notes.concat([tag]),
}

fs.writeFileSync(
  path.join("output", "sn.json"),
  JSON.stringify(output, null, 2)
)
