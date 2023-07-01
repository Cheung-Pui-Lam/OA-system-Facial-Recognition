/* ----------------------- 企业自动化办公OA系统服务端 ---------------------------- */

/* ---------------------------------------- 模块的引入以及初始化 ----------------------------------- */
const express = require('express')
// 创建服务器
const app = express()
var asciify = require('asciify');//字体输出banner模块
var figlet = require('figlet');//字体输出banner模块
const jwt = require('jsonwebtoken')//jwt(token加密模块)
const http = require('http').Server(app)
var cors = require('cors')
app.use(cors())//使用跨域模块

const io = require('socket.io')(http, { //将socket服务器与接口服务器绑定在一起
  cors: {
    origin: '*',//允许全世界跨域
    methods: ['GET', 'POST'],
    credentials: true,
    allowEIO3: true
  },
  transport: ['websocket']
})

/* ------------------------------------------ 全局跨域设置 ------------------------------------------- */
/**
 * 全系统允许跨域处理 这段配置要再new出express实例的时候就要设置了，放在所有的api前面，不然没有效果
*/
app.all("*", function (req, res, next) {
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin", "*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers", "*");
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods", "*");
    if (req.method.toLowerCase() == 'options')
        res.send(200);  //让options尝试请求快速结束
    else
        next();
});

/* ----------------------------------------------配置置中间件 ------------------------------------------------------- */ 
// 通过express.json()这个中间件，解析表单中的JSON格式的数据
app.use(express.json())//解析post的请求题参数(json格式)
// 通过express.urlencoded()这个中间件，来解析表单中的url-encoded格式的数据
app.use(express.urlencoded({extended:false}))//解析post的请求题参数(encoded格式)
//使用express.static()中间件来托管静态资源
app.use(express.static('./public'))

// 定义端口号
const port = 3000

// 引入自己写的socket.io通信包(函数)
require('./socket/index.js')(io);

/* -------------------------------------------------- 后端接口 ---------------------------------------------------------*/

// 设置中间件验证token(在所有的中间件之前,不放行后续接口无法响应)
/*
  token有效,中间件放行next(),token无效则不放行[返回401状态]
*/
app.use((req,res,next)=>{
  // console.log('请求路径',req.url);
  // 如果token有效 ,next() 
  // 如果token过期了, 返回401错误
  /*
    首先排除登录接口(因为登录接口没有token) 以及文件下载接口(参数自带,没有token)
  */
  if(req.url==="/user/login" || req.url.includes(`/user/downloadFileN`) || req.url.includes(`/user/downloadFile`)){
    next()
    return;
  }

  // console.log(req.headers.authorization);
  const token = req.headers.authorization
  // token解析
  if(token){
    // console.log('有token,用户信息为:',req.body);
    var payload = jwt.verify(token,'lam', async function(err, decoded){
      // console.log('解密后的用户信息:',decoded.data);
      if(!err){// 如果解析成功,重新生成token返回给前端页面
        const token = jwt.sign(
          {data:[decoded.data[0],decoded.data[1],decoded.data[2],decoded.data[3]]},//将用户名(username),工号(id)加密成token,岗位类型,所在部门
          'lam',// 加密密钥为 lam
          {expiresIn: '7d'} // token生效时间为7天
        )

        // 返回新的token给前端
        res.header('Authorization' , token)//固定写为Authorization(后面校验也是用这个请求头)
        res.setHeader("Access-Control-Expose-Headers","Authorization");
        next()
      }else{
        res.status(401).send({errCode:"-1",errorInfo:"token验证失败!  请重新登录......"})
      }
    })
  }
})

// 引入路由接口
var publicApi = require('./api/publicApi/index.js') // 公共接口路由
var staffApi = require('./api/staffApi/index.js') // 普工接口路由
var managerApi = require('./api/managerApi/index.js') // 部门经理接口路由
var bossApi = require('./api/bossApi/index.js') // 老总接口路由

// 调用路由布置接口
app.use('/user',publicApi)
app.use('/staff',staffApi)
app.use('/manager',managerApi)
app.use('/boss',bossApi)

/* ----------------------------------- 启动服务器 --------------------------------------------- */
http.listen(port,()=>{
    // figlet('Fat Lam', function(err, data) {
    //     console.log(data)
    //     console.log(`服务器已启动! ${port}端口号正在监听......`);
    // });
    asciify(`fat lam'sProject`,{font:'larry3d'}, function(err, res){ 
        console.log(res) 
        console.log(`服务器已启动! ${port}端口号正在监听......`);
    });
})
