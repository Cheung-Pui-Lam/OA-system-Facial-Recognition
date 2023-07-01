/* ----------------------------------- 4. 老总专用接口(26) --------------------------------------- */
var express = require('express');
var router = express.Router();// 引入express路由
const promisePool = require('../../DataBase/index.js')//mysql数据库操作模块

// 1. 获取所有普通员工的信息(不限制部门)
router.get('/getAllStaff',async (req,res)=>{
    var Allstaff = await promisePool.query('select * from crew where type=1')
    // console.log(`全部普工总数:${Allstaff[0].length},
    //              全部普工数据:${Allstaff[0]}`);//总数和数据
    res.send({
        msg:'全部普工数据获取成功!',
        Allstaff:Allstaff[0].length,//返回总数
        data: Allstaff[0]//返回数据
    })
})

// 2. 获取所有经理的信息(不限制部门)
router.get('/getAllManager',async (req,res)=>{
    var AllManager = await promisePool.query('select * from crew where type=2')
    // console.log(`全部普工总数:${AllManager[0].length},
    //              全部普工数据:${AllManager[0]}`);//总数和数据
    res.send({
        msg:'全部普工数据获取成功!',
        AllManager:AllManager[0].length,//返回总数
        data: AllManager[0]//返回数据
    })
})

// 3. 新增普通员工(不限制部门)
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
        
        // console.log(createStaff[0]);//控制台上输出结果
        res.send({
            msg:'新增普通员工成功',
            status: 1//返回新增的普工数据
        })
    } catch (error) {
        res.send({
            msg:'新增错误!已存在该工号,请重试!',
            status: 0//返回失败新增状态
        })
    }
})

// 4. 新增经理(不限制部门)
router.post('/createManager',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var createManager = await promisePool.query(
            `insert into crew(id,username,password,headpic,sex,age,phone,department,type,onduty,isReadNotice) values (?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.id,
                req.body.username,
                123,
                '/img/manager.png',
                req.body.sex,
                req.body.age,
                req.body.phone,
                req.body.department,
                2,
                0,
                0
            ])
        
        // console.log(createManager[0]);//控制台上输出结果
        res.send({
            msg:'新增经理成功',
            status: 1//返回成功新增状态
        })
    } catch (error) {
        res.send({
            msg:'新增错误!已存在该工号,请重试!',
            status: 0//返回失败新增状态
        })
    }
})

// 5. 删除普通员工(所有部门)
router.post('/deleteStaff',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var onduty = await promisePool.query(
        `delete from crew where id=? and type=?`,
        [req.body.id,1])
    
    console.log(onduty[0]);//控制台上输出结果
    res.send({
        msg:'删除该员工成功!',
        data: onduty[0]//返回你部门的普工数据
    })
})

// 6. 删除经理(所有部门)
router.post('/deleteManger',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var onduty = await promisePool.query(
        `delete from crew where id=? and type=?`,
        [req.body.id,2])
    
    console.log(onduty[0]);//控制台上输出结果
    res.send({
        msg:'删除该经理成功!',
        data: onduty[0]//返回你部门的普工数据
    })
})

// 7. 修改普通员工(所有部门)
router.post('/editStaff',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var editStaff = await promisePool.query(
            `update crew set id=?,username=?,sex=?,age=?,phone=?, department=? where id=${req.body.oldId} and type=1`,
            [
                req.body.newId,
                req.body.username,
                req.body.sex,
                req.body.age,
                req.body.phone,
                req.body.department,
            ])
        
        console.log(req.body);//控制台上输出结果
        res.send({
            msg:'修改普通员工成功!',
            status: 1//返回修改成功的状态码
        })
    } catch (error) {
        res.send({
            msg:'修改错误!已存在该工号,请重试!',
            status: 0//返回失败新增状态
        })
    }
})

// 8. 修改经理(所有部门)
router.post('/editManger',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var editManger = await promisePool.query(
            `update crew set id=?,username=?,sex=?,age=?,phone=?, department=? where id=${req.body.oldId} and type=2`,
            [
                req.body.newId,
                req.body.username,
                req.body.sex,
                req.body.age,
                req.body.phone,
                req.body.department,
            ])
        
        console.log(req.body);//控制台上输出结果
        res.send({
            msg:'修改经理成功!',
            status:1//返回修改成功状态码
        })
    } catch (error) {
        res.send({
            msg:'修改经理失败!已存在该工号,请重试!',
            status:0//返回失败状态码
        })
    }
})

// 9. 发布公告(新增)
router.post('/createNotice',async (req , res)=>{  
    // console.log('新增公告数据:',req.body);
    var departments=''
    req.body.department.map(item=>{
        departments = departments+`[${item.d_name}]`
    })
    // console.log(111,departments);
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var createNotice = await promisePool.query(
            `insert into notice(n_title,n_desc,n_content,n_createtime,n_department,n_file,n_user) values (?,?,?,?,?,?,?)`,
            [
                req.body.title,
                req.body.desc,
                req.body.content,
                req.body.createtime,
                departments,
                req.body.file,
                req.body.user,
            ])
        
        console.log(createNotice[0]);//控制台上输出结果
        res.send({
            msg:'新增公告成功',
            status: 1//返回成功状态码
        })
    } catch (error) {
        res.send({
            msg:'该公告标题已存在,只需该改动内容即可!',
            status: 0//返回失败状态码
        })
    }
})

// 10. 删除公告
router.post('/deleteNotice',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    // console.log('删除公告数据!',req.body.file);
    var deleteNotice = await promisePool.query(// 删除公告
        `delete from notice where n_title=?`,[req.body.title])
    if(req.body.file === 1){
        var deleteNoticeFile = await promisePool.query(// 删除对应的文件
            `delete from storage where f_department=?`,[`${req.body.title}(公告文件)`])
    }
    
    // console.log(deleteNotice[0]);//控制台上输出结果
    res.send({
        msg:'删除公告成功!',
        data: deleteNotice[0]//返回新增的经理数据
    })
})

// 11. 修改公告
router.post('/editNotice',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    console.log('修改公告数据:',req.body);
    var departments=''
    req.body.department.map(item=>{
        departments = departments+`,${item.d_name}`
    })
    try {
        var editNotice = await promisePool.query(
            `update notice set n_title=?,n_desc=?,n_content=?,n_createtime=?,n_department=?,n_file=? where n_title=?`,
            [
                req.body.newTitle,
                req.body.newDesc,
                req.body.newContent,
                req.body.newCreatetime,
                departments,
                req.body.file,
                req.body.oldTitle
            ])
        
        // 判断当前修改的公告是否携带文件
        if(req.body.file === 1){}    
        
        console.log(editNotice[0]);//控制台上输出结果
        res.send({
            msg:'修改公告成功!',
            status:1//返回成功修改的状态码
        })
    } catch (error) {
        res.send({
            msg:'修改公告失败!该公告标题已存在,改动已存在标题的公告内容或重选另一个公告标题',
            status:0//返回失败修改的状态码
        })
    }
})

// 12. 修改指定所有用户的公告阅读状态(修改为已读)
router.post('/updateIsReadNotice',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    console.log('要修改的用户部门:',req.body);
    req.body.department.map(async item=>{
        var updateIsReadNotice = await promisePool.query(
            `update crew set isReadNotice=? where department=?`,
            [
                req.body.state,
                item.d_name,
            ])
    })

    
    // console.log(updateIsReadNotice[0]);//控制台上输出结果
    res.send({
        msg:'修改所有用户的公告阅读状态成功!',
        // data: updateIsReadNotice[0]//输出到页面上
    })
})

// 13. 获取所有部门
router.get('/getAllDepartment',async (req,res)=>{
    var AllDepartment = await promisePool.query('select * from department')
    console.log(`全部部门总数:${AllDepartment[0].length},
                 全部部门数据:${AllDepartment[0]}`);//总数和数据
    res.send({
        msg:'全部部门数据获取成功!',
        AllDepartment:AllDepartment[0].length,//返回总数
        data: AllDepartment[0]//返回数据
    })
})

// 14. 新增部门
router.post('/addDepartment',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var addDepartment = await promisePool.query(
            `insert into department(d_id,d_name) values (?,?)`,
            [
                req.body.id,
                req.body.name,
            ])
        
        // console.log(addDepartment[0]);//控制台上输出结果
        res.send({
            msg:'新增部门成功',
            status: 1//返回新增的普工数据
        })
    } catch (error) {
        res.send({
            msg:'新增错误!已存在该部门信息,请重试!',
            status: 0//返回失败新增状态
        })
    }
})

// 15. 修改部门
router.post('/editDepartment',async (req , res)=>{  
    // console.log('修改部门信息同时修改该部门下所有的员工信息:',req.body);
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        // 连接数据库修改部门信息
        var editDepartment = await promisePool.query(
            `update department set d_id=?,d_name=? where d_id=${req.body.oldId}`,
            [
                req.body.newId,
                req.body.name,
            ])
        
        // 同时修改该部门下所有员工的部门字段信息
        var editStaffDepartment = await promisePool.query(
            `update crew set department=? where department=?`,
            [
                req.body.name,
                req.body.oldD_name,
            ])
        
        console.log(req.body);//控制台上输出结果
        res.send({
            msg:'修改部门成功!',
            status: 1//返回修改成功的状态码
        })
    } catch (error) {
        console.log(req.body);//控制台上输出结果
        res.send({
            msg:'修改错误!已存在该部门信息,请重试!',
            status: 0//返回失败新增状态
        })
    }
})

// 16. 删除部门
router.post('/deleteDepartment',async (req , res)=>{  
    console.log('删除部门数据:',req.body);
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    // 删除部门
    var deleteDepartment = await promisePool.query(
        `delete from department where d_id=?`,
        [req.body.id])

    // 将该部门下的所有员工的所属部门字段设置为空
    var setNull = await promisePool.query(
        `update crew set department=${null} where department=?`,
        [req.body.department])
    
    // console.log('所删除部门下的所有员工:',setNull[0]);//控制台上输出结果
    res.send({
        msg:'删除该部门成功!',
        data: deleteDepartment[0]//返回你部门的普工数据
    })
})

// 17. 获取所有部门经理的假条数据
router.post('/getAllManagerLeaves',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var allStaffLeaves = await promisePool.query(
        `select * from crewleave where type=2`)
    
    // console.log(allStaffLeaves[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'获取经理请假数据成功',
        staffCount:allStaffLeaves[0].length,//返回你部门的普工假条数
        data: allStaffLeaves[0]//返回你部门的普工请假数据
    })
})

// 18. 修改经理的请假申请(拒接或者接受)
router.post('/updataManagerLeave',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var updataManagerLeave = await promisePool.query(
        `update crewleave set state=? , approver=? where type=2 and l_id=?`,
        [
            req.body.state,
            req.body.approver,
            req.body.l_id,
        ]
        )
    
    // console.log(updataManagerLeave[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'修改经理请假数据成功',
        status: 1//返回成功新增的状态码
    })
})

// 19. 获取云仓中所有文件数据(不限部门且不包含公告文件)
router.get('/getAllFile',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句) select * from employees_copy where not regexp_like(first_name,'[,o]+');
    var file = await promisePool.query(`select * from storage`)
    // console.log(file[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'获取所有部门文件数据成功!',
        data: file[0],//返回你部门的普工数据
        status: 1//返回成功新增的状态码
    })
})

// 20. 获取老总数据列表
router.get('/getAllBoss',async (req,res)=>{
    var AllBoss = await promisePool.query('select * from crew where type=3')
    // console.log(`全部普工总数:${AllBoss[0].length},
    //              全部普工数据:${AllBoss[0]}`);//总数和数据
    res.send({
        msg:'全部老总数据获取成功!',
        AllBoss:AllBoss[0].length,//返回总数
        data: AllBoss[0]//返回数据
    })
})

// 21. 新增老总
router.post('/createBoss',async (req , res)=>{  
    console.log('新增的老总数据:',req.body);
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var createBoss = await promisePool.query(
            `insert into crew(id,username,password,headpic,sex,age,phone,department,type,onduty,isReadNotice) values (?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.id,
                req.body.username,
                123,
                '/img/boss.png',
                req.body.sex,
                req.body.age,
                req.body.phone,
                req.body.department,
                3,
                0,
                0
            ])
        
        // console.log(createBoss[0]);//控制台上输出结果
        res.send({
            msg:'新增老总成功',
            status: 1//返回成功新增状态
        })
    } catch (error) {
        res.send({
            msg:'新增错误!已存在该工号,请重试!',
            status: 0//返回失败新增状态
        })
    }
})

// 23. 删除老总
router.post('/deleteBoss',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var onduty = await promisePool.query(
        `delete from crew where id=? and type=?`,
        [req.body.id,3])
    
    console.log(onduty[0]);//控制台上输出结果
    res.send({
        msg:'删除该老总成功!',
        data: onduty[0]//返回你部门的普工数据
    })
})

// 24. 编辑老总
router.post('/editBoss',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var editBoss = await promisePool.query(
            `update crew set id=?,username=?,sex=?,age=?,phone=?, department=? where id=${req.body.oldId} and type=3`,
            [
                req.body.newId,
                req.body.username,
                req.body.sex,
                req.body.age,
                req.body.phone,
                req.body.department,
            ])
        
        console.log(req.body);//控制台上输出结果
        res.send({
            msg:'修改老总成功!',
            status:1//返回修改成功状态码
        })
    } catch (error) {
        res.send({
            msg:'修改老总失败!已存在该工号,请重试!',
            status:0//返回失败状态码
        })
    }
})

// 25. 强制下班(判断当前是否为23:59)
router.get('/forceOffDuty',async(req,res)=>{
    var Allstaff = await promisePool.query('update crew set onDuty=0 where onDuty=1')
    // console.log(`全部普工总数:${Allstaff[0].length},
    //              全部普工数据:${Allstaff[0]}`);//总数和数据
    res.send({
        msg:'全部员工下班成功!',
        Allstaff:Allstaff[0].length,//返回总数
        data: Allstaff[0]//返回数据
    })
})

// 26. 获取所有员工数据
router.get('/getAllStaffDutyRecord',async (req,res)=>{
    var Allstaff = await promisePool.query('select * from crew where type=1 || type=2')
    // console.log(`全部普工总数:${Allstaff[0].length},
    //              全部普工数据:${Allstaff[0]}`);//总数和数据
    res.send({
        msg:'全部员工数据获取成功!',
        Allstaff:Allstaff[0].length,//返回总数
        data: Allstaff[0]//返回数据
    })
})

module.exports = router;// 将路由暴露出去
