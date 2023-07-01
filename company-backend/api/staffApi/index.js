/* ------------------------------------  2. 普工专用接口(2)  ------------------------------------ */
var express = require('express');
var router = express.Router();// 引入express路由
const promisePool = require('../../DataBase/index.js')//mysql数据库操作模块

// 1. 普工请假
router.post('/leave',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var staffLeave = await promisePool.query(
        `insert into crewleave(u_id,u_name,u_department,type,reason,starttime,endtime,state,createtime) values (?,?,?,?,?,?,?,?,?)`,
        [
            req.body.id,
            req.body.username,
            req.body.department,
            1,
            req.body.reason,
            req.body.starttime,
            req.body.endtime,
            0,
            req.body.createtime
        ])
    
    console.log(staffLeave[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出请求体
    res.send({
        msg:'请假表提交成功!',
        status: 1//返回成功新增的状态码
    })
})

// 2. 普工销假
router.post('/cancelLeave',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var cancelLeave = await promisePool.query(
        `delete from crewleave where l_id=? and type=?`,
        [req.body.id,1])
    
    console.log(cancelLeave[0]);//控制台上输出结果
    console.log(req.body);//控制台上输出结果
    res.send({
        msg:'销假成功!',
        status: 1//返回成功新增的状态码
    })
})

module.exports = router;// 将路由暴露出去
