// Todo: 使用原生http代码替换axios
const axios = require('axios')
const pluralize = require('pluralize')
const createNodeHelper = require('gatsby-node-helpers').createNodeHelpers

// Todo: 在获取数据和创建数据节点的过程中输出一些当前处理内容进度相关的信息，方便后续的运行调试
async function sourceNodes (
  { createNodeId, createContentDigest, actions },
  configOptions
) {
  let { apiURL, accessToken, singleTypes, collectionTypes } = configOptions
  const { createNode } = actions
  // Todo：需要判断singleTypes、collectionTypes数组值类型，对类型做限制，不符合的报错提示
  const stypes = singleTypes.map(type => type.toLowerCase())
  const ctypes = collectionTypes.map(type => pluralize(type.toLowerCase()))

  // 对apiURL的值做判断，判断其是否由https://或http://开头
  // 使用正则表达式来判断，否则是则不做处理，否则为其在开头拼接http://
  if (!/^http[s]?:\/\//.test(apiURL)) apiURL = `http://${apiURL}`

  //  先处理singleTypes
  // Todo: singleType 请求的params为{"populate":"*"} 不需要分页
  let finalSingles = await getContents(stypes, apiURL, true)
  await createNodeForContents(finalSingles, true)

  // 再处理collectionTypes
  let finalCollections = await getContents(ctypes, apiURL)
  await createNodeForContents(finalCollections)

  async function createNodeForContents (contents, isSingleType) {
    for (const [key, value] of Object.entries(contents)) {
      let typeKey = key.replace(/^./, key[0].toUpperCase())
      if (!isSingleType) typeKey = typeKey.replace(/s$/, '')
      // 1. 构建数据节点对象 allMystrapiXXX, 如: allMystrapiPost
      const { createNodeFactory } = createNodeHelper({
        typePrefix: `Mystrapi${typeKey}`,
        createNodeId,
        createContentDigest
      })

      const createNodeObject = createNodeFactory('')

      // 2. 根据数据节点对象创建节点
      Array.isArray(value)
        ? value.forEach(async item => {
            await createNode(createNodeObject(item))
          })
        : await createNode(createNodeObject(value))
    }
  }
}

async function getContents (types, apiURL, isSingleType = false) {
  const final = {}
  const size = types.length
  let index = 0
  let baseParams = { populate: '*' }

  // 初始调用递归处理
  await loadNodeContents()

  // 返回全部获取完成的值，只要有一个失败就报错回退不错存储
  return final

  // 采用递归方式处理请求内容并缓存
  async function loadNodeContents () {
    if (index === size) return

    isSingleType ? await getDataOnce() : await getDataWithPagination()

    // 获取singleType的data
    async function getDataOnce () {
      let params = baseParams
      console.log(params)
      const { data } = await axios.get(`${apiURL}/api/${types[index]}`, {
        params
      })

      final[types[index++]] = data.data
    }

    // 获取collectionType的data, 分页式处理
    async function getDataWithPagination () {
      let done = false
      // Todo: 实现分页获取，以应对请求数据量过大的情况，一次请求数据毕竟是有上限的
      // {"pagination":{"pageSize":250,"page":1},"populate":"*"} 构建请求的params
      let params = { pagination: { pageSize: 80, page: 1 }, ...baseParams }

      while (!done) {
        console.log(params)
        let { data } = await axios.get(`${apiURL}/api/${types[index]}`, {
          params
        })
        let { meta } = data

        // 然后根据第一次请求回来的meta数据判断是否需要继续发起请求获取下一页数据，并构建当前分页的请求params
        meta.pagination.page === meta.pagination.pageCount
          ? (done = true)
          : params.pagination.page++

        final[types[index]]
          ? final[types[index]].concat(data.data)
          : (final[types[index]] = data.data)

        // 处理下一个type
        index++
      }
    }
    await loadNodeContents()
  }
}

module.exports = {
  sourceNodes
}
