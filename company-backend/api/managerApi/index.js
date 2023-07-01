/* ------------------------------------  3. 经理专用接口(8)  ------------------------------------ */
var express = require('express');
var router = express.Router();// 引入express路由
const promisePool = require('../../DataBase/index.js')//mysql数据库操作模块

// 1. 获取自己所在部门的所有普通员工信息(限制自己的部门)
router.post('/getAllStaff',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var onduty = await promisePool.query(
        `select * from crew where type=1 and department=?`,
        [req.body.department]
        )
    
    console.log(onduty[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'获取您所在的部门普工数据成功',
        staffCount:onduty[0].length,//返回你部门的普工人数
        data: onduty[0]//返回你部门的普工数据
    })
})

// 2. 给自己的部门新增普通员工(限制自己的部门)
router.post('/createStaff',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var createStaff = await promisePool.query(
            `insert into crew(id,username,password,headpic,sex,age,phone,department,type,onduty,isReadNotice) values (?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.id,
                req.body.username,
                123,
                '/img/staff.png',
                req.body.sex,
                req.body.age,
                req.body.phone,
                req.body.department,
                1,
                0,
                0
            ])
        
        console.log(createStaff[0]);//控制台上输出结果
        res.send({
            msg:'新增普通员工成功',
            status: 1//返回成功新增的状态码
        })
    } catch (error) {
        console.log('错误信息为:',error);
        res.send({
            msg:'新增普通员工失败!该工号已存在,请重试...',
            status: 0//返回成功新增的状态码
        })
    }
})

// 3. 删除自己部门的普通员工(限制自己的部门)
router.post('/deleteStaff',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var onduty = await promisePool.query(
        `delete from crew where id=? and type=? and department=?`,
        [req.body.id,1,req.body.department])
    
    // console.log(onduty[0]);//控制台上输出结果
    res.send({
        msg:'删除该员工成功!',
        // staffCount:onduty[0].length,//返回你部门的普工人数
        data: onduty[0]//返回你部门的普工数据
    })
})

// 4. 修改自己部门的普通员工(限制自己的部门)
router.post('/editStaff',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var editStaff = await promisePool.query(
            `update crew set id=?,username=?,sex=?,age=?,phone=? where id=${req.body.oldId}`,
            [
                req.body.newId,
                req.body.username,
                req.body.sex,
                req.body.age,
                req.body.phone,
            ])
        
        // console.log(req.body);//控制台上输出结果
        res.send({
            msg:'修改普通员工成功!',
            data: 1//返回成功修改的状态码
        })
    } catch (error) {
        res.send({
            msg:'修改普通员工失败!该工号已被占用,请重试...',
            data: 0//返回修改失败的状态码
        })
    }
})

// 5. 经理请假
router.post('/leave',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var managerLeave = await promisePool.query(
        `insert into crewleave(u_id,u_name,u_department,type,reason,starttime,endtime,state,createtime) values (?,?,?,?,?,?,?,?,?)`,
        [
            req.body.id,
            req.body.username,
            req.body.department,
            2,
            req.body.reason,
            req.body.starttime,
            req.body.endtime,
            0,
            req.body.createtime
        ])
    console.log(managerLeave[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出请求体
    res.send({
        msg:'请假表提交成功!',
        status: 1//返回成功新增的状态码
    })
})

// 6. 经理销假
router.post('/cancelLeave',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var cancelLeave = await promisePool.query(
        `delete from crewleave where l_id=? and type=?`,
        [req.body.id,2])
    
    // console.log(cancelLeave[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'销假成功!',
        status: 1//返回成功新增的状态码
    })
})

// 7. 获取自己所管辖下部门的所有普工假条
router.post('/getAllStaffLeaves',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var allStaffLeaves = await promisePool.query(
        `select * from crewleave where type=1 and u_department=?`,
        [req.body.department]
        )
    
    // console.log(allStaffLeaves[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'获取您所在的部门普工请假数据成功',
        staffCount:allStaffLeaves[0].length,//返回你部门的普工假条数
        data: allStaffLeaves[0]//返回你部门的普工请假数据
    })
})

// 8. 修改自己部门的普工请假申请(拒接或者接受)
router.post('/updataStaffLeave',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var updataStaffLeave = await promisePool.query(
        `update crewleave set state=? , approver=? where type=1 and l_id=?`,
        [
            req.body.state,
            req.body.approver,
            req.body.l_id,
        ]
        )
    
    // console.log(updataStaffLeave[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'修改您所在的部门普工请假数据成功',
        status: 1//返回成功新增的状态码
    })
})

module.exports = router;// 将路由暴露出去