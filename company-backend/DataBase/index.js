// 数据库操作模块
const mysql = require('mysql2')//mysql数据库操作模块

// 1.创建连接池,进行操作
const config = getConfig()//2.创建数据库连接对象
// 3.创建数据库连接池(promise形式调数据)
const promisePool = mysql.createPool(config).promise()

// 创建链接数据库函数
function getConfig(){
    return {
        host:'127.0.0.1',//域名
        port: 3306,//端口号(mysql默认是3306)
        user: 'root',//数据库的用户名
        password: '123456',//数据库的密码
        database:'companydb',//要连接的数据库名称
        connectionLimit:1//创建连接池的数量
    }
}

module.exports = promisePool
