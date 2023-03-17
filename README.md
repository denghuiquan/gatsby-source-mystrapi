# gatsby-source-mystrapi

Project Url: [https://github.com/denghuiquan/gatsby-source-mystrapi](https://github.com/denghuiquan/gatsby-source-mystrapi)

# gatsby-source-mystrapi

Source plugin for pulling documents into Gatsby from a Strapi API.

⚠️ This version of gatsby-source-mystrapi is only compatible with Strapi v4.

### A gatsby-config.js example:

```js
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`
})

const strapiConfig = {
  apiURL: process.env.STRAPI_API_URL,
  accessToken: process.env.STRAPI_TOKEN,
  singleTypes: ['general'],
  collectionTypes: ['post', 'tag']
}

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-source-mystrapi',
      options: strapiConfig
    }
  ]
}

```